import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth/auth.service';
import { PrismaService } from '@/prisma/prisma.service';
import { OperationLogService } from '../operation-log/operation-log.service';
import { TeacherObservationCreateDto } from './dto/teacher-observation-create.dto';
import { TeacherObservationAiPolishDto } from './dto/teacher-observation-ai-polish.dto';
import { toNumber } from '@/common/utils/bigint.util';

@Injectable()
export class TeacherObservationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authService: AuthService,
    private readonly operationLogService: OperationLogService,
    private readonly configService: ConfigService,
  ) {}

  async create(authorization: string | undefined, body: TeacherObservationCreateDto) {
    const user = await this.authService.getAuthUserFromAuthorization(authorization);
    if (!['homeroom_teacher', 'subject_teacher', 'school_admin', 'academic_admin', 'grade_admin', 'moral_admin', 'super_admin'].includes(user.roleCode)) {
      throw new ForbiddenException('当前角色无权记录教师观察');
    }

    this.authService.ensureCanAccessClass(user, body.classId);
    const student = await this.prisma.student.findFirst({
      where: {
        id: BigInt(body.studentId),
        classId: BigInt(body.classId),
        schoolId: user.schoolId,
        deletedAt: null,
        status: 'enabled',
      },
      select: {
        id: true,
        classId: true,
        name: true,
      },
    });

    if (!student) {
      throw new NotFoundException('学生不存在');
    }

    const created = await this.prisma.teacherObservation.create({
      data: {
        schoolId: user.schoolId,
        classId: BigInt(body.classId),
        studentId: BigInt(body.studentId),
        teacherId: user.id,
        observationType: body.observationType?.trim() || null,
        content: body.content.trim(),
      },
    });

    await this.operationLogService.create({
      schoolId: user.schoolId,
      userId: user.id,
      roleCode: user.roleCode,
      terminalType: 'admin',
      module: 'teacher_observation',
      action: 'create',
      targetType: 'student',
      targetId: BigInt(body.studentId),
      detail: {
        classId: body.classId,
        observationType: body.observationType?.trim() || null,
      },
    });

    return {
      code: 0,
      message: 'ok',
      data: {
        id: toNumber(created.id),
      },
    };
  }

  async aiPolish(authorization: string | undefined, body: TeacherObservationAiPolishDto) {
    const user = await this.authService.getAuthUserFromAuthorization(authorization);
    if (!['homeroom_teacher', 'subject_teacher', 'school_admin', 'academic_admin', 'grade_admin', 'moral_admin', 'super_admin'].includes(user.roleCode)) {
      throw new ForbiddenException('当前角色无权使用观察润色');
    }

    const fallback = this.buildFallbackPolish(body);
    const polished = await this.generateWithArk(body, fallback);

    return {
      code: 0,
      message: 'ok',
      data: {
        content: polished,
      },
    };
  }

  private buildFallbackPolish(body: TeacherObservationAiPolishDto) {
    const prefix = [body.className, body.studentName, body.observationType].filter(Boolean).join(' · ');
    const normalized = body.content.replace(/\s+/g, ' ').trim();
    return prefix ? `${prefix}：${normalized}` : normalized;
  }

  private async generateWithArk(body: TeacherObservationAiPolishDto, fallback: string) {
    const apiKey = this.configService.get<string>('ARK_API_KEY');
    const apiUrl = this.configService.get<string>('ARK_API_URL') || 'https://ark.cn-beijing.volces.com/api/v3/responses';
    const model = this.configService.get<string>('ARK_MODEL') || 'deepseek-v3-2-251201';
    const timeoutMs = Number(this.configService.get<string>('ARK_TIMEOUT_MS') || 30000);

    if (!apiKey) {
      return fallback;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          stream: false,
          input: [
            {
              role: 'system',
              content: [
                {
                  type: 'input_text',
                  text: [
                    '你是学校教师观察记录助手。',
                    '请把原始观察整理成简洁、正式、客观的教师观察文本。',
                    '不要夸大，不做医学或心理诊断，不要输出标题。',
                    '只输出润色后的正文，不要附加解释。',
                  ].join(' '),
                },
              ],
            },
            {
              role: 'user',
              content: [
                {
                  type: 'input_text',
                  text: JSON.stringify(body, null, 2),
                },
              ],
            },
          ],
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Ark API 请求失败: ${response.status}`);
      }

      const payload = (await response.json()) as {
        output_text?: string;
        output?: Array<{ content?: Array<{ text?: string }> }>;
      };
      const text =
        payload.output_text?.trim() ||
        payload.output?.flatMap((item) => item.content ?? []).map((item) => item.text ?? '').join('\n').trim() ||
        '';

      return text || fallback;
    } catch {
      return fallback;
    } finally {
      clearTimeout(timeout);
    }
  }
}

import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import { AuthService } from '../auth/auth.service';
import { toNumber } from '@/common/utils/bigint.util';
import { OperationLogService } from '../operation-log/operation-log.service';
import { RealtimeService } from '../realtime/realtime.service';
import { HonorUpsertDto } from './dto/honor-upsert.dto';
import { HonorRecordCreateDto } from './dto/honor-record-create.dto';
import { assertHonorImageDimensions } from '@/common/utils/image-dimension.util';
import { mkdir, writeFile } from 'node:fs/promises';
import { extname, resolve } from 'node:path';

/** 校级荣誉管理：创建/维护勋章、为班级颁发集体荣誉 */
const SCHOOL_HONOR_ADMIN_ROLES = [
  'super_admin',
  'school_admin',
  'moral_admin',
  'academic_admin',
] as const;

/** 可为学生颁发个人/阶段/长期荣誉的任课与班主任 */
const STUDENT_HONOR_GRANT_TEACHER_ROLES = ['homeroom_teacher', 'subject_teacher'] as const;

@Injectable()
export class HonorsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authService: AuthService,
    private readonly operationLogService: OperationLogService,
    private readonly realtimeService: RealtimeService,
  ) {}

  async list(authorization: string | undefined, query: Record<string, string>) {
    const user = await this.authService.getAuthUserFromAuthorization(authorization);
    const includeDisabled = query.includeDisabled === 'true';
    if (includeDisabled) {
      this.ensureCanManageHonors(user.roleCode);
    }

    const rows = await this.prisma.honor.findMany({
      where: {
        schoolId: user.schoolId,
        status: includeDisabled ? undefined : 'enabled',
      },
      include: {
        honorRecords: {
          orderBy: { grantedAt: 'desc' },
          take: 1,
        },
        _count: {
          select: {
            honorRecords: true,
          },
        },
      },
      orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }],
    });

    return {
      code: 0,
      message: 'ok',
      data: rows.map((row) => ({
        id: toNumber(row.id),
        schoolId: toNumber(row.schoolId),
        code: row.code,
        name: row.name,
        category: row.category,
        iconUrl: row.iconUrl,
        description: row.description,
        conditionType: row.conditionType,
        conditionConfig: row.conditionConfig as Record<string, unknown> | null,
        status: row.status,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        grantedCount: row._count.honorRecords,
        lastGrantedAt: row.honorRecords[0]?.grantedAt ?? null,
      })),
    };
  }

  async create(authorization: string | undefined, body: HonorUpsertDto) {
    const user = await this.authService.getAuthUserFromAuthorization(authorization);
    this.ensureCanManageHonors(user.roleCode);
    const iconUrl = (body.iconUrl ?? '').trim();
    if (!iconUrl) {
      throw new BadRequestException('请先上传勋章图片');
    }
    if (!iconUrl.startsWith('/uploads/honors/')) {
      throw new BadRequestException('勋章图片必须通过后台上传');
    }

    const created = await this.prisma.honor.create({
      data: {
        schoolId: user.schoolId,
        code: body.code,
        name: body.name,
        category: body.category,
        iconUrl,
        description: body.description,
        conditionType: body.conditionType,
        conditionConfig: body.conditionConfig as Prisma.InputJsonValue | undefined,
      },
    });

    await this.operationLogService.create({
      schoolId: user.schoolId,
      userId: user.id,
      roleCode: user.roleCode,
      terminalType: 'admin',
      module: 'honor',
      action: 'create',
      targetType: 'honor',
      targetId: created.id,
      detail: {
        code: body.code,
        name: body.name,
        category: body.category,
      },
    });

    return { code: 0, message: 'ok', data: { id: toNumber(created.id) } };
  }

  async update(authorization: string | undefined, id: number, body: HonorUpsertDto) {
    const user = await this.authService.getAuthUserFromAuthorization(authorization);
    this.ensureCanManageHonors(user.roleCode);
    const iconUrl = (body.iconUrl ?? '').trim();
    if (!iconUrl) {
      throw new BadRequestException('请先上传勋章图片');
    }
    if (!iconUrl.startsWith('/uploads/honors/')) {
      throw new BadRequestException('勋章图片必须通过后台上传');
    }

    const exists = await this.prisma.honor.findFirst({
      where: {
        id: BigInt(id),
        schoolId: user.schoolId,
      },
      select: { id: true },
    });

    if (!exists) {
      throw new NotFoundException('荣誉不存在');
    }

    const updated = await this.prisma.honor.update({
      where: { id: BigInt(id) },
      data: {
        code: body.code,
        name: body.name,
        category: body.category,
        iconUrl,
        description: body.description,
        conditionType: body.conditionType,
        conditionConfig: body.conditionConfig as Prisma.InputJsonValue | undefined,
      },
    });

    await this.operationLogService.create({
      schoolId: user.schoolId,
      userId: user.id,
      roleCode: user.roleCode,
      terminalType: 'admin',
      module: 'honor',
      action: 'update',
      targetType: 'honor',
      targetId: updated.id,
      detail: {
        code: body.code,
        name: body.name,
        category: body.category,
      },
    });

    return { code: 0, message: 'ok', data: { id: toNumber(updated.id) } };
  }

  async uploadHonorAsset(
    authorization: string | undefined,
    file: { originalname: string; mimetype: string; size: number; buffer: Buffer } | undefined,
  ) {
    const user = await this.authService.getAuthUserFromAuthorization(authorization);
    this.ensureCanManageHonors(user.roleCode);

    if (!file) {
      throw new BadRequestException('请选择要上传的图片');
    }
    if (!file.mimetype.startsWith('image/')) {
      throw new BadRequestException('仅支持上传图片文件');
    }
    if (file.size > 5 * 1024 * 1024) {
      throw new BadRequestException('图片大小不能超过 5MB');
    }
    try {
      assertHonorImageDimensions(file.buffer, file.mimetype);
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : '勋章图片尺寸不符合要求',
      );
    }

    const uploadsDir = resolve(process.cwd(), 'public/uploads/honors');
    await mkdir(uploadsDir, { recursive: true });
    const extension = extname(file.originalname || '').toLowerCase() || '.png';
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}${extension}`;
    await writeFile(resolve(uploadsDir, fileName), file.buffer);

    return {
      code: 0,
      message: 'ok',
      data: {
        url: `/uploads/honors/${fileName}`,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
      },
    };
  }

  async updateStatus(authorization: string | undefined, id: number, status: 'enabled' | 'disabled') {
    const user = await this.authService.getAuthUserFromAuthorization(authorization);
    this.ensureCanManageHonors(user.roleCode);

    const honor = await this.prisma.honor.findFirst({
      where: {
        id: BigInt(id),
        schoolId: user.schoolId,
      },
    });
    if (!honor) {
      throw new NotFoundException('荣誉不存在');
    }

    const updated = await this.prisma.honor.update({
      where: { id: BigInt(id) },
      data: { status },
    });

    await this.operationLogService.create({
      schoolId: user.schoolId,
      userId: user.id,
      roleCode: user.roleCode,
      terminalType: 'admin',
      module: 'honor',
      action: 'status_update',
      targetType: 'honor',
      targetId: updated.id,
      detail: {
        code: honor.code,
        name: honor.name,
        status,
      },
    });

    return { code: 0, message: 'ok', data: { id: toNumber(updated.id), status } };
  }

  async records(authorization: string | undefined, query: Record<string, string>) {
    const user = await this.authService.getAuthUserFromAuthorization(authorization);
    if (query.classId) {
      this.authService.ensureCanAccessClass(user, Number(query.classId));
    }

    const rows = await this.prisma.honorRecord.findMany({
      where: {
        schoolId: user.schoolId,
        honorId: query.honorId ? BigInt(query.honorId) : undefined,
        targetType: query.targetType || undefined,
        classId: query.classId ? BigInt(query.classId) : undefined,
        studentId: query.studentId ? BigInt(query.studentId) : undefined,
      },
      include: {
        honor: true,
        classroom: true,
        student: true,
        grantedByUser: true,
      },
      orderBy: { grantedAt: 'desc' },
      take: 200,
    });

    const filteredRows =
      ['super_admin', 'school_admin', 'moral_admin'].includes(user.roleCode)
        ? rows
        : rows.filter((row) => this.authService.canAccessClass(user, row.classId));

    return {
      code: 0,
      message: 'ok',
      data: filteredRows.map((row) => ({
        id: toNumber(row.id),
        honorId: toNumber(row.honorId),
        honorName: row.honor.name,
        honorIconUrl: row.honor.iconUrl,
        targetType: row.targetType,
        targetId: toNumber(row.targetId),
        schoolId: toNumber(row.schoolId),
        classId: toNumber(row.classId),
        className: row.classroom.name,
        studentId: row.studentId ? toNumber(row.studentId) : null,
        studentName: row.student?.name ?? null,
        grantedBy: row.grantedBy ? toNumber(row.grantedBy) : null,
        grantedByName: row.grantedByUser?.name ?? null,
        grantedAt: row.grantedAt,
        remark: row.remark,
        createdAt: row.createdAt,
      })),
    };
  }

  async createRecord(authorization: string | undefined, body: HonorRecordCreateDto) {
    const user = await this.authService.getAuthUserFromAuthorization(authorization);
    if (body.targetType === 'class') {
      this.ensureCanGrantClassHonor(user.roleCode);
    } else if (body.targetType === 'student') {
      this.ensureCanGrantStudentHonor(user.roleCode);
    } else {
      throw new BadRequestException('不支持的荣誉颁发对象类型');
    }
    this.authService.ensureCanAccessClass(user, body.classId);

    const result = await this.prisma.$transaction(async (tx) => {
      const honor = await tx.honor.findFirst({
        where: {
          id: BigInt(body.honorId),
          schoolId: user.schoolId,
          status: 'enabled',
        },
      });
      if (!honor) {
        throw new NotFoundException('荣誉不存在或已停用');
      }

      if (body.targetType === 'class') {
        if (honor.category !== 'collective') {
          throw new BadRequestException('班级荣誉仅可颁发集体类勋章');
        }
      } else if (honor.category === 'collective') {
        throw new BadRequestException('集体类勋章仅可颁发给班级');
      }

      const classroom = await tx.classroom.findFirst({
        where: {
          id: BigInt(body.classId),
          schoolId: user.schoolId,
          status: 'enabled',
        },
      });
      if (!classroom) {
        throw new NotFoundException('班级不存在');
      }

      let studentId: bigint | null = null;
      let studentName: string | null = null;
      if (body.targetType === 'student') {
        const student = await tx.student.findFirst({
          where: {
            id: BigInt(body.targetId),
            classId: BigInt(body.classId),
            schoolId: user.schoolId,
            status: 'enabled',
            deletedAt: null,
          },
        });
        if (!student) {
          throw new NotFoundException('学生不存在');
        }
        studentId = student.id;
        studentName = student.name;
      } else {
        if (body.targetId !== body.classId) {
          throw new BadRequestException('班级荣誉的 targetId 必须等于 classId');
        }
      }

      const record = await tx.honorRecord.create({
        data: {
          honorId: honor.id,
          targetType: body.targetType,
          targetId: BigInt(body.targetId),
          schoolId: user.schoolId,
          classId: BigInt(body.classId),
          studentId,
          grantedBy: user.id,
          grantedAt: new Date(),
          remark: body.remark,
        },
      });

      if (studentId) {
        await tx.studentProfile.upsert({
          where: { studentId },
          create: {
            studentId,
            classId: BigInt(body.classId),
            honorsCount: 1,
          },
          update: {
            honorsCount: { increment: 1 },
          },
        });
      }

      return {
        recordId: toNumber(record.id),
        honorId: toNumber(honor.id),
        honorName: honor.name,
        honorIconUrl: honor.iconUrl,
        targetType: body.targetType,
        targetId: body.targetId,
        classId: body.classId,
        className: classroom.name,
        gradeName: classroom.gradeName,
        studentId: studentId ? toNumber(studentId) : null,
        studentName,
        grantedAt: record.grantedAt.toISOString(),
        remark: body.remark ?? null,
        operatorName: user.name,
      };
    });

    await this.operationLogService.create({
      schoolId: user.schoolId,
      userId: user.id,
      roleCode: user.roleCode,
      terminalType: 'admin',
      module: 'honor',
      action: 'grant',
      targetType: body.targetType,
      targetId: BigInt(body.targetId),
      detail: {
        honorId: body.honorId,
        classId: body.classId,
        targetType: body.targetType,
        remark: body.remark ?? null,
      },
    });

    this.realtimeService.emitHonorGranted(body.classId, {
      classId: body.classId,
      recordId: result.recordId,
      honorId: result.honorId,
      honorName: result.honorName,
      honorIconUrl: result.honorIconUrl,
      targetType: result.targetType,
      targetId: result.targetId,
      studentId: result.studentId,
      studentName: result.studentName,
      className: result.className,
      gradeName: result.gradeName,
      grantedAt: result.grantedAt,
      remark: result.remark,
      operatorName: result.operatorName,
    });

    return { code: 0, message: 'ok', data: result };
  }

  private ensureCanManageHonors(roleCode: string) {
    if (!SCHOOL_HONOR_ADMIN_ROLES.includes(roleCode as (typeof SCHOOL_HONOR_ADMIN_ROLES)[number])) {
      throw new ForbiddenException('仅学校管理员、德育管理员或教务管理员可维护荣誉勋章');
    }
  }

  private ensureCanGrantStudentHonor(roleCode: string) {
    if (
      SCHOOL_HONOR_ADMIN_ROLES.includes(roleCode as (typeof SCHOOL_HONOR_ADMIN_ROLES)[number]) ||
      STUDENT_HONOR_GRANT_TEACHER_ROLES.includes(roleCode as (typeof STUDENT_HONOR_GRANT_TEACHER_ROLES)[number])
    ) {
      return;
    }
    throw new ForbiddenException('当前角色无权为学生颁发荣誉');
  }

  private ensureCanGrantClassHonor(roleCode: string) {
    if (SCHOOL_HONOR_ADMIN_ROLES.includes(roleCode as (typeof SCHOOL_HONOR_ADMIN_ROLES)[number])) {
      return;
    }
    throw new ForbiddenException('仅校级管理员可为班级颁发集体荣誉');
  }
}

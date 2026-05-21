import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { AuthService } from '../auth/auth.service';
import { RealtimeService } from '../realtime/realtime.service';
import { CreateCallDto } from './dto/create-call.dto';
import { AuthUser } from '@/common/auth/auth-user.interface';
import { toNumber } from '@/common/utils/bigint.util';

@Injectable()
export class CallQueueService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authService: AuthService,
    private readonly realtimeService: RealtimeService,
  ) {}

  async createCall(user: AuthUser, dto: CreateCallDto) {
    if (!dto.studentIds || dto.studentIds.length === 0) {
      throw new BadRequestException('请选择要叫号的学生');
    }

    const students = await this.prisma.student.findMany({
      where: {
        id: { in: dto.studentIds.map(BigInt) },
        schoolId: user.schoolId,
        deletedAt: null,
      },
      select: { id: true, name: true, classId: true },
    });

    if (students.length === 0) {
      throw new BadRequestException('未找到指定的学生信息');
    }

    // 按班级分组，支持跨班级批量叫号，各班级独立排队
    const studentsByClass = new Map<bigint, Array<{ id: number; name: string }>>();
    for (const s of students) {
      if (!studentsByClass.has(s.classId)) {
        studentsByClass.set(s.classId, []);
      }
      studentsByClass.get(s.classId)!.push({ id: toNumber(s.id) as number, name: s.name });
    }

    const results: any[] = [];

    for (const [classId, studentList] of studentsByClass.entries()) {
      // 校验当前用户是否有权访问该班级
      this.authService.ensureCanAccessClass(user, classId);

      // 检查当前班级是否已有呼叫中的叫号记录
      const activeCall = await this.prisma.callQueue.findFirst({
        where: {
          classId,
          status: 'calling',
        },
      });

      const initialStatus = activeCall ? 'pending' : 'calling';

      const record = await this.prisma.callQueue.create({
        data: {
          schoolId: user.schoolId,
          classId,
          location: dto.location,
          callerId: user.id,
          callerName: user.name,
          calledStudents: studentList,
          status: initialStatus,
        },
      });

      const serialized = this.serializeCall(record);
      results.push(serialized);

      // 如果是当前活动的叫号，通过 Socket.IO 实时推送变更到大屏端
      if (initialStatus === 'calling') {
        this.realtimeService.emitCallQueueChanged(Number(classId), serialized);
      }
    }

    return {
      code: 0,
      message: 'ok',
      data: results,
    };
  }

  async confirmCall(id: number) {
    const record = await this.prisma.callQueue.findUnique({
      where: { id: BigInt(id) },
    });

    if (!record) {
      throw new NotFoundException('该叫号记录不存在');
    }

    if (record.status === 'completed' || record.status === 'cancelled') {
      return { code: 0, message: 'ok' };
    }

    await this.prisma.callQueue.update({
      where: { id: record.id },
      data: { status: 'completed' },
    });

    if (record.status === 'calling') {
      await this.advanceQueue(record.classId);
    }

    return { code: 0, message: 'ok' };
  }

  async cancelCall(user: AuthUser, id: number) {
    const record = await this.prisma.callQueue.findUnique({
      where: { id: BigInt(id) },
    });

    if (!record) {
      throw new NotFoundException('该叫号记录不存在');
    }

    const isAdmin = ['super_admin', 'school_admin', 'academic_admin', 'moral_admin'].includes(user.roleCode);
    if (record.callerId !== user.id && !isAdmin) {
      throw new ForbiddenException('无权取消他人发起的叫号');
    }

    if (record.status === 'completed' || record.status === 'cancelled') {
      return { code: 0, message: 'ok' };
    }

    await this.prisma.callQueue.update({
      where: { id: record.id },
      data: { status: 'cancelled' },
    });

    if (record.status === 'calling') {
      await this.advanceQueue(record.classId);
    }

    return { code: 0, message: 'ok' };
  }

  async getActiveCall(classId: number) {
    const record = await this.prisma.callQueue.findFirst({
      where: {
        classId: BigInt(classId),
        status: 'calling',
      },
      orderBy: { createdAt: 'asc' },
    });

    return {
      code: 0,
      message: 'ok',
      data: this.serializeCall(record),
    };
  }

  async getQueueList(classId: number) {
    const records = await this.prisma.callQueue.findMany({
      where: {
        classId: BigInt(classId),
        status: { in: ['calling', 'pending'] },
      },
      orderBy: { createdAt: 'asc' },
    });

    return {
      code: 0,
      message: 'ok',
      data: records.map((r) => this.serializeCall(r)),
    };
  }

  private async advanceQueue(classId: bigint) {
    // 获取队列中下一条等待呼叫的记录
    const nextCall = await this.prisma.callQueue.findFirst({
      where: {
        classId,
        status: 'pending',
      },
      orderBy: { createdAt: 'asc' },
    });

    if (nextCall) {
      const updated = await this.prisma.callQueue.update({
        where: { id: nextCall.id },
        data: { status: 'calling' },
      });
      const serialized = this.serializeCall(updated);
      this.realtimeService.emitCallQueueChanged(Number(classId), serialized);
    } else {
      // 队列中无待呼叫内容，通知大屏清除呼叫界面
      this.realtimeService.emitCallQueueChanged(Number(classId), null);
    }
  }

  private serializeCall(record: any) {
    if (!record) return null;
    return {
      id: toNumber(record.id),
      schoolId: toNumber(record.schoolId),
      classId: toNumber(record.classId),
      location: record.location,
      callerId: toNumber(record.callerId),
      callerName: record.callerName,
      calledStudents: record.calledStudents,
      status: record.status,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }
}

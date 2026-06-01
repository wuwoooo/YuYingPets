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
    this.ensureCanUseCallQueue(user);

    if (!dto.studentIds || dto.studentIds.length === 0) {
      throw new BadRequestException('请选择要叫号的学生');
    }

    const students = await this.prisma.student.findMany({
      where: {
        id: { in: dto.studentIds.map(BigInt) },
        schoolId: user.schoolId,
        deletedAt: null,
        status: 'enabled',
      },
      select: { id: true, name: true, classId: true },
    });

    if (students.length === 0) {
      throw new BadRequestException('未找到指定的学生信息');
    }

    if (dto.classId) {
      const targetClassId = BigInt(dto.classId);
      if (students.some((student) => student.classId !== targetClassId)) {
        throw new BadRequestException('所选学生必须全部来自同一个班级');
      }
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
      await this.ensureClassHasOnlineDisplay(user, classId);

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

  async getCallableClasses(user: AuthUser) {
    this.ensureCanUseCallQueue(user);

    const accessibleClassIds = this.authService.getAccessibleClassIds(user);
    const terminals = await this.prisma.displayTerminal.findMany({
      where: {
        schoolId: user.schoolId,
        classId: accessibleClassIds === null ? { not: null } : { in: accessibleClassIds },
        status: 'enabled',
      },
      select: {
        terminalCode: true,
        classId: true,
        classroom: {
          select: {
            id: true,
            schoolId: true,
            semesterId: true,
            code: true,
            gradeCode: true,
            gradeName: true,
            name: true,
            slogan: true,
            targetScore: true,
            countdownTitle: true,
            countdownDeadlineAt: true,
            sortOrder: true,
            displayStatus: true,
            homeroomTeacher: {
              select: {
                id: true,
                name: true,
                username: true,
              },
            },
            students: {
              where: { deletedAt: null, status: 'enabled' },
              select: { id: true },
            },
            studentProfiles: {
              select: { currentScore: true, totalScore: true },
            },
            classScoreProfile: {
              select: { currentScore: true, totalScore: true },
            },
          },
        },
      },
    });

    const onlineTerminalCodes = await this.realtimeService.listOnlineDisplayTerminalCodes(
      terminals.map((item) => item.terminalCode),
    );

    const classMap = new Map<
      string,
      {
        id: number;
        schoolId: number;
        semesterId: number;
        code: string;
        gradeCode: string;
        gradeName: string;
        name: string;
        slogan: string | null;
        targetScore: number | null;
        countdownTitle: string | null;
        countdownDeadlineAt: Date | null;
        sortOrder: number | null;
        displayStatus: string;
        onlineStatus: 'online' | 'offline';
        studentCount: number;
        currentScoreTotal: number;
        totalScoreTotal: number;
        classScore: number;
        classTotalScore: number;
        homeroomTeacher: { id: number; name: string; username: string } | null;
      }
    >();

    for (const terminal of terminals) {
      if (!terminal.classId || !terminal.classroom) {
        continue;
      }

      const key = terminal.classId.toString();
      const isOnline = onlineTerminalCodes.has(terminal.terminalCode);
      if (classMap.has(key)) {
        if (isOnline) {
          classMap.get(key)!.onlineStatus = 'online';
        }
        continue;
      }

      classMap.set(key, {
        id: Number(terminal.classroom.id),
        schoolId: Number(terminal.classroom.schoolId),
        semesterId: Number(terminal.classroom.semesterId),
        code: terminal.classroom.code,
        gradeCode: terminal.classroom.gradeCode,
        gradeName: terminal.classroom.gradeName,
        name: terminal.classroom.name,
        slogan: terminal.classroom.slogan,
        targetScore: terminal.classroom.targetScore,
        countdownTitle: terminal.classroom.countdownTitle,
        countdownDeadlineAt: terminal.classroom.countdownDeadlineAt,
        sortOrder: terminal.classroom.sortOrder,
        displayStatus: terminal.classroom.displayStatus ?? 'enabled',
        onlineStatus: isOnline ? 'online' : 'offline',
        studentCount: terminal.classroom.students.length,
        currentScoreTotal: terminal.classroom.studentProfiles.reduce((sum, item) => sum + item.currentScore, 0),
        totalScoreTotal: terminal.classroom.studentProfiles.reduce((sum, item) => sum + item.totalScore, 0),
        classScore: terminal.classroom.classScoreProfile?.currentScore ?? 0,
        classTotalScore: terminal.classroom.classScoreProfile?.totalScore ?? 0,
        homeroomTeacher: terminal.classroom.homeroomTeacher
          ? {
              id: Number(terminal.classroom.homeroomTeacher.id),
              name: terminal.classroom.homeroomTeacher.name,
              username: terminal.classroom.homeroomTeacher.username,
            }
          : null,
      });
    }

    return {
      code: 0,
      message: 'ok',
      data: Array.from(classMap.values()).sort((left, right) => {
        const gradeCompare = left.gradeCode.localeCompare(right.gradeCode, 'zh-Hans-CN', { numeric: true });
        if (gradeCompare !== 0) return gradeCompare;
        const leftSort = left.sortOrder ?? Number.MAX_SAFE_INTEGER;
        const rightSort = right.sortOrder ?? Number.MAX_SAFE_INTEGER;
        if (leftSort !== rightSort) return leftSort - rightSort;
        return left.id - right.id;
      }),
    };
  }

  async getCallableClassStudents(user: AuthUser, classId: number) {
    await this.ensureClassHasOnlineDisplay(user, classId);

    const rows = await this.prisma.student.findMany({
      where: {
        schoolId: user.schoolId,
        classId: BigInt(classId),
        deletedAt: null,
        status: 'enabled',
      },
      include: {
        classroom: true,
        profile: true,
        studentPet: {
          include: {
            pet: true,
          },
        },
      },
      orderBy: [{ studentNo: 'asc' }, { id: 'asc' }],
    });

    return {
      code: 0,
      message: 'ok',
      data: rows.map((row) => ({
        id: toNumber(row.id),
        schoolId: toNumber(row.schoolId),
        classId: toNumber(row.classId),
        studentNo: row.studentNo,
        name: row.name,
        gender: row.gender,
        avatarUrl: row.avatarUrl,
        status: row.status,
        className: row.classroom.name,
        currentScore: row.profile?.currentScore ?? 0,
        totalScore: row.profile?.totalScore ?? 0,
        currentPetLevel: row.profile?.currentPetLevel ?? 1,
        latestAcademic: null,
        pet: row.studentPet
          ? {
              id: toNumber(row.studentPet.pet.id),
              name: row.studentPet.pet.name,
              coverUrl: row.studentPet.pet.coverUrl,
              currentLevel: row.profile?.currentPetLevel ?? 1,
              totalScore: row.profile?.totalScore ?? 0,
            }
          : null,
      })),
    };
  }

  async confirmCall(user: AuthUser, id: number) {
    const record = await this.prisma.callQueue.findUnique({
      where: { id: BigInt(id) },
    });

    if (!record) {
      throw new NotFoundException('该叫号记录不存在');
    }
    this.authService.ensureCanAccessClass(user, record.classId);

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

  async getActiveCall(user: AuthUser, classId: number) {
    this.authService.ensureCanAccessClass(user, classId);
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

  async getQueueList(user: AuthUser, classId: number) {
    await this.ensureClassHasOnlineDisplay(user, classId);

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

  private ensureCanUseCallQueue(user: AuthUser) {
    if (!this.authService.canOperateDisplay(user)) {
      throw new ForbiddenException('当前角色无权使用大屏叫号');
    }
  }

  private async ensureClassHasOnlineDisplay(user: AuthUser, classId: bigint | number) {
    this.ensureCanUseCallQueue(user);

    const targetClassId = typeof classId === 'bigint' ? classId : BigInt(classId);
    this.authService.ensureCanAccessClass(user, targetClassId);

    const classroom = await this.prisma.classroom.findFirst({
      where: {
        id: targetClassId,
        schoolId: user.schoolId,
        deletedAt: null,
        status: 'enabled',
      },
      select: { id: true },
    });

    if (!classroom) {
      throw new NotFoundException('班级不存在');
    }

    const terminals = await this.prisma.displayTerminal.findMany({
      where: {
        schoolId: user.schoolId,
        classId: targetClassId,
        status: 'enabled',
      },
      select: { terminalCode: true },
    });

    if (terminals.length === 0) {
      throw new ForbiddenException('当前班级未绑定大屏终端');
    }

    const onlineTerminalCodes = await this.realtimeService.listOnlineDisplayTerminalCodes(
      terminals.map((item) => item.terminalCode),
    );

    if (onlineTerminalCodes.size === 0) {
      throw new ForbiddenException('当前班级大屏未在线');
    }
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

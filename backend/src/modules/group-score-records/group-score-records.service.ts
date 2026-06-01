import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AuthUser } from '@/common/auth/auth-user.interface';
import { toNumber } from '@/common/utils/bigint.util';
import { PrismaService } from '@/prisma/prisma.service';
import { AuthService } from '../auth/auth.service';
import { OperationLogService } from '../operation-log/operation-log.service';
import { RealtimeService } from '../realtime/realtime.service';
import { GroupScoreAdjustDto } from './dto/group-score-adjust.dto';
import { GroupScoreResetDto } from './dto/group-score-reset.dto';

type LoadedClassroom = {
  id: bigint;
  schoolId: bigint;
  semesterId: bigint;
  name: string;
};

@Injectable()
export class GroupScoreRecordsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authService: AuthService,
    private readonly operationLogService: OperationLogService,
    private readonly realtimeService: RealtimeService,
  ) {}

  async list(
    authorization: string | undefined,
    classId: number,
    query: Record<string, string>,
  ) {
    const user = await this.authService.getAuthUserFromAuthorization(authorization);
    this.authService.ensureCanAccessClass(user, classId);
    if (user.roleCode === 'homeroom_teacher') {
      await this.authService.ensureIsHomeroomOfClass(user, classId);
    }

    const classGroupId = query.classGroupId ? BigInt(query.classGroupId) : undefined;
    const rows = await this.prisma.classGroupScoreRecord.findMany({
      where: {
        classId: BigInt(classId),
        ...(classGroupId ? { classGroupId } : {}),
      },
      include: {
        classGroup: { select: { id: true, groupNo: true, name: true } },
      },
      orderBy: [{ occurredAt: 'desc' }, { id: 'desc' }],
      take: 100,
    });

    return {
      code: 0,
      message: 'ok',
      data: rows.map((row) => ({
        id: toNumber(row.id),
        classId: toNumber(row.classId),
        classGroupId: toNumber(row.classGroupId),
        groupNo: row.classGroup.groupNo,
        groupName: row.classGroup.name,
        scoreDelta: row.scoreDelta,
        remark: row.remark,
        operatorName: row.operatorName,
        occurredAt: row.occurredAt,
        createdAt: row.createdAt,
      })),
    };
  }

  async ranking(authorization: string | undefined, classId: number) {
    const user = await this.authService.getAuthUserFromAuthorization(authorization);
    this.authService.ensureCanAccessClass(user, classId);

    const groups = await this.prisma.classGroup.findMany({
      where: { classId: BigInt(classId), status: 'enabled' },
      orderBy: [{ groupNo: 'asc' }, { id: 'asc' }],
    });

    const sorted = [...groups].sort((left, right) => {
      const scoreDiff = right.groupCurrentScore - left.groupCurrentScore;
      if (scoreDiff !== 0) return scoreDiff;
      return left.groupNo - right.groupNo || Number(left.id - right.id);
    });

    return {
      code: 0,
      message: 'ok',
      data: sorted.map((group, index) => ({
        rank: index + 1,
        id: toNumber(group.id),
        classId: toNumber(group.classId),
        groupNo: group.groupNo,
        name: group.name,
        groupScore: group.groupCurrentScore,
        groupTotalScore: group.groupTotalScore,
        groupLastScoreAt: group.groupLastScoreAt,
      })),
    };
  }

  async adjust(
    authorization: string | undefined,
    classId: number,
    body: GroupScoreAdjustDto,
  ) {
    const user = await this.authService.getAuthUserFromAuthorization(authorization);
    this.ensureCanManageGroupScore(user.roleCode);
    this.authService.ensureCanAccessClass(user, classId);
    if (user.roleCode === 'homeroom_teacher') {
      await this.authService.ensureIsHomeroomOfClass(user, classId);
    }

    const scoreDelta = Number(body.scoreDelta);
    if (!Number.isInteger(scoreDelta) || scoreDelta === 0) {
      throw new BadRequestException('分值须为非 0 整数');
    }
    const remark = body.remark?.trim();
    if (!remark) {
      throw new BadRequestException('请填写事由');
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const classroom = await this.loadClassroomForTransaction(tx, classId, user.schoolId);
      const classGroup = await tx.classGroup.findFirst({
        where: {
          id: BigInt(body.classGroupId),
          classId: BigInt(classId),
          status: 'enabled',
        },
      });
      if (!classGroup) {
        throw new NotFoundException('小组不存在或已禁用');
      }

      const nextCurrentScore = classGroup.groupCurrentScore + scoreDelta;
      const nextTotalScore = classGroup.groupTotalScore + Math.max(scoreDelta, 0);
      const now = new Date();

      const updatedGroup = await tx.classGroup.update({
        where: { id: classGroup.id },
        data: {
          groupCurrentScore: nextCurrentScore,
          groupTotalScore: nextTotalScore,
          groupLastScoreAt: now,
        },
      });

      const record = await tx.classGroupScoreRecord.create({
        data: {
          schoolId: classroom.schoolId,
          semesterId: classroom.semesterId,
          classId: classroom.id,
          classGroupId: classGroup.id,
          scoreDelta,
          remark,
          sourceTerminal: body.sourceTerminal,
          sourceRole: user.roleCode,
          operatorId: user.id,
          operatorName: user.name,
          occurredAt: now,
        },
      });

      return {
        classGroupId: toNumber(classGroup.id),
        groupNo: classGroup.groupNo,
        groupName: classGroup.name,
        scoreDelta,
        groupScore: updatedGroup.groupCurrentScore,
        groupTotalScore: updatedGroup.groupTotalScore,
        recordId: toNumber(record.id),
      };
    });

    await this.operationLogService.create({
      schoolId: user.schoolId,
      userId: user.id,
      roleCode: user.roleCode,
      terminalType: body.sourceTerminal,
      module: 'class_group_score',
      action: 'adjust',
      targetType: 'class_group',
      targetId: BigInt(body.classGroupId),
      detail: {
        classId,
        classGroupId: body.classGroupId,
        scoreDelta,
        remark,
      },
    });

    this.realtimeService.emitClassGroupScoreChanged(classId, {
      classId,
      classGroupId: result.classGroupId,
      groupNo: result.groupNo,
      scoreDelta: result.scoreDelta,
      groupScore: result.groupScore,
      operatorName: user.name,
      sourceTerminal: body.sourceTerminal,
    });

    return { code: 0, message: 'ok', data: result };
  }

  async reset(
    authorization: string | undefined,
    classId: number,
    body: GroupScoreResetDto,
  ) {
    const user = await this.authService.getAuthUserFromAuthorization(authorization);
    this.ensureCanManageGroupScore(user.roleCode);
    this.authService.ensureCanAccessClass(user, classId);
    if (user.roleCode === 'homeroom_teacher') {
      await this.authService.ensureIsHomeroomOfClass(user, classId);
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const classroom = await this.loadClassroomForTransaction(tx, classId, user.schoolId);
      const groups = await tx.classGroup.findMany({
        where: { classId: BigInt(classId), status: 'enabled' },
      });

      const now = new Date();
      const resetItems: Array<{
        classGroupId: number;
        groupNo: number;
        groupName: string;
        previousScore: number;
      }> = [];

      for (const group of groups) {
        if (group.groupCurrentScore === 0) continue;

        const previousScore = group.groupCurrentScore;
        await tx.classGroup.update({
          where: { id: group.id },
          data: {
            groupCurrentScore: 0,
            groupLastScoreAt: now,
          },
        });

        await tx.classGroupScoreRecord.create({
          data: {
            schoolId: classroom.schoolId,
            semesterId: classroom.semesterId,
            classId: classroom.id,
            classGroupId: group.id,
            scoreDelta: -previousScore,
            remark: '小组积分一键清零',
            sourceTerminal: body.sourceTerminal,
            sourceRole: user.roleCode,
            operatorId: user.id,
            operatorName: user.name,
            occurredAt: now,
          },
        });

        resetItems.push({
          classGroupId: Number(group.id),
          groupNo: group.groupNo,
          groupName: group.name,
          previousScore,
        });
      }

      return { resetCount: resetItems.length, items: resetItems };
    });

    await this.operationLogService.create({
      schoolId: user.schoolId,
      userId: user.id,
      roleCode: user.roleCode,
      terminalType: body.sourceTerminal,
      module: 'class_group_score',
      action: 'reset_all',
      targetType: 'class',
      targetId: BigInt(classId),
      detail: {
        classId,
        resetCount: result.resetCount,
      },
    });

    this.realtimeService.emitClassGroupScoreChanged(classId, {
      classId,
      resetAll: true,
      resetCount: result.resetCount,
      operatorName: user.name,
      sourceTerminal: body.sourceTerminal,
    });

    return { code: 0, message: 'ok', data: result };
  }

  private ensureCanManageGroupScore(roleCode: string) {
    if (!['super_admin', 'school_admin', 'academic_admin', 'homeroom_teacher'].includes(roleCode)) {
      throw new ForbiddenException('当前角色无权操作小组积分');
    }
  }

  private async loadClassroomForTransaction(
    tx: Pick<Prisma.TransactionClient, 'classroom'>,
    classId: number,
    schoolId: bigint,
  ): Promise<LoadedClassroom> {
    const classroom = await tx.classroom.findFirst({
      where: {
        id: BigInt(classId),
        schoolId,
        deletedAt: null,
        status: 'enabled',
      },
      select: {
        id: true,
        schoolId: true,
        semesterId: true,
        name: true,
      },
    });
    if (!classroom) throw new NotFoundException('班级不存在');
    return classroom;
  }
}

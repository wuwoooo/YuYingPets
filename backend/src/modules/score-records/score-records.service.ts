import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import { AuthService } from '../auth/auth.service';
import { AuthUser } from '@/common/auth/auth-user.interface';
import { ScoreRecordCreateDto } from './dto/score-record-create.dto';
import { ScoreRecordBatchDto } from './dto/score-record-batch.dto';
import { ScoreRecordGroupDto } from './dto/score-record-group.dto';
import { ScoreRecordReverseDto } from './dto/score-record-reverse.dto';
import { toNumber } from '@/common/utils/bigint.util';
import { TerminalSource } from '@/common/types/terminal-source.type';
import { OperationLogService } from '../operation-log/operation-log.service';
import { RealtimeService } from '../realtime/realtime.service';
import {
  normalizePetGrowthThresholds,
  resolveMatchedPetStage,
} from '@/common/utils/pet-growth.util';
import { syncUnlockedDecorationsForLevel } from '@/common/utils/pet-decoration-unlock.util';

@Injectable()
export class ScoreRecordsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authService: AuthService,
    private readonly operationLogService: OperationLogService,
    private readonly realtimeService: RealtimeService,
  ) {}

  async list(authorization: string | undefined, query: Record<string, string>) {
    const user = authorization
      ? await this.authService.getAuthUserFromAuthorization(authorization).catch(() => null)
      : null;
    const classId = query.classId ? BigInt(query.classId) : undefined;
    if (user && classId) {
      this.authService.ensureCanAccessClass(user, classId);
    }
    const occurredAtFilter = this.buildOccurredAtFilter(query.startDate, query.endDate);
    const scoreRecordWhere = {
      classId,
      studentId: query.studentId ? BigInt(query.studentId) : undefined,
      subjectCode: query.subjectCode || undefined,
      operatorId: user?.roleCode === 'subject_teacher' ? user.id : undefined,
      occurredAt: occurredAtFilter,
    };

    const [scoreRows, rewardOrderRows] = await Promise.all([
      this.prisma.scoreRecord.findMany({
        where: scoreRecordWhere,
        include: {
          rule: {
            select: { name: true },
          },
          reversedBy: {
            select: { name: true },
          },
        },
        orderBy: { occurredAt: 'desc' },
        take: 100,
      }),
      query.subjectCode
        ? Promise.resolve([])
        : this.prisma.rewardOrder.findMany({
            where: {
              classId,
              studentId: query.studentId ? BigInt(query.studentId) : undefined,
              operatorId: user?.roleCode === 'subject_teacher' ? user.id : undefined,
              createdAt: this.buildCreatedAtFilter(query.startDate, query.endDate),
            },
            include: {
              reward: {
                select: {
                  name: true,
                },
              },
            },
            orderBy: { createdAt: 'desc' },
            take: 100,
          }),
    ]);

    const scoreItems = scoreRows.map(({ rule, reversedBy, ...row }) => ({
      ...row,
      id: toNumber(row.id),
      schoolId: toNumber(row.schoolId),
      semesterId: toNumber(row.semesterId),
      classId: toNumber(row.classId),
      studentId: toNumber(row.studentId),
      classGroupId: toNumber(row.classGroupId),
      ruleId: toNumber(row.ruleId),
      operatorId: toNumber(row.operatorId),
      reversedById: toNumber(row.reversedById),
      reversedByName: reversedBy?.name ?? null,
      ruleName: rule?.name ?? null,
    }));

    const rewardOrderItems = rewardOrderRows.map((row) => ({
      id: -Number(row.id),
      schoolId: toNumber(row.schoolId),
      semesterId: null,
      classId: toNumber(row.classId),
      studentId: toNumber(row.studentId),
      classGroupId: null,
      ruleId: null,
      subjectCode: null,
      sceneCode: 'reward_redeem',
      dimension: '奖励兑换',
      tag: row.reward.name,
      sentiment: 'negative' as const,
      scoreDelta: -Math.abs(row.scoreCost),
      remark: `兑换奖励：${row.reward.name}`,
      sourceTerminal: row.sourceTerminal,
      sourceRole: row.operatorRole,
      operatorId: toNumber(row.operatorId),
      operatorName: null,
      ruleName: `兑换奖励：${row.reward.name}`,
      occurredAt: row.createdAt,
      createdAt: row.createdAt,
      reversedAt: null,
      reversedById: null,
      reversedByName: null,
      reverseRemark: null,
    }));

    const rows = [...scoreItems, ...rewardOrderItems]
      .sort((a, b) => (b.occurredAt ?? b.createdAt).getTime() - (a.occurredAt ?? a.createdAt).getTime())
      .slice(0, 100);

    return {
      code: 0,
      message: 'ok',
      data: rows,
    };
  }

  private buildOccurredAtFilter(startDate?: string, endDate?: string): Prisma.DateTimeFilter | undefined {
    const range = this.resolveDateRange(startDate, endDate);
    if (!range) return undefined;
    return {
      gte: range.start,
      lte: range.end,
    };
  }

  private buildCreatedAtFilter(startDate?: string, endDate?: string): Prisma.DateTimeFilter | undefined {
    const range = this.resolveDateRange(startDate, endDate);
    if (!range) return undefined;
    return {
      gte: range.start,
      lte: range.end,
    };
  }

  private resolveDateRange(startDate?: string, endDate?: string) {
    const normalizedStart = this.normalizeDateString(startDate);
    const normalizedEnd = this.normalizeDateString(endDate);
    if (!normalizedStart && !normalizedEnd) return null;

    const start = new Date(`${normalizedStart ?? normalizedEnd}T00:00:00`);
    const end = new Date(`${normalizedEnd ?? normalizedStart}T23:59:59.999`);
    if (start.getTime() <= end.getTime()) {
      return { start, end };
    }
    return { start: end, end: start };
  }

  private normalizeDateString(value?: string) {
    if (!value) return null;
    const normalized = value.trim();
    return /^\d{4}-\d{2}-\d{2}$/.test(normalized) ? normalized : null;
  }

  async create(authorization: string | undefined, body: ScoreRecordCreateDto) {
    const user = await this.authService.getAuthUserFromAuthorization(authorization);
    this.ensureCanWriteScore(user.roleCode, body.sourceTerminal);
    this.authService.ensureCanAccessClass(user, body.classId);

    const result = await this.prisma.$transaction(async (tx) => {
      const target = await this.loadSingleTarget(tx, body.classId, body.studentId, body.ruleId);
      this.authService.ensureCanUseRuleForClass(user, body.classId, target.rule);
      const created = await this.createScoreRecordForStudent(tx, {
        schoolId: target.schoolId,
        semesterId: target.semesterId,
        classId: BigInt(body.classId),
        studentId: BigInt(body.studentId),
        classGroupId: target.classGroupId,
        rule: target.rule,
        operatorId: user.id,
        operatorName: user.name,
        sourceTerminal: body.sourceTerminal,
        sourceRole: user.roleCode,
        remark: body.remark,
      });

      return created;
    });

    await this.operationLogService.create({
      schoolId: user.schoolId,
      userId: user.id,
      roleCode: user.roleCode,
      terminalType: body.sourceTerminal,
      module: 'score_record',
      action: 'create',
      targetType: 'student',
      targetId: BigInt(body.studentId),
      detail: {
        classId: body.classId,
        ruleId: body.ruleId,
        remark: body.remark,
      },
    });

    this.realtimeService.emitClassScoreChanged(body.classId, {
      classId: body.classId,
      studentIds: [body.studentId],
      sourceTerminal: body.sourceTerminal,
      operatorName: user.name,
      changes: this.buildStudentScoreChanges([result]),
      upgrades: result.petUpgrade.upgraded
        ? [
            {
              studentId: body.studentId,
              beforeLevel: result.petUpgrade.beforeLevel,
              afterLevel: result.petUpgrade.afterLevel,
            },
          ]
        : [],
    });

    return { code: 0, message: 'ok', data: result };
  }

  async batch(authorization: string | undefined, body: ScoreRecordBatchDto) {
    const user = await this.authService.getAuthUserFromAuthorization(authorization);
    this.ensureCanWriteScore(user.roleCode, body.sourceTerminal);
    this.authService.ensureCanAccessClass(user, body.classId);

    const result = await this.prisma.$transaction(async (tx) => {
      const rule = await tx.scoreRule.findFirst({
        where: { id: BigInt(body.ruleId), deletedAt: null, status: 'enabled' },
      });
      if (!rule) throw new NotFoundException('积分规则不存在');
      if (rule.scoreTarget === 'class') {
        throw new ForbiddenException('班级积分规则不能用于学生评价');
      }
      this.authService.ensureCanUseRuleForClass(user, body.classId, rule);

      const batch = await tx.scoreRecordBatch.create({
        data: {
          schoolId: user.schoolId,
          classId: BigInt(body.classId),
          actionType: 'batch',
          ruleId: rule.id,
          scoreDelta: this.resolveSignedValue(rule.scoreType, rule.scoreValue),
          remark: body.remark,
          sourceTerminal: body.sourceTerminal,
          operatorId: user.id,
        },
      });

      const items = [];
      for (const studentId of body.studentIds) {
        const target = await this.loadSingleTarget(tx, body.classId, studentId, body.ruleId);
        const created = await this.createScoreRecordForStudent(tx, {
          schoolId: target.schoolId,
          semesterId: target.semesterId,
          classId: BigInt(body.classId),
          studentId: BigInt(studentId),
          classGroupId: target.classGroupId,
          rule: target.rule,
          operatorId: user.id,
          operatorName: user.name,
          sourceTerminal: body.sourceTerminal,
          sourceRole: user.roleCode,
          remark: body.remark,
        });
        await tx.scoreRecordBatchItem.create({
          data: {
            batchId: batch.id,
            scoreRecordId: BigInt(created.scoreRecordId),
            studentId: BigInt(studentId),
          },
        });
        items.push(created);
      }

      return {
        batchId: toNumber(batch.id),
        items,
      };
    });

    await this.operationLogService.create({
      schoolId: user.schoolId,
      userId: user.id,
      roleCode: user.roleCode,
      terminalType: body.sourceTerminal,
      module: 'score_record',
      action: 'batch_create',
      targetType: 'class',
      targetId: BigInt(body.classId),
      detail: {
        classId: body.classId,
        ruleId: body.ruleId,
        studentIds: body.studentIds,
        remark: body.remark,
      },
    });

    this.realtimeService.emitClassScoreChanged(body.classId, {
      classId: body.classId,
      studentIds: body.studentIds,
      sourceTerminal: body.sourceTerminal,
      operatorName: user.name,
      batchId: result.batchId,
      changes: this.buildStudentScoreChanges(result.items),
      upgrades: result.items
        .filter((item) => item.petUpgrade?.upgraded)
        .map((item) => ({
          studentId: item.studentProfile.studentId,
          beforeLevel: item.petUpgrade.beforeLevel,
          afterLevel: item.petUpgrade.afterLevel,
        })),
    });

    return { code: 0, message: 'ok', data: result };
  }

  async group(authorization: string | undefined, body: ScoreRecordGroupDto) {
    const user = await this.authService.getAuthUserFromAuthorization(authorization);
    this.ensureCanWriteScore(user.roleCode, body.sourceTerminal);
    this.authService.ensureCanAccessClass(user, body.classId);

    const members = await this.prisma.studentGroupRel.findMany({
      where: { classGroupId: BigInt(body.classGroupId) },
      select: { studentId: true },
    });

    const result = await this.batch(authorization, {
      classId: body.classId,
      studentIds: members.map((item) => Number(item.studentId)),
      ruleId: body.ruleId,
      remark: body.remark,
      sourceTerminal: body.sourceTerminal,
    });

    await this.operationLogService.create({
      schoolId: user.schoolId,
      userId: user.id,
      roleCode: user.roleCode,
      terminalType: body.sourceTerminal,
      module: 'score_record',
      action: 'group_create',
      targetType: 'class_group',
      targetId: BigInt(body.classGroupId),
      detail: {
        classId: body.classId,
        classGroupId: body.classGroupId,
        ruleId: body.ruleId,
      },
    });

    return result;
  }

  async createLinkedRecordsForClassEvaluation(
    tx: Prisma.TransactionClient,
    params: {
      schoolId: bigint;
      semesterId: bigint;
      classId: bigint;
      rule: {
        id: bigint;
        subjectCode: string | null;
        sceneCode: string;
        dimension: string | null;
        tag: string | null;
        sentiment: 'positive' | 'negative';
        scoreType: 'add' | 'deduct';
        scoreValue: number;
        scoreTarget?: 'student' | 'class';
      };
      operatorId: bigint;
      operatorName: string;
      sourceTerminal: TerminalSource;
      sourceRole: string;
      remark?: string;
      linkMultiplier: number;
    },
  ) {
    const multiplier = Math.max(0, Math.trunc(Number(params.linkMultiplier)));
    if (multiplier <= 0) {
      return [];
    }

    const classScoreDelta = this.resolveSignedValue(params.rule.scoreType, params.rule.scoreValue);
    const linkedStudentScoreDelta = classScoreDelta * multiplier;
    if (linkedStudentScoreDelta === 0) {
      return [];
    }

    const students = await tx.student.findMany({
      where: {
        classId: params.classId,
        deletedAt: null,
        status: 'enabled',
      },
      include: {
        groupRel: true,
      },
      orderBy: [{ studentNo: 'asc' }, { id: 'asc' }],
    });

    const remark = params.remark?.trim()
      ? `${params.remark.trim()}（班级评价联动）`
      : '班级评价联动';

    const items = [];
    for (const student of students) {
      const created = await this.createScoreRecordForStudent(tx, {
        schoolId: params.schoolId,
        semesterId: params.semesterId,
        classId: params.classId,
        studentId: student.id,
        classGroupId: student.groupRel?.classGroupId ?? null,
        rule: params.rule,
        operatorId: params.operatorId,
        operatorName: params.operatorName,
        sourceTerminal: params.sourceTerminal,
        sourceRole: params.sourceRole,
        remark,
        allowClassRuleLinkage: true,
        overrideScoreDelta: linkedStudentScoreDelta,
      });
      items.push(created);
    }

    return items;
  }

  async reverse(authorization: string | undefined, id: number, body: ScoreRecordReverseDto) {
    const user = await this.authService.getAuthUserFromAuthorization(authorization);
    if (id <= 0) {
      throw new BadRequestException('兑换记录不可撤销，请前往奖励管理处理');
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const record = await tx.scoreRecord.findUnique({
        where: { id: BigInt(id) },
        include: {
          rule: { select: { name: true } },
        },
      });
      if (!record) {
        throw new NotFoundException('评价记录不存在');
      }
      if (record.reversedAt) {
        throw new BadRequestException('该记录已撤销');
      }

      await this.ensureCanReverseScore(user, record);
      const rollbackDelta = -record.scoreDelta;

      const profile = await tx.studentProfile.findUnique({
        where: { studentId: record.studentId },
      });
      if (!profile) {
        throw new NotFoundException('学生积分档案不存在');
      }

      const nextCurrentScore = profile.currentScore + rollbackDelta;
      const nextTotalScore = profile.totalScore + Math.max(rollbackDelta, 0);
      const nextPositiveCount7d =
        record.sentiment === 'positive' ? Math.max(0, profile.positiveCount7d - 1) : profile.positiveCount7d;
      const nextNegativeCount7d =
        record.sentiment === 'negative' ? Math.max(0, profile.negativeCount7d - 1) : profile.negativeCount7d;

      const updatedProfile = await tx.studentProfile.update({
        where: { studentId: record.studentId },
        data: {
          currentScore: nextCurrentScore,
          totalScore: nextTotalScore,
          positiveCount7d: nextPositiveCount7d,
          negativeCount7d: nextNegativeCount7d,
        },
      });

      const reversedAt = new Date();
      await tx.scoreRecord.update({
        where: { id: record.id },
        data: {
          reversedAt,
          reversedById: user.id,
          reverseRemark: body.remark.trim(),
        },
      });

      const petChange = await this.rollbackStudentPetForReverse(tx, record);

      return {
        scoreRecordId: Number(record.id),
        classId: Number(record.classId),
        studentId: Number(record.studentId),
        scoreDelta: record.scoreDelta,
        rollbackDelta,
        reversedAt,
        reverseRemark: body.remark.trim(),
        studentProfile: {
          studentId: Number(record.studentId),
          currentScore: updatedProfile.currentScore,
          currentPetLevel: updatedProfile.currentPetLevel,
        },
        petChange,
        ruleName: record.rule?.name ?? null,
      };
    });

    await this.operationLogService.create({
      schoolId: user.schoolId,
      userId: user.id,
      roleCode: user.roleCode,
      terminalType: 'admin',
      module: 'score_record',
      action: 'reverse',
      targetType: 'student',
      targetId: BigInt(result.studentId),
      detail: {
        scoreRecordId: result.scoreRecordId,
        classId: result.classId,
        scoreDelta: result.scoreDelta,
        reverseRemark: result.reverseRemark,
      },
    });

    this.realtimeService.emitClassScoreChanged(result.classId, {
      classId: result.classId,
      studentIds: [result.studentId],
      sourceTerminal: 'admin',
      operatorName: user.name,
      changes: [
        {
          studentId: result.studentId,
          scoreDelta: result.rollbackDelta,
          currentScore: result.studentProfile.currentScore,
          currentPetLevel: result.studentProfile.currentPetLevel,
        },
      ],
      upgrades: result.petChange.upgraded
        ? [
            {
              studentId: result.studentId,
              beforeLevel: result.petChange.beforeLevel,
              afterLevel: result.petChange.afterLevel,
            },
          ]
        : [],
    });

    return { code: 0, message: 'ok', data: result };
  }

  private async ensureCanReverseScore(
    user: AuthUser,
    record: { classId: bigint; operatorId: bigint; createdAt: Date },
  ) {
    this.authService.ensureCanAccessClass(user, record.classId);

    const adminRoles = ['school_admin', 'academic_admin', 'grade_admin', 'moral_admin', 'super_admin'];
    if (adminRoles.includes(user.roleCode)) {
      return;
    }

    try {
      await this.authService.ensureIsHomeroomOfClass(user, record.classId);
      return;
    } catch {
      // 非班主任，继续检查是否为本人 24 小时内操作
    }

    const isOwner = record.operatorId === user.id;
    const within24h = Date.now() - record.createdAt.getTime() <= 24 * 60 * 60 * 1000;
    if (isOwner && within24h) {
      return;
    }

    throw new ForbiddenException('无权撤销该评价记录');
  }

  private async rollbackStudentPetForReverse(
    tx: Prisma.TransactionClient,
    record: { id: bigint; studentId: bigint; scoreDelta: number },
  ) {
    const studentPet = await tx.studentPet.findUnique({
      where: { studentId: record.studentId },
      include: {
        student: {
          select: {
            school: {
              select: {
                petGrowthThresholds: true,
              },
            },
          },
        },
        pet: { include: { stages: { orderBy: { stageNo: 'asc' } } } },
      },
    });

    if (!studentPet) {
      return { upgraded: false as const };
    }

    const positiveDelta = Math.max(record.scoreDelta, 0);
    if (positiveDelta === 0) {
      return { upgraded: false as const };
    }

    const nextScore = Math.max(0, studentPet.totalScore - positiveDelta);
    const thresholds = normalizePetGrowthThresholds(studentPet.student.school.petGrowthThresholds);
    const matchedStage = resolveMatchedPetStage(studentPet.pet.stages, nextScore, thresholds);
    const nextLevel = matchedStage?.levelNo ?? 1;
    const nextStageNo = matchedStage?.stageNo ?? studentPet.currentStageNo;

    if (nextLevel !== studentPet.currentLevel || nextStageNo !== studentPet.currentStageNo) {
      await tx.studentPet.update({
        where: { id: studentPet.id },
        data: {
          totalScore: nextScore,
          currentLevel: nextLevel,
          currentStageNo: nextStageNo,
        },
      });
      await tx.studentProfile.update({
        where: { studentId: record.studentId },
        data: { currentPetLevel: nextLevel },
      });
      await tx.petLevelLog.create({
        data: {
          studentPetId: studentPet.id,
          studentId: record.studentId,
          beforeLevel: studentPet.currentLevel,
          afterLevel: nextLevel,
          beforeStageNo: studentPet.currentStageNo,
          afterStageNo: nextStageNo,
          triggerScoreRecordId: record.id,
        },
      });
      return {
        upgraded: true as const,
        beforeLevel: studentPet.currentLevel,
        afterLevel: nextLevel,
      };
    }

    await tx.studentPet.update({
      where: { id: studentPet.id },
      data: { totalScore: nextScore },
    });

    return { upgraded: false as const };
  }

  private ensureCanWriteScore(roleCode: string, sourceTerminal: TerminalSource) {
    if (sourceTerminal === 'display' && roleCode === 'display_account') {
      throw new ForbiddenException('展示端账号不能执行加减分');
    }
    if (!['homeroom_teacher', 'subject_teacher', 'school_admin', 'academic_admin', 'grade_admin', 'moral_admin', 'super_admin'].includes(roleCode)) {
      throw new ForbiddenException('当前角色无权执行评价');
    }
  }

  private resolveSignedValue(scoreType: 'add' | 'deduct', value: number) {
    return scoreType === 'deduct' ? -Math.abs(value) : Math.abs(value);
  }

  private async loadSingleTarget(
    tx: Prisma.TransactionClient,
    classId: number,
    studentId: number,
    ruleId: number,
  ) {
    const student = await tx.student.findFirst({
      where: {
        id: BigInt(studentId),
        classId: BigInt(classId),
        deletedAt: null,
        status: 'enabled',
      },
      include: {
        classroom: true,
        groupRel: true,
      },
    });
    if (!student) throw new NotFoundException('学生不存在');

    const rule = await tx.scoreRule.findFirst({
      where: {
        id: BigInt(ruleId),
        deletedAt: null,
        status: 'enabled',
      },
    });
    if (!rule) throw new NotFoundException('积分规则不存在');
    if (rule.scoreTarget === 'class') {
      throw new ForbiddenException('班级积分规则不能用于学生评价');
    }

    return {
      schoolId: student.schoolId,
      semesterId: student.classroom.semesterId,
      classGroupId: student.groupRel?.classGroupId ?? null,
      rule,
    };
  }

  private async createScoreRecordForStudent(
    tx: Prisma.TransactionClient,
    params: {
      schoolId: bigint;
      semesterId: bigint;
      classId: bigint;
      studentId: bigint;
      classGroupId: bigint | null;
      rule: {
        id: bigint;
        subjectCode: string | null;
        sceneCode: string;
        dimension: string | null;
        tag: string | null;
        sentiment: 'positive' | 'negative';
        scoreType: 'add' | 'deduct';
        scoreValue: number;
        scoreTarget?: 'student' | 'class';
      };
      operatorId: bigint;
      operatorName: string;
      sourceTerminal: TerminalSource;
      sourceRole: string;
      remark?: string;
      allowClassRuleLinkage?: boolean;
      overrideScoreDelta?: number;
    },
  ) {
    const scoreDelta =
      typeof params.overrideScoreDelta === 'number'
        ? Math.trunc(params.overrideScoreDelta)
        : this.resolveSignedValue(params.rule.scoreType, params.rule.scoreValue);
    if (params.rule.scoreTarget === 'class' && !params.allowClassRuleLinkage) {
      throw new ForbiddenException('班级积分规则不能用于学生评价');
    }

    const profile = await tx.studentProfile.upsert({
      where: { studentId: params.studentId },
      create: {
        studentId: params.studentId,
        classId: params.classId,
        currentScore: scoreDelta,
        totalScore: Math.max(scoreDelta, 0),
        currentPetLevel: 1,
        lastScoreAt: new Date(),
      },
      update: {
        classId: params.classId,
        currentScore: { increment: scoreDelta },
        totalScore: { increment: Math.max(scoreDelta, 0) },
        positiveCount7d: params.rule.sentiment === 'positive' ? { increment: 1 } : undefined,
        negativeCount7d: params.rule.sentiment === 'negative' ? { increment: 1 } : undefined,
        lastScoreAt: new Date(),
      },
    });

    const record = await tx.scoreRecord.create({
      data: {
        schoolId: params.schoolId,
        semesterId: params.semesterId,
        classId: params.classId,
        studentId: params.studentId,
        classGroupId: params.classGroupId,
        ruleId: params.rule.id,
        subjectCode: params.rule.subjectCode,
        sceneCode: params.rule.sceneCode,
        dimension: params.rule.dimension,
        tag: params.rule.tag,
        sentiment: params.rule.sentiment,
        scoreDelta,
        remark: params.remark,
        sourceTerminal: params.sourceTerminal,
        sourceRole: params.sourceRole,
        operatorId: params.operatorId,
        operatorName: params.operatorName,
      },
    });

    const studentPet = await tx.studentPet.findUnique({
      where: { studentId: params.studentId },
      include: {
        student: {
          select: {
            school: {
              select: {
                id: true,
                petGrowthThresholds: true,
              },
            },
          },
        },
        pet: { include: { stages: { orderBy: { stageNo: 'asc' } } } },
      },
    });

    let petUpgrade: { upgraded: boolean; beforeLevel?: number; afterLevel?: number } = { upgraded: false };
    if (studentPet) {
      const nextScore = studentPet.totalScore + Math.max(scoreDelta, 0);
      const thresholds = normalizePetGrowthThresholds(studentPet.student.school.petGrowthThresholds);
      const matchedStage = resolveMatchedPetStage(studentPet.pet.stages, nextScore, thresholds);

      if (matchedStage && matchedStage.levelNo > studentPet.currentLevel) {
        await tx.studentPet.update({
          where: { id: studentPet.id },
          data: {
            totalScore: nextScore,
            currentLevel: matchedStage.levelNo,
            currentStageNo: matchedStage.stageNo,
            decoFreeChangeLevel: matchedStage.levelNo,
          },
        });
        await tx.studentProfile.update({
          where: { studentId: params.studentId },
          data: { currentPetLevel: matchedStage.levelNo },
        });
        await tx.petLevelLog.create({
          data: {
            studentPetId: studentPet.id,
            studentId: params.studentId,
            beforeLevel: studentPet.currentLevel,
            afterLevel: matchedStage.levelNo,
            beforeStageNo: studentPet.currentStageNo,
            afterStageNo: matchedStage.stageNo,
            triggerScoreRecordId: record.id,
          },
        });
        petUpgrade = {
          upgraded: true,
          beforeLevel: studentPet.currentLevel,
          afterLevel: matchedStage.levelNo,
        };

        await syncUnlockedDecorationsForLevel(tx, studentPet.id, studentPet.student.school.id, matchedStage.levelNo);
      } else {
        await tx.studentPet.update({
          where: { id: studentPet.id },
          data: {
            totalScore: nextScore,
          },
        });
      }
    }

    return {
      scoreRecordId: Number(record.id),
      scoreDelta,
      studentProfile: {
        studentId: toNumber(params.studentId),
        currentScore: profile.currentScore,
        currentPetLevel: profile.currentPetLevel,
      },
      petUpgrade,
    };
  }

  private buildStudentScoreChanges(
    items: Array<{
      scoreDelta: number;
      studentProfile: { studentId: number | null; currentScore: number; currentPetLevel: number };
    }>,
  ) {
    return items
      .filter((item) => item.studentProfile.studentId != null)
      .map((item) => ({
        studentId: Number(item.studentProfile.studentId),
        scoreDelta: item.scoreDelta,
        currentScore: item.studentProfile.currentScore,
        currentPetLevel: item.studentProfile.currentPetLevel,
      }));
  }
}

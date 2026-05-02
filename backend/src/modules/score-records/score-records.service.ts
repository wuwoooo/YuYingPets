import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import { AuthService } from '../auth/auth.service';
import { ScoreRecordCreateDto } from './dto/score-record-create.dto';
import { ScoreRecordBatchDto } from './dto/score-record-batch.dto';
import { ScoreRecordGroupDto } from './dto/score-record-group.dto';
import { toNumber } from '@/common/utils/bigint.util';
import { TerminalSource } from '@/common/types/terminal-source.type';
import { OperationLogService } from '../operation-log/operation-log.service';
import { RealtimeService } from '../realtime/realtime.service';
import {
  normalizePetGrowthThresholds,
  resolveMatchedPetStage,
} from '@/common/utils/pet-growth.util';

@Injectable()
export class ScoreRecordsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authService: AuthService,
    private readonly operationLogService: OperationLogService,
    private readonly realtimeService: RealtimeService,
  ) {}

  async list(query: Record<string, string>) {
    const scoreRecordWhere = {
      classId: query.classId ? BigInt(query.classId) : undefined,
      studentId: query.studentId ? BigInt(query.studentId) : undefined,
      subjectCode: query.subjectCode || undefined,
    };

    const [scoreRows, rewardOrderRows] = await Promise.all([
      this.prisma.scoreRecord.findMany({
        where: scoreRecordWhere,
        include: {
          rule: {
            select: { name: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 100,
      }),
      query.subjectCode
        ? Promise.resolve([])
        : this.prisma.rewardOrder.findMany({
            where: {
              classId: query.classId ? BigInt(query.classId) : undefined,
              studentId: query.studentId ? BigInt(query.studentId) : undefined,
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

    const scoreItems = scoreRows.map(({ rule, ...row }) => ({
      ...row,
      id: toNumber(row.id),
      schoolId: toNumber(row.schoolId),
      semesterId: toNumber(row.semesterId),
      classId: toNumber(row.classId),
      studentId: toNumber(row.studentId),
      classGroupId: toNumber(row.classGroupId),
      ruleId: toNumber(row.ruleId),
      operatorId: toNumber(row.operatorId),
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
      createdAt: row.createdAt,
    }));

    const rows = [...scoreItems, ...rewardOrderItems]
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 100);

    return {
      code: 0,
      message: 'ok',
      data: rows,
    };
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

  reverse(id: number) {
    return { code: 0, message: 'ok', data: { id } };
  }

  private ensureCanWriteScore(roleCode: string, sourceTerminal: TerminalSource) {
    if (sourceTerminal === 'display' && roleCode === 'display_account') {
      throw new ForbiddenException('展示端账号不能执行加减分');
    }
    if (!['homeroom_teacher', 'subject_teacher', 'school_admin', 'grade_admin', 'moral_admin', 'super_admin'].includes(roleCode)) {
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
    },
  ) {
    const scoreDelta = this.resolveSignedValue(params.rule.scoreType, params.rule.scoreValue);
    if (params.rule.scoreTarget === 'class') {
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
      studentProfile: {
        studentId: toNumber(params.studentId),
        currentScore: profile.currentScore,
        currentPetLevel: profile.currentPetLevel,
      },
      petUpgrade,
    };
  }
}

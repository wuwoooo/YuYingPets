import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AuthUser } from '@/common/auth/auth-user.interface';
import { TerminalSource } from '@/common/types/terminal-source.type';
import { toNumber } from '@/common/utils/bigint.util';
import { PrismaService } from '@/prisma/prisma.service';
import { AuthService } from '../auth/auth.service';
import { OperationLogService } from '../operation-log/operation-log.service';
import { RealtimeService } from '../realtime/realtime.service';
import { ClassScoreRecordBatchDto } from './dto/class-score-record-batch.dto';
import { ClassScoreRecordCreateDto } from './dto/class-score-record-create.dto';

type LoadedClassroom = {
  id: bigint;
  schoolId: bigint;
  semesterId: bigint;
  gradeCode: string;
  gradeName: string;
  name: string;
};

type LoadedClassRule = {
  id: bigint;
  subjectCode: string | null;
  sceneCode: string;
  dimension: string | null;
  tag: string | null;
  sentiment: 'positive' | 'negative';
  scoreType: 'add' | 'deduct';
  scoreValue: number;
  scoreTarget: 'student' | 'class';
  moduleType: 'general' | 'subject';
};

@Injectable()
export class ClassScoreRecordsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authService: AuthService,
    private readonly operationLogService: OperationLogService,
    private readonly realtimeService: RealtimeService,
  ) {}

  async list(authorization: string | undefined, query: Record<string, string>) {
    const user = await this.authService.getAuthUserFromAuthorization(authorization);
    const classId = query.classId ? BigInt(query.classId) : undefined;
    if (classId) {
      const classroom = await this.loadClassroom(Number(classId), user.schoolId);
      this.ensureCanViewClassScore(user, classroom);
    }

    const rows = await this.prisma.classScoreRecord.findMany({
      where: {
        schoolId: user.schoolId,
        classId,
      },
      include: {
        classroom: { select: { id: true, name: true, gradeCode: true, gradeName: true } },
        rule: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    const filteredRows = rows.filter((row) => this.canViewClassScore(user, row.classroom));

    return {
      code: 0,
      message: 'ok',
      data: filteredRows.map((row) => ({
        id: toNumber(row.id),
        schoolId: toNumber(row.schoolId),
        semesterId: toNumber(row.semesterId),
        classId: toNumber(row.classId),
        batchId: toNumber(row.batchId),
        ruleId: toNumber(row.ruleId),
        ruleName: row.rule.name,
        className: row.classroom.name,
        gradeCode: row.classroom.gradeCode,
        gradeName: row.classroom.gradeName,
        subjectCode: row.subjectCode,
        sceneCode: row.sceneCode,
        dimension: row.dimension,
        tag: row.tag,
        sentiment: row.sentiment,
        scoreDelta: row.scoreDelta,
        remark: row.remark,
        sourceTerminal: row.sourceTerminal,
        sourceRole: row.sourceRole,
        operatorId: toNumber(row.operatorId),
        operatorName: row.operatorName,
        createdAt: row.createdAt,
      })),
    };
  }

  async rankings(authorization: string | undefined, query: Record<string, string>) {
    const user = await this.authService.getAuthUserFromAuthorization(authorization);
    const gradeCode = query.gradeCode?.trim();
    const classId = query.classId ? Number(query.classId) : undefined;
    let targetGradeCode = gradeCode;

    if (!targetGradeCode && classId) {
      const classroom = await this.loadClassroom(classId, user.schoolId);
      this.ensureCanViewClassScore(user, classroom);
      targetGradeCode = classroom.gradeCode;
    }
    if (!targetGradeCode) {
      throw new BadRequestException('请指定年级');
    }

    const classrooms = await this.prisma.classroom.findMany({
      where: {
        schoolId: user.schoolId,
        gradeCode: targetGradeCode,
        deletedAt: null,
        status: 'enabled',
      },
      include: {
        classScoreProfile: true,
      },
      orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
    });

    const visibleRows = classrooms.filter((row) => this.canViewClassScore(user, row));
    const sortedRows = visibleRows.sort((left, right) => {
      const scoreDiff = (right.classScoreProfile?.currentScore ?? 0) - (left.classScoreProfile?.currentScore ?? 0);
      if (scoreDiff !== 0) return scoreDiff;
      return (left.sortOrder ?? 999999) - (right.sortOrder ?? 999999) || Number(left.id - right.id);
    });

    let lastScore: number | null = null;
    let currentRank = 0;

    return {
      code: 0,
      message: 'ok',
      data: {
        gradeCode: targetGradeCode,
        gradeName: sortedRows[0]?.gradeName ?? null,
        rows: sortedRows.map((row, index) => {
          const currentScore = row.classScoreProfile?.currentScore ?? 0;
          if (lastScore === null || currentScore !== lastScore) {
            currentRank = index + 1;
            lastScore = currentScore;
          }
          return {
            rank: currentRank,
            classId: toNumber(row.id),
            className: row.name,
            gradeCode: row.gradeCode,
            gradeName: row.gradeName,
            currentScore,
            totalScore: row.classScoreProfile?.totalScore ?? 0,
            lastScoreAt: row.classScoreProfile?.lastScoreAt ?? null,
          };
        }),
      },
    };
  }

  async create(authorization: string | undefined, body: ClassScoreRecordCreateDto) {
    const user = await this.authService.getAuthUserFromAuthorization(authorization);
    this.ensureCanWriteClassScore(user.roleCode, body.sourceTerminal);

    const result = await this.prisma.$transaction(async (tx) => {
      const target = await this.loadClassTarget(tx, user, body.classId, body.ruleId);
      this.ensureCanOperateClassScore(user, target.classroom);
      return this.createClassScoreRecord(tx, {
        classroom: target.classroom,
        rule: target.rule,
        operatorId: user.id,
        operatorName: user.name,
        sourceTerminal: body.sourceTerminal,
        sourceRole: user.roleCode,
        remark: body.remark,
        batchId: null,
      });
    });

    await this.operationLogService.create({
      schoolId: user.schoolId,
      userId: user.id,
      roleCode: user.roleCode,
      terminalType: body.sourceTerminal,
      module: 'class_score_record',
      action: 'create',
      targetType: 'class',
      targetId: BigInt(body.classId),
      detail: {
        classId: body.classId,
        ruleId: body.ruleId,
        remark: body.remark,
      },
    });

    this.realtimeService.emitClassScoreChanged(body.classId, {
      classId: body.classId,
      gradeCode: result.gradeCode,
      scoreDelta: result.scoreDelta,
      currentScore: result.classScoreProfile.currentScore,
      operatorName: user.name,
    });
    this.realtimeService.emitGradeClassRankingChanged(result.gradeCode, {
      gradeCode: result.gradeCode,
      classIds: [body.classId],
    });

    return { code: 0, message: 'ok', data: result };
  }

  async batch(authorization: string | undefined, body: ClassScoreRecordBatchDto) {
    const user = await this.authService.getAuthUserFromAuthorization(authorization);
    this.ensureCanWriteClassScore(user.roleCode, body.sourceTerminal);
    const classIds = Array.from(new Set(body.classIds.map(Number).filter((id) => Number.isInteger(id) && id > 0)));
    if (classIds.length === 0) {
      throw new BadRequestException('请至少选择一个班级');
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const rule = await this.loadClassRule(tx, body.ruleId);
      const scoreDelta = this.resolveSignedValue(rule.scoreType, rule.scoreValue);
      const batch = await tx.classScoreRecordBatch.create({
        data: {
          schoolId: user.schoolId,
          ruleId: rule.id,
          scoreDelta,
          remark: body.remark,
          sourceTerminal: body.sourceTerminal,
          sourceRole: user.roleCode,
          operatorId: user.id,
          operatorName: user.name,
        },
      });

      const items = [];
      for (const classId of classIds) {
        const classroom = await this.loadClassroomForTransaction(tx, classId, user.schoolId);
        this.ensureCanOperateClassScore(user, classroom);
        const created = await this.createClassScoreRecord(tx, {
          classroom,
          rule,
          operatorId: user.id,
          operatorName: user.name,
          sourceTerminal: body.sourceTerminal,
          sourceRole: user.roleCode,
          remark: body.remark,
          batchId: batch.id,
        });
        items.push(created);
      }

      return {
        batchId: Number(batch.id),
        items,
      };
    });

    await this.operationLogService.create({
      schoolId: user.schoolId,
      userId: user.id,
      roleCode: user.roleCode,
      terminalType: body.sourceTerminal,
      module: 'class_score_record',
      action: 'batch_create',
      targetType: 'class_score_batch',
      targetId: BigInt(result.batchId),
      detail: {
        classIds,
        ruleId: body.ruleId,
        remark: body.remark,
      },
    });

    const gradeCodes = Array.from(new Set(result.items.map((item) => item.gradeCode)));
    for (const item of result.items) {
      this.realtimeService.emitClassScoreChanged(item.classId, {
        classId: item.classId,
        gradeCode: item.gradeCode,
        batchId: result.batchId,
        scoreDelta: item.scoreDelta,
        currentScore: item.classScoreProfile.currentScore,
        operatorName: user.name,
      });
    }
    for (const gradeCode of gradeCodes) {
      this.realtimeService.emitGradeClassRankingChanged(gradeCode, {
        gradeCode,
        classIds,
        batchId: result.batchId,
      });
    }

    return { code: 0, message: 'ok', data: result };
  }

  private ensureCanWriteClassScore(roleCode: string, sourceTerminal: TerminalSource) {
    if (sourceTerminal === 'display') {
      throw new ForbiddenException('展示端不能执行班级评价');
    }
    if (!['super_admin', 'school_admin', 'moral_admin', 'grade_admin'].includes(roleCode)) {
      throw new ForbiddenException('当前角色无权操作班级积分');
    }
  }

  private canViewClassScore(user: AuthUser, classroom: { id: bigint; gradeCode: string }) {
    if (['super_admin', 'school_admin', 'moral_admin'].includes(user.roleCode)) {
      return true;
    }
    const byClass = this.authService.canAccessClass(user, classroom.id);
    const byGrade = user.scopes.some((scope) => scope.gradeCode === classroom.gradeCode);
    return byClass || byGrade;
  }

  private ensureCanViewClassScore(user: AuthUser, classroom: { id: bigint; gradeCode: string }) {
    if (!this.canViewClassScore(user, classroom)) {
      throw new ForbiddenException('无权查看当前班级积分');
    }
  }

  private ensureCanOperateClassScore(user: AuthUser, classroom: { id: bigint; gradeCode: string }) {
    if (['super_admin', 'school_admin', 'moral_admin'].includes(user.roleCode)) {
      return;
    }
    if (user.roleCode === 'grade_admin') {
      const byClass = this.authService.canAccessClass(user, classroom.id);
      const byGrade = user.scopes.some((scope) => scope.gradeCode === classroom.gradeCode);
      if (byClass || byGrade) return;
    }
    throw new ForbiddenException('无权操作当前班级积分');
  }

  private resolveSignedValue(scoreType: 'add' | 'deduct', value: number) {
    return scoreType === 'deduct' ? -Math.abs(value) : Math.abs(value);
  }

  private async loadClassTarget(
    tx: Prisma.TransactionClient,
    user: AuthUser,
    classId: number,
    ruleId: number,
  ) {
    const [classroom, rule] = await Promise.all([
      this.loadClassroomForTransaction(tx, classId, user.schoolId),
      this.loadClassRule(tx, ruleId),
    ]);
    return { classroom, rule };
  }

  private async loadClassroom(classId: number, schoolId: bigint) {
    return this.loadClassroomForTransaction(this.prisma, classId, schoolId);
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
        gradeCode: true,
        gradeName: true,
        name: true,
      },
    });
    if (!classroom) throw new NotFoundException('班级不存在');
    return classroom;
  }

  private async loadClassRule(
    tx: Pick<Prisma.TransactionClient, 'scoreRule'>,
    ruleId: number,
  ): Promise<LoadedClassRule> {
    const rule = await tx.scoreRule.findFirst({
      where: { id: BigInt(ruleId), deletedAt: null, status: 'enabled' },
      select: {
        id: true,
        moduleType: true,
        subjectCode: true,
        sceneCode: true,
        dimension: true,
        tag: true,
        sentiment: true,
        scoreType: true,
        scoreValue: true,
        scoreTarget: true,
      },
    });
    if (!rule) throw new NotFoundException('积分规则不存在');
    if (rule.scoreTarget !== 'class') {
      throw new BadRequestException('个人积分规则不能用于班级评价');
    }
    return rule;
  }

  private async createClassScoreRecord(
    tx: Prisma.TransactionClient,
    params: {
      classroom: LoadedClassroom;
      rule: LoadedClassRule;
      operatorId: bigint;
      operatorName: string;
      sourceTerminal: TerminalSource;
      sourceRole: string;
      remark?: string;
      batchId: bigint | null;
    },
  ) {
    const scoreDelta = this.resolveSignedValue(params.rule.scoreType, params.rule.scoreValue);
    const profile = await tx.classScoreProfile.upsert({
      where: { classId: params.classroom.id },
      create: {
        schoolId: params.classroom.schoolId,
        semesterId: params.classroom.semesterId,
        classId: params.classroom.id,
        currentScore: scoreDelta,
        totalScore: Math.max(scoreDelta, 0),
        positiveCount7d: params.rule.sentiment === 'positive' ? 1 : 0,
        negativeCount7d: params.rule.sentiment === 'negative' ? 1 : 0,
        lastScoreAt: new Date(),
      },
      update: {
        currentScore: { increment: scoreDelta },
        totalScore: { increment: Math.max(scoreDelta, 0) },
        positiveCount7d: params.rule.sentiment === 'positive' ? { increment: 1 } : undefined,
        negativeCount7d: params.rule.sentiment === 'negative' ? { increment: 1 } : undefined,
        lastScoreAt: new Date(),
      },
    });

    const record = await tx.classScoreRecord.create({
      data: {
        schoolId: params.classroom.schoolId,
        semesterId: params.classroom.semesterId,
        classId: params.classroom.id,
        batchId: params.batchId,
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

    return {
      classScoreRecordId: Number(record.id),
      classId: Number(params.classroom.id),
      gradeCode: params.classroom.gradeCode,
      scoreDelta,
      classScoreProfile: {
        classId: Number(params.classroom.id),
        currentScore: profile.currentScore,
        totalScore: profile.totalScore,
      },
    };
  }
}

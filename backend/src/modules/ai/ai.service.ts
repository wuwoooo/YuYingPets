import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@/prisma/prisma.service';
import { AuthService } from '../auth/auth.service';
import { PeriodType } from '@prisma/client';
import { toNumber } from '@/common/utils/bigint.util';
import { behaviorScoreRecordWhere } from '@/common/utils/behavior-score-record.util';
import { OperationLogService } from '../operation-log/operation-log.service';
import { RealtimeService } from '../realtime/realtime.service';
import { getChinaPeriodStartLimit } from '@/common/utils/date.util';

type ScoreRecordWithRule = {
  subjectCode: string | null;
  sceneCode: string | null;
  dimension: string | null;
  tag: string | null;
  sentiment: 'positive' | 'negative';
  scoreDelta: number;
  expDelta?: number;
  remark: string | null;
  occurredAt: Date;
  createdAt: Date;
  rule: {
    name: string;
    aiSummaryText: string | null;
  };
};

type SummaryBreakdown = {
  count: number;
  scoreDelta: number;
};

type TrendSummary = {
  totalScoreDelta: number;
  totalExpDelta: number;
  positiveRatio: number;
  recentTrend: 'up' | 'down' | 'flat';
  activeDays: number;
};

type DimensionSummaryItem = {
  dimension: string;
  count: number;
  positiveCount: number;
  negativeCount: number;
};

type SubjectSummaryItem = {
  subject: string;
  count: number;
  positiveCount: number;
  negativeCount: number;
};

type SceneSummaryItem = {
  scene: string;
  count: number;
  positiveCount: number;
  negativeCount: number;
};

type EvidenceItem = {
  date: string;
  subject: string;
  scene: string;
  ruleName: string;
  sentiment: 'positive' | 'negative';
  scoreDelta: number;
  remark: string | null;
  signal: string;
};

type AcademicSummaryItem = {
  examName: string;
  examDate: string;
  periodLabel: string | null;
  importedAt: string;
  totalScore: number | null;
  totalSchoolRank: number | null;
  totalSchoolRankDelta: number | null;
  totalClassRank: number | null;
  totalClassRankDelta: number | null;
  subjects: Array<{
    subjectName: string;
    score: number | null;
    schoolRank: number | null;
    schoolRankDelta: number | null;
    classRank: number | null;
    classRankDelta: number | null;
  }>;
};

type StudentSnapshotResponse = {
  id: number;
  studentId: number;
  classId: number;
  periodType: PeriodType;
  snapshotDate: Date;
  generatedAt: Date;
  hasNewerBehaviorRecord: boolean;
  latestBehaviorRecordAt: Date | null;
  positiveSummary: unknown;
  negativeSummary: unknown;
  dimensionSummary: unknown;
  trendSummary: unknown;
  aiSummary: string | null;
  aiSuggestion: string | null;
};

type ArkResponse = {
  output_text?: string;
  output?: Array<{
    content?: Array<{
      type?: string;
      text?: string;
    }>;
  }>;
};

@Injectable()
export class AiService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authService: AuthService,
    private readonly operationLogService: OperationLogService,
    private readonly realtimeService: RealtimeService,
    private readonly configService: ConfigService,
  ) {}

  async summary(
    authorization: string | undefined,
    studentId: number,
    periodType: 'weekly' | 'monthly' = 'weekly',
  ) {
    const user = await this.authService.getAuthUserFromAuthorization(authorization);
    const student = await this.loadStudent(studentId);
    this.authService.ensureCanAccessClass(user, student.classId);

    const limitDate = getChinaPeriodStartLimit(periodType);

    const snapshot = await this.prisma.aiStudentSnapshot.findFirst({
      where: {
        studentId: BigInt(studentId),
        periodType,
        createdAt: {
          gte: limitDate,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      code: 0,
      message: 'ok',
      data: snapshot ? await this.serializeSnapshot(snapshot, studentId) : null,
    };
  }

  async generate(
    authorization: string | undefined,
    studentId: number,
    periodType: 'weekly' | 'monthly' = 'weekly',
  ) {
    const user = await this.authService.getAuthUserFromAuthorization(authorization);
    if (!['homeroom_teacher', 'subject_teacher', 'school_admin', 'academic_admin', 'grade_admin', 'moral_admin', 'super_admin'].includes(user.roleCode)) {
      throw new ForbiddenException('当前角色无权生成学情摘要');
    }

    const student = await this.loadStudent(studentId);
    this.authService.ensureCanAccessClass(user, student.classId);

    const result = await this.generateSnapshot(studentId, periodType, 'manual');

    await this.operationLogService.create({
      schoolId: student.schoolId,
      userId: user.id,
      roleCode: user.roleCode,
      terminalType: 'admin',
      module: 'ai_student_snapshot',
      action: 'generate',
      targetType: 'student',
      targetId: BigInt(studentId),
      detail: {
        classId: Number(student.classId),
        periodType,
        snapshotId: result.data.id,
      },
    });

    return result;
  }

  async generateForDisplay(
    studentId: number,
    periodType: 'weekly' | 'monthly' = 'weekly',
  ) {
    await this.loadStudent(studentId);
    return this.generateSnapshot(studentId, periodType, 'manual');
  }

  private async generateSnapshot(
    studentId: number,
    periodType: 'weekly' | 'monthly',
    generatedBy: 'manual',
  ) {
    const student = await this.loadStudent(studentId);

    const limitDate = getChinaPeriodStartLimit(periodType);

    const scoreRecords = await this.prisma.scoreRecord.findMany({
      where: {
        studentId: BigInt(studentId),
        ...behaviorScoreRecordWhere(),
        occurredAt: {
          gte: limitDate,
        },
      },
      include: {
        rule: {
          select: {
            name: true,
            aiSummaryText: true,
          },
        },
      },
      orderBy: { occurredAt: 'desc' },
      take: periodType === 'weekly' ? 100 : 300,
    });
    const teacherObservations = await this.prisma.teacherObservation.findMany({
      where: {
        studentId: BigInt(studentId),
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });
    const academicSummary = await this.loadAcademicSummary(studentId);

    const positiveSummary = this.buildSentimentSummary(scoreRecords, 'positive');
    const negativeSummary = this.buildSentimentSummary(scoreRecords, 'negative');
    const dimensionSummary = this.buildDimensionSummary(scoreRecords);
    const subjectSummary = this.buildSubjectSummary(scoreRecords);
    const sceneSummary = this.buildSceneSummary(scoreRecords);
    const trendSummary = this.buildTrendSummary(scoreRecords);
    const evidence = this.buildEvidence(scoreRecords);

    const fallbackSummary = this.buildAiSummary(student.name, periodType, positiveSummary, negativeSummary, dimensionSummary, subjectSummary, trendSummary, academicSummary);
    const fallbackSuggestion = this.buildAiSuggestion(positiveSummary, negativeSummary, dimensionSummary, subjectSummary, sceneSummary, trendSummary, academicSummary);

    const llmResult = await this.generateWithArk({
      studentName: student.name,
      className: student.className,
      periodType,
      positiveSummary,
      negativeSummary,
      dimensionSummary,
      subjectSummary,
      sceneSummary,
      trendSummary,
      evidence,
      academicSummary,
      teacherObservations: teacherObservations.map((item) => ({
        observationType: item.observationType,
        content: item.content,
        createdAt: item.createdAt.toISOString(),
      })),
      fallbackSummary,
      fallbackSuggestion,
    });

    const snapshotDate = new Date();

    const snapshot = await this.prisma.aiStudentSnapshot.create({
      data: {
        schoolId: student.schoolId,
        semesterId: student.semesterId,
        classId: student.classId,
        studentId: BigInt(studentId),
        snapshotDate,
        periodType: periodType as PeriodType,
        positiveSummary,
        negativeSummary,
        dimensionSummary,
        trendSummary: {
          ...trendSummary,
          subjectSummary,
          sceneSummary,
          evidence,
          academicSummary,
        },
        aiSummary: llmResult.aiSummary,
        aiSuggestion: llmResult.aiSuggestion,
        generatedBy,
      },
    });

    const result = {
      code: 0,
      message: 'ok',
      data: {
        id: toNumber(snapshot.id),
        studentId,
        classId: Number(student.classId),
        periodType: snapshot.periodType,
        snapshotDate: snapshot.snapshotDate,
        generatedAt: snapshot.createdAt,
        hasNewerBehaviorRecord: false,
        latestBehaviorRecordAt: null,
        generatedBy: snapshot.generatedBy,
        positiveSummary,
        negativeSummary,
        dimensionSummary,
        trendSummary: {
          ...trendSummary,
          subjectSummary,
          sceneSummary,
          evidence,
          academicSummary,
        },
        aiSummary: llmResult.aiSummary,
        aiSuggestion: llmResult.aiSuggestion,
      },
    };

    this.realtimeService.emitAiSummaryGenerated(Number(student.classId), {
      classId: Number(student.classId),
      studentId,
      periodType,
      snapshotId: result.data.id,
    });

    return result;
  }

  private async loadStudent(studentId: number) {
    const student = await this.prisma.student.findFirst({
      where: {
        id: BigInt(studentId),
        deletedAt: null,
        status: 'enabled',
      },
      include: {
        classroom: true,
      },
    });

    if (!student) {
      throw new NotFoundException('学生不存在');
    }

    return {
      id: student.id,
      schoolId: student.schoolId,
      classId: student.classId,
      className: student.classroom.name,
      semesterId: student.classroom.semesterId,
      name: student.name,
    };
  }

  private async serializeSnapshot(snapshot: {
    id: bigint;
    classId: bigint;
    periodType: PeriodType;
    snapshotDate: Date;
    createdAt: Date;
    positiveSummary: unknown;
    negativeSummary: unknown;
    dimensionSummary: unknown;
    trendSummary: unknown;
    aiSummary: string | null;
    aiSuggestion: string | null;
  }, studentId: number): Promise<StudentSnapshotResponse> {
    const latestBehaviorRecord = await this.prisma.scoreRecord.findFirst({
      where: {
        studentId: BigInt(studentId),
        ...behaviorScoreRecordWhere(),
      },
      select: {
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    const latestBehaviorRecordAt = latestBehaviorRecord?.createdAt ?? null;
    return {
      id: toNumber(snapshot.id) ?? 0,
      studentId,
      classId: toNumber(snapshot.classId) ?? 0,
      periodType: snapshot.periodType,
      snapshotDate: snapshot.snapshotDate,
      generatedAt: snapshot.createdAt,
      hasNewerBehaviorRecord: latestBehaviorRecordAt ? latestBehaviorRecordAt.getTime() > snapshot.createdAt.getTime() : false,
      latestBehaviorRecordAt,
      positiveSummary: snapshot.positiveSummary,
      negativeSummary: snapshot.negativeSummary,
      dimensionSummary: snapshot.dimensionSummary,
      trendSummary: snapshot.trendSummary,
      aiSummary: snapshot.aiSummary,
      aiSuggestion: snapshot.aiSuggestion,
    };
  }

  private buildSentimentSummary(records: ScoreRecordWithRule[], sentiment: 'positive' | 'negative'): SummaryBreakdown {
    const targetRecords = records.filter((item) => item.sentiment === sentiment);
    return {
      count: targetRecords.length,
      scoreDelta: targetRecords.reduce((sum, item) => sum + item.scoreDelta, 0),
    };
  }

  private buildDimensionSummary(records: ScoreRecordWithRule[]) {
    const counter = new Map<string, DimensionSummaryItem>();
    for (const item of records) {
      const dimension = item.dimension || item.tag || item.sceneCode || '未分类';
      const current = counter.get(dimension) ?? {
        dimension,
        count: 0,
        positiveCount: 0,
        negativeCount: 0,
      };
      current.count += 1;
      if (item.sentiment === 'positive') current.positiveCount += 1;
      if (item.sentiment === 'negative') current.negativeCount += 1;
      counter.set(dimension, current);
    }

    return [...counter.values()]
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }

  private buildSubjectSummary(records: ScoreRecordWithRule[]) {
    const counter = new Map<string, SubjectSummaryItem>();
    for (const item of records) {
      const subject = item.subjectCode || '通用';
      const current = counter.get(subject) ?? {
        subject,
        count: 0,
        positiveCount: 0,
        negativeCount: 0,
      };
      current.count += 1;
      if (item.sentiment === 'positive') current.positiveCount += 1;
      if (item.sentiment === 'negative') current.negativeCount += 1;
      counter.set(subject, current);
    }

    return [...counter.values()]
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }

  private buildSceneSummary(records: ScoreRecordWithRule[]) {
    const counter = new Map<string, SceneSummaryItem>();
    for (const item of records) {
      const scene = item.sceneCode || '未标记';
      const current = counter.get(scene) ?? {
        scene,
        count: 0,
        positiveCount: 0,
        negativeCount: 0,
      };
      current.count += 1;
      if (item.sentiment === 'positive') current.positiveCount += 1;
      if (item.sentiment === 'negative') current.negativeCount += 1;
      counter.set(scene, current);
    }

    return [...counter.values()]
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }

  private buildTrendSummary(records: ScoreRecordWithRule[]): TrendSummary {
    const totalScoreDelta = records.reduce((sum, item) => sum + item.scoreDelta, 0);
    const totalExpDelta = records.reduce((sum, item) => sum + (item.expDelta ?? 0), 0);
    const positiveCount = records.filter((item) => item.sentiment === 'positive').length;
    const recentWindow = records.slice(0, Math.min(10, records.length));
    const recentTrendScore = recentWindow.reduce((sum, item) => sum + item.scoreDelta, 0);

    return {
      totalScoreDelta,
      totalExpDelta,
      positiveRatio: records.length ? Number((positiveCount / records.length).toFixed(2)) : 0,
      recentTrend: recentTrendScore > 2 ? 'up' : recentTrendScore < -2 ? 'down' : 'flat',
      activeDays: new Set(records.map((item) => item.occurredAt.toISOString().slice(0, 10))).size,
    };
  }

  private buildEvidence(records: ScoreRecordWithRule[]) {
    return records.slice(0, 8).map((item) => ({
      date: item.occurredAt.toISOString().slice(0, 10),
      subject: item.subjectCode || '通用',
      scene: item.sceneCode || '未标记',
      ruleName: item.rule.name,
      sentiment: item.sentiment,
      scoreDelta: item.scoreDelta,
      remark: item.remark,
      signal: item.rule.aiSummaryText || item.dimension || item.tag || item.sceneCode || item.rule.name,
    }));
  }

  private async loadAcademicSummary(studentId: number): Promise<AcademicSummaryItem[]> {
    const records = await this.prisma.academicScoreRecord.findMany({
      where: { studentId: BigInt(studentId) },
      include: { exam: true },
      orderBy: [{ exam: { examDate: 'desc' } }, { subjectCode: 'asc' }],
      take: 80,
    });
    const grouped = new Map<string, AcademicSummaryItem>();
    records.forEach((record) => {
      const key = record.examId.toString();
      const current = grouped.get(key) ?? {
        examName: record.exam.name,
        examDate: record.exam.examDate.toISOString().slice(0, 10),
        periodLabel: record.exam.periodLabel,
        importedAt: record.exam.importedAt.toISOString(),
        totalScore: null,
        totalSchoolRank: null,
        totalSchoolRankDelta: null,
        totalClassRank: null,
        totalClassRankDelta: null,
        subjects: [],
      };
      const item = {
        subjectName: record.subjectName,
        score: record.score === null ? null : Number(record.score),
        schoolRank: record.schoolRank,
        schoolRankDelta: record.schoolRankDelta,
        classRank: record.classRank,
        classRankDelta: record.classRankDelta,
      };
      if (record.subjectCode === 'total' || record.subjectName === '总分') {
        current.totalScore = item.score;
        current.totalSchoolRank = item.schoolRank;
        current.totalSchoolRankDelta = item.schoolRankDelta;
        current.totalClassRank = item.classRank;
        current.totalClassRankDelta = item.classRankDelta;
      } else {
        current.subjects.push(item);
      }
      grouped.set(key, current);
    });
    return Array.from(grouped.values()).slice(0, 3);
  }

  private buildAiSummary(
    studentName: string,
    periodType: 'weekly' | 'monthly',
    positiveSummary: SummaryBreakdown,
    negativeSummary: SummaryBreakdown,
    dimensionSummary: DimensionSummaryItem[],
    subjectSummary: SubjectSummaryItem[],
    trendSummary: TrendSummary,
    academicSummary: AcademicSummaryItem[],
  ) {
    const periodLabel = periodType === 'weekly' ? '近7天' : '近30天';
    const topDimension = dimensionSummary.length > 0 ? dimensionSummary[0].dimension : '暂未形成明显行为集中项';
    const topSubject = subjectSummary.length > 0 ? subjectSummary[0].subject : '通用场景';
    const trendText =
      trendSummary.recentTrend === 'up'
        ? '最近状态呈上升趋势'
        : trendSummary.recentTrend === 'down'
          ? '最近状态有回落迹象'
          : '最近整体较为平稳';

    const latestAcademic = academicSummary[0];
    const classRankDeltaText = this.formatRankDelta(latestAcademic?.totalClassRankDelta);
    const schoolRankDeltaText = this.formatRankDelta(latestAcademic?.totalSchoolRankDelta);
    const academicText = latestAcademic
      ? `最近一次成绩为“${latestAcademic.examName}”，总分${latestAcademic.totalScore ?? '暂无'}，班次${latestAcademic.totalClassRank ?? '暂无'}（${classRankDeltaText}），校次${latestAcademic.totalSchoolRank ?? '暂无'}（${schoolRankDeltaText}）。`
      : '';

    return `${studentName}${periodLabel}累计正向表现${positiveSummary.count}次，负向表现${negativeSummary.count}次，积分净变化${trendSummary.totalScoreDelta}分。高频关注点集中在“${topDimension}”，主要发生在“${topSubject}”相关学习场景，${trendText}。${academicText}`;
  }

  private buildAiSuggestion(
    positiveSummary: SummaryBreakdown,
    negativeSummary: SummaryBreakdown,
    dimensionSummary: DimensionSummaryItem[],
    subjectSummary: SubjectSummaryItem[],
    sceneSummary: SceneSummaryItem[],
    trendSummary: TrendSummary,
    academicSummary: AcademicSummaryItem[],
  ) {
    const latestAcademic = academicSummary[0];
    if (latestAcademic?.totalClassRankDelta && latestAcademic.totalClassRankDelta > 0) {
      return `建议及时肯定本次班级排名上升${latestAcademic.totalClassRankDelta}名的进步，并引导学生复盘提分科目和可复制的学习动作。`;
    }

    if (latestAcademic?.totalClassRankDelta && latestAcademic.totalClassRankDelta < 0) {
      return `建议重点关注本次班级排名下降${Math.abs(latestAcademic.totalClassRankDelta)}名的原因，结合错题复盘与课堂执行做短周期纠偏。`;
    }

    if (latestAcademic?.totalClassRank && latestAcademic.totalClassRank <= 5) {
      return '建议结合最近成绩优势，继续强化优势科目表达与错题复盘，把学业表现转化为稳定学习习惯。';
    }

    if (negativeSummary.count > positiveSummary.count) {
      const topRiskDimension = dimensionSummary.find((item) => item.negativeCount > 0)?.dimension ?? '课堂学习';
      return `建议班主任优先围绕“${topRiskDimension}”制定一周内可执行的小目标，并结合课堂提醒与作业跟进做短周期复盘。`;
    }

    if (trendSummary.recentTrend === 'down') {
      const scene = sceneSummary.find((item) => item.negativeCount > 0)?.scene ?? '课堂';
      return `建议近期重点关注“${scene}”场景中的状态波动，补充即时正反馈，避免学生从阶段性松动转为持续下滑。`;
    }

    if (subjectSummary.length > 0) {
      return `建议继续强化“${subjectSummary[0].subject}”相关正向反馈，并把当前优势迁移到作业与测评等关键学习环节，帮助学生稳定输出。`;
    }

    return '建议继续积累课堂、作业和测评场景数据，保持教师观察记录与规则评价同步，便于后续形成更稳定的学情画像。';
  }

  private formatRankDelta(value: number | null | undefined) {
    if (value === null || value === undefined || !Number.isFinite(Number(value)) || Number(value) === 0) {
      return '排名持平';
    }
    const numeric = Number(value);
    return numeric > 0 ? `上升${numeric}名` : `下降${Math.abs(numeric)}名`;
  }

  private async generateWithArk(input: {
    studentName: string;
    className: string;
    periodType: 'weekly' | 'monthly';
    positiveSummary: SummaryBreakdown;
    negativeSummary: SummaryBreakdown;
    dimensionSummary: DimensionSummaryItem[];
    subjectSummary: SubjectSummaryItem[];
    sceneSummary: SceneSummaryItem[];
    trendSummary: TrendSummary;
    evidence: EvidenceItem[];
    academicSummary: AcademicSummaryItem[];
    teacherObservations: Array<{
      observationType: string | null;
      content: string;
      createdAt: string;
    }>;
    fallbackSummary: string;
    fallbackSuggestion: string;
  }) {
    const apiKey = this.configService.get<string>('ARK_API_KEY');
    const apiUrl = this.configService.get<string>('ARK_API_URL') || 'https://ark.cn-beijing.volces.com/api/v3/responses';
    const model = this.configService.get<string>('ARK_MODEL') || 'deepseek-v3-2-251201';
    const timeoutMs = Number(this.configService.get<string>('ARK_TIMEOUT_MS') || 30000);

    if (!apiKey) {
      return {
        aiSummary: input.fallbackSummary,
        aiSuggestion: input.fallbackSuggestion,
      };
    }

    const periodLabel = input.periodType === 'weekly' ? '近7天' : '近30天';
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
                    '你是校内学情分析助手。',
                    '你只允许基于提供的数据进行判断，不夸大，不臆测。',
                    '输出必须正式、克制、适合班主任与学校管理场景。',
                    '若 academicSummary 中存在 totalClassRankDelta、totalSchoolRankDelta 或各科 classRankDelta、schoolRankDelta，必须在总结或建议中体现排名上升/下降及其可能指向。',
                    '排名变化字段含义：正数代表排名上升，负数代表排名下降，0 或 null 代表无明显变化或暂无数据。',
                    '行为评价数据已排除萌宠装扮、积分兑换、班级评价联动等非个体行为扣/加分，不得把消费或班级联动理解为学生个人表现。',
                    '请严格输出 JSON，字段只有 aiSummary 和 aiSuggestion，两个字段都必须是字符串。',
                    'aiSummary 控制在 120 字以内，aiSuggestion 控制在 80 字以内。',
                  ].join(' '),
                },
              ],
            },
            {
              role: 'user',
              content: [
                {
                  type: 'input_text',
                  text: JSON.stringify(
                    {
                      studentName: input.studentName,
                      className: input.className,
                      period: periodLabel,
                      metrics: {
                        positiveSummary: input.positiveSummary,
                        negativeSummary: input.negativeSummary,
                        trendSummary: input.trendSummary,
                      },
                      dimensionSummary: input.dimensionSummary,
                      subjectSummary: input.subjectSummary,
                      sceneSummary: input.sceneSummary,
                      evidence: input.evidence,
                      academicSummary: input.academicSummary,
                      teacherObservations: input.teacherObservations,
                    },
                    null,
                    2,
                  ),
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

      const payload = (await response.json()) as ArkResponse;
      const outputText = this.extractArkOutputText(payload);
      const parsed = this.parseArkOutput(outputText);
      return {
        aiSummary: parsed.aiSummary || input.fallbackSummary,
        aiSuggestion: parsed.aiSuggestion || input.fallbackSuggestion,
      };
    } catch {
      return {
        aiSummary: input.fallbackSummary,
        aiSuggestion: input.fallbackSuggestion,
      };
    } finally {
      clearTimeout(timeout);
    }
  }

  private extractArkOutputText(payload: ArkResponse) {
    if (typeof payload.output_text === 'string' && payload.output_text.trim()) {
      return payload.output_text.trim();
    }

    const text = payload.output
      ?.flatMap((item) => item.content ?? [])
      .filter((item) => item.type === 'output_text' || item.type === 'text')
      .map((item) => item.text ?? '')
      .join('\n')
      .trim();

    return text || '';
  }

  private parseArkOutput(text: string) {
    if (!text) {
      return {
        aiSummary: '',
        aiSuggestion: '',
      };
    }

    try {
      return JSON.parse(text) as {
        aiSummary: string;
        aiSuggestion: string;
      };
    } catch {
      const match = text.match(/\{[\s\S]*\}/);
      if (!match) {
        return {
          aiSummary: text.slice(0, 120),
          aiSuggestion: '',
        };
      }

      try {
        return JSON.parse(match[0]) as {
          aiSummary: string;
          aiSuggestion: string;
        };
      } catch {
        return {
          aiSummary: text.slice(0, 120),
          aiSuggestion: '',
        };
      }
    }
  }
}

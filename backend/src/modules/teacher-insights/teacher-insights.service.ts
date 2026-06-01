import { BadRequestException, Injectable } from '@nestjs/common';
import { toNumber } from '@/common/utils/bigint.util';
import { PrismaService } from '@/prisma/prisma.service';
import { AcademicRecordsService } from '../academic-records/academic-records.service';
import { AdminInsightsService } from '../admin-insights/admin-insights.service';
import { AuthService } from '../auth/auth.service';

const SUBJECT_COMPATIBILITY: Record<string, string[]> = {
  computer: ['computer', 'arts_it'],
  art: ['art', 'arts_it'],
  music: ['music', 'arts_it'],
  pe: ['pe', 'arts_it'],
  mathematics: ['math', 'mathematics'],
  math: ['math', 'mathematics'],
};

const SUBJECT_LABELS: Record<string, string> = {
  chinese: '语文',
  math: '数学',
  mathematics: '数学',
  english: '英语',
  physics: '物理',
  chemistry: '化学',
  geography: '地理',
  biology: '生物',
  history: '历史',
  politics: '政治',
  arts_it: '音美信综合',
  computer: '计算机',
  art: '美术',
  music: '音乐',
  pe: '体育',
};

function uniqueStrings(values: Array<string | null | undefined>) {
  return Array.from(new Set(values.map((item) => String(item ?? '').trim()).filter(Boolean)));
}

function expandSubjectCodes(subjectCode: string) {
  return uniqueStrings([subjectCode, ...(SUBJECT_COMPATIBILITY[subjectCode] ?? [])]);
}

function splitSentences(text: string) {
  return text
    .split(/[。！？\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function formatDateTimeLabel(value: Date | string | null | undefined) {
  if (!value) return '';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);
}

function formatDateLabel(value: Date | string | null | undefined) {
  if (!value) return '';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

function subjectLabelForText(subjectName: string | null | undefined, subjectCode: string) {
  const normalizedName = String(subjectName ?? '').trim();
  const normalizedCode = String(subjectCode ?? '').trim().toLowerCase();

  if (normalizedName && !/^[a-z][a-z0-9_]*$/i.test(normalizedName)) {
    return normalizedName;
  }

  if (normalizedCode && SUBJECT_LABELS[normalizedCode]) {
    return SUBJECT_LABELS[normalizedCode];
  }

  if (normalizedName && SUBJECT_LABELS[normalizedName.toLowerCase()]) {
    return SUBJECT_LABELS[normalizedName.toLowerCase()];
  }

  return normalizedName || SUBJECT_LABELS[normalizedCode] || normalizedCode || '学科';
}

@Injectable()
export class TeacherInsightsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authService: AuthService,
    private readonly academicRecordsService: AcademicRecordsService,
    private readonly adminInsightsService: AdminInsightsService,
  ) {}

  async workbenchContext(
    authorization: string | undefined,
    query: { classId?: number; subjectCode?: string },
  ) {
    const user = await this.authService.getAuthUserFromAuthorization(authorization);
    const classId = this.assertClassId(query.classId);
    const subjectCode = this.assertSubjectCode(query.subjectCode);
    this.authService.ensureCanAccessClass(user, classId);

    const classroom = await this.prisma.classroom.findFirst({
      where: {
        id: BigInt(classId),
        schoolId: user.schoolId,
        deletedAt: null,
        status: 'enabled',
      },
      select: {
        id: true,
        name: true,
        gradeName: true,
        students: {
          where: { deletedAt: null, status: 'enabled' },
          include: {
            profile: true,
          },
          orderBy: [{ studentNo: 'asc' }, { id: 'asc' }],
        },
      },
    });
    if (!classroom) throw new BadRequestException('班级不存在或已停用');

    const subjectCodes = expandSubjectCodes(subjectCode);
    const now = new Date();
    const recent7dStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const recent14dStart = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const recentRecordsRaw = await this.prisma.scoreRecord.findMany({
      where: {
        schoolId: user.schoolId,
        classId: BigInt(classId),
        createdAt: { gte: recent14dStart },
        OR: [
          { subjectCode: { in: subjectCodes } },
          { subjectCode: null, sourceRole: 'subject_teacher' },
        ],
      },
      include: {
        rule: {
          select: {
            name: true,
            dimension: true,
            sceneCode: true,
          },
        },
        student: {
          select: { id: true, name: true },
        },
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: 120,
    });

    const deskOverviewResp = (await this.academicRecordsService.deskOverview(authorization, {
      classId: String(classId),
      subjectCode,
    })) as {
      data: {
        examTrends: Array<{
          examId: number;
          examName: string;
          importedAt: Date;
          classAverageScore: number;
          participantCount: number;
        }>;
        subjectFocus: {
          examId: number;
          examName: string;
          subjectCode: string;
          subjectName: string | null;
          averageScore: number;
          participantCount: number;
          sampleLow: Array<{
            studentId: number;
            studentName: string;
            score: number;
            classRank: number | null;
            classRankDelta: number | null;
          }>;
          sampleHigh: Array<{
            studentId: number;
            studentName: string;
            score: number;
            classRank: number | null;
            classRankDelta: number | null;
          }>;
        } | null;
        gradeExamBenchmark: {
          examId: number;
          gradeName: string;
          participantAverageScore: number;
          participantCount: number;
          distinctClassCount: number;
        } | null;
      };
    };

    const baseline = deskOverviewResp.data;
    const latestSubjectExamId = baseline.subjectFocus?.examId ?? baseline.examTrends[baseline.examTrends.length - 1]?.examId ?? null;
    const latestAcademicImportedAt =
      baseline.subjectFocus?.examId
        ? baseline.examTrends.find((item) => item.examId === baseline.subjectFocus?.examId)?.importedAt ??
          baseline.examTrends[baseline.examTrends.length - 1]?.importedAt ??
          null
        : baseline.examTrends[baseline.examTrends.length - 1]?.importedAt ?? null;

    const latestSubjectRows = latestSubjectExamId
      ? await this.prisma.academicScoreRecord.findMany({
          where: {
            schoolId: user.schoolId,
            classId: BigInt(classId),
            examId: BigInt(latestSubjectExamId),
            subjectCode: { in: subjectCodes },
            score: { not: null },
          },
          select: {
            studentId: true,
            score: true,
          },
        })
      : [];

    const recentAcademicRows = await this.prisma.academicScoreRecord.findMany({
      where: {
        schoolId: user.schoolId,
        classId: BigInt(classId),
        subjectCode: { in: subjectCodes },
        score: { not: null },
      },
      select: {
        studentId: true,
        score: true,
        exam: {
          select: {
            id: true,
            importedAt: true,
          },
        },
      },
      orderBy: [{ exam: { examDate: 'desc' } }, { id: 'desc' }],
    });

    const latestSubjectScoreMap = new Map<number, number>();
    latestSubjectRows.forEach((row) => {
      latestSubjectScoreMap.set(toNumber(row.studentId) ?? 0, Number(row.score));
    });

    const scoreDeltaMap = new Map<number, number>();
    const recentAcademicByStudent = new Map<number, number[]>();
    recentAcademicRows.forEach((row) => {
      const studentId = toNumber(row.studentId) ?? 0;
      const current = recentAcademicByStudent.get(studentId) ?? [];
      if (current.length < 2) current.push(Number(row.score));
      recentAcademicByStudent.set(studentId, current);
    });
    recentAcademicByStudent.forEach((scores, studentId) => {
      if (scores.length >= 2) scoreDeltaMap.set(studentId, Math.round((scores[0] - scores[1]) * 10) / 10);
    });

    const lowSampleSet = new Set((baseline.subjectFocus?.sampleLow ?? []).map((item) => item.studentId));
    const classAverageScore = baseline.subjectFocus?.averageScore ?? null;
    const recordAggByStudent = new Map<
      number,
      {
        negativeCount: number;
        positiveCount: number;
        scoreDelta: number;
        recentCount: number;
        latestAt: string | null;
        latestDimension: string | null;
      }
    >();
    recentRecordsRaw.forEach((record) => {
      const studentId = toNumber(record.studentId) ?? 0;
      const current = recordAggByStudent.get(studentId) ?? {
        negativeCount: 0,
        positiveCount: 0,
        scoreDelta: 0,
        recentCount: 0,
        latestAt: null,
        latestDimension: null,
      };
      current.recentCount += 1;
      current.scoreDelta += record.scoreDelta;
      if (record.scoreDelta < 0) current.negativeCount += 1;
      if (record.scoreDelta > 0) current.positiveCount += 1;
      if (!current.latestAt) current.latestAt = record.createdAt.toISOString();
      if (!current.latestDimension) current.latestDimension = record.dimension ?? record.rule?.dimension ?? record.sceneCode ?? record.rule?.sceneCode ?? null;
      recordAggByStudent.set(studentId, current);
    });

    const attentionStudents = classroom.students
      .map((student) => {
        const studentId = toNumber(student.id) ?? 0;
        const agg = recordAggByStudent.get(studentId) ?? {
          negativeCount: 0,
          positiveCount: 0,
          scoreDelta: 0,
          recentCount: 0,
          latestAt: null,
          latestDimension: null,
        };
        const latestSubjectScore = latestSubjectScoreMap.get(studentId) ?? null;
        const subjectScoreDelta = scoreDeltaMap.get(studentId) ?? null;
        const reasonTags: string[] = [];
        if (agg.negativeCount >= 2) reasonTags.push('最近常被提醒');
        if (classAverageScore !== null && latestSubjectScore !== null && latestSubjectScore <= classAverageScore - 8) {
          reasonTags.push('这门课有点吃力');
        }
        if (subjectScoreDelta !== null && subjectScoreDelta <= -5) {
          reasonTags.push('最近成绩往下掉');
        }
        if (agg.recentCount === 0 || (agg.positiveCount === 0 && agg.negativeCount <= 1)) {
          reasonTags.push('上课存在感偏低');
        }
        if (
          reasonTags.includes('最近常被提醒') &&
          (reasonTags.includes('这门课有点吃力') || reasonTags.includes('最近成绩往下掉'))
        ) {
          reasonTags.push('建议和班主任一起跟');
        }
        if (!reasonTags.length && lowSampleSet.has(studentId)) {
          reasonTags.push('这门课有点吃力');
        }

        const priorityScore =
          agg.negativeCount * 4 +
          (reasonTags.includes('这门课有点吃力') ? 3 : 0) +
          (reasonTags.includes('最近成绩往下掉') ? 3 : 0) +
          (reasonTags.includes('上课存在感偏低') ? 1 : 0) +
          (reasonTags.includes('建议和班主任一起跟') ? 2 : 0);
        const priority = priorityScore >= 8 ? 'high' : priorityScore >= 4 ? 'medium' : 'low';
        const evidenceParts = [
          agg.negativeCount > 0 ? `近 14 日负向 ${agg.negativeCount} 次` : '',
          agg.recentCount > 0 ? `近 14 日记录 ${agg.recentCount} 条` : '近 14 日课堂记录偏少',
          latestSubjectScore !== null ? `最近单科 ${Math.round(latestSubjectScore * 10) / 10} 分` : '',
          subjectScoreDelta !== null ? `较上次 ${subjectScoreDelta > 0 ? '+' : ''}${subjectScoreDelta} 分` : '',
        ].filter(Boolean);
        const recommendedAction =
          reasonTags.includes('建议和班主任一起跟')
            ? '先看成绩和最近课堂记录，下课后和班主任通个气'
            : reasonTags.includes('最近常被提醒')
              ? '下节课先多盯一盯，及时提醒并补一条具体记录'
              : reasonTags.includes('这门课有点吃力') || reasonTags.includes('最近成绩往下掉')
                ? '先看成绩单，再安排一次更有针对性的提问或作业反馈'
                : '下节课多点一次名、多问一句，把情况看清楚一点';

        return {
          studentId,
          studentName: student.name,
          priority,
          priorityScore,
          reasonTags: uniqueStrings(reasonTags).slice(0, 4),
          evidence: evidenceParts.join(' · ') || '当前主要依据为最新课堂与学业数据',
          recommendedAction,
          currentScore: student.profile?.currentScore ?? 0,
          currentPetLevel: student.profile?.currentPetLevel ?? 1,
        };
      })
      .filter((item) => item.priorityScore > 0)
      .sort((left, right) => right.priorityScore - left.priorityScore || left.studentName.localeCompare(right.studentName, 'zh-CN'))
      .slice(0, 5);

    const topDimension = this.buildTopDimensionLabel(recentRecordsRaw);
    const recentEvaluationCount = recentRecordsRaw.filter((item) => item.createdAt >= recent7dStart).length;
    const latestLowCount =
      classAverageScore === null
        ? lowSampleSet.size
        : classroom.students.filter((student) => {
            const score = latestSubjectScoreMap.get(toNumber(student.id) ?? 0);
            return score !== undefined && score <= classAverageScore - 8;
          }).length;

    const attentionNames = attentionStudents.slice(0, 3).map((item) => item.studentName);
    const classDisplayName = `${classroom.gradeName}${classroom.name}`;
    const subjectDisplayName = subjectLabelForText(baseline.subjectFocus?.subjectName, subjectCode);
    const headline = attentionStudents.length
      ? `今天先把注意力放在 ${attentionNames.join('、')} ${attentionNames.length > 1 ? '这几位学生' : '这位学生'}身上。最近这门课的问题主要集中在「${topDimension}」。`
      : `${classDisplayName}这门${subjectDisplayName}最近整体比较平稳，先按正常节奏上课和记录就可以。`;
    const evidence = uniqueStrings([
      recentEvaluationCount > 0 ? `近 7 天这门课一共记了 ${recentEvaluationCount} 条课堂记录。` : '近 7 天这门课还没有新的课堂记录，判断会偏粗一些。',
      classAverageScore !== null ? `最近一次考试里，这个班的${subjectDisplayName}班均分是 ${classAverageScore} 分，目前有 ${latestLowCount} 名学生相对偏弱。` : '最近一次考试里，暂时还没有这门课可参考的成绩数据。',
      attentionStudents[0]
        ? `${attentionStudents[0].studentName}${attentionStudents[1] ? '等学生' : ''}需要先看，主要是因为：${attentionStudents[0].reasonTags.join('、')}。`
        : '眼下还没有必须立刻单独跟进的学生。',
    ]).slice(0, 3);

    const actionItems = uniqueStrings([
      attentionStudents[0]
        ? `先看 ${attentionStudents[0].studentName}${attentionStudents[1] ? `、${attentionStudents[1].studentName}` : ''} 最近的课堂记录和成绩，再决定这节课要不要单独提醒。`
        : '这节课先正常推进，同时补 1 到 2 条更具体的课堂记录。',
      topDimension
        ? `这节课的记录尽量围绕「${topDimension}」来写，别只记太泛的评价。`
        : '这节课尽量把课堂表现记具体一点，后面判断会更准。',
      attentionStudents.some((item) => item.reasonTags.includes('建议和班主任一起跟'))
        ? `像 ${attentionStudents.filter((item) => item.reasonTags.includes('建议和班主任一起跟')).map((item) => item.studentName).slice(0, 2).join('、')} 这样的学生，下课后最好顺手和班主任说一声。`
        : '如果后面同时出现课堂问题和成绩回落，再请班主任一起跟进。',
    ]).slice(0, 3);

    const homeroomSyncDraft = attentionStudents.some((item) => item.reasonTags.includes('建议和班主任一起跟'))
      ? `班主任您好，最近上 ${classDisplayName} 的${subjectDisplayName}时，建议重点看看 ${attentionNames.join('、')}。课堂上已经出现${attentionStudents
          .filter((item) => item.reasonTags.includes('最近常被提醒'))
          .map((item) => item.studentName)
          .slice(0, 2)
          .join('、') || '部分学生'}连续被提醒的情况，学业上也有回落或偏弱的迹象。这周如果方便，咱们可以一起跟一下。`
      : `班主任您好，这个班最近上课整体比较稳。如果后面我发现有需要一起跟进的学生，再第一时间和您说。`;
    const homeroomSyncShortDraft = attentionStudents.some((item) => item.reasonTags.includes('建议和班主任一起跟'))
      ? `建议和班主任一起关注：${attentionNames.join('、')}。课堂上最近常被提醒，成绩也有点往下掉。`
      : `这门课目前整体稳定，暂时不用额外联动班主任。`;
    const homeroomSyncForwardDraft = attentionStudents.some((item) => item.reasonTags.includes('建议和班主任一起跟'))
      ? `班主任您好，想和您同步一下：${classDisplayName}最近上${subjectDisplayName}时，${attentionNames.join('、')}这几位学生需要多留意。课堂上有连续被提醒的情况，成绩也有回落或偏弱迹象。方便的话，这周一起跟一下。`
      : `班主任您好，这个班最近在${subjectDisplayName}课上的整体状态比较稳，暂时没有需要额外同步的重点学生。`;
    const lessonSummaryDraft = attentionStudents.length
      ? `这节${subjectDisplayName}课建议先盯住 ${attentionNames.join('、')}。最近的问题主要出在「${topDimension}」，考试这边${classAverageScore !== null ? `班均分是 ${classAverageScore} 分` : '暂时没有新的成绩可参考'}。下节课可以多给几次点名、提问或作业反馈，把问题再看清楚一点。`
      : `这节${subjectDisplayName}课整体比较稳，继续保持正常节奏就可以。下次上课时，课堂记录尽量再写具体一些。`;
    const nextLessonDraft = attentionStudents.length
      ? `下次上${subjectDisplayName}时，先重点看 ${attentionNames.join('、')} 的课堂反应，尽量多留几条具体记录。`
      : `下次这门课先按正常节奏上，顺手把课堂记录写得再具体一点。`;

    const recentRecords = recentRecordsRaw.slice(0, 8).map((record) => ({
      id: toNumber(record.id),
      studentId: toNumber(record.studentId),
      studentName: record.student.name,
      scoreDelta: record.scoreDelta,
      subjectCode: record.subjectCode,
      dimension: record.dimension ?? record.rule?.dimension ?? null,
      tag: record.tag,
      ruleName: record.rule?.name ?? null,
      remark: record.remark,
      createdAt: record.createdAt,
      operatorName: record.operatorName,
      sentiment: record.sentiment,
    }));

    const subjectLabel = subjectLabelForText(baseline.subjectFocus?.subjectName, subjectCode);

    return {
      code: 0,
      message: 'ok',
      data: {
        contextHeader: {
          classId,
          className: classroom.name,
          gradeName: classroom.gradeName,
          subjectCode,
          subjectLabel,
          studentCount: classroom.students.length,
          recentEvaluationCount,
          latestAcademicImportedAt,
          latestAcademicExamName: baseline.subjectFocus?.examName ?? baseline.examTrends[baseline.examTrends.length - 1]?.examName ?? null,
        },
        aiBrief: {
          headline,
          evidence,
          actionItems,
          homeroomSyncDraft,
        },
        attentionStudents,
        quickActions: [
          {
            key: 'evaluation',
            label: '进入学科评价',
            targetPath: '/evaluation',
            query: { classId, subjectCode, mode: 'single' },
          },
          {
            key: 'students',
            label: '查看当前班学生',
            targetPath: '/students',
            query: { classId, statsView: 'class' },
          },
          { key: 'scores', label: '打开成绩单', targetPath: '/students', query: { tab: 'scores', classId } },
          { key: 'homeroom-sync', label: '复制发给班主任的话', actionType: 'copy', copyText: homeroomSyncForwardDraft },
        ],
        academicBaseline: baseline,
        recentRecords,
        followUpDrafts: {
          homeroomSyncDraft,
          homeroomSyncShortDraft,
          homeroomSyncForwardDraft,
          lessonSummaryDraft,
          nextLessonDraft,
        },
      },
    };
  }

  async reviewContext(
    authorization: string | undefined,
    query: {
      classId?: number;
      subjectCode?: string;
      startDate?: string;
      endDate?: string;
      regenerateAi?: boolean;
    },
  ) {
    const user = await this.authService.getAuthUserFromAuthorization(authorization);
    const classId = this.assertClassId(query.classId);
    const subjectCode = this.assertSubjectCode(query.subjectCode);
    this.authService.ensureCanAccessClass(user, classId);

    const analyticsResp = (await this.adminInsightsService.analytics(authorization, {
      classId,
      subjectCode,
      startDate: query.startDate,
      endDate: query.endDate,
      regenerateAi: Boolean(query.regenerateAi),
    })) as {
      data: {
        positiveRuleCount: number;
        negativeRuleCount: number;
        activeDays: number;
        ruleDistribution: Array<{ name: string; value: number }>;
        subjectDistribution: Array<{ name: string; value: number }>;
        riskStudents: Array<{
          studentId: number;
          studentName: string;
          className: string;
          positiveCount: number;
          negativeCount: number;
          scoreDelta: number;
          riskLevel: 'high' | 'medium' | 'low';
          reason: string;
        }>;
        aiInsight: {
          summary: string;
          suggestion: string;
          reportSummary: string;
          generatedAt: string | null;
          reportDate: string | null;
          isCached: boolean;
        };
        heatMap: {
          rows: string[];
          cols: string[];
          data: Array<{ row: string; values: number[] }>;
        };
      };
    };

    const classroom = await this.prisma.classroom.findFirst({
      where: {
        id: BigInt(classId),
        schoolId: user.schoolId,
        deletedAt: null,
        status: 'enabled',
      },
      select: {
        id: true,
        name: true,
        gradeName: true,
        students: {
          where: { deletedAt: null, status: 'enabled' },
          select: { id: true, name: true },
        },
      },
    });
    if (!classroom) throw new BadRequestException('班级不存在或已停用');

    const range = this.resolveDateRange(query.startDate, query.endDate);
    const subjectCodes = expandSubjectCodes(subjectCode);
    const scopedRecords = await this.prisma.scoreRecord.findMany({
      where: {
        schoolId: user.schoolId,
        classId: BigInt(classId),
        createdAt: {
          gte: range.startAt,
          lt: range.endAtExclusive,
        },
        OR: [
          { subjectCode: { in: subjectCodes } },
          { subjectCode: null, sourceRole: 'subject_teacher' },
        ],
      },
      select: {
        id: true,
        studentId: true,
        scoreDelta: true,
        sentiment: true,
        dimension: true,
        sceneCode: true,
        tag: true,
        remark: true,
        subjectCode: true,
        operatorId: true,
        operatorName: true,
        createdAt: true,
        rule: {
          select: {
            name: true,
          },
        },
      },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    });

    const coveredStudents = new Set(scopedRecords.map((record) => toNumber(record.studentId) ?? 0)).size;
    const dailyMap = new Map<string, { positive: number; negative: number; total: number }>();
    scopedRecords.forEach((record) => {
      const dateKey = record.createdAt.toISOString().slice(0, 10);
      const current = dailyMap.get(dateKey) ?? { positive: 0, negative: 0, total: 0 };
      current.total += 1;
      if (record.scoreDelta > 0) current.positive += 1;
      if (record.scoreDelta < 0) current.negative += 1;
      dailyMap.set(dateKey, current);
    });
    const dailyTrend = Array.from(dailyMap.entries()).map(([date, value]) => ({
      date,
      ...value,
    }));

    const sceneDistribution = Array.from(
      scopedRecords.reduce((map, record) => {
        const key = record.dimension ?? record.sceneCode ?? '未分类';
        map.set(key, (map.get(key) ?? 0) + 1);
        return map;
      }, new Map<string, number>()),
    )
      .sort((left, right) => right[1] - left[1])
      .slice(0, 6)
      .map(([name, value]) => ({ name, value }));

    const aiSummarySentences = splitSentences(analyticsResp.data.aiInsight.summary);
    const aiReportSentences = splitSentences(analyticsResp.data.aiInsight.reportSummary);
    const aiSuggestionSentences = splitSentences(analyticsResp.data.aiInsight.suggestion);
    const basis = uniqueStrings([
      `统计周期内共产生 ${scopedRecords.length} 条本学科评价，其中正向 ${analyticsResp.data.positiveRuleCount} 条、负向 ${analyticsResp.data.negativeRuleCount} 条。`,
      analyticsResp.data.ruleDistribution[0]
        ? `课堂信号主要集中在「${analyticsResp.data.ruleDistribution[0].name}」维度。`
        : '',
      analyticsResp.data.riskStudents[0]
        ? `当前区间内持续异常对象以 ${analyticsResp.data.riskStudents[0].studentName} 为代表。`
        : '当前区间内未发现明显持续异常对象。',
    ]).slice(0, 3);
    const ownScoreDetailSummary = Array.from(
      scopedRecords.reduce((map, record) => {
        if ((toNumber(record.operatorId) ?? 0) !== (toNumber(user.id) ?? 0)) return map;
        const studentId = toNumber(record.studentId) ?? 0;
        if (!studentId) return map;
        const current = map.get(studentId) ?? {
          studentId,
          studentName: classroom.students.find((item) => (toNumber(item.id) ?? 0) === studentId)?.name ?? `学生#${studentId}`,
          classId,
          className: classroom.name,
          totalScoreDelta: 0,
          positiveCount: 0,
          negativeCount: 0,
          recordCount: 0,
          records: [] as Array<{
            id: number;
            scoreDelta: number;
            ruleName: string | null;
            dimension: string | null;
            tag: string | null;
            remark: string | null;
            subjectCode: string | null;
            operatorName: string | null;
            createdAt: Date;
          }>,
        };
        current.totalScoreDelta += record.scoreDelta;
        current.recordCount += 1;
        if (record.scoreDelta > 0) current.positiveCount += 1;
        if (record.scoreDelta < 0) current.negativeCount += 1;
        current.records.push({
          id: toNumber(record.id) ?? 0,
          scoreDelta: record.scoreDelta,
          ruleName: record.rule?.name ?? null,
          dimension: record.dimension,
          tag: record.tag,
          remark: record.remark,
          subjectCode: record.subjectCode,
          operatorName: record.operatorName,
          createdAt: record.createdAt,
        });
        map.set(studentId, current);
        return map;
      }, new Map<number, {
        studentId: number;
        studentName: string;
        classId: number;
        className: string;
        totalScoreDelta: number;
        positiveCount: number;
        negativeCount: number;
        recordCount: number;
        records: Array<{
          id: number;
          scoreDelta: number;
          ruleName: string | null;
          dimension: string | null;
          tag: string | null;
          remark: string | null;
          subjectCode: string | null;
          operatorName: string | null;
          createdAt: Date;
        }>;
      }>()),
    )
      .map(([, item]) => ({
        ...item,
        records: item.records.sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime() || right.id - left.id),
      }))
      .sort(
        (left, right) =>
          right.totalScoreDelta - left.totalScoreDelta ||
          right.recordCount - left.recordCount ||
          left.studentId - right.studentId,
      );

    return {
      code: 0,
      message: 'ok',
      data: {
        contextHeader: {
          classId,
          className: classroom.name,
          gradeName: classroom.gradeName,
          subjectCode,
          studentCount: classroom.students.length,
          dateRangeLabel: `${range.startDate} 至 ${range.endDate}`,
        },
        summaryKpis: {
          totalEvents: scopedRecords.length,
          positiveCount: analyticsResp.data.positiveRuleCount,
          negativeCount: analyticsResp.data.negativeRuleCount,
          activeDays: analyticsResp.data.activeDays,
          coveredStudents,
          riskStudentCount: analyticsResp.data.riskStudents.length,
        },
        trendSlices: {
          dailyTrend,
          dimensionDistribution: analyticsResp.data.ruleDistribution,
          sceneDistribution,
          heatMap: analyticsResp.data.heatMap,
        },
        riskStudents: analyticsResp.data.riskStudents,
        aiRetrospective: {
          conclusion: aiSummarySentences[0] ?? analyticsResp.data.aiInsight.summary,
          basis,
          problemAnalysis:
            aiReportSentences[1] ??
            aiReportSentences[0] ??
            '当前需要结合课堂过程性记录与学业结果，持续判断问题是否来自学习习惯、课堂参与或阶段性难点。',
          nextSteps: aiSuggestionSentences.slice(0, 3),
          generatedAt: analyticsResp.data.aiInsight.generatedAt,
          reportDate: analyticsResp.data.aiInsight.reportDate,
          isCached: analyticsResp.data.aiInsight.isCached,
        },
        recommendedAdjustments:
          aiSuggestionSentences.length > 0
            ? aiSuggestionSentences.slice(0, 3)
            : [
                '先补足更具体的课堂过程性评价，再观察下一阶段波动是否持续。',
                '把风险学生放进下次课堂的点名、提问或作业反馈名单中。',
              ],
        scoreDetailSummary: ownScoreDetailSummary,
      },
    };
  }

  private assertClassId(classId?: number) {
    if (!Number.isInteger(classId) || Number(classId) <= 0) {
      throw new BadRequestException('无效的 classId');
    }
    return Number(classId);
  }

  private assertSubjectCode(subjectCode?: string) {
    const normalized = String(subjectCode ?? '').trim();
    if (!normalized) {
      throw new BadRequestException('缺少 subjectCode');
    }
    return normalized;
  }

  private resolveDateRange(startDate?: string, endDate?: string) {
    const today = new Date();
    const fallbackEnd = today.toISOString().slice(0, 10);
    const fallbackStart = new Date(today.getTime() - 29 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const normalizedStart = /^\d{4}-\d{2}-\d{2}$/.test(String(startDate ?? '')) ? String(startDate) : fallbackStart;
    const normalizedEnd = /^\d{4}-\d{2}-\d{2}$/.test(String(endDate ?? '')) ? String(endDate) : fallbackEnd;
    const startAt = new Date(`${normalizedStart}T00:00:00.000Z`);
    const endAtExclusive = new Date(`${normalizedEnd}T00:00:00.000Z`);
    endAtExclusive.setUTCDate(endAtExclusive.getUTCDate() + 1);
    return {
      startDate: normalizedStart,
      endDate: normalizedEnd,
      startAt,
      endAtExclusive,
    };
  }

  private buildTopDimensionLabel(
    records: Array<{
      dimension: string | null;
      sceneCode: string | null;
      rule?: { dimension: string | null; sceneCode: string | null } | null;
    }>,
  ) {
    const grouped = Array.from(
      records.reduce((map, record) => {
        const key = record.dimension ?? record.rule?.dimension ?? record.sceneCode ?? record.rule?.sceneCode ?? '课堂表现';
        map.set(key, (map.get(key) ?? 0) + 1);
        return map;
      }, new Map<string, number>()),
    ).sort((left, right) => right[1] - left[1]);
    return grouped[0]?.[0] ?? '课堂表现';
  }
}

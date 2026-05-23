import type { AcademicExamListItem, AcademicScoreListRow, AdminClass, AdminStudent } from '../lib/api';

export type AcademicGrowthSummary = {
  latestExam: AcademicExamListItem | null;
  previousExam: AcademicExamListItem | null;
  coverageRate: number;
  participantCount: number;
  averageScore: number;
  progressCount: number;
  declineCount: number;
  riskCount: number;
  growthIndex: number;
  classSummaries: AcademicClassSummary[];
  /** 最近一次考试全科总分行的学生画像（教员工作台按班切片用） */
  studentSignals: AcademicStudentSignal[];
  progressLeaders: AcademicStudentSignal[];
  riskStudents: AcademicStudentSignal[];
  quadrants: Array<{ key: string; label: string; count: number; tone: 'good' | 'potential' | 'watch' | 'risk' }>;
  trend: Array<{
    examId: number;
    examName: string;
    examDate?: string;
    periodLabel?: string | null;
    importedAt: string;
    averageScore: number;
    progressRate: number;
    declineRate: number;
    participantCount: number;
  }>;
  insight: {
    headline: string;
    suggestion: string;
    report: string;
  };
};

export type AcademicClassSummary = {
  classId: number;
  className: string;
  gradeName: string;
  averageScore: number;
  participantCount: number;
  progressCount: number;
  declineCount: number;
  behaviorAverage: number;
  growthIndex: number;
  riskLevel: 'high' | 'medium' | 'low';
};

export type AcademicStudentSignal = {
  studentId: number;
  studentName: string;
  classId: number;
  className: string;
  totalScore: number;
  scoreDelta: number;
  rankDelta: number;
  quadrant: 'star' | 'potential' | 'quiet' | 'risk';
  reason: string;
};

const emptySummary: AcademicGrowthSummary = {
  latestExam: null,
  previousExam: null,
  coverageRate: 0,
  participantCount: 0,
  averageScore: 0,
  progressCount: 0,
  declineCount: 0,
  riskCount: 0,
  growthIndex: 0,
  classSummaries: [],
  studentSignals: [],
  progressLeaders: [],
  riskStudents: [],
  quadrants: [
    { key: 'star', label: '高分进步', count: 0, tone: 'good' },
    { key: 'potential', label: '进步潜力', count: 0, tone: 'potential' },
    { key: 'quiet', label: '高分承压', count: 0, tone: 'watch' },
    { key: 'risk', label: '重点帮扶', count: 0, tone: 'risk' },
  ],
  trend: [],
  insight: {
    headline: '暂无可分析的学业成长数据。',
    suggestion: '导入考试成绩后，系统会自动形成班级成长、学生进退步和风险关注视图。',
    report: '当前学业成长数据尚未形成有效样本。',
  },
};

function examTime(exam: AcademicExamListItem) {
  return new Date(exam.examDate || exam.importedAt).getTime();
}

function avg(values: number[]) {
  if (!values.length) return 0;
  return Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 10) / 10;
}

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function resolveRankDelta(row: AcademicScoreListRow, previous?: AcademicScoreListRow) {
  const explicit = row.classRankDelta ?? row.schoolRankDelta;
  if (typeof explicit === 'number' && Number.isFinite(explicit)) return explicit;
  if (previous && previous.totalScore !== null && row.totalScore !== null) return Math.round(row.totalScore - previous.totalScore);
  return 0;
}

function pickQuadrant(totalScore: number, scoreDelta: number, averageScore: number): AcademicStudentSignal['quadrant'] {
  const highAcademic = totalScore >= averageScore;
  const improving = scoreDelta >= 0;
  if (highAcademic && improving) return 'star';
  if (!highAcademic && improving) return 'potential';
  if (highAcademic && !improving) return 'quiet';
  return 'risk';
}

export function buildAcademicGrowthSummary(
  exams: AcademicExamListItem[],
  scoreRows: AcademicScoreListRow[],
  classes: AdminClass[],
  students: AdminStudent[],
  selectedExamId?: number | null,
): AcademicGrowthSummary {
  if (!exams.length || !scoreRows.length) return emptySummary;

  const sortedExams = [...exams].sort((left, right) => examTime(right) - examTime(left));
  const focusExam = (selectedExamId ? sortedExams.find((exam) => exam.id === selectedExamId) : null) ?? sortedExams[0] ?? null;
  if (!focusExam) return emptySummary;

  const totalScoreRows = scoreRows.filter((row) => !row.subjectCode || row.subjectCode === 'total');
  const latestRows = totalScoreRows.filter((row) => row.examId === focusExam.id && row.totalScore !== null);
  if (!latestRows.length) return { ...emptySummary, latestExam: focusExam };

  const latestGrade = focusExam.gradeName;
  const comparableExams = latestGrade
    ? sortedExams.filter((exam) => exam.gradeName === latestGrade)
    : sortedExams;
  const focusExamIndex = comparableExams.findIndex((exam) => exam.id === focusExam.id);
  const previousExam = (focusExamIndex >= 0 ? comparableExams[focusExamIndex + 1] : null) ?? null;
  const previousRows = previousExam ? totalScoreRows.filter((row) => row.examId === previousExam.id && row.totalScore !== null) : [];
  const previousByStudent = new Map(previousRows.map((row) => [row.studentId, row]));
  const classById = new Map(classes.map((item) => [item.id, item]));

  const scoreValues = latestRows.flatMap((row) => (row.totalScore === null ? [] : [row.totalScore]));
  const averageScore = avg(scoreValues);

  const signals = latestRows.map((row) => {
    const previous = previousByStudent.get(row.studentId);
    const rankDelta = resolveRankDelta(row, previous);
    const totalScore = row.totalScore ?? 0;
    const scoreDelta = previous?.totalScore !== null && previous?.totalScore !== undefined ? Math.round((totalScore - previous.totalScore) * 10) / 10 : rankDelta;
    const quadrant = pickQuadrant(totalScore, scoreDelta, averageScore);
    const reason =
      quadrant === 'star'
        ? '总分高于均值，且较上次考试保持进步'
        : quadrant === 'potential'
          ? '本次有进步，仍有继续抬升空间'
          : quadrant === 'quiet'
            ? '总分仍在高位，但较上次考试回落'
            : '总分低于均值，且较上次考试退步';
    return {
      studentId: row.studentId,
      studentName: row.studentName,
      classId: row.classId,
      className: row.className,
      totalScore,
      scoreDelta,
      rankDelta,
      quadrant,
      reason,
    };
  });

  const progressLeaders = [...signals]
    .filter((item) => item.rankDelta > 0 || item.scoreDelta > 0)
    .sort((left, right) => right.rankDelta - left.rankDelta || right.scoreDelta - left.scoreDelta || right.totalScore - left.totalScore)
    .slice(0, 8);
  const riskStudents = [...signals]
    .filter((item) => item.rankDelta < 0 || item.scoreDelta < 0)
    .sort((left, right) => left.rankDelta - right.rankDelta || left.scoreDelta - right.scoreDelta || left.totalScore - right.totalScore)
    .slice(0, 8);

  const progressCount = signals.filter((item) => item.rankDelta > 0 || item.scoreDelta > 0).length;
  const declineCount = signals.filter((item) => item.rankDelta < 0 || item.scoreDelta < 0).length;
  const coverageBase = latestGrade ? students.filter((student) => classById.get(student.classId)?.gradeName === latestGrade).length : students.length;
  const coverageRate = coverageBase ? Math.round((latestRows.length / coverageBase) * 100) : 0;

  const classSummaries = Array.from(
    latestRows.reduce((map, row) => {
      const current = map.get(row.classId) ?? {
        classId: row.classId,
        className: row.className,
        gradeName: classById.get(row.classId)?.gradeName ?? latestGrade ?? '未分年级',
        scores: [] as number[],
        progressCount: 0,
        declineCount: 0,
      };
      if (row.totalScore !== null) current.scores.push(row.totalScore);
      const rankDelta = resolveRankDelta(row, previousByStudent.get(row.studentId));
      if (rankDelta > 0) current.progressCount += 1;
      if (rankDelta < 0) current.declineCount += 1;
      map.set(row.classId, current);
      return map;
    }, new Map<number, { classId: number; className: string; gradeName: string; scores: number[]; progressCount: number; declineCount: number }>())
      .values(),
  )
    .map((item) => {
      const classAverage = avg(item.scores);
      const progressRate = item.scores.length ? (item.progressCount / item.scores.length) * 100 : 0;
      const declineRate = item.scores.length ? (item.declineCount / item.scores.length) * 100 : 0;
      const growthIndex = Math.round(clamp(classAverage * 0.16 + progressRate * 0.52 - declineRate * 0.32, 0, 100));
      return {
        classId: item.classId,
        className: item.className,
        gradeName: item.gradeName,
        averageScore: classAverage,
        participantCount: item.scores.length,
        progressCount: item.progressCount,
        declineCount: item.declineCount,
        behaviorAverage: 0,
        growthIndex,
        riskLevel: declineRate >= 35 ? 'high' : declineRate >= 18 ? 'medium' : 'low',
      } satisfies AcademicClassSummary;
    })
    .sort((left, right) => right.growthIndex - left.growthIndex || right.averageScore - left.averageScore);

  const trend = comparableExams
    .slice(0, 6)
    .map((exam) => {
      const rows = totalScoreRows.filter((row) => row.examId === exam.id && row.totalScore !== null);
      const examIndex = comparableExams.findIndex((item) => item.id === exam.id);
      const examPrevious = examIndex >= 0 ? comparableExams[examIndex + 1] ?? null : null;
      const examPreviousRows = examPrevious
        ? totalScoreRows.filter((candidate) => candidate.examId === examPrevious.id && candidate.totalScore !== null)
        : [];
      const examPreviousByStudent = new Map(examPreviousRows.map((row) => [row.studentId, row]));
      const progressRows = rows.filter((row) => {
        const previous = examPreviousByStudent.get(row.studentId);
        return resolveRankDelta(row, previous) > 0;
      });
      const declineRows = rows.filter((row) => {
        const previous = examPreviousByStudent.get(row.studentId);
        return resolveRankDelta(row, previous) < 0;
      });
      return {
        examId: exam.id,
        examName: exam.name,
        importedAt: exam.importedAt,
        averageScore: avg(rows.flatMap((row) => (row.totalScore === null ? [] : [row.totalScore]))),
        progressRate: rows.length ? Math.round((progressRows.length / rows.length) * 100) : 0,
        declineRate: rows.length ? Math.round((declineRows.length / rows.length) * 100) : 0,
        participantCount: rows.length,
      };
    })
    .reverse();

  const quadrantCounts = signals.reduce(
    (map, item) => {
      map[item.quadrant] += 1;
      return map;
    },
    { star: 0, potential: 0, quiet: 0, risk: 0 },
  );
  const quadrants = [
    { key: 'star', label: '高分进步', count: quadrantCounts.star, tone: 'good' },
    { key: 'potential', label: '进步潜力', count: quadrantCounts.potential, tone: 'potential' },
    { key: 'quiet', label: '高分承压', count: quadrantCounts.quiet, tone: 'watch' },
    { key: 'risk', label: '重点帮扶', count: quadrantCounts.risk, tone: 'risk' },
  ] as AcademicGrowthSummary['quadrants'];

  const progressRate = latestRows.length ? Math.round((progressCount / latestRows.length) * 100) : 0;
  const declineRate = latestRows.length ? Math.round((declineCount / latestRows.length) * 100) : 0;
  const growthIndex = Math.round(clamp(averageScore * 0.12 + coverageRate * 0.22 + progressRate * 0.42 - declineRate * 0.24, 0, 100));
  const topClass = classSummaries[0];
  const riskClass = [...classSummaries].sort((left, right) => right.declineCount - left.declineCount || left.growthIndex - right.growthIndex)[0];

  return {
    latestExam: focusExam,
    previousExam,
    coverageRate,
    participantCount: latestRows.length,
    averageScore,
    progressCount,
    declineCount,
    riskCount: riskStudents.length,
    growthIndex,
    classSummaries,
    studentSignals: signals,
    progressLeaders,
    riskStudents,
    quadrants,
    trend,
    insight: {
      headline: `${focusExam.name} 已覆盖 ${latestRows.length} 名学生，学业成长指数 ${growthIndex}。`,
      suggestion: riskClass
        ? `建议优先关注 ${riskClass.className} 的退步学生，同时沉淀 ${topClass?.className ?? '标杆班级'} 的提分做法。`
        : '建议继续保持成绩导入节奏，并结合日常评价观察学业变化。',
      report: `本次考试均分 ${averageScore}，进步学生 ${progressCount} 人，退步预警 ${declineCount} 人，覆盖率 ${coverageRate}%。`,
    },
  };
}

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
  progressLeaders: AcademicStudentSignal[];
  riskStudents: AcademicStudentSignal[];
  quadrants: Array<{ key: string; label: string; count: number; tone: 'good' | 'potential' | 'watch' | 'risk' }>;
  trend: Array<{ examId: number; examName: string; importedAt: string; averageScore: number; progressRate: number; participantCount: number }>;
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
  behaviorScore: number;
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
  progressLeaders: [],
  riskStudents: [],
  quadrants: [
    { key: 'star', label: '高分高活跃', count: 0, tone: 'good' },
    { key: 'potential', label: '进步潜力', count: 0, tone: 'potential' },
    { key: 'quiet', label: '安静优秀', count: 0, tone: 'watch' },
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
  return new Date(exam.importedAt).getTime();
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

function pickQuadrant(totalScore: number, scoreDelta: number, behaviorScore: number, averageScore: number, behaviorAverage: number): AcademicStudentSignal['quadrant'] {
  const highAcademic = totalScore >= averageScore;
  const highBehavior = behaviorScore >= behaviorAverage;
  if (highAcademic && highBehavior) return 'star';
  if (!highAcademic && (highBehavior || scoreDelta > 0)) return 'potential';
  if (highAcademic && !highBehavior) return 'quiet';
  return 'risk';
}

export function buildAcademicGrowthSummary(
  exams: AcademicExamListItem[],
  scoreRows: AcademicScoreListRow[],
  classes: AdminClass[],
  students: AdminStudent[],
): AcademicGrowthSummary {
  if (!exams.length || !scoreRows.length) return emptySummary;

  const sortedExams = [...exams].sort((left, right) => examTime(right) - examTime(left));
  const latestExam = sortedExams[0] ?? null;
  if (!latestExam) return emptySummary;

  const totalScoreRows = scoreRows.filter((row) => !row.subjectCode || row.subjectCode === 'total');
  const latestRows = totalScoreRows.filter((row) => row.examId === latestExam.id && row.totalScore !== null);
  if (!latestRows.length) return { ...emptySummary, latestExam };

  const latestGrade = latestExam.gradeName;
  const previousExam = sortedExams.find((exam) => exam.id !== latestExam.id && (!latestGrade || exam.gradeName === latestGrade)) ?? null;
  const previousRows = previousExam ? totalScoreRows.filter((row) => row.examId === previousExam.id && row.totalScore !== null) : [];
  const previousByStudent = new Map(previousRows.map((row) => [row.studentId, row]));
  const studentById = new Map(students.map((student) => [student.id, student]));
  const classById = new Map(classes.map((item) => [item.id, item]));

  const scoreValues = latestRows.flatMap((row) => (row.totalScore === null ? [] : [row.totalScore]));
  const averageScore = avg(scoreValues);
  const behaviorAverage = students.length ? avg(students.map((student) => student.currentScore)) : 0;

  const signals = latestRows.map((row) => {
    const previous = previousByStudent.get(row.studentId);
    const rankDelta = resolveRankDelta(row, previous);
    const totalScore = row.totalScore ?? 0;
    const scoreDelta = previous?.totalScore !== null && previous?.totalScore !== undefined ? Math.round((totalScore - previous.totalScore) * 10) / 10 : rankDelta;
    const behaviorScore = studentById.get(row.studentId)?.currentScore ?? 0;
    const quadrant = pickQuadrant(totalScore, scoreDelta, behaviorScore, averageScore, behaviorAverage);
    const reason =
      quadrant === 'star'
        ? '学业表现与行为参与均处于高位'
        : quadrant === 'potential'
          ? '行为参与较好，学业仍有提升空间'
          : quadrant === 'quiet'
            ? '学业稳定，但日常参与度偏低'
            : '学业与行为信号均需关注';
    return {
      studentId: row.studentId,
      studentName: row.studentName,
      classId: row.classId,
      className: row.className,
      totalScore,
      scoreDelta,
      rankDelta,
      behaviorScore,
      quadrant,
      reason,
    };
  });

  const progressLeaders = [...signals]
    .filter((item) => item.rankDelta > 0 || item.scoreDelta > 0)
    .sort((left, right) => right.rankDelta - left.rankDelta || right.scoreDelta - left.scoreDelta || right.totalScore - left.totalScore)
    .slice(0, 8);
  const riskStudents = [...signals]
    .filter((item) => item.rankDelta < 0 || item.quadrant === 'risk')
    .sort((left, right) => left.rankDelta - right.rankDelta || left.totalScore - right.totalScore)
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
        behaviorScores: [] as number[],
      };
      if (row.totalScore !== null) current.scores.push(row.totalScore);
      const rankDelta = resolveRankDelta(row, previousByStudent.get(row.studentId));
      if (rankDelta > 0) current.progressCount += 1;
      if (rankDelta < 0) current.declineCount += 1;
      current.behaviorScores.push(studentById.get(row.studentId)?.currentScore ?? 0);
      map.set(row.classId, current);
      return map;
    }, new Map<number, { classId: number; className: string; gradeName: string; scores: number[]; progressCount: number; declineCount: number; behaviorScores: number[] }>())
      .values(),
  )
    .map((item) => {
      const classAverage = avg(item.scores);
      const behavior = avg(item.behaviorScores);
      const progressRate = item.scores.length ? (item.progressCount / item.scores.length) * 100 : 0;
      const declineRate = item.scores.length ? (item.declineCount / item.scores.length) * 100 : 0;
      const growthIndex = Math.round(clamp(classAverage * 0.12 + behavior * 0.32 + progressRate * 0.42 - declineRate * 0.18, 0, 100));
      return {
        classId: item.classId,
        className: item.className,
        gradeName: item.gradeName,
        averageScore: classAverage,
        participantCount: item.scores.length,
        progressCount: item.progressCount,
        declineCount: item.declineCount,
        behaviorAverage: behavior,
        growthIndex,
        riskLevel: declineRate >= 35 ? 'high' : declineRate >= 18 ? 'medium' : 'low',
      } satisfies AcademicClassSummary;
    })
    .sort((left, right) => right.growthIndex - left.growthIndex || right.averageScore - left.averageScore);

  const trend = sortedExams
    .slice(0, 6)
    .map((exam) => {
      const rows = totalScoreRows.filter((row) => row.examId === exam.id && row.totalScore !== null);
      const progressRows = rows.filter((row) => {
        const previous = totalScoreRows.find((candidate) => candidate.studentId === row.studentId && candidate.examId !== row.examId && examTime(sortedExams.find((item) => item.id === candidate.examId) ?? exam) < examTime(exam));
        return resolveRankDelta(row, previous) > 0;
      });
      return {
        examId: exam.id,
        examName: exam.name,
        importedAt: exam.importedAt,
        averageScore: avg(rows.flatMap((row) => (row.totalScore === null ? [] : [row.totalScore]))),
        progressRate: rows.length ? Math.round((progressRows.length / rows.length) * 100) : 0,
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
    { key: 'star', label: '高分高活跃', count: quadrantCounts.star, tone: 'good' },
    { key: 'potential', label: '进步潜力', count: quadrantCounts.potential, tone: 'potential' },
    { key: 'quiet', label: '安静优秀', count: quadrantCounts.quiet, tone: 'watch' },
    { key: 'risk', label: '重点帮扶', count: quadrantCounts.risk, tone: 'risk' },
  ] as AcademicGrowthSummary['quadrants'];

  const progressRate = latestRows.length ? Math.round((progressCount / latestRows.length) * 100) : 0;
  const declineRate = latestRows.length ? Math.round((declineCount / latestRows.length) * 100) : 0;
  const growthIndex = Math.round(clamp(averageScore * 0.12 + coverageRate * 0.22 + progressRate * 0.42 - declineRate * 0.24, 0, 100));
  const topClass = classSummaries[0];
  const riskClass = [...classSummaries].sort((left, right) => right.declineCount - left.declineCount || left.growthIndex - right.growthIndex)[0];

  return {
    latestExam,
    previousExam,
    coverageRate,
    participantCount: latestRows.length,
    averageScore,
    progressCount,
    declineCount,
    riskCount: riskStudents.length,
    growthIndex,
    classSummaries,
    progressLeaders,
    riskStudents,
    quadrants,
    trend,
    insight: {
      headline: `${latestExam.name} 已覆盖 ${latestRows.length} 名学生，学业成长指数 ${growthIndex}。`,
      suggestion: riskClass
        ? `建议优先关注 ${riskClass.className} 的退步学生与行为参与情况，同时沉淀 ${topClass?.className ?? '标杆班级'} 的成长做法。`
        : '建议继续保持成绩导入节奏，并结合日常评价观察学业变化。',
      report: `本次考试均分 ${averageScore}，进步学生 ${progressCount} 人，退步预警 ${declineCount} 人，覆盖率 ${coverageRate}%。`,
    },
  };
}

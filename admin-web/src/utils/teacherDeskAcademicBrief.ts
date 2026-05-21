import type {
  AcademicDeskOverviewPayload,
  AcademicExamListItem,
  AcademicScoreListRow,
} from "../lib/api";
import type {
  AcademicClassSummary,
  AcademicGrowthSummary,
  AcademicStudentSignal,
} from "./academicGrowth";

export type TeacherDeskQuadrant = {
  key: "star" | "potential" | "quiet" | "risk";
  label: string;
  count: number;
};

/** 本班历次考试总分均分（时间正序），用于工作台趋势展示 */
export type TeacherClassExamTrendPoint = {
  examId: number;
  examName: string;
  importedAt: string;
  classAverageScore: number;
  participantCount: number;
};

/** 服务端整场年级对标（同学籍年级的全体参评加权均与本场班数口径） */
export type TeacherDeskGradeExamBenchmark = {
  gradeName: string;
  participantAverageScore: number;
  participantCount: number;
  distinctClassCount: number;
};

/** 将服务端 desk-overview 载荷映射为简报入参（缺字段或计数异常时跳过） */
export function mapDeskOverviewGradeBench(
  raw: AcademicDeskOverviewPayload["gradeExamBenchmark"],
): TeacherDeskGradeExamBenchmark | null {
  if (
    !raw?.gradeName?.trim() ||
    typeof raw.participantAverageScore !== "number" ||
    raw.participantAverageScore <= 0 ||
    raw.participantCount < 1 ||
    raw.distinctClassCount < 1
  )
    return null;
  return {
    gradeName: raw.gradeName.trim(),
    participantAverageScore: raw.participantAverageScore,
    participantCount: raw.participantCount,
    distinctClassCount: raw.distinctClassCount,
  };
}

export type TeacherDeskAcademicBrief = {
  headline: string;
  subline: string;
  suggestions: string[];
  quadrantsClass: TeacherDeskQuadrant[];
  /** 本班四象限学生明细（最近一次考试全科口径），供界面展开点名 */
  quadrantRoster: Record<TeacherDeskQuadrant["key"], AcademicStudentSignal[]>;
  /** 最近一次考试 id，成绩单深链可选用 */
  latestExamId: number | null;
  classTrend: TeacherClassExamTrendPoint[];
  /** 本班风险提示学生（最近一次考试全科口径） */
  riskForClass: AcademicStudentSignal[];
  /** 是否有可用于对比的上一次同年级的考试画像 */
  hasPreviousExamComparable: boolean;
  /**
   * 对标参照均分：
   * 优先为「本校同学籍年级在本场考试中全体参评学生的加权平均分」，
   * 服务端无数据时退化为他班班均的算术平均值。
   */
  peerAverageLatest: number | null;
  /** 参与均值对照的其它班级个数（年级整场口径时为 distinctClass−1） */
  peerCompareClassCount: number | null;
};

const QUADRANT_LABELS: Record<TeacherDeskQuadrant["key"], string> = {
  star: "高分高活跃",
  potential: "进步潜力",
  quiet: "安静优秀",
  risk: "重点帮扶",
};

function examTime(exam: AcademicExamListItem) {
  return new Date(exam.importedAt).getTime();
}

function avg(values: number[]) {
  if (!values.length) return 0;
  return Math.round((values.reduce((s, x) => s + x, 0) / values.length) * 10) / 10;
}

/**
 * 用总分表行构建单班历次考试均分序列（至多 maxPoints 场，按时间从早到晚）。
 */
export function buildClassTotalTrendFromRows(
  exams: AcademicExamListItem[],
  totalRows: AcademicScoreListRow[],
  classId: number,
  maxPoints = 6,
): TeacherClassExamTrendPoint[] {
  if (!exams.length) return [];
  const totals = totalRows.filter(
    (r) =>
      (!r.subjectCode || r.subjectCode === "total") &&
      r.classId === classId &&
      r.totalScore !== null,
  );
  const sortedDesc = [...exams].sort(
    (a, b) => examTime(b) - examTime(a),
  ).slice(0, maxPoints);
  const chronological = [...sortedDesc].reverse();
  return chronological.map((exam) => {
    const rows = totals.filter((r) => r.examId === exam.id);
    const scores = rows.flatMap((r) =>
      r.totalScore === null ? [] : [r.totalScore],
    );
    return {
      examId: exam.id,
      examName: exam.name,
      importedAt: exam.importedAt,
      classAverageScore: avg(scores),
      participantCount: rows.length,
    };
  });
}

function quadrantCountsForClass(
  signals: AcademicStudentSignal[],
  classId: number,
): Record<TeacherDeskQuadrant["key"], number> {
  const base: Record<TeacherDeskQuadrant["key"], number> = {
    star: 0,
    potential: 0,
    quiet: 0,
    risk: 0,
  };
  for (const row of signals) {
    if (row.classId !== classId) continue;
    base[row.quadrant] += 1;
  }
  return base;
}

function riskListForClass(
  signals: AcademicStudentSignal[],
  classId: number,
  limit = 12,
): AcademicStudentSignal[] {
  const pool = signals.filter((s) => s.classId === classId).filter((s) => {
    const likelyRisk = s.rankDelta < 0 || s.quadrant === "risk";
    return likelyRisk;
  });
  pool.sort((a, b) => {
    if (a.rankDelta !== b.rankDelta) return a.rankDelta - b.rankDelta;
    return a.totalScore - b.totalScore;
  });
  return pool.slice(0, limit);
}

function peerGradeAverageOthers(
  classSummaries: AcademicClassSummary[],
  deskClassRow: AcademicClassSummary | null,
): { average: number | null; peerClassCount: number } {
  /** 与同一场考试中其它班级对比；不按年级字面值再筛一层，避免因名册写法「初二/八年级」不一致丢掉参照班 */
  if (!deskClassRow) return { average: null, peerClassCount: 0 };
  const peers = classSummaries.filter((c) => c.classId !== deskClassRow.classId);
  if (!peers.length) return { average: null, peerClassCount: 0 };
  return {
    average: avg(peers.flatMap((c) => [c.averageScore])),
    peerClassCount: peers.length,
  };
}

/** 为本班最近一次考试拼装四象限名单（便于教师点名） */
function rosterByQuadrantForClass(
  signals: AcademicStudentSignal[],
  classId: number,
): Record<TeacherDeskQuadrant["key"], AcademicStudentSignal[]> {
  const keys: TeacherDeskQuadrant["key"][] = [
    "star",
    "potential",
    "quiet",
    "risk",
  ];
  const out: Record<TeacherDeskQuadrant["key"], AcademicStudentSignal[]> = {
    star: [],
    potential: [],
    quiet: [],
    risk: [],
  };
  for (const row of signals) {
    if (row.classId !== classId) continue;
    out[row.quadrant].push(row);
  }
  for (const key of keys) {
    out[key].sort((a, b) =>
      (a.studentName || "").localeCompare(b.studentName || "", "zh-Hans-CN"),
    );
  }
  return out;
}

function emptyQuadrantRoster(): Record<
  TeacherDeskQuadrant["key"],
  AcademicStudentSignal[]
> {
  return { star: [], potential: [], quiet: [], risk: [] };
}

/**
 * 教师工作台视角：对本班最近一次考试做一次可读摘要与可操作建议。
 */
export function buildTeacherDeskAcademicBrief(
  growth: AcademicGrowthSummary,
  deskClassId: number | null,
  opts?: {
    totalScoreRows?: AcademicScoreListRow[];
    examsOrdered?: AcademicExamListItem[];
    /** 来自 `/academic-records/desk-overview` 的学校本场年级整场统计（优先用作对标） */
    gradeExamBenchmark?: TeacherDeskGradeExamBenchmark | null;
  },
): TeacherDeskAcademicBrief {
  const empty: TeacherDeskAcademicBrief = {
    headline: "尚未形成本班可用的学业快照。",
    subline:
      "请先在「成绩单」中为当前班级归档至少一场全科汇总；同年级多场考试可自动生成进退步与同级参照。",
    suggestions: [
      "核对本班最近一次大型测验是否已在成绩单模块入库。",
      "同一学年保留两场及以上同年级全科汇总，更有利于观察进退节奏。",
      "学情尚不明朗时，可先用班级过程性评价补齐关注点。",
    ],
    quadrantsClass: [],
    quadrantRoster: emptyQuadrantRoster(),
    latestExamId: null,
    classTrend: [],
    riskForClass: [],
    hasPreviousExamComparable: false,
    peerAverageLatest: null,
    peerCompareClassCount: null,
  };

  const examName = growth.latestExam?.name;
  const classRow =
    deskClassId === null
      ? null
      : growth.classSummaries.find((c) => c.classId === deskClassId) ?? null;

  if (!examName || !growth.latestExam || !deskClassId || !classRow) {
    return empty;
  }

  const qc = quadrantCountsForClass(growth.studentSignals, deskClassId);
  const quadrantsClass = (
    ["star", "potential", "quiet", "risk"] as const
  ).map((key) => ({
    key,
    label: QUADRANT_LABELS[key],
    count: qc[key],
  }));

  const trend =
    opts?.totalScoreRows && opts?.examsOrdered?.length
      ? buildClassTotalTrendFromRows(
          opts.examsOrdered,
          opts.totalScoreRows,
          deskClassId,
          6,
        )
      : [];

  const riskForClass = riskListForClass(
    growth.studentSignals,
    deskClassId,
    14,
  );

  const quadrantRoster = rosterByQuadrantForClass(
    growth.studentSignals,
    deskClassId,
  );

  const peerMeta = peerGradeAverageOthers(growth.classSummaries, classRow);

  const gradeBenchPayload = opts?.gradeExamBenchmark;
  const gradeBench =
    gradeBenchPayload &&
    gradeBenchPayload.participantCount > 0 &&
    gradeBenchPayload.participantAverageScore > 0 &&
    gradeBenchPayload.distinctClassCount > 0
      ? gradeBenchPayload
      : null;

  const peerAverageLatest = gradeBench
    ? gradeBench.participantAverageScore
    : peerMeta.average;
  const peerCompareClassCount =
    gradeBench && gradeBench.distinctClassCount > 0
      ? Math.max(gradeBench.distinctClassCount - 1, 0)
      : peerMeta.peerClassCount > 0
        ? peerMeta.peerClassCount
        : null;

  /** 最近一次考试是否与上一份同年级全科考试配对成功（growth 内置逻辑） */
  const hasPreviousExamComparable = Boolean(growth.previousExam);

  const classAvgRounded = Math.round(classRow.averageScore * 10) / 10;
  let subParts: string[] = [];
  subParts.push(
    `本场进步约 ${classRow.progressCount} 人次、退步约 ${classRow.declineCount} 人次。`,
  );
  if (typeof peerAverageLatest === "number" && peerAverageLatest > 0) {
    const peerRounded = Math.round(peerAverageLatest * 10) / 10;
    const diff = Math.round((classAvgRounded - peerRounded) * 10) / 10;
    const cmp = diff >= 0 ? "高约" : "低约";
    if (gradeBench) {
      subParts.push(
        `本场考试本校学籍年级「${gradeBench.gradeName}」在本次成绩档案中共 ${gradeBench.distinctClassCount} 个班录入全科总分、${gradeBench.participantCount} 名学生参评（年级平均分由这些学生加权得出）；年级平均分约 ${peerRounded}；本班班均 ${classAvgRounded}，相较${cmp} ${Math.abs(diff)}。`,
      );
    } else if (typeof peerMeta.average === "number" && peerMeta.average > 0) {
      const seenClasses = growth.classSummaries.length;
      subParts.push(
        `年级整场统计暂未返回，暂时用页面快照中出现的 ${seenClasses} 个班作近似对照：除本班外 ${peerMeta.peerClassCount} 个班班均总分的算术平均约 ${peerRounded}；本班班均 ${classAvgRounded}，相较${cmp} ${Math.abs(diff)}。`,
      );
    }
  }
  if (!hasPreviousExamComparable) {
    subParts.push("暂未匹配到上一份可对比的同年级全科考试，仅能看本场截面。");
  }
  const subline = subParts.join(" ");

  const suggestions: string[] = [];
  if (growth.coverageRate < 75 && growth.coverageRate > 0) {
    suggestions.push(
      `参评覆盖率约 ${growth.coverageRate}%：补齐缺考、未录分或名单不匹配的学生，以免结论偏陡。`,
    );
  }
  if (classRow.declineCount >= Math.max(3, Math.ceil(classRow.participantCount * 0.2))) {
    suggestions.push(
      "退步面偏大：分批约谈「重点帮扶」「退步关注」名单，结合课堂与错题做归因记录。",
    );
  }
  if (qc.risk >= 2) {
    suggestions.push(
      `「重点帮扶」象限 ${qc.risk} 人：优先安排任课与班主任联合跟进（课堂表现 + 成绩双线）。`,
    );
  }
  if (qc.quiet >= qc.star && qc.quiet >= 3) {
    suggestions.push(
      "「安静优秀」人数偏多：可增加课堂表达类正向评价，防学业好但参与度低。",
    );
  }
  if (qc.potential >= 3 && classRow.declineCount < classRow.progressCount) {
    suggestions.push(
      "「进步潜力」学生不占少数：配对短期目标与小步子激励，稳住行为侧投入。",
    );
  }
  if (riskForClass.length) {
    suggestions.push(
      `优先跟进名单中前 ${Math.min(5, riskForClass.length)} 名学生，逐一打开成绩单比对历次轨迹。`,
    );
  }
  if (hasPreviousExamComparable && trend.length >= 2) {
    suggestions.push(
      "对比下方趋势：留意连续下降的场次是否与教学节奏或评价体系调整重叠。",
    );
  }

  const fallbackPool = [
    "每学期尽量归档两轮全科成绩单，更有利于观察进退节奏。",
    "将学业关注与兑换/评价激励机制挂钩，帮助学生建立可见的进步路径。",
    "对尖子生适当增加拓展任务，分层作业避免「安静优秀」长期低挑战。",
  ];
  for (const fb of fallbackPool) {
    if (suggestions.length >= 5) break;
    if (!suggestions.includes(fb)) suggestions.push(fb);
  }

  suggestions.splice(5);

  const headline = `「${examName}」本班参评 ${classRow.participantCount} 人，班均总分约 ${classAvgRounded}。`;

  return {
    headline,
    subline,
    suggestions,
    quadrantsClass,
    quadrantRoster,
    latestExamId: growth.latestExam?.id ?? null,
    classTrend: trend,
    riskForClass,
    hasPreviousExamComparable,
    peerAverageLatest:
      typeof peerAverageLatest === "number" && peerAverageLatest > 0
        ? peerAverageLatest
        : null,
    peerCompareClassCount,
  };
}

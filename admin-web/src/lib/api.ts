const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ??
  (typeof window !== 'undefined' ? `${window.location.origin}/api/v1` : 'http://127.0.0.1:3000/api/v1');

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  token?: string | null;
  body?: unknown;
  headers?: Record<string, string>;
};

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function request<T>(path: string, options: RequestOptions = {}) {
  let response: Response;

  try {
    const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
    response = await fetch(`${API_BASE_URL}${path}`, {
      method: options.method ?? 'GET',
      headers: {
        ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
        ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
        ...(options.headers ?? {}),
      },
      body: options.body ? (isFormData ? (options.body as FormData) : JSON.stringify(options.body)) : undefined,
    });
  } catch (error) {
    const message =
      error instanceof Error && error.message
        ? `网络请求失败：${error.message}`
        : '网络请求失败，请检查连接后重试';
    throw new Error(message);
  }

  if (!response.ok) {
    let message = `接口请求失败: ${response.status}`;

    try {
      const errorBody = (await response.json()) as { message?: string | string[] };
      if (Array.isArray(errorBody.message)) {
        message = errorBody.message.join('，');
      } else if (errorBody.message) {
        message = errorBody.message;
      }
    } catch {
      // ignore invalid error body
    }

    throw new ApiError(message, response.status);
  }

  return (await response.json()) as T;
}

export type LoginResponse = {
  code: number;
  message: string;
  data: {
    token: string;
    user: {
      id: number;
      name: string;
      roleCode: string;
      roleName?: string;
      dutyTags?: string[];
      passwordChangeRequired?: boolean;
    };
  };
};

export type ApiListResponse<T> = {
  code: number;
  message: string;
  data: T[];
};

export type ApiObjectResponse<T> = {
  code: number;
  message: string;
  data: T;
};

export type SessionUser = {
  id: number;
  schoolId?: number;
  username?: string;
  name: string;
  roleCode: string;
  roleName?: string;
  dutyTags?: string[];
  passwordChangeRequired?: boolean;
  classAssignments?: SessionClassAssignment[];
};

export type SessionScope = {
  scopeType: string;
  classId: number | null;
  gradeCode: string | null;
  subjectCode: string | null;
};

export type SessionClassAssignment = {
  classId: number;
  roleInClass: string;
  subjectCode: string | null;
  isPrimary: boolean;
};

export type SessionMeResponse = {
  code: number;
  message: string;
  data: {
    user: SessionUser;
    scopes: SessionScope[];
    classAssignments: SessionClassAssignment[];
  };
};

export type HomeroomTeacher = {
  id: number;
  name: string;
  username: string;
};

export type AdminClass = {
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
  countdownDeadlineAt: string | null;
  sortOrder?: number | null;
  displayStatus: string;
  onlineStatus?: 'online' | 'offline';
  studentCount: number;
  currentScoreTotal: number;
  totalScoreTotal: number;
  classScore: number;
  classTotalScore: number;
  homeroomTeacher: HomeroomTeacher | null;
};

export type DisplayTerminal = {
  id: number;
  terminalCode: string;
  terminalName: string;
  classId: number | null;
  classInfo: {
    id: number;
    gradeName: string;
    className: string;
    displayStatus: string;
  } | null;
  onlineStatus: 'online' | 'offline';
  initializedAt: string | null;
  lastBoundAt: string | null;
  lastOnlineAt: string | null;
};

export type AdminStudent = {
  id: number;
  schoolId: number;
  classId: number;
  studentNo: string;
  name: string;
  gender: string | null;
  avatarUrl: string | null;
  status?: 'enabled' | 'disabled';
  className: string;
  currentScore: number;
  totalScore: number;
  currentPetLevel: number;
  latestAcademic: {
    examId: number;
    examName: string;
    examDate: string;
    periodLabel: string | null;
    importedAt: string;
    totalScore: number | null;
    schoolRank: number | null;
    schoolRankDelta: number | null;
    classRank: number | null;
    classRankDelta: number | null;
  } | null;
  pet?: {
    id: number;
    studentPetId?: number;
    name: string;
    nickname?: string | null;
    lastRenameAt?: string | null;
    coverUrl: string | null;
    currentLevel: number;
    totalScore: number;
  } | null;
};

export type StudentDetail = {
  id: number;
  schoolId: number;
  classId: number;
  className: string;
  studentNo: string;
  name: string;
  gender: string | null;
  avatarUrl: string | null;
  status?: 'enabled' | 'disabled';
  profile: {
    currentScore: number;
    totalScore: number;
    currentPetLevel: number;
    rewardsCount: number;
    honorsCount: number;
    positiveCount7d: number;
    negativeCount7d: number;
  } | null;
  group: {
    id: number;
    name: string;
    groupNo: number;
  } | null;
  pet: {
    id: number;
    petId: number;
    name: string;
    coverUrl: string | null;
    currentLevel: number;
    currentStageNo: number;
    totalScore: number;
    stages: Array<{
      id: number;
      stageNo: number;
      levelNo: number;
      name: string;
      imageUrl: string;
      needScoreTotal: number;
    }>;
  } | null;
  teacherObservations: Array<{
    id: number;
    teacherId: number;
    observationType: string | null;
    content: string;
    createdAt: string;
  }>;
};

export type AiStudentSummary = {
  id: number;
  studentId: number;
  classId: number;
  periodType: 'weekly' | 'monthly';
  snapshotDate: string;
  generatedAt: string | null;
  hasNewerBehaviorRecord: boolean;
  latestBehaviorRecordAt: string | null;
  positiveSummary: {
    count: number;
    scoreDelta: number;
  } | null;
  negativeSummary: {
    count: number;
    scoreDelta: number;
  } | null;
  dimensionSummary: Array<{
    dimension: string;
    count: number;
    positiveCount?: number;
    negativeCount?: number;
  }> | null;
  trendSummary: {
    totalScoreDelta: number;
    totalExpDelta: number;
    positiveRatio: number;
    recentTrend?: 'up' | 'down' | 'flat';
    activeDays?: number;
    subjectSummary?: Array<{
      subject: string;
      count: number;
      positiveCount: number;
      negativeCount: number;
    }>;
    sceneSummary?: Array<{
      scene: string;
      count: number;
      positiveCount: number;
      negativeCount: number;
    }>;
    evidence?: Array<{
      date: string;
      subject: string;
      scene: string;
      ruleName: string;
      sentiment: 'positive' | 'negative';
      scoreDelta: number;
      remark: string | null;
      signal: string;
    }>;
  } | null;
  aiSummary: string | null;
  aiSuggestion: string | null;
};

export type TeacherObservationCreatePayload = {
  studentId: number;
  classId: number;
  observationType?: string;
  content: string;
};

export type TeacherObservationAiPolishPayload = {
  studentName?: string;
  className?: string;
  observationType?: string;
  content: string;
};

export type AcademicScoreImportPayload = {
  examName: string;
  examDate?: string;
  periodLabel?: string;
  semesterId?: number;
  gradeName?: string;
  sourceFile?: string;
  students: Array<{
    studentNo: string;
    name: string;
    className: string;
    subjects: Array<{
      subjectName: string;
      score: number | null;
      jointRank: number | null;
      schoolRank: number | null;
      schoolRankDelta: number | null;
      classRank: number | null;
      classRankDelta: number | null;
    }>;
  }>;
};

export type AcademicScoreImportResult = {
  examId: number;
  importedStudentCount: number;
  importedRecordCount: number;
  createdClassCount: number;
  createdStudentCount: number;
  unmatchedCount: number;
  unmatched: Array<{
    row: number;
    studentNo: string;
    name: string;
    className: string;
    reason: string;
  }>;
};

export type AcademicExamUpdatePayload = {
  examName: string;
  examDate: string;
  periodLabel?: string | null;
};

export type AcademicExamListItem = {
  id: number;
  semesterId: number;
  name: string;
  gradeName: string | null;
  sourceFile: string | null;
  examDate: string;
  periodLabel: string | null;
  importedAt: string;
  recordCount: number;
};

export type AcademicScoreListRow = {
  id: number;
  examId: number;
  examName: string;
  examGradeName: string | null;
  sourceFile: string | null;
  examDate: string;
  periodLabel: string | null;
  importedAt: string;
  classId: number;
  className: string;
  studentId: number;
  studentNo: string;
  studentName: string;
  subjectCode?: string;
  subjectName?: string;
  totalScore: number | null;
  schoolRank: number | null;
  schoolRankDelta: number | null;
  classRank: number | null;
  classRankDelta: number | null;
};

export type AcademicDeskExamTrend = {
  examId: number;
  examName: string;
  examDate: string;
  periodLabel: string | null;
  importedAt: string;
  classAverageScore: number;
  participantCount: number;
};

export type AcademicDeskSubjectSample = {
  studentId: number;
  studentName: string;
  score: number;
  classRank: number | null;
  classRankDelta: number | null;
};

export type AcademicDeskOverviewPayload = {
  examTrends: AcademicDeskExamTrend[];
  subjectFocus: {
    examId: number;
    examName: string;
    subjectCode: string;
    subjectName: string | null;
    averageScore: number;
    participantCount: number;
    sampleLow: AcademicDeskSubjectSample[];
    sampleHigh: AcademicDeskSubjectSample[];
  } | null;
  /** 本场考试本校同学籍年级的全体参评加权均（服务端聚合，不因列表分页/裁剪改变） */
  gradeExamBenchmark: {
    examId: number;
    gradeName: string;
    participantAverageScore: number;
    participantCount: number;
    distinctClassCount: number;
  } | null;
};

export type SchoolAcademicGrowthPayload = {
  latestExam: AcademicExamListItem | null;
  previousExam: AcademicExamListItem | null;
  coverageRate: number;
  participantCount: number;
  averageScore: number;
  progressCount: number;
  declineCount: number;
  riskCount: number;
  growthIndex: number;
  classSummaries: Array<{
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
  }>;
  studentSignals: Array<{
    studentId: number;
    studentName: string;
    classId: number;
    className: string;
    totalScore: number;
    scoreDelta: number;
    rankDelta: number;
    quadrant: 'star' | 'potential' | 'quiet' | 'risk';
    reason: string;
  }>;
  progressLeaders: Array<{
    studentId: number;
    studentName: string;
    classId: number;
    className: string;
    totalScore: number;
    scoreDelta: number;
    rankDelta: number;
    quadrant: 'star' | 'potential' | 'quiet' | 'risk';
    reason: string;
  }>;
  riskStudents: Array<{
    studentId: number;
    studentName: string;
    classId: number;
    className: string;
    totalScore: number;
    scoreDelta: number;
    rankDelta: number;
    quadrant: 'star' | 'potential' | 'quiet' | 'risk';
    reason: string;
  }>;
  quadrants: Array<{
    key: string;
    label: string;
    count: number;
    tone: 'good' | 'potential' | 'watch' | 'risk';
  }>;
  trend: Array<{
    examId: number;
    examName: string;
    examDate: string;
    periodLabel: string | null;
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
  gradeGrowthGroups?: Array<{
    gradeName: string;
    latestExam: AcademicExamListItem | null;
    previousExam: AcademicExamListItem | null;
    coverageRate: number;
    participantCount: number;
    averageScore: number;
    progressCount: number;
    declineCount: number;
    riskCount: number;
    growthIndex: number;
    classSummaries: SchoolAcademicGrowthPayload['classSummaries'];
    studentSignals: SchoolAcademicGrowthPayload['studentSignals'];
    progressLeaders: SchoolAcademicGrowthPayload['progressLeaders'];
    riskStudents: SchoolAcademicGrowthPayload['riskStudents'];
    quadrants: SchoolAcademicGrowthPayload['quadrants'];
    trend: SchoolAcademicGrowthPayload['trend'];
    insight: SchoolAcademicGrowthPayload['insight'];
  }>;
};

export type StudentAcademicExam = {
  examId: number;
  examName: string;
  gradeName: string | null;
  sourceFile: string | null;
  examDate: string;
  periodLabel: string | null;
  importedAt: string;
  subjects: Array<{
    subjectCode: string;
    subjectName: string;
    score: number | null;
    jointRank: number | null;
    schoolRank: number | null;
    schoolRankDelta: number | null;
    classRank: number | null;
    classRankDelta: number | null;
  }>;
};

export type ClassGroupSummary = {
  id: number;
  classId: number;
  groupNo: number;
  name: string;
  studentCount: number;
  groupScore?: number;
  groupTotalScore?: number;
  groupLastScoreAt?: string | null;
  currentScoreTotal: number;
  students: Array<{
    id: number;
    name: string;
    studentNo: string;
    currentScore: number;
  }>;
};

export type GroupScoreRankingRow = {
  rank: number;
  id: number;
  classId: number;
  groupNo: number;
  name: string;
  groupScore: number;
  groupTotalScore: number;
  groupLastScoreAt: string | null;
};

export type GroupScoreRecordRow = {
  id: number;
  classId: number;
  classGroupId: number;
  groupNo: number;
  groupName: string;
  scoreDelta: number;
  remark: string | null;
  operatorName: string | null;
  occurredAt: string | null;
  createdAt: string;
};

export type ScoreRule = {
  id: number;
  schoolId: number;
  semesterId: number;
  moduleType: 'general' | 'subject';
  subjectCode: string | null;
  sceneCode: string;
  code: string;
  name: string;
  scoreType: 'add' | 'deduct';
  scoreTarget: 'student' | 'class';
  scoreValue: number;
  dimension: string | null;
  tag: string | null;
  sentiment: 'positive' | 'negative';
  aiSummaryText: string | null;
  description: string | null;
  allowedRoleCodes: string[];
  isHighFrequency: boolean;
  highFrequencyRank?: number;
  displayEnabled: boolean;
  adminEnabled: boolean;
};

export type ScoreRuleTreeScene = {
  sceneCode: string;
  sceneLabel: string;
  count: number;
  rules: ScoreRule[];
};

export type ScoreRuleTreeSubject = {
  subjectCode: string | null;
  subjectLabel: string;
  count: number;
  scenes: ScoreRuleTreeScene[];
};

export type ScoreRuleTreeModule = {
  moduleType: 'general' | 'subject';
  moduleLabel: string;
  count: number;
  subjects: ScoreRuleTreeSubject[];
};

export type Reward = {
  id: number;
  schoolId: number;
  classId: number | null;
  scopeType: 'global' | 'class';
  code: string;
  name: string;
  category: string;
  imageUrl: string | null;
  scoreCost: number;
  stockQty: number | null;
  isInfiniteStock: boolean;
  status: string;
  rewardOrderCount: number;
  createdBy: number | null;
  createdByName: string | null;
  sourceLabel: string;
};

export type RewardOrder = {
  id: number;
  schoolId: number;
  classId: number;
  studentId: number;
  rewardId: number;
  scoreCost: number;
  status: string;
  sourceTerminal: string;
  operatorId: number;
  operatorRole: string;
  createdAt: string;
  reward: Reward;
  student: {
    id: number;
    classId: number;
    name: string;
    studentNo: string;
  };
};

export type ScoreRecord = {
  id: number;
  schoolId: number;
  semesterId: number | null;
  classId: number;
  studentId: number;
  studentName?: string | null;
  className?: string | null;
  classGroupId: number | null;
  ruleId: number | null;
  subjectCode: string | null;
  sceneCode: string | null;
  dimension: string | null;
  tag: string | null;
  sentiment: 'positive' | 'negative';
  scoreDelta: number;
  remark: string | null;
  sourceTerminal: string;
  sourceRole: string;
  operatorId: number | null;
  operatorName: string | null;
  ruleName: string | null;
  reversedAt: string | null;
  reversedById: number | null;
  reversedByName: string | null;
  reverseRemark: string | null;
  createdAt: string;
};

export type ScoreRecordCreateResult = {
  scoreRecordId: number;
  scoreDelta: number;
  studentProfile: {
    studentId: number;
    currentScore: number;
    currentPetLevel: number;
  };
  petUpgrade: {
    upgraded: boolean;
    beforeLevel?: number;
    afterLevel?: number;
  };
};

export type ScoreRecordBatchResult = {
  batchId: number;
  items: ScoreRecordCreateResult[];
};

export type ScoreRecordReverseResult = {
  scoreRecordId: number;
  classId: number;
  studentId: number;
  scoreDelta: number;
  rollbackDelta: number;
  reversedAt: string;
  reverseRemark: string;
  studentProfile: {
    studentId: number;
    currentScore: number;
    currentPetLevel: number;
  };
  ruleName: string | null;
};

export type ClassScoreRecord = {
  id: number;
  schoolId: number;
  semesterId: number;
  classId: number;
  batchId: number | null;
  ruleId: number;
  ruleName: string;
  className: string;
  gradeCode: string;
  gradeName: string;
  subjectCode: string | null;
  sceneCode: string | null;
  dimension: string | null;
  tag: string | null;
  sentiment: 'positive' | 'negative';
  scoreDelta: number;
  remark: string | null;
  sourceTerminal: string;
  sourceRole: string | null;
  operatorId: number;
  operatorName: string | null;
  reversedAt: string | null;
  reversedById: number | null;
  reversedByName: string | null;
  reverseRemark: string | null;
  createdAt: string;
};

export type ClassScoreRankingRow = {
  rank: number;
  classId: number;
  className: string;
  gradeCode: string;
  gradeName: string;
  currentScore: number;
  totalScore: number;
  lastScoreAt: string | null;
};

export type ClassScoreRecordReverseResult = {
  classScoreRecordId: number;
  classId: number;
  gradeCode: string;
  gradeName: string;
  className: string;
  ruleName: string;
  scoreDelta: number;
  rollbackDelta: number;
  reversedAt: string;
  reverseRemark: string;
  classScoreProfile: {
    classId: number;
    currentScore: number;
    totalScore: number;
  };
};

export type RoleTemplate = {
  id?: number;
  code: string;
  name: string;
  summary: string;
  permissions: string[];
};

export type GradeConfig = {
  id: number;
  code: string;
  name: string;
  sortOrder: number | null;
  status: string;
};

export type SystemSettings = {
  school: {
    id: number;
    code: string;
    name: string;
    englishName: string | null;
    motto: string | null;
    phone: string | null;
    address: string | null;
    classScoreStudentLinkMultiplier: number;
    petDecoChangeCost: number;
    petGrowth: {
      thresholds: number[];
    };
  };
  semester: {
    id: number;
    name: string;
    startDate: string;
    endDate: string;
    isCurrent: boolean;
    status: string;
  } | null;
  display: {
    id: number | null;
    title: string;
    subtitle: string;
    bgImageUrl: string | null;
    weatherLabel: string;
    weatherLatitude: number;
    weatherLongitude: number;
    animationSpeed: string;
    allowSkipAnimation: boolean;
    defaultMode: string;
    terminalCount: number;
  };
  gradeConfigs: GradeConfig[];
  roleTemplates: RoleTemplate[];
};

export type DisplaySettingsPayload = {
  id: number | null;
  title: string;
  subtitle: string;
  bgImageUrl: string | null;
  weatherLabel: string;
  weatherLatitude: number;
  weatherLongitude: number;
  animationSpeed: string;
  allowSkipAnimation: boolean;
  defaultMode: string;
  currentSemester: {
    id: number;
    name: string;
  } | null;
};

export type DisplayWeatherPayload = {
  label: string;
  title: string;
  icon: string;
  temperatureC: number | null;
  temperatureText: string;
  conditionText: string;
  provider: string;
  observedAt: string | null;
  isStale: boolean;
};

export type PermissionUser = {
  id: number;
  name: string;
  username: string;
  phone: string | null;
  dutyTags: string[];
  roleCode: string;
  roleName: string;
  status: string;
  lastLoginAt?: string | null;
  classIds: number[];
  subjectScopes: Array<{
    classId: number;
    className: string | null;
    gradeName: string | null;
    subjectCode: string;
    subjectLabel: string;
  }>;
  scopeDisplay: string;
  permissionSummary: string;
  permissions: string[];
};

export type TeacherLiveStatusRow = {
  teacherId: number;
  teacherName: string;
  roleCode: string;
  roleName: string;
  status: 'busy' | 'free';
  busyType: 'class' | 'research' | null;
  currentClassName: string | null;
  currentSubject: string | null;
  currentPeriodNo: number | null;
  startTime: string | null;
  endTime: string | null;
};

export type TeacherOccupancyRule = {
  id: number;
  name: string;
  weekdays: number[];
  subjectCodes: string[];
  startTime: string;
  endTime: string;
  status: 'enabled' | 'disabled';
  remark: string | null;
};

export type TeacherScheduleImportResult = {
  sourceFile: string;
  teacherSheetCount: number;
  parsedSlotCount: number;
  importedSlotCount: number;
  matchedTeacherCount: number;
  needConfirmCreateTeachers?: boolean;
  missingTeachers?: Array<{
    teacherName: string;
    defaultUsername: string;
    defaultPassword: string;
    defaultRoleCode: 'subject_teacher' | 'homeroom_teacher';
  }>;
  missingClasses?: string[];
  createdTeacherCount?: number;
  createdClassCount?: number;
  pendingSlotCount?: number;
};

export type TeacherScheduleSlotRow = {
  id: number;
  teacherId: number | null;
  teacherName: string;
  roleCode: string;
  roleName: string;
  weekday: number;
  periodNo: number;
  startTime: string;
  endTime: string;
  subject: string;
  className: string | null;
  isPending: boolean;
};

export type AnalyticsData = {
  totalScore: number;
  positiveRuleCount: number;
  negativeRuleCount?: number;
  /** 全校（或权限范围内）评价记录总数，不受列表接口 100 条上限影响 */
  totalScoreRecordCount?: number;
  /** 今日评价记录数 */
  todayScoreRecordCount?: number;
  /** 今日正向评价数（不受列表接口 100 条上限影响） */
  todayPositiveCount?: number;
  /** 今日负向评价数（不受列表接口 100 条上限影响） */
  todayNegativeCount?: number;
  /** 近 24 小时评价记录数 */
  recent24hScoreRecordCount?: number;
  /** 近 7 日积分脉冲趋势（不受列表接口 100 条上限影响） */
  dailyTrend?: Array<{
    date: string;
    total: number;
    score: number;
    positive: number;
    negative: number;
  }>;
  averageScore: number;
  activeDays: number;
  gradeTrend: Array<{ name: string; value: number }>;
  ruleDistribution: Array<{ name: string; value: number }>;
  subjectDistribution: Array<{ name: string; value: number }>;
  topClasses: Array<{ id: number; name: string; currentScoreTotal: number; classScore: number }>;
  topStudents: Array<{
    studentId: number;
    studentName: string;
    classId: number;
    className: string;
    currentScore: number;
  }>;
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
  riskStudentStats: {
    high: number;
    medium: number;
    low: number;
    total: number;
  };
  aiInsight?: {
    summary: string;
    suggestion: string;
    reportSummary: string;
    source: 'ark' | 'fallback';
    generatedAt: string | null;
    reportDate: string | null;
    classId: number | null;
    className: string | null;
    isCached: boolean;
  };
  heatMap?: {
    rows: string[];
    cols: string[];
    data: Array<{ row: string; values: number[] }>;
  };
  scoreDetailSummary?: Array<{
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
      createdAt: string;
    }>;
  }>;
};

export type AnalyticsQuery = {
  gradeName?: string;
  classId?: number;
  /** 任课教师单科维度：仅统计该学科相关积分记录 */
  subjectCode?: string;
  regenerateAi?: boolean;
  startDate?: string;
  endDate?: string;
  skipDetailSummary?: boolean;
};

export type AnalyticsReportStatus = {
  hasTodayReport: boolean;
  classId: number | null;
  className: string | null;
  reportDate: string;
  generatedAt: string | null;
  source: 'ark' | 'fallback' | null;
};

export type TeacherWorkbenchContext = {
  contextHeader: {
    classId: number;
    className: string;
    gradeName: string;
    subjectCode: string;
    subjectLabel: string;
    studentCount: number;
    recentEvaluationCount: number;
    latestAcademicImportedAt: string | null;
    latestAcademicExamName: string | null;
  };
  aiBrief: {
    headline: string;
    evidence: string[];
    actionItems: string[];
    homeroomSyncDraft: string;
  };
  attentionStudents: Array<{
    studentId: number;
    studentName: string;
    priority: 'high' | 'medium' | 'low';
    reasonTags: string[];
    evidence: string;
    recommendedAction: string;
    currentScore: number;
    currentPetLevel: number;
  }>;
  quickActions: Array<{
    key: string;
    label: string;
    targetPath?: string;
    actionType?: 'copy';
    copyText?: string;
    query?: Record<string, string | number>;
  }>;
  academicBaseline: AcademicDeskOverviewPayload;
  recentRecords: Array<{
    id: number;
    studentId: number;
    studentName: string;
    scoreDelta: number;
    subjectCode: string | null;
    dimension: string | null;
    tag: string | null;
    ruleName: string | null;
    remark: string | null;
    createdAt: string;
    operatorName: string | null;
    sentiment: 'positive' | 'negative';
  }>;
  followUpDrafts: {
    homeroomSyncDraft: string;
    homeroomSyncShortDraft: string;
    homeroomSyncForwardDraft: string;
    lessonSummaryDraft: string;
    nextLessonDraft: string;
  };
};

export type RealtimeMonitorStats = {
  todayScoreRecordCount: number;
  todayPositiveCount: number;
  todayNegativeCount: number;
  todayActiveClassCount: number;
  recent24hScoreRecordCount: number;
};

export type ProjectionSnapshotPayload = {
  classes: AdminClass[];
  students: AdminStudent[];
  rules: ScoreRule[];
  honors: Honor[];
  rewards: Reward[];
  analytics: AnalyticsData | null;
  scoreRecords: ScoreRecord[];
  honorRecords: HonorRecord[];
  academicGrowth: Record<string, unknown> | null;
  displayTerminals: DisplayTerminal[];
  weatherInfo: DisplayWeatherPayload | null;
  weatherLabel: string;
  semesterName: string | null;
};

export type TeacherReviewContext = {
  contextHeader: {
    classId: number;
    className: string;
    gradeName: string;
    subjectCode: string;
    studentCount: number;
    dateRangeLabel: string;
  };
  summaryKpis: {
    totalEvents: number;
    positiveCount: number;
    negativeCount: number;
    activeDays: number;
    coveredStudents: number;
    riskStudentCount: number;
  };
  trendSlices: {
    dailyTrend: Array<{
      date: string;
      positive: number;
      negative: number;
      total: number;
    }>;
    dimensionDistribution: Array<{ name: string; value: number }>;
    sceneDistribution: Array<{ name: string; value: number }>;
    heatMap: {
      rows: string[];
      cols: string[];
      data: Array<{ row: string; values: number[] }>;
    };
  };
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
  aiRetrospective: {
    conclusion: string;
    basis: string[];
    problemAnalysis: string;
    nextSteps: string[];
    generatedAt: string | null;
    reportDate: string | null;
    isCached: boolean;
  };
  recommendedAdjustments: string[];
  scoreDetailSummary: Array<{
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
      createdAt: string;
    }>;
  }>;
};

export type PetCatalogItem = {
  id: number;
  schoolId: number;
  code: string;
  name: string;
  category: string | null;
  rarity: string | null;
  sourceType: 'system' | 'custom';
  coverUrl: string | null;
  description: string | null;
  status: string;
  bindCount: number;
  maxLevel: number;
  stages: Array<{
    stageNo: number;
    levelNo: number;
    name: string;
    imageUrl: string;
    needScoreTotal: number;
    animationKey: string | null;
  }>;
};

export type Honor = {
  id: number;
  schoolId: number;
  code: string;
  name: string;
  category: 'personal' | 'collective' | 'phase' | 'longterm';
  iconUrl: string | null;
  description: string | null;
  conditionType: string | null;
  conditionConfig: Record<string, unknown> | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  grantedCount: number;
  lastGrantedAt: string | null;
};

export type HonorRecord = {
  id: number;
  honorId: number;
  honorName: string;
  honorIconUrl?: string | null;
  targetType: 'student' | 'class';
  targetId: number;
  schoolId: number;
  classId: number;
  className: string;
  studentId: number | null;
  studentName: string | null;
  grantedBy: number | null;
  grantedByName: string | null;
  grantedAt: string;
  remark: string | null;
  createdAt: string;
};

export type ClassUpsertPayload = {
  semesterId: number;
  code: string;
  gradeCode: string;
  gradeName: string;
  name: string;
  homeroomTeacherId?: number | null;
  slogan?: string | null;
  targetScore?: number | null;
  countdownTitle?: string | null;
  countdownDeadlineAt?: string | null;
  displayStatus?: string;
  sortOrder?: number | null;
};

export type StudentImportPayload = {
  classId: number;
  students: Array<{
    studentNo: string;
    name: string;
    className?: string;
    gradeName?: string;
    gender?: string;
    avatarUrl?: string;
  }>;
};

export type StudentUpdatePayload = {
  classId: number;
  studentNo: string;
  name: string;
  gender?: string | null;
  avatarUrl?: string | null;
  status?: 'enabled' | 'disabled';
};

export type ScoreRecordCreatePayload = {
  classId: number;
  studentId: number;
  ruleId: number;
  remark?: string;
  sourceTerminal: 'admin' | 'display';
};

export type ScoreRecordBatchPayload = {
  classId: number;
  studentIds: number[];
  ruleId: number;
  remark?: string;
  sourceTerminal: 'admin' | 'display';
};

export type ScoreRecordGroupPayload = {
  classId: number;
  classGroupId: number;
  ruleId: number;
  remark?: string;
  sourceTerminal: 'admin' | 'display';
};

export type ClassScoreRecordCreatePayload = {
  classId: number;
  ruleId: number;
  remark?: string;
  sourceTerminal: 'admin' | 'display';
};

export type ClassScoreRecordBatchPayload = {
  classIds: number[];
  ruleId: number;
  remark?: string;
  sourceTerminal: 'admin' | 'display';
};

export type ScoreRuleUpsertPayload = {
  semesterId: number;
  moduleType: 'general' | 'subject';
  subjectCode?: string;
  sceneCode: string;
  code: string;
  name: string;
  scoreType: 'add' | 'deduct';
  scoreValue: number;
  scoreTarget?: 'student' | 'class';
  dimension?: string;
  tag?: string;
  sentiment: 'positive' | 'negative';
  aiSummaryText?: string;
  description?: string;
  allowedRoleCodes?: string[];
  isHighFrequency?: boolean;
  displayEnabled?: boolean;
  adminEnabled?: boolean;
};

export type ScoreRuleAiSuggestPayload = {
  semesterId?: number;
  moduleType?: 'general' | 'subject';
  subjectCode?: string;
  sceneCode?: string;
  name?: string;
  scoreType?: 'add' | 'deduct';
  scoreValue?: number;
  sentiment?: 'positive' | 'negative';
};

export type ScoreRuleAiSuggestResult = {
  dimension: string;
  tag: string;
  aiSummaryText: string;
  description: string;
};

export type RewardUpsertPayload = {
  code?: string;
  name: string;
  scopeType?: 'global' | 'class';
  classId?: number;
  category?: string;
  imageUrl?: string;
  scoreCost: number;
  stockQty?: number;
  isInfiniteStock?: boolean;
};

export type HonorUpsertPayload = {
  code: string;
  name: string;
  category: 'personal' | 'collective' | 'phase' | 'longterm';
  iconUrl: string;
  description?: string;
  conditionType?: string;
  conditionConfig?: Record<string, unknown>;
};

export type SchoolSettingsUpdatePayload = {
  code?: string;
  name?: string;
  englishName?: string;
  motto?: string;
  phone?: string;
  address?: string;
};

export type SemesterSettingsUpdatePayload = {
  id: number;
  name?: string;
  startDate?: string;
  endDate?: string;
};

export type DisplaySettingsUpdatePayload = {
  title?: string;
  subtitle?: string;
  bgImageUrl?: string;
  weatherLabel?: string;
  weatherLatitude?: number;
  weatherLongitude?: number;
  animationSpeed?: string;
  defaultMode?: string;
  allowSkipAnimation?: boolean;
};

export type GradeSettingsUpdatePayload = {
  grades: Array<{
    id?: number;
    name: string;
    sortOrder?: number;
    status?: string;
  }>;
};

export type PetGrowthSettingsUpdatePayload = {
  thresholds: number[];
  classScoreStudentLinkMultiplier: number;
  petDecoChangeCost: number;
};

export type PermissionUserUpsertPayload = {
  name: string;
  username: string;
  roleCode: string;
  phone?: string;
  dutyTags?: string[];
  classIds?: number[];
  subjectScopes?: Array<{
    classId: number;
    subjectCode: string;
  }>;
  resetPassword?: boolean;
};

export type PermissionUserImportPayload = {
  rows: Array<{
    name: string;
    phone?: string;
    roles?: string;
    teachingClasses?: string;
  }>;
};

export type PermissionUserImportResult = {
  total: number;
  createdCount: number;
  updatedCount: number;
  skippedCount: number;
  defaultPassword: string;
  results: Array<{
    row: number;
    name: string;
    username: string;
    roleCode: string;
    roleName: string;
    action: 'created' | 'updated' | 'skipped';
    message?: string;
  }>;
  warnings: string[];
};

export type PermissionUserStatusUpdatePayload = {
  status: 'enabled' | 'disabled';
};

export type PetUpsertPayload = {
  code: string;
  name: string;
  category?: string;
  rarity?: string;
  sourceType?: 'system' | 'custom';
  coverUrl?: string;
  description?: string;
  stages: Array<{
    stageNo: number;
    levelNo: number;
    name: string;
    imageUrl: string;
    needScoreTotal: number;
    animationKey?: string;
  }>;
};

export type AssetUploadResponse = {
  url: string;
  originalName: string;
  mimeType: string;
  size: number;
};

/** 业务审计日志条目（operation_log），含服务端生成的中文可读字段 */
export type OperationAuditLogItem = {
  id: number;
  schoolId: number;
  userId: number | null;
  roleCode: string | null;
  terminalType: string;
  module: string;
  action: string;
  targetType: string | null;
  targetId: number | null;
  detail: unknown;
  createdAt: string;
  operatorName: string | null;
  operatorUsername: string | null;
  moduleLabel: string;
  actionLabel: string;
  summary: string;
  sensitivity: 'high' | 'medium' | 'normal';
};

export type OperationAuditLogsPayload = {
  items: OperationAuditLogItem[];
  total: number;
  page: number;
  limit: number;
};

export type AdminOpsOverview = {
  status: 'ok' | 'degraded';
  checkedAt: string;
  app: {
    uptimeSeconds: number;
    nodeVersion: string;
  };
  dependencies: {
    database: 'ok' | 'error';
  };
  error: string | null;
  server: {
    hostname: string;
    platform: string;
    cpu: {
      coreCount: number;
      model: string;
      loadAverage: number[];
      usageRate: number | null;
    };
    memory: {
      totalBytes: number;
      usedBytes: number;
      freeBytes: number;
      usageRate: number | null;
    };
    disk: {
      path: string;
      totalBytes: number | null;
      usedBytes: number | null;
      availableBytes: number | null;
      usageRate: number | null;
      error?: string;
    };
  };
  process: {
    pid: number;
    memoryBytes: number;
    pm2:
      | {
          available: true;
          status: string;
          pid: number | null;
          restarts: number;
          unstableRestarts: number;
          uptimeMs: number | null;
          memoryBytes: number | null;
          cpuPercent: number | null;
        }
      | {
          available: false;
          status: 'unavailable';
          reason: string;
        };
  };
};

export type AdminOpsLogItem = {
  id: string;
  time: string | null;
  level: 'info' | 'warn' | 'error' | 'fatal' | 'unknown';
  source: string;
  summary: string;
  requestId: string | null;
  raw: string;
  detail: Record<string, unknown> | null;
};

export type AdminOpsLogsResponse = {
  items: AdminOpsLogItem[];
  total: number;
  level: 'all' | 'warn' | 'error' | 'fatal';
  sinceHours: number;
  limit: number;
  sources: {
    errorLog: string | null;
    outLog: string | null;
  };
};

export const adminApi = {
  login(username: string, password: string) {
    return request<LoginResponse>('/auth/login', {
      method: 'POST',
      body: {
        username,
        password,
        terminalType: 'admin',
      },
    });
  },
  projectionLogin(username: string, password: string) {
    return request<LoginResponse>('/auth/projection-login', {
      method: 'POST',
      body: { username, password },
    });
  },
  projectionSnapshot(token: string, query?: { startDate?: string; endDate?: string }) {
    const params = new URLSearchParams();
    if (query?.startDate) params.set('startDate', query.startDate);
    if (query?.endDate) params.set('endDate', query.endDate);
    const suffix = params.size > 0 ? `?${params.toString()}` : '';
    return request<ApiObjectResponse<ProjectionSnapshotPayload>>(`/projection/snapshot${suffix}`, { token });
  },
  me(token: string) {
    return request<SessionMeResponse>('/auth/me', { token });
  },
  changePassword(token: string, body: { currentPassword: string; newPassword: string }) {
    return request<ApiObjectResponse<null>>('/auth/change-password', {
      method: 'POST',
      token,
      body,
    });
  },
  classes(token: string) {
    return request<ApiListResponse<AdminClass>>('/classes', { token });
  },
  displayTerminals(token: string) {
    return request<ApiListResponse<DisplayTerminal>>('/display/terminals', { token });
  },
  deleteDisplayTerminal(token: string, id: number) {
    return request<ApiObjectResponse<{ id: number }>>(`/display/terminals/${id}`, {
      method: 'DELETE',
      token,
    });
  },
  displayWeather(
    token: string,
    query?: { latitude?: number; longitude?: number; label?: string },
  ) {
    const params = new URLSearchParams();
    if (query?.latitude !== undefined) params.set('latitude', String(query.latitude));
    if (query?.longitude !== undefined) params.set('longitude', String(query.longitude));
    if (query?.label) params.set('label', query.label);
    const suffix = params.size > 0 ? `?${params.toString()}` : '';
    return request<ApiObjectResponse<DisplayWeatherPayload>>(`/display/weather${suffix}`, { token });
  },
  students(token: string, query?: { classId?: number; page?: number; pageSize?: number; includeDisabled?: boolean; includeLatestAcademic?: boolean; includePetDetails?: boolean }) {
    const params = new URLSearchParams();
    if (query?.classId) params.set('classId', String(query.classId));
    if (query?.page) params.set('page', String(query.page));
    if (query?.pageSize) params.set('pageSize', String(query.pageSize));
    if (query?.includeDisabled) params.set('includeDisabled', 'true');
    if (query?.includeLatestAcademic === false) params.set('includeLatestAcademic', 'false');
    if (query?.includePetDetails === false) params.set('includePetDetails', 'false');
    const suffix = params.size > 0 ? `?${params.toString()}` : '';
    return request<ApiListResponse<AdminStudent>>(`/students${suffix}`, { token });
  },
  studentDetail(token: string, id: number) {
    return request<ApiObjectResponse<StudentDetail>>(`/students/${id}`, { token });
  },
  studentAcademicRecords(token: string, studentId: number) {
    return request<ApiListResponse<StudentAcademicExam>>(`/academic-records/students/${studentId}`, { token });
  },
  importAcademicScores(token: string, body: AcademicScoreImportPayload) {
    return request<ApiObjectResponse<AcademicScoreImportResult>>('/academic-records/import', {
      method: 'POST',
      token,
      body,
    });
  },
  academicExams(token: string, query?: { semesterId?: number; currentSemesterOnly?: boolean }) {
    const params = new URLSearchParams();
    if (query?.semesterId) params.set('semesterId', String(query.semesterId));
    if (query?.currentSemesterOnly) params.set('currentSemesterOnly', 'true');
    const suffix = params.size > 0 ? `?${params.toString()}` : '';
    return request<ApiListResponse<AcademicExamListItem>>(`/academic-records/exams${suffix}`, { token });
  },
  updateAcademicExam(token: string, examId: number, body: AcademicExamUpdatePayload) {
    return request<ApiObjectResponse<AcademicExamListItem>>(`/academic-records/exams/${examId}`, {
      method: 'PUT',
      token,
      body,
    });
  },
  deleteAcademicExam(token: string, examId: number) {
    return request<ApiObjectResponse<{ id: number; deletedRecordCount: number }>>(`/academic-records/exams/${examId}`, {
      method: 'DELETE',
      token,
    });
  },
  academicScores(
    token: string,
    query?: { examId?: number; classId?: number; gradeName?: string; keyword?: string; includeSubjects?: boolean; recentExamLimit?: number; currentSemesterOnly?: boolean },
  ) {
    const params = new URLSearchParams();
    if (query?.examId) params.set('examId', String(query.examId));
    if (query?.classId) params.set('classId', String(query.classId));
    if (query?.gradeName) params.set('gradeName', query.gradeName);
    if (query?.keyword) params.set('keyword', query.keyword);
    if (query?.includeSubjects) params.set('includeSubjects', 'true');
    if (query?.recentExamLimit) params.set('recentExamLimit', String(query.recentExamLimit));
    if (query?.currentSemesterOnly) params.set('currentSemesterOnly', 'true');
    const suffix = params.size > 0 ? `?${params.toString()}` : '';
    return request<ApiListResponse<AcademicScoreListRow>>(`/academic-records${suffix}`, { token });
  },
  academicDeskOverview(
    token: string,
    query: { classId: number; examId?: number; subjectCode?: string },
  ) {
    const params = new URLSearchParams();
    params.set('classId', String(query.classId));
    if (query.examId) params.set('examId', String(query.examId));
    if (query.subjectCode) params.set('subjectCode', query.subjectCode);
    return request<ApiObjectResponse<AcademicDeskOverviewPayload>>(
      `/academic-records/desk-overview?${params.toString()}`,
      { token },
    );
  },
  academicSchoolGrowth(token: string, query?: { examId?: number; currentSemesterOnly?: boolean }) {
    const params = new URLSearchParams();
    if (query?.examId) params.set('examId', String(query.examId));
    if (query?.currentSemesterOnly) params.set('currentSemesterOnly', 'true');
    const suffix = params.size > 0 ? `?${params.toString()}` : '';
    return request<ApiObjectResponse<SchoolAcademicGrowthPayload>>(
      `/academic-records/school-growth${suffix}`,
      { token },
    );
  },
  studentAiSummary(token: string, studentId: number, periodType: 'weekly' | 'monthly' = 'weekly') {
    return request<ApiObjectResponse<AiStudentSummary | null>>(`/ai/students/${studentId}/summary?periodType=${periodType}`, { token });
  },
  generateStudentAiSummary(token: string, studentId: number, periodType: 'weekly' | 'monthly' = 'weekly') {
    return request<ApiObjectResponse<AiStudentSummary>>(`/ai/students/${studentId}/generate-summary`, {
      method: 'POST',
      token,
      body: { periodType },
    });
  },
  createTeacherObservation(token: string, body: TeacherObservationCreatePayload) {
    return request<ApiObjectResponse<{ id: number }>>('/teacher-observations', {
      method: 'POST',
      token,
      body,
    });
  },
  polishTeacherObservation(token: string, body: TeacherObservationAiPolishPayload) {
    return request<ApiObjectResponse<{ content: string }>>('/teacher-observations/ai-polish', {
      method: 'POST',
      token,
      body,
    });
  },
  classGroups(token: string, classId: number) {
    return request<ApiListResponse<ClassGroupSummary>>(`/classes/${classId}/groups`, { token });
  },
  groupScoreRanking(token: string, classId: number) {
    return request<ApiListResponse<GroupScoreRankingRow>>(`/classes/${classId}/group-scores/ranking`, { token });
  },
  groupScoreRecords(token: string, classId: number, classGroupId?: number) {
    const params = new URLSearchParams();
    if (classGroupId) params.set('classGroupId', String(classGroupId));
    const suffix = params.size > 0 ? `?${params.toString()}` : '';
    return request<ApiListResponse<GroupScoreRecordRow>>(`/classes/${classId}/group-scores/records${suffix}`, { token });
  },
  adjustGroupScore(
    token: string,
    classId: number,
    body: { classGroupId: number; scoreDelta: number; remark: string; sourceTerminal: 'admin' },
  ) {
    return request<ApiObjectResponse<{ classGroupId: number; groupNo: number; groupName: string; scoreDelta: number; groupScore: number; groupTotalScore: number; recordId: number }>>(
      `/classes/${classId}/group-scores/adjust`,
      {
        method: 'POST',
        token,
        body,
      },
    );
  },
  resetGroupScores(token: string, classId: number, body: { sourceTerminal: 'admin' }) {
    return request<ApiObjectResponse<{ resetCount: number; items: Array<{ classGroupId: number; groupNo: number; groupName: string; previousScore: number }> }>>(
      `/classes/${classId}/group-scores/reset`,
      {
        method: 'POST',
        token,
        body,
      },
    );
  },
  scoreRules(token: string, query?: { scoreTarget?: 'student' | 'class' }) {
    const params = new URLSearchParams();
    if (query?.scoreTarget) params.set('scoreTarget', query.scoreTarget);
    const suffix = params.size > 0 ? `?${params.toString()}` : '';
    return request<ApiListResponse<ScoreRule>>(`/score-rules${suffix}`, { token });
  },
  scoreRecords(token: string, query?: { classId?: number; studentId?: number; subjectCode?: string; startDate?: string; endDate?: string }) {
    const params = new URLSearchParams();
    if (query?.classId) params.set('classId', String(query.classId));
    if (query?.studentId) params.set('studentId', String(query.studentId));
    if (query?.subjectCode) params.set('subjectCode', query.subjectCode);
    if (query?.startDate) params.set('startDate', query.startDate);
    if (query?.endDate) params.set('endDate', query.endDate);
    const suffix = params.size > 0 ? `?${params.toString()}` : '';
    return request<ApiListResponse<ScoreRecord>>(`/score-records${suffix}`, { token });
  },
  realtimeMonitorStats(token: string) {
    return request<ApiObjectResponse<RealtimeMonitorStats>>('/admin/analytics/realtime-monitor', { token });
  },
  createScoreRecord(token: string, body: ScoreRecordCreatePayload) {
    return request<ApiObjectResponse<ScoreRecordCreateResult>>('/score-records', {
      method: 'POST',
      token,
      body,
    });
  },
  createScoreRecordBatch(token: string, body: ScoreRecordBatchPayload) {
    return request<ApiObjectResponse<ScoreRecordBatchResult>>('/score-records/batch', {
      method: 'POST',
      token,
      body,
    });
  },
  createScoreRecordGroup(token: string, body: ScoreRecordGroupPayload) {
    return request<ApiObjectResponse<ScoreRecordBatchResult>>('/score-records/group', {
      method: 'POST',
      token,
      body,
    });
  },
  reverseScoreRecord(token: string, id: number, body: { remark: string }) {
    return request<ApiObjectResponse<ScoreRecordReverseResult>>(`/score-records/${id}/reverse`, {
      method: 'POST',
      token,
      body,
    });
  },
  classScoreRecords(token: string, query?: { classId?: number; classIds?: number[]; startDate?: string; endDate?: string }) {
    const params = new URLSearchParams();
    if (query?.classId) params.set('classId', String(query.classId));
    if (query?.classIds && query.classIds.length > 0) params.set('classIds', query.classIds.join(','));
    if (query?.startDate) params.set('startDate', query.startDate);
    if (query?.endDate) params.set('endDate', query.endDate);
    const suffix = params.size > 0 ? `?${params.toString()}` : '';
    return request<ApiListResponse<ClassScoreRecord>>(`/class-score-records${suffix}`, { token });
  },
  classScoreRankings(token: string, query: { gradeCode?: string; classId?: number; startDate?: string; endDate?: string }) {
    const params = new URLSearchParams();
    if (query.gradeCode) params.set('gradeCode', query.gradeCode);
    if (query.classId) params.set('classId', String(query.classId));
    if (query.startDate) params.set('startDate', query.startDate);
    if (query.endDate) params.set('endDate', query.endDate);
    const suffix = params.size > 0 ? `?${params.toString()}` : '';
    return request<ApiObjectResponse<{ gradeCode: string; gradeName: string | null; rows: ClassScoreRankingRow[] }>>(
      `/class-score-records/rankings${suffix}`,
      { token },
    );
  },
  createClassScoreRecord(token: string, body: ClassScoreRecordCreatePayload) {
    return request<ApiObjectResponse<{ classScoreRecordId: number }>>('/class-score-records', {
      method: 'POST',
      token,
      body,
    });
  },
  createClassScoreRecordBatch(token: string, body: ClassScoreRecordBatchPayload) {
    return request<ApiObjectResponse<{ batchId: number }>>('/class-score-records/batch', {
      method: 'POST',
      token,
      body,
    });
  },
  reverseClassScoreRecord(token: string, id: number, body: { remark: string }) {
    return request<ApiObjectResponse<ClassScoreRecordReverseResult>>(`/class-score-records/${id}/reverse`, {
      method: 'POST',
      token,
      body,
    });
  },
  scoreRulesTree(token: string) {
    return request<ApiListResponse<ScoreRuleTreeModule> | ApiObjectResponse<ScoreRuleTreeModule[]>>('/score-rules/tree', { token });
  },
  rewards(token: string, query?: { includeDisabled?: boolean; classId?: number; scopeType?: 'global' | 'class' }) {
    const params = new URLSearchParams();
    if (query?.includeDisabled) params.set('includeDisabled', 'true');
    if (query?.classId) params.set('classId', String(query.classId));
    if (query?.scopeType) params.set('scopeType', query.scopeType);
    const suffix = params.size > 0 ? `?${params.toString()}` : '';
    return request<ApiListResponse<Reward>>(`/rewards${suffix}`, { token });
  },
  rewardOrders(token: string, query?: { classId?: number; studentId?: number }) {
    const params = new URLSearchParams();
    if (query?.classId) params.set('classId', String(query.classId));
    if (query?.studentId) params.set('studentId', String(query.studentId));
    const suffix = params.size > 0 ? `?${params.toString()}` : '';
    return request<ApiListResponse<RewardOrder>>(`/reward-orders${suffix}`, { token });
  },
  createReward(token: string, body: RewardUpsertPayload) {
    return request<ApiObjectResponse<{ id: number }>>('/rewards', {
      method: 'POST',
      token,
      body,
    });
  },
  updateReward(token: string, id: number, body: RewardUpsertPayload) {
    return request<ApiObjectResponse<{ id: number }>>(`/rewards/${id}`, {
      method: 'PUT',
      token,
      body,
    });
  },
  uploadRewardAsset(token: string, file: File) {
    const formData = new FormData();
    formData.append('file', file);
    return request<ApiObjectResponse<AssetUploadResponse>>('/rewards/upload', {
      method: 'POST',
      token,
      body: formData,
    });
  },
  updateRewardStatus(token: string, id: number, status: 'enabled' | 'disabled') {
    return request<ApiObjectResponse<{ id: number; status: string }>>(`/rewards/${id}/status`, {
      method: 'PUT',
      token,
      body: { status },
    });
  },
  deleteReward(token: string, id: number) {
    return request<ApiObjectResponse<{ id: number }>>(`/rewards/${id}`, {
      method: 'DELETE',
      token,
    });
  },
  honors(token: string, query?: { includeDisabled?: boolean }) {
    const params = new URLSearchParams();
    if (query?.includeDisabled) params.set('includeDisabled', 'true');
    const suffix = params.size > 0 ? `?${params.toString()}` : '';
    return request<ApiListResponse<Honor>>(`/honors${suffix}`, { token });
  },
  honorRecords(token: string, query?: { targetType?: 'student' | 'class'; classId?: number; studentId?: number; honorId?: number }) {
    const params = new URLSearchParams();
    if (query?.targetType) params.set('targetType', query.targetType);
    if (query?.classId) params.set('classId', String(query.classId));
    if (query?.studentId) params.set('studentId', String(query.studentId));
    if (query?.honorId) params.set('honorId', String(query.honorId));
    const suffix = params.size > 0 ? `?${params.toString()}` : '';
    return request<ApiListResponse<HonorRecord>>(`/honor-records${suffix}`, { token });
  },
  createHonorRecord(
    token: string,
    body: {
      honorId: number;
      targetType: 'student' | 'class';
      targetId: number;
      classId: number;
      remark?: string;
    },
  ) {
    return request<
      ApiObjectResponse<{
        recordId: number;
        honorId: number;
        targetType: 'student' | 'class';
        targetId: number;
        classId: number;
        studentId: number | null;
      }>
    >('/honor-records', {
      method: 'POST',
      token,
      body,
    });
  },
  createHonor(token: string, body: HonorUpsertPayload) {
    return request<ApiObjectResponse<{ id: number }>>('/honors', {
      method: 'POST',
      token,
      body,
    });
  },
  updateHonor(token: string, id: number, body: HonorUpsertPayload) {
    return request<ApiObjectResponse<{ id: number }>>(`/honors/${id}`, {
      method: 'PUT',
      token,
      body,
    });
  },
  uploadHonorAsset(token: string, file: File) {
    const formData = new FormData();
    formData.append('file', file);
    return request<ApiObjectResponse<AssetUploadResponse>>('/honors/upload', {
      method: 'POST',
      token,
      body: formData,
    });
  },
  updateHonorStatus(token: string, id: number, status: 'enabled' | 'disabled') {
    return request<ApiObjectResponse<{ id: number; status: string }>>(`/honors/${id}/status`, {
      method: 'PUT',
      token,
      body: { status },
    });
  },
  settings(token: string) {
    return request<ApiObjectResponse<SystemSettings>>('/admin/settings', { token });
  },
  displaySettings(token: string) {
    return request<ApiObjectResponse<DisplaySettingsPayload>>('/admin/settings/display', { token });
  },
  setPresentationMode(token: string, mode: 'report' | 'daily') {
    return request<ApiObjectResponse<{ id: number; defaultMode: string }>>('/admin/settings/presentation-mode', {
      method: 'PUT',
      token,
      body: { mode },
    });
  },
  updateSchoolSettings(token: string, body: SchoolSettingsUpdatePayload) {
    return request<ApiObjectResponse<{ id: number }>>('/admin/settings/school', {
      method: 'PUT',
      token,
      body,
    });
  },
  updateSemesterSettings(token: string, body: SemesterSettingsUpdatePayload) {
    return request<ApiObjectResponse<{ id: number }>>('/admin/settings/semester', {
      method: 'PUT',
      token,
      body,
    });
  },
  updateDisplaySettings(token: string, body: DisplaySettingsUpdatePayload) {
    return request<ApiObjectResponse<{ id: number }>>('/admin/settings/display', {
      method: 'PUT',
      token,
      body,
    });
  },
  updateGradeSettings(token: string, body: GradeSettingsUpdatePayload) {
    return request<ApiObjectResponse<{ count: number }>>('/admin/settings/grades', {
      method: 'PUT',
      token,
      body,
    });
  },
  updatePetGrowthSettings(token: string, body: PetGrowthSettingsUpdatePayload) {
    return request<ApiObjectResponse<{ id: number }>>('/admin/settings/pet-growth', {
      method: 'PUT',
      token,
      body,
    });
  },
  permissionUsers(token: string) {
    return request<ApiListResponse<PermissionUser>>('/admin/permissions/users', { token });
  },
  roleTemplates(token: string) {
    return request<ApiListResponse<RoleTemplate>>('/admin/permissions/roles', { token });
  },
  teacherLiveStatus(token: string, query?: { at?: string; startAt?: string; endAt?: string }) {
    const params = new URLSearchParams();
    if (query?.at) params.set('at', query.at);
    if (query?.startAt) params.set('startAt', query.startAt);
    if (query?.endAt) params.set('endAt', query.endAt);
    const suffix = params.size > 0 ? `?${params.toString()}` : '';
    return request<
      ApiObjectResponse<{
        at: string | null;
        startAt: string | null;
        endAt: string | null;
        weekday: number;
        currentTime: string;
        busyCount: number;
        freeCount: number;
        rows: TeacherLiveStatusRow[];
      }>
    >(`/teacher-schedules/live-status${suffix}`, { token });
  },
  importTeacherScheduleFromXls(token: string, payload: { file?: File; filePath?: string; createMissingTeachers?: boolean }) {
    return request<ApiObjectResponse<TeacherScheduleImportResult>>('/teacher-schedules/import-from-xls', {
      method: 'POST',
      token,
      body: (() => {
        const formData = new FormData();
        if (payload.file) formData.append('file', payload.file);
        if (payload.filePath) formData.append('filePath', payload.filePath);
        if (payload.createMissingTeachers !== undefined) formData.append('createMissingTeachers', String(payload.createMissingTeachers));
        return formData;
      })(),
    });
  },
  importTeacherScheduleFromXlsAdvanced(
    token: string,
    payload: {
      file?: File;
      filePath?: string;
      createMissingTeachers?: boolean;
      creationRoleCode?: string;
      usernamePrefix?: string;
      missingTeacherConfigs?: Array<{
        teacherName: string;
        create: boolean;
        username?: string;
        password?: string;
        roleCode?: string;
      }>;
      missingClassConfigs?: Array<{
        className: string;
        create: boolean;
        gradeName?: string;
        gradeCode?: string;
      }>;
    },
  ) {
    const formData = new FormData();
    if (payload.file) formData.append('file', payload.file);
    if (payload.filePath) formData.append('filePath', payload.filePath);
    if (payload.createMissingTeachers !== undefined) formData.append('createMissingTeachers', String(payload.createMissingTeachers));
    if (payload.creationRoleCode) formData.append('creationRoleCode', payload.creationRoleCode);
    if (payload.usernamePrefix) formData.append('usernamePrefix', payload.usernamePrefix);
    if (payload.missingTeacherConfigs) formData.append('missingTeacherConfigs', JSON.stringify(payload.missingTeacherConfigs));
    if (payload.missingClassConfigs) formData.append('missingClassConfigs', JSON.stringify(payload.missingClassConfigs));
    return request<ApiObjectResponse<TeacherScheduleImportResult>>('/teacher-schedules/import-from-xls', {
      method: 'POST',
      token,
      body: formData,
    });
  },
  teacherScheduleSlots(token: string, teacherId?: number) {
    const params = new URLSearchParams();
    if (teacherId) params.set('teacherId', String(teacherId));
    const suffix = params.size > 0 ? `?${params.toString()}` : '';
    return request<ApiListResponse<TeacherScheduleSlotRow>>(`/teacher-schedules/slots${suffix}`, { token });
  },
  teacherOccupancyRules(token: string) {
    return request<ApiListResponse<TeacherOccupancyRule>>('/teacher-schedules/occupancy-rules', { token });
  },
  updateTeacherOccupancyRules(token: string, rules: TeacherOccupancyRule[]) {
    return request<ApiListResponse<TeacherOccupancyRule>>('/teacher-schedules/occupancy-rules', {
      method: 'PUT',
      token,
      body: { rules },
    });
  },
  createPermissionUser(token: string, body: PermissionUserUpsertPayload) {
    return request<ApiObjectResponse<{ id: number; defaultPassword: string }>>('/admin/permissions/users', {
      method: 'POST',
      token,
      body,
    });
  },
  importPermissionUsers(token: string, body: PermissionUserImportPayload) {
    return request<ApiObjectResponse<PermissionUserImportResult>>('/admin/permissions/users/import-teachers', {
      method: 'POST',
      token,
      body,
    });
  },
  updatePermissionUser(token: string, id: number, body: PermissionUserUpsertPayload) {
    return request<ApiObjectResponse<{ id: number }>>(`/admin/permissions/users/${id}`, {
      method: 'PUT',
      token,
      body,
    });
  },
  resetPermissionUserPassword(token: string, id: number) {
    return request<ApiObjectResponse<{ id: number; defaultPassword: string }>>(`/admin/permissions/users/${id}/reset-password`, {
      method: 'POST',
      token,
    });
  },
  updatePermissionUserStatus(token: string, id: number, body: PermissionUserStatusUpdatePayload) {
    return request<ApiObjectResponse<{ id: number; status: string }>>(`/admin/permissions/users/${id}/status`, {
      method: 'PUT',
      token,
      body,
    });
  },
  operationAuditLogs(
    token: string,
    query?: {
      page?: number;
      limit?: number;
      module?: string;
      action?: string;
      terminalType?: 'admin' | 'display';
      scope?: 'all' | 'sensitive';
    },
  ) {
    const params = new URLSearchParams();
    if (query?.page !== undefined) params.set('page', String(query.page));
    if (query?.limit !== undefined) params.set('limit', String(query.limit));
    if (query?.module) params.set('module', query.module);
    if (query?.action) params.set('action', query.action);
    if (query?.terminalType) params.set('terminalType', query.terminalType);
    if (query?.scope) params.set('scope', query.scope);
    const suffix = params.size > 0 ? `?${params.toString()}` : '';
    return request<ApiObjectResponse<OperationAuditLogsPayload>>(`/admin/audit/operation-logs${suffix}`, {
      token,
    });
  },
  opsOverview(token: string) {
    return request<ApiObjectResponse<AdminOpsOverview>>('/admin/ops/overview', { token });
  },
  opsLogs(
    token: string,
    query?: {
      level?: 'all' | 'warn' | 'error' | 'fatal';
      sinceHours?: number;
      limit?: number;
    },
  ) {
    const params = new URLSearchParams();
    if (query?.level) params.set('level', query.level);
    if (query?.sinceHours !== undefined) params.set('sinceHours', String(query.sinceHours));
    if (query?.limit !== undefined) params.set('limit', String(query.limit));
    const suffix = params.size > 0 ? `?${params.toString()}` : '';
    return request<ApiObjectResponse<AdminOpsLogsResponse>>(`/admin/ops/logs${suffix}`, {
      token,
    });
  },
  analyticsSummary(token: string, query?: AnalyticsQuery) {
    const params = new URLSearchParams();
    if (query?.gradeName) params.set('gradeName', query.gradeName);
    if (query?.classId) params.set('classId', String(query.classId));
    if (query?.subjectCode) params.set('subjectCode', query.subjectCode);
    if (query?.startDate) params.set('startDate', query.startDate);
    if (query?.endDate) params.set('endDate', query.endDate);
    if (query?.skipDetailSummary) params.set('skipDetailSummary', 'true');
    const suffix = params.size > 0 ? `?${params.toString()}` : '';
    return request<ApiObjectResponse<AnalyticsData>>(`/admin/analytics/summary${suffix}`, { token });
  },
  analyticsHeatmap(token: string, query?: AnalyticsQuery) {
    const params = new URLSearchParams();
    if (query?.gradeName) params.set('gradeName', query.gradeName);
    if (query?.classId) params.set('classId', String(query.classId));
    if (query?.subjectCode) params.set('subjectCode', query.subjectCode);
    if (query?.startDate) params.set('startDate', query.startDate);
    if (query?.endDate) params.set('endDate', query.endDate);
    if (query?.skipDetailSummary) params.set('skipDetailSummary', 'true');
    const suffix = params.size > 0 ? `?${params.toString()}` : '';
    return request<ApiObjectResponse<AnalyticsData>>(`/admin/analytics/heatmap${suffix}`, { token });
  },
  analyticsAi(token: string, query?: AnalyticsQuery) {
    const params = new URLSearchParams();
    if (query?.gradeName) params.set('gradeName', query.gradeName);
    if (query?.classId) params.set('classId', String(query.classId));
    if (query?.subjectCode) params.set('subjectCode', query.subjectCode);
    if (query?.regenerateAi) params.set('regenerateAi', 'true');
    if (query?.startDate) params.set('startDate', query.startDate);
    if (query?.endDate) params.set('endDate', query.endDate);
    if (query?.skipDetailSummary) params.set('skipDetailSummary', 'true');
    const suffix = params.size > 0 ? `?${params.toString()}` : '';
    return request<ApiObjectResponse<AnalyticsData>>(`/admin/analytics/ai${suffix}`, { token });
  },
  analyticsReportStatus(token: string, query?: { classId?: number; gradeName?: string; startDate?: string; endDate?: string; subjectCode?: string }) {
    const params = new URLSearchParams();
    if (query?.classId) params.set('classId', String(query.classId));
    if (query?.gradeName) params.set('gradeName', query.gradeName);
    if (query?.startDate) params.set('startDate', query.startDate);
    if (query?.endDate) params.set('endDate', query.endDate);
    if (query?.subjectCode) params.set('subjectCode', query.subjectCode);
    const suffix = params.size > 0 ? `?${params.toString()}` : '';
    return request<ApiObjectResponse<AnalyticsReportStatus>>(`/admin/analytics/report-status${suffix}`, { token });
  },
  teacherWorkbenchContext(token: string, query: { classId: number; subjectCode: string }) {
    const params = new URLSearchParams();
    params.set('classId', String(query.classId));
    params.set('subjectCode', query.subjectCode);
    return request<ApiObjectResponse<TeacherWorkbenchContext>>(`/teacher/workbench/context?${params.toString()}`, { token });
  },
  teacherReviewContext(
    token: string,
    query: { classId: number; subjectCode: string; startDate?: string; endDate?: string; regenerateAi?: boolean },
  ) {
    const params = new URLSearchParams();
    params.set('classId', String(query.classId));
    params.set('subjectCode', query.subjectCode);
    if (query.startDate) params.set('startDate', query.startDate);
    if (query.endDate) params.set('endDate', query.endDate);
    if (query.regenerateAi) params.set('regenerateAi', 'true');
    return request<ApiObjectResponse<TeacherReviewContext>>(`/teacher/review/context?${params.toString()}`, { token });
  },
  pets(token: string, category?: string) {
    const suffix = category ? `?category=${encodeURIComponent(category)}` : '';
    return request<ApiListResponse<PetCatalogItem>>(`/admin/pets${suffix}`, { token });
  },
  petGrowthThresholds(token: string) {
    return request<ApiObjectResponse<{ thresholds: number[] }>>('/admin/pets/growth-thresholds', { token });
  },
  createPet(token: string, body: PetUpsertPayload) {
    return request<ApiObjectResponse<{ id: number }>>('/admin/pets', {
      method: 'POST',
      token,
      body,
    });
  },
  updatePet(token: string, id: number, body: PetUpsertPayload) {
    return request<ApiObjectResponse<{ id: number }>>(`/admin/pets/${id}`, {
      method: 'PUT',
      token,
      body,
    });
  },
  uploadPetAsset(token: string, file: File) {
    const formData = new FormData();
    formData.append('file', file);
    return request<ApiObjectResponse<AssetUploadResponse>>('/admin/pets/upload', {
      method: 'POST',
      token,
      body: formData,
    });
  },
  updatePetStatus(token: string, id: number, status: 'enabled' | 'disabled') {
    return request<ApiObjectResponse<{ id: number; status: string }>>(`/admin/pets/${id}/status`, {
      method: 'PUT',
      token,
      body: { status },
    });
  },
  deletePet(token: string, id: number) {
    return request<ApiObjectResponse<{ id: number }>>(`/admin/pets/${id}`, {
      method: 'DELETE',
      token,
    });
  },
  createClass(token: string, body: ClassUpsertPayload) {
    return request<ApiObjectResponse<{ id: number }>>('/classes', {
      method: 'POST',
      token,
      body,
    });
  },
  updateClass(token: string, id: number, body: ClassUpsertPayload) {
    return request<ApiObjectResponse<{ id: number }>>(`/classes/${id}`, {
      method: 'PUT',
      token,
      body,
    });
  },
  importStudents(token: string, body: StudentImportPayload) {
    return request<ApiObjectResponse<{
      createdCount: number;
      updatedCount: number;
      classChangedCount: number;
      unchangedCount: number;
      createdClassCount?: number;
      studentIds: number[];
      updatedStudentIds: number[];
    }>>('/students/import', {
      method: 'POST',
      token,
      body,
    });
  },
  updateStudent(token: string, id: number, body: StudentUpdatePayload) {
    return request<ApiObjectResponse<{ id: number }>>(`/students/${id}`, {
      method: 'PUT',
      token,
      body,
    });
  },
  resetStudentPet(token: string, id: number) {
    return request<ApiObjectResponse<{ studentId: number; studentName: string }>>(`/students/${id}/reset-pet`, {
      method: 'POST',
      token,
    });
  },
  resetStudentPetNickname(token: string, id: number) {
    return request<
      ApiObjectResponse<{
        studentId: number;
        studentName: string;
        studentPetId: number;
        defaultPetName: string;
        previousNickname: string | null;
      }>
    >(`/students/${id}/reset-pet-nickname`, {
      method: 'POST',
      token,
    });
  },
  createScoreRule(token: string, body: ScoreRuleUpsertPayload) {
    return request<ApiObjectResponse<{ id: number }>>('/score-rules', {
      method: 'POST',
      token,
      body,
    });
  },
  suggestScoreRule(token: string, body: ScoreRuleAiSuggestPayload) {
    return request<ApiObjectResponse<ScoreRuleAiSuggestResult>>('/score-rules/ai-suggest', {
      method: 'POST',
      token,
      body,
    });
  },
  updateScoreRule(token: string, id: number, body: ScoreRuleUpsertPayload) {
    return request<ApiObjectResponse<{ id: number }>>(`/score-rules/${id}`, {
      method: 'PUT',
      token,
      body,
    });
  },
  createCallQueue(token: string, body: { classId?: number; studentIds: number[]; location: string }) {
    return request<ApiObjectResponse<any>>('/call-queue', {
      method: 'POST',
      token,
      body,
    });
  },
  callQueueClasses(token: string) {
    return request<ApiListResponse<AdminClass>>('/call-queue/classes', { token });
  },
  callQueueStudents(token: string, classId: number) {
    return request<ApiListResponse<AdminStudent>>(`/call-queue/class-students?classId=${classId}`, { token });
  },
  confirmCallQueue(token: string, id: number) {
    return request<ApiObjectResponse<null>>(`/call-queue/${id}/confirm`, {
      method: 'POST',
      token,
    });
  },
  cancelCallQueue(token: string, id: number) {
    return request<ApiObjectResponse<null>>(`/call-queue/${id}/cancel`, {
      method: 'POST',
      token,
    });
  },
  activeCallQueue(token: string, classId: number) {
    return request<ApiObjectResponse<any>>(`/call-queue/active/${classId}`, { token });
  },
  callQueueList(token: string, classId: number) {
    return request<ApiListResponse<any>>(`/call-queue/list?classId=${classId}`, { token });
  },
};

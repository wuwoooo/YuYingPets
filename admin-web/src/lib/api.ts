const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000/api/v1';

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  token?: string | null;
  body?: unknown;
  headers?: Record<string, string>;
};

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

    throw new Error(message);
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
  username?: string;
  name: string;
  roleCode: string;
  roleName?: string;
  dutyTags?: string[];
};

export type SessionScope = {
  scopeType: string;
  classId: number | null;
  gradeCode: string | null;
  subjectCode: string | null;
};

export type SessionMeResponse = {
  code: number;
  message: string;
  data: {
    user: SessionUser;
    scopes: SessionScope[];
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
  sortOrder?: number | null;
  displayStatus: string;
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
  className: string;
  currentScore: number;
  totalScore: number;
  currentPetLevel: number;
  latestAcademic: {
    examId: number;
    examName: string;
    importedAt: string;
    totalScore: number | null;
    schoolRank: number | null;
    schoolRankDelta: number | null;
    classRank: number | null;
    classRankDelta: number | null;
  } | null;
  pet?: {
    id: number;
    name: string;
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

export type AcademicExamListItem = {
  id: number;
  name: string;
  gradeName: string | null;
  sourceFile: string | null;
  importedAt: string;
  recordCount: number;
};

export type AcademicScoreListRow = {
  id: number;
  examId: number;
  examName: string;
  examGradeName: string | null;
  sourceFile: string | null;
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

export type StudentAcademicExam = {
  examId: number;
  examName: string;
  gradeName: string | null;
  sourceFile: string | null;
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
  currentScoreTotal: number;
  students: Array<{
    id: number;
    name: string;
    studentNo: string;
    currentScore: number;
  }>;
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
  isHighFrequency: boolean;
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
  code: string;
  name: string;
  category: string;
  imageUrl: string | null;
  scoreCost: number;
  stockQty: number | null;
  isInfiniteStock: boolean;
  status: string;
  rewardOrderCount: number;
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
  createdAt: string;
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
  averageScore: number;
  activeDays: number;
  gradeTrend: Array<{ name: string; value: number }>;
  ruleDistribution: Array<{ name: string; value: number }>;
  subjectDistribution: Array<{ name: string; value: number }>;
  topClasses: Array<{ id: number; name: string; currentScoreTotal: number }>;
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
  aiInsight: {
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
  heatMap: {
    rows: string[];
    cols: string[];
    data: Array<{ row: string; values: number[] }>;
  };
};

export type AnalyticsQuery = {
  gradeName?: string;
  classId?: number;
  regenerateAi?: boolean;
  startDate?: string;
  endDate?: string;
};

export type AnalyticsReportStatus = {
  hasTodayReport: boolean;
  classId: number | null;
  className: string | null;
  reportDate: string;
  generatedAt: string | null;
  source: 'ark' | 'fallback' | null;
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
  code: string;
  name: string;
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
  students(token: string, query?: { classId?: number; page?: number; pageSize?: number }) {
    const params = new URLSearchParams();
    if (query?.classId) params.set('classId', String(query.classId));
    if (query?.page) params.set('page', String(query.page));
    if (query?.pageSize) params.set('pageSize', String(query.pageSize));
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
  academicExams(token: string) {
    return request<ApiListResponse<AcademicExamListItem>>('/academic-records/exams', { token });
  },
  academicScores(
    token: string,
    query?: { examId?: number; classId?: number; gradeName?: string; keyword?: string; includeSubjects?: boolean },
  ) {
    const params = new URLSearchParams();
    if (query?.examId) params.set('examId', String(query.examId));
    if (query?.classId) params.set('classId', String(query.classId));
    if (query?.gradeName) params.set('gradeName', query.gradeName);
    if (query?.keyword) params.set('keyword', query.keyword);
    if (query?.includeSubjects) params.set('includeSubjects', 'true');
    const suffix = params.size > 0 ? `?${params.toString()}` : '';
    return request<ApiListResponse<AcademicScoreListRow>>(`/academic-records${suffix}`, { token });
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
  scoreRules(token: string, query?: { scoreTarget?: 'student' | 'class' }) {
    const params = new URLSearchParams();
    if (query?.scoreTarget) params.set('scoreTarget', query.scoreTarget);
    const suffix = params.size > 0 ? `?${params.toString()}` : '';
    return request<ApiListResponse<ScoreRule>>(`/score-rules${suffix}`, { token });
  },
  scoreRecords(token: string, query?: { classId?: number; studentId?: number; subjectCode?: string }) {
    const params = new URLSearchParams();
    if (query?.classId) params.set('classId', String(query.classId));
    if (query?.studentId) params.set('studentId', String(query.studentId));
    if (query?.subjectCode) params.set('subjectCode', query.subjectCode);
    const suffix = params.size > 0 ? `?${params.toString()}` : '';
    return request<ApiListResponse<ScoreRecord>>(`/score-records${suffix}`, { token });
  },
  createScoreRecord(token: string, body: ScoreRecordCreatePayload) {
    return request<ApiObjectResponse<{ scoreRecordId: number }>>('/score-records', {
      method: 'POST',
      token,
      body,
    });
  },
  createScoreRecordBatch(token: string, body: ScoreRecordBatchPayload) {
    return request<ApiObjectResponse<{ batchId: number }>>('/score-records/batch', {
      method: 'POST',
      token,
      body,
    });
  },
  createScoreRecordGroup(token: string, body: ScoreRecordGroupPayload) {
    return request<ApiObjectResponse<{ batchId: number }>>('/score-records/group', {
      method: 'POST',
      token,
      body,
    });
  },
  classScoreRecords(token: string, query?: { classId?: number }) {
    const params = new URLSearchParams();
    if (query?.classId) params.set('classId', String(query.classId));
    const suffix = params.size > 0 ? `?${params.toString()}` : '';
    return request<ApiListResponse<ClassScoreRecord>>(`/class-score-records${suffix}`, { token });
  },
  classScoreRankings(token: string, query: { gradeCode?: string; classId?: number }) {
    const params = new URLSearchParams();
    if (query.gradeCode) params.set('gradeCode', query.gradeCode);
    if (query.classId) params.set('classId', String(query.classId));
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
  scoreRulesTree(token: string) {
    return request<ApiListResponse<ScoreRuleTreeModule> | ApiObjectResponse<ScoreRuleTreeModule[]>>('/score-rules/tree', { token });
  },
  rewards(token: string, query?: { includeDisabled?: boolean }) {
    const params = new URLSearchParams();
    if (query?.includeDisabled) params.set('includeDisabled', 'true');
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
  analytics(token: string, query?: AnalyticsQuery) {
    const params = new URLSearchParams();
    if (query?.gradeName) params.set('gradeName', query.gradeName);
    if (query?.classId) params.set('classId', String(query.classId));
    if (query?.regenerateAi) params.set('regenerateAi', 'true');
    if (query?.startDate) params.set('startDate', query.startDate);
    if (query?.endDate) params.set('endDate', query.endDate);
    const suffix = params.size > 0 ? `?${params.toString()}` : '';
    return request<ApiObjectResponse<AnalyticsData>>(`/admin/analytics${suffix}`, { token });
  },
  analyticsReportStatus(token: string, query?: { classId?: number; gradeName?: string; startDate?: string; endDate?: string }) {
    const params = new URLSearchParams();
    if (query?.classId) params.set('classId', String(query.classId));
    if (query?.gradeName) params.set('gradeName', query.gradeName);
    if (query?.startDate) params.set('startDate', query.startDate);
    if (query?.endDate) params.set('endDate', query.endDate);
    const suffix = params.size > 0 ? `?${params.toString()}` : '';
    return request<ApiObjectResponse<AnalyticsReportStatus>>(`/admin/analytics/report-status${suffix}`, { token });
  },
  pets(token: string, category?: string) {
    const suffix = category ? `?category=${encodeURIComponent(category)}` : '';
    return request<ApiListResponse<PetCatalogItem>>(`/admin/pets${suffix}`, { token });
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
    return request<ApiObjectResponse<{ createdCount: number; createdClassCount?: number; studentIds: number[] }>>('/students/import', {
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
};

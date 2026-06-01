import type {
  AdminClass,
  AdminStudent,
  GradeConfig,
  Honor,
  PermissionUser,
  PetCatalogItem,
  Reward,
  ScoreRule,
  SessionScope,
  SessionUser,
  StudentImportPayload,
  SystemSettings,
} from '../lib/api';
import type { ReactNode } from 'react';

export type AdminState = {
  token: string | null;
  user: SessionUser | null;
  scopes: SessionScope[];
  classes: AdminClass[];
  students: AdminStudent[];
  rules: ScoreRule[];
  honors: Honor[];
  rewards: Reward[];
  loading: boolean;
  error: string | null;
};

export type ModalProps = {
  title: string;
  subtitle: string;
  onClose: () => void;
  children: ReactNode;
};

export type ClassFormState = {
  semesterId: string;
  code: string;
  gradeCode: string;
  gradeName: string;
  name: string;
  homeroomTeacherId: string;
  slogan: string;
  targetScore: string;
  countdownTitle: string;
  countdownDeadlineAt: string;
  displayStatus: string;
  sortOrder: string;
};

export type RuleFormState = {
  semesterId: string;
  moduleType: 'general' | 'subject';
  subjectCode: string;
  sceneCode: string;
  code: string;
  name: string;
  scoreType: 'add' | 'deduct';
  scoreTarget: 'student' | 'class';
  scoreValue: string;
  dimension: string;
  tag: string;
  sentiment: 'positive' | 'negative';
  aiSummaryText: string;
  description: string;
  allowedRoleCodes: string[];
  isHighFrequency: boolean;
  displayEnabled: boolean;
  adminEnabled: boolean;
};

export type RewardFormState = {
  code: string;
  name: string;
  scopeType: 'global' | 'class';
  classId: string;
  category: string;
  imageUrl: string;
  scoreCost: string;
  stockQty: string;
  isInfiniteStock: boolean;
};

export type HonorFormState = {
  code: string;
  name: string;
  category: Honor['category'];
  iconUrl: string;
  description: string;
  conditionType: string;
};

export type SchoolFormState = {
  code: string;
  name: string;
  englishName: string;
  motto: string;
  phone: string;
  address: string;
};

export type PetGrowthFormState = {
  thresholds: string[];
  classScoreStudentLinkMultiplier: string;
  petDecoChangeCost: string;
};

export type SemesterFormState = {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
};

export type DisplayFormState = {
  title: string;
  subtitle: string;
  bgImageUrl: string;
  weatherLabel: string;
  weatherLatitude: string;
  weatherLongitude: string;
  animationSpeed: string;
  defaultMode: string;
  allowSkipAnimation: boolean;
};

export type GradeConfigFormItem = {
  id?: number;
  name: string;
  sortOrder: string;
  status: string;
};

export type PermissionUserFormState = {
  name: string;
  username: string;
  roleCode: string;
  phone: string;
  classIds: string[];
  subjectScopeKeys: string[];
  resetPassword: boolean;
};

export type PetFormState = {
  code: string;
  name: string;
  category: string;
  rarity: string;
  sourceType: 'system' | 'custom';
  coverUrl: string;
  description: string;
  stages: Array<{
    stageNo: number;
    levelNo: number;
    name: string;
    imageUrl: string;
    needScoreTotal: string;
    animationKey: string;
  }>;
};

export const studentImportColumnAliases = {
  studentNo: ['准考证号', '考号', '学号', '学生学号', 'studentno', 'student_no', 'student no', '学籍号', '编号'],
  name: ['姓名', '学生姓名', 'name', 'studentname', 'student_name', 'student name'],
  className: ['班级', '班级名称', 'class', 'classname', 'class_name', 'class name'],
  gradeName: ['年级', '年级名称', 'grade', 'gradename', 'grade_name', 'grade name'],
  gender: ['性别', 'gender'],
  avatarUrl: ['头像', '头像地址', 'avatar', 'avatarurl', 'avatar_url', 'avatar url'],
} as const;

export type StudentImportColumnKey = keyof typeof studentImportColumnAliases;
export type StudentImportStudents = StudentImportPayload['students'];

export type UseAdminDataResult = AdminState & {
  refresh: () => void;
  setToken: (token: string | null) => void;
};

export type SchoolSettingsState = SystemSettings['school'] | null | undefined;
export type SemesterSettingsState = SystemSettings['semester'] | null | undefined;
export type DisplaySettingsState = SystemSettings['display'] | null | undefined;

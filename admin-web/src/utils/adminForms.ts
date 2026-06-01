import type { AdminClass, GradeConfig, Honor, PermissionUser, PetCatalogItem, Reward, ScoreRule, SystemSettings } from '../lib/api';
import { resolveRuleDimension } from '../constants/admin';
import type {
  ClassFormState,
  DisplayFormState,
  GradeConfigFormItem,
  HonorFormState,
  PermissionUserFormState,
  PetFormState,
  PetGrowthFormState,
  RewardFormState,
  RuleFormState,
  SchoolFormState,
  SemesterFormState,
} from '../types/admin';

export function createClassForm(defaultSemesterId?: number, row?: AdminClass): ClassFormState {
  const formatLocalDateTime = (value?: string | null) => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    const pad = (part: number) => String(part).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  };

  return {
    semesterId: String(row?.semesterId ?? defaultSemesterId ?? ''),
    code: row?.code ?? '',
    gradeCode: row?.gradeCode ?? '',
    gradeName: row?.gradeName ?? '',
    name: row?.name ?? '',
    homeroomTeacherId: row?.homeroomTeacher?.id ? String(row.homeroomTeacher.id) : '',
    slogan: row?.slogan ?? '',
    targetScore: row?.targetScore === null || row?.targetScore === undefined ? '' : String(row.targetScore),
    countdownTitle: row?.countdownTitle ?? '',
    countdownDeadlineAt: formatLocalDateTime(row?.countdownDeadlineAt),
    displayStatus: row?.displayStatus ?? 'enabled',
    sortOrder: row?.sortOrder === null || row?.sortOrder === undefined ? '' : String(row.sortOrder),
  };
}

export function slugifyCodePart(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function buildGradeCode(gradeName: string, classes: AdminClass[], gradeConfigs: GradeConfig[] = [], currentCode?: string) {
  if (currentCode) return currentCode;
  const trimmedGradeName = gradeName.trim();
  const matchedConfig = gradeConfigs.find((item) => item.name.trim() === trimmedGradeName && item.status === 'enabled');
  if (matchedConfig?.code) return matchedConfig.code;
  const matched = classes.find((item) => item.gradeName.trim() === trimmedGradeName && item.gradeCode);
  if (matched?.gradeCode) return matched.gradeCode;

  const slug = slugifyCodePart(trimmedGradeName);
  if (slug) return `grade-${slug}`;

  const uniqueGradeCount = new Set(classes.map((item) => item.gradeName.trim()).filter(Boolean)).size + 1;
  return `grade-${String(uniqueGradeCount).padStart(2, '0')}`;
}

export function buildClassCode(
  semesterId: string,
  gradeCode: string,
  className: string,
  classes: AdminClass[],
  currentCode?: string,
) {
  if (currentCode) return currentCode;
  const trimmedClassName = className.trim();
  const matched = classes.find((item) => item.name.trim() === trimmedClassName && item.code);
  if (matched?.code) return matched.code;

  const siblingCount = classes.filter((item) => item.gradeCode === gradeCode).length + 1;
  const classSlug = slugifyCodePart(trimmedClassName);
  const suffix = classSlug || `class-${String(siblingCount).padStart(2, '0')}`;
  return `cls-${semesterId}-${gradeCode}-${suffix}`;
}

export function buildSortOrder(gradeCode: string, classes: AdminClass[], currentSortOrder?: string) {
  if (currentSortOrder?.trim()) return Number(currentSortOrder);
  const sameGradeOrders = classes
    .filter((item) => item.gradeCode === gradeCode)
    .map((item) => item.sortOrder)
    .filter((value): value is number => typeof value === 'number');

  return sameGradeOrders.length > 0 ? Math.max(...sameGradeOrders) + 1 : classes.filter((item) => item.gradeCode === gradeCode).length + 1;
}

export function buildAutoCode(prefix: string, name: string, currentCode?: string) {
  if (currentCode?.trim()) return currentCode.trim();
  const slug = slugifyCodePart(name);
  return `${prefix}-${slug || 'item'}`;
}

export function createRuleForm(defaultSemesterId?: number, row?: ScoreRule): RuleFormState {
  return {
    semesterId: String(row?.semesterId ?? defaultSemesterId ?? ''),
    moduleType: row?.moduleType ?? 'general',
    subjectCode: row?.subjectCode ?? '',
    sceneCode: row?.sceneCode ?? '',
    code: row?.code ?? '',
    name: row?.name ?? '',
    scoreType: row?.scoreType ?? 'add',
    scoreTarget: row?.scoreTarget ?? 'student',
    scoreValue: row?.scoreValue === undefined ? '2' : String(row.scoreValue),
    dimension: row?.dimension ?? resolveRuleDimension(row?.sceneCode, row?.scoreType ?? 'add'),
    tag: row?.tag ?? '',
    sentiment: row?.sentiment ?? 'positive',
    aiSummaryText: row?.aiSummaryText ?? '',
    description: row?.description ?? '',
    allowedRoleCodes: row?.allowedRoleCodes ?? [],
    isHighFrequency: row?.isHighFrequency ?? false,
    displayEnabled: row?.displayEnabled ?? true,
    adminEnabled: row?.adminEnabled ?? true,
  };
}

export function createRewardForm(row?: Reward): RewardFormState {
  return {
    code: row?.code ?? '',
    name: row?.name ?? '',
    scopeType: row?.scopeType ?? 'global',
    classId: row?.classId ? String(row.classId) : '',
    category: row?.category ?? '',
    imageUrl: row?.imageUrl ?? '',
    scoreCost: row?.scoreCost === undefined ? '20' : String(row.scoreCost),
    stockQty: row?.stockQty === null || row?.stockQty === undefined ? '' : String(row.stockQty),
    isInfiniteStock: row?.isInfiniteStock ?? false,
  };
}

export function createHonorForm(row?: Honor): HonorFormState {
  return {
    code: row?.code ?? '',
    name: row?.name ?? '',
    category: row?.category ?? 'personal',
    iconUrl: row?.iconUrl ?? '',
    description: row?.description ?? '',
    conditionType: row?.conditionType ?? '',
  };
}

export function createSchoolForm(settings?: SystemSettings['school'] | null): SchoolFormState {
  return {
    code: settings?.code ?? '',
    name: settings?.name ?? '',
    englishName: settings?.englishName ?? '',
    motto: settings?.motto ?? '',
    phone: settings?.phone ?? '',
    address: settings?.address ?? '',
  };
}

export function createPetGrowthForm(school?: SystemSettings['school'] | null): PetGrowthFormState {
  const fallbackThresholds = [0, 140, 240, 360, 500, 660, 840, 1040, 1260, 1500];
  const thresholds = school?.petGrowth?.thresholds?.length === 10 ? school.petGrowth.thresholds : fallbackThresholds;

  return {
    thresholds: thresholds.map(String),
    classScoreStudentLinkMultiplier: String(school?.classScoreStudentLinkMultiplier ?? 0),
    petDecoChangeCost: String(school?.petDecoChangeCost ?? 10),
  };
}

export function createSemesterForm(semester?: SystemSettings['semester'] | null): SemesterFormState {
  const formatDate = (value?: string | null) => (value ? new Date(value).toISOString().slice(0, 10) : '');
  return {
    id: semester?.id ? String(semester.id) : '',
    name: semester?.name ?? '',
    startDate: formatDate(semester?.startDate),
    endDate: formatDate(semester?.endDate),
  };
}

export function createDisplayForm(display?: SystemSettings['display'] | null): DisplayFormState {
  return {
    title: display?.title ?? '',
    subtitle: display?.subtitle ?? '',
    bgImageUrl: display?.bgImageUrl ?? '',
    weatherLabel: display?.weatherLabel ?? '大理',
    weatherLatitude:
      display?.weatherLatitude === undefined || display?.weatherLatitude === null
        ? '25.6065'
        : String(display.weatherLatitude),
    weatherLongitude:
      display?.weatherLongitude === undefined || display?.weatherLongitude === null
        ? '100.2676'
        : String(display.weatherLongitude),
    animationSpeed: display?.animationSpeed ?? 'normal',
    defaultMode: display?.defaultMode ?? 'daily',
    allowSkipAnimation: display?.allowSkipAnimation ?? true,
  };
}

export function createPermissionUserForm(row?: PermissionUser): PermissionUserFormState {
  return {
    name: row?.name ?? '',
    username: row?.username ?? '',
    roleCode: row?.roleCode ?? 'homeroom_teacher',
    phone: row?.phone ?? '',
    classIds: row?.classIds?.map(String) ?? [],
    subjectScopeKeys: row?.subjectScopes?.map((item) => `${item.classId}:${item.subjectCode}`) ?? [],
    resetPassword: false,
  };
}

export function createGradeConfigForm(grades: GradeConfig[] = []): GradeConfigFormItem[] {
  return grades.map((item, index) => ({
    id: item.id,
    name: item.name,
    sortOrder: String(item.sortOrder ?? index + 1),
    status: item.status ?? 'enabled',
  }));
}

export function createPetForm(row?: PetCatalogItem, defaultThresholds?: number[]): PetFormState {
  const fallbackThresholds = [0, 140, 240, 360, 500, 660, 840, 1040, 1260, 1500];
  const defaultStageExp = defaultThresholds?.length === 10 ? defaultThresholds : fallbackThresholds;
  const stages = Array.from({ length: 10 }, (_, index) => {
    const stageNo = index + 1;
    const matched = row?.stages?.find((item) => item.stageNo === stageNo);
    return {
      stageNo,
      levelNo: stageNo,
      name: matched?.name ?? `${row?.name ?? ''}${row?.name ? '·' : ''}Lv.${stageNo}`,
      imageUrl: matched?.imageUrl ?? row?.coverUrl ?? '',
      needScoreTotal: String(matched?.needScoreTotal ?? defaultStageExp[index]),
      animationKey: matched?.animationKey ?? 'pet-level-up',
    };
  });

  return {
    code: row?.code ?? '',
    name: row?.name ?? '',
    category: row?.category ?? '',
    rarity: row?.rarity ?? '',
    sourceType: row?.sourceType ?? 'custom',
    coverUrl: row?.coverUrl ?? '',
    description: row?.description ?? '',
    stages,
  };
}

export function normalizeKeyword(value: string) {
  return value.trim().toLowerCase();
}

export function formatEnabledStatus(status?: string | null, enabledLabel = '启用中', disabledLabel = '未启用') {
  return status === 'enabled' ? enabledLabel : disabledLabel;
}

const permissionScopeTokenLabels: Record<string, string> = {
  school: '全校',
  grade: '年级范围',
  class_scope: '班级范围',
  subject_class: '学科班级',
};

/** 将负责范围中的英文 scope 标识转为中文展示 */
export function formatPermissionScopeDisplay(value?: string | null) {
  const text = String(value ?? '').trim();
  if (!text) return '全校范围';
  if (permissionScopeTokenLabels[text]) return permissionScopeTokenLabels[text];
  return text
    .split('、')
    .map((part) => permissionScopeTokenLabels[part.trim()] ?? part.trim())
    .join('、');
}

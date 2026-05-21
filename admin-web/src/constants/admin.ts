export const navItems = [
  ['dashboard', '校级驾驶舱'],
  ['analytics', '数据分析'],
  ['students', '学生管理'],
  ['teachers', '教师管理'],
  ['classes', '班级管理'],
  ['evaluation', '学生评价'],
  ['class-evaluation', '班级评价'],
  ['rules', '积分规则'],
  ['honors', '荣誉勋章'],
  ['rewards', '奖励中心'],
  ['pets', '萌宠图鉴'],
  ['organization', '安全中心'],
  ['settings', '系统设置'],
] as const;

export type NavKey = (typeof navItems)[number][0];

export const metricThemes = ['mc-blue', 'mc-green', 'mc-purple', 'mc-red', 'mc-gold', 'mc-teal'] as const;

export const roleAccessMap: Record<string, NavKey[]> = {
  super_admin: navItems.map(([key]) => key),
  school_admin: navItems.map(([key]) => key),
  academic_admin: ['dashboard', 'analytics', 'students', 'teachers', 'classes', 'evaluation', 'class-evaluation', 'organization'],
  moral_admin: ['dashboard', 'analytics', 'students', 'evaluation', 'class-evaluation', 'rules', 'honors', 'rewards', 'pets'],
  grade_admin: navItems.map(([key]) => key),
  // 侧边栏顺序由 adminPermissions.getAccessibleNavItems 中 TEACHER_NAV_ORDER_* 编排
  homeroom_teacher: ['dashboard', 'evaluation', 'students', 'classes', 'rules', 'rewards', 'pets', 'analytics'],
  // 任课教师可通过工作台链到 /rules 查阅规则，侧边栏不显式列出（见 canAccessNav 例外）
  subject_teacher: ['dashboard', 'evaluation', 'students', 'classes', 'analytics'],
};

export const roleNavLabelMap: Record<string, Partial<Record<NavKey, string>>> = {
  homeroom_teacher: {
    dashboard: '班级工作台',
    classes: '我的班级',
    students: '学生管理',
    evaluation: '学生评价',
    rules: '积分规则查阅',
    rewards: '兑换处理',
    pets: '萌宠图鉴',
    analytics: '班级概览',
  },
  subject_teacher: {
    dashboard: '教学工作台',
    classes: '我的授课班级',
    students: '学生查看',
    evaluation: '学科评价',
    analytics: '教学复盘',
  },
};

/** 教师侧栏：与工作台 / 概览分工配套的简短副标题 */
export const roleNavHintMap: Record<string, Partial<Record<NavKey, string>>> = {
  homeroom_teacher: {
    dashboard: '今日待办',
    analytics: '周期复盘',
  },
  subject_teacher: {
    dashboard: '日常办事',
    analytics: '区间分析',
  },
};

export const ruleModuleOptions = [
  { value: 'general', label: '班级通用' },
  { value: 'subject', label: '学科专项' },
] as const;

export const ruleSceneOptions = [
  { value: 'attendance', label: '出勤' },
  { value: 'behavior', label: '行为规范' },
  { value: 'classroom', label: '课堂' },
  { value: 'competition', label: '竞赛' },
  { value: 'dictation', label: '听写默写' },
  { value: 'discipline', label: '纪律' },
  { value: 'equipment', label: '器材设备' },
  { value: 'exam', label: '测评' },
  { value: 'group', label: '小组合作' },
  { value: 'homework', label: '作业' },
  { value: 'presentation', label: '展讲' },
  { value: 'qa', label: '答疑互动' },
  { value: 'reading', label: '早读' },
  { value: 'recitation', label: '背诵' },
  { value: 'self_study', label: '自习' },
  { value: 'activity', label: '活动' },
] as const;

export const ruleSubjectOptions = [
  { value: 'chinese', label: '语文' },
  { value: 'math', label: '数学' },
  { value: 'english', label: '英语' },
  { value: 'physics', label: '物理' },
  { value: 'chemistry', label: '化学' },
  { value: 'geography', label: '地理' },
  { value: 'biology', label: '生物' },
  { value: 'history', label: '历史' },
  { value: 'politics', label: '政治' },
  { value: 'computer', label: '计算机' },
  { value: 'art', label: '美术' },
  { value: 'music', label: '音乐' },
  { value: 'pe', label: '体育' },
] as const;
export const ruleDimensionOptions = ['课堂表现', '学习习惯', '文明礼仪', '团队合作', '劳动实践', '品德成长'] as const;
export const ruleTagOptions = ['常规加分', '课堂提醒', '表扬激励', '成长记录', '班级荣誉', '展示播报'] as const;

export const ruleModuleLabelMap: Record<string, string> = {
  general: '班级通用',
  subject: '学科专项',
};

export const ruleSceneLabelMap: Record<string, string> = Object.fromEntries(
  ruleSceneOptions.map((item) => [item.value, item.label]),
);

export const ruleSubjectLabelMap: Record<string, string> = Object.fromEntries(
  ruleSubjectOptions.map((item) => [item.value, item.label]),
);

/** 扩展别名：与后端、成绩单等来源的 code 对齐 */
const subjectLabelAliasMap: Record<string, string> = {
  ...ruleSubjectLabelMap,
  mathematics: '数学',
  sport: '体育',
  it: '信息',
  general: '通用',
  arts_it: '音美信综合',
};

/** 将学科 code 或可能为英文的 name 统一解析为中文展示名 */
export function resolveSubjectLabel(
  subjectCode?: string | null,
  subjectName?: string | null,
): string {
  const code = String(subjectCode ?? '').trim().toLowerCase();
  const name = String(subjectName ?? '').trim();

  if (code && subjectLabelAliasMap[code]) {
    return subjectLabelAliasMap[code];
  }

  if (name) {
    const fromName = subjectLabelAliasMap[name.toLowerCase()];
    if (fromName) return fromName;
    // 已是中文等非 slug 形式，直接使用
    if (!/^[a-z][a-z0-9_]*$/i.test(name)) return name;
    return subjectLabelAliasMap[name.toLowerCase()] ?? name;
  }

  if (code) return subjectLabelAliasMap[code] ?? code;
  return '—';
}

export function resolveRuleDimension(sceneCode?: string, scoreType: 'add' | 'deduct' = 'add') {
  switch (sceneCode) {
    case 'homework':
      return '作业管理';
    case 'exam':
    case 'dictation':
    case 'recitation':
      return '学业成绩';
    case 'attendance':
      return '出勤习惯';
    case 'discipline':
    case 'behavior':
      return '课堂纪律';
    default:
      return scoreType === 'deduct' ? '自我管理' : '课堂学习';
  }
}

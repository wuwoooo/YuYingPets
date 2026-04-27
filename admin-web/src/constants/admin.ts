export const navItems = [
  ['dashboard', '校级驾驶舱'],
  ['analytics', '数据分析'],
  ['students', '学生管理'],
  ['teachers', '教师管理'],
  ['classes', '班级管理'],
  ['evaluation', '班级评价'],
  ['rules', '积分规则'],
  ['honors', '荣誉勋章'],
  ['rewards', '奖励中心'],
  ['pets', '萌宠图鉴'],
  ['organization', '组织权限'],
  ['settings', '系统设置'],
] as const;

export type NavKey = (typeof navItems)[number][0];

export const metricThemes = ['mc-blue', 'mc-green', 'mc-purple', 'mc-red', 'mc-gold', 'mc-teal'] as const;

export const roleAccessMap: Record<string, NavKey[]> = {
  super_admin: navItems.map(([key]) => key),
  school_admin: navItems.map(([key]) => key),
  moral_admin: navItems.map(([key]) => key),
  homeroom_teacher: ['dashboard', 'classes', 'students', 'evaluation', 'rules', 'rewards', 'pets', 'analytics'],
  subject_teacher: ['dashboard', 'classes', 'students', 'evaluation', 'rules', 'analytics'],
};

export const roleNavLabelMap: Record<string, Partial<Record<NavKey, string>>> = {
  homeroom_teacher: {
    dashboard: '班级工作台',
    classes: '我的班级',
    students: '学生管理',
    evaluation: '班级评价',
    rules: '规则查询',
    rewards: '兑换处理',
    pets: '萌宠图鉴',
    analytics: '班级概览',
  },
  subject_teacher: {
    dashboard: '教学工作台',
    classes: '我的授课班级',
    students: '学生查看',
    evaluation: '学科评价',
    rules: '规则查询',
    analytics: '教学概览',
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
  { value: 'arts_it', label: '音美信综合' },
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

/** 操作审计页：筛选下拉的中文展示（value 仍为后端 module / action 原值） */

export const AUDIT_MODULE_FILTER_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: '全部模块' },
  { value: 'permission_user', label: '教师账号与权限' },
  { value: 'school', label: '学校信息' },
  { value: 'semester', label: '学期设置' },
  { value: 'display_config', label: '大屏展示配置' },
  { value: 'grade_config', label: '年级结构' },
  { value: 'school_pet_growth', label: '萌宠成长参数' },
  { value: 'student', label: '学生档案' },
  { value: 'academic', label: '学业成绩' },
  { value: 'class', label: '班级' },
  { value: 'class_group', label: '班级小组' },
  { value: 'class_score_record', label: '班级积分记录' },
  { value: 'score_record', label: '学生积分记录' },
  { value: 'honor', label: '荣誉勋章' },
  { value: 'reward', label: '兑换奖品' },
  { value: 'reward_order', label: '兑换订单' },
  { value: 'pet', label: '萌宠图鉴' },
  { value: 'display_terminal', label: '大屏终端' },
  { value: 'display', label: '大屏解锁' },
  { value: 'ai_student_snapshot', label: 'AI 成长摘要' },
  { value: 'teacher_observation', label: '教师观测记录' },
  { value: 'student_pet', label: '学生领养萌宠' },
];

const AUDIT_ACTION_OPTIONS_BY_MODULE: Record<string, { value: string; label: string }[]> = {
  permission_user: [
    { value: 'create', label: '新建教师账号' },
    { value: 'update', label: '修改教师账号资料' },
    { value: 'reset_password', label: '重置登录密码' },
    { value: 'import_teachers', label: '批量导入教师' },
    { value: 'update_status', label: '启用或停用账号' },
  ],
  school: [{ value: 'update', label: '修改学校基础信息' }],
  semester: [{ value: 'update', label: '调整学期配置' }],
  display_config: [{ value: 'update', label: '修改大屏展示参数' }],
  grade_config: [{ value: 'update', label: '调整年级班级结构' }],
  school_pet_growth: [{ value: 'update', label: '修改萌宠成长规则' }],
  student: [
    { value: 'import', label: '批量导入学生' },
    { value: 'update', label: '修改学生信息' },
  ],
  academic: [{ value: 'import', label: '导入学业成绩' }],
  class: [
    { value: 'create', label: '新建班级' },
    { value: 'update', label: '修改班级信息' },
  ],
  class_group: [{ value: 'update_members', label: '调整班级小组成员' }],
  class_score_record: [
    { value: 'create', label: '录入班级积分' },
    { value: 'batch_create', label: '批量录入班级积分' },
  ],
  score_record: [
    { value: 'create', label: '为学生加减分' },
    { value: 'batch_create', label: '批量加减分' },
    { value: 'group_create', label: '按小组加减分' },
  ],
  honor: [
    { value: 'create', label: '新建荣誉类型' },
    { value: 'update', label: '修改荣誉类型' },
    { value: 'status_update', label: '启用或停用荣誉' },
    { value: 'grant', label: '授予荣誉' },
  ],
  reward: [
    { value: 'create', label: '新建兑换奖品' },
    { value: 'update', label: '修改兑换奖品' },
    { value: 'status_update', label: '启用或停用奖品' },
    { value: 'delete', label: '删除奖品' },
  ],
  reward_order: [{ value: 'create', label: '登记兑换订单' }],
  pet: [
    { value: 'create', label: '新建自定义萌宠' },
    { value: 'update', label: '修改萌宠配置' },
    { value: 'status_update', label: '启用或停用萌宠' },
    { value: 'delete', label: '删除萌宠' },
  ],
  display_terminal: [{ value: 'initialize', label: '初始化大屏终端' }],
  display: [
    { value: 'unlock', label: '解锁大屏展示' },
    { value: 'lock', label: '锁定大屏展示' },
  ],
  ai_student_snapshot: [{ value: 'generate', label: '生成 AI 摘要' }],
  teacher_observation: [{ value: 'create', label: '撰写教师观测' }],
  student_pet: [{ value: 'adopt', label: '学生领养萌宠' }],
};

export function getAuditActionFilterOptions(moduleValue: string): { value: string; label: string }[] {
  const base = [{ value: '', label: '全部操作' }];
  if (!moduleValue) {
    return base;
  }
  const extra = AUDIT_ACTION_OPTIONS_BY_MODULE[moduleValue];
  return extra ? [...base, ...extra] : base;
}

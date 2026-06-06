import type { Prisma } from '@prisma/client';

/** 「重点关注」筛选：权限、系统配置、批量导入、高风险业务变更 */
export const AUDIT_SENSITIVE_SCOPE_OR: Prisma.OperationLogWhereInput[] = [
  { module: 'permission_user', action: { in: ['reset_password', 'import_teachers', 'update_status', 'create', 'update'] } },
  { module: 'school', action: 'update' },
  { module: 'semester', action: 'update' },
  { module: 'display_config', action: 'update' },
  { module: 'grade_config', action: 'update' },
  { module: 'school_pet_growth', action: 'update' },
  { module: 'student', action: 'import' },
  { module: 'academic', action: 'import' },
  { module: 'class', action: { in: ['create', 'update'] } },
  { module: 'pet', action: { in: ['delete', 'status_update', 'create', 'update'] } },
  { module: 'reward', action: { in: ['delete', 'status_update', 'create', 'update'] } },
  { module: 'honor', action: { in: ['grant', 'create', 'update', 'status_update'] } },
];

const MODULE_LABEL: Record<string, string> = {
  permission_user: '教师账号与权限',
  school: '学校信息',
  semester: '学期设置',
  display_config: '大屏展示配置',
  grade_config: '年级结构',
  school_pet_growth: '萌宠成长参数',
  student: '学生档案',
  academic: '学业成绩',
  class: '班级',
  class_group: '班级小组',
  class_score_record: '班级积分记录',
  score_record: '学生积分记录',
  honor: '荣誉勋章',
  reward: '兑换奖品',
  reward_order: '兑换订单',
  pet: '萌宠图鉴',
  display_terminal: '大屏终端',
  display: '大屏解锁',
  ai_student_snapshot: 'AI 成长摘要',
  teacher_observation: '教师观测记录',
  student_pet: '学生领养萌宠',
};

/** 复合键 module.action → 动作中文（优先） */
const ACTION_LABEL_COMPOSITE: Record<string, string> = {
  'permission_user.create': '新建教师账号',
  'permission_user.update': '修改教师账号资料',
  'permission_user.reset_password': '重置教师登录密码',
  'permission_user.import_teachers': '批量导入教师',
  'permission_user.update_status': '启用或停用账号',
  'school.update': '修改学校基础信息',
  'semester.update': '调整学期配置',
  'display_config.update': '修改大屏展示参数',
  'grade_config.update': '调整年级班级结构',
  'school_pet_growth.update': '修改萌宠成长规则',
  'student.import': '批量导入学生',
  'student.update': '修改学生信息',
  'academic.import': '导入学业成绩',
  'class.create': '新建班级',
  'class.update': '修改班级信息',
  'class_group.update_members': '调整班级小组成员',
  'class_score_record.create': '录入班级积分',
  'class_score_record.batch_create': '批量录入班级积分',
  'class_score_record.reverse': '撤销班级评价',
  'score_record.create': '为学生加减分',
  'score_record.batch_create': '批量为学生加减分',
  'score_record.group_create': '按小组加减分',
  'score_record.reverse': '撤销学生评价',
  'honor.create': '新建荣誉类型',
  'honor.update': '修改荣誉类型',
  'honor.status_update': '启用或停用荣誉',
  'honor.grant': '授予荣誉',
  'reward.create': '新建兑换奖品',
  'reward.update': '修改兑换奖品',
  'reward.status_update': '启用或停用奖品',
  'reward.delete': '删除兑换奖品',
  'reward_order.create': '登记兑换订单',
  'pet.create': '新建自定义萌宠',
  'pet.update': '修改萌宠配置',
  'pet.status_update': '启用或停用萌宠',
  'pet.delete': '删除萌宠',
  'display_terminal.initialize': '初始化大屏终端',
  'display_terminal.delete': '删除大屏终端',
  'display.unlock': '解锁大屏展示',
  'display.lock': '锁定大屏展示',
  'ai_student_snapshot.generate': '生成学生 AI 摘要',
  'teacher_observation.create': '撰写教师观测',
  'student_pet.adopt': '学生领养萌宠',
  'student_pet.reset': '重置学生萌宠为未领取',
};

const GENERIC_ACTION: Record<string, string> = {
  create: '新建',
  update: '修改',
  delete: '删除',
  import: '导入',
  grant: '授予',
  generate: '生成',
  initialize: '初始化',
  unlock: '解锁',
  lock: '锁定',
  adopt: '领养',
  status_update: '调整启用状态',
  batch_create: '批量录入',
  group_create: '按小组操作',
  reset_password: '重置密码',
  update_members: '调整成员',
};

export type AuditPresentSource = {
  module: string;
  action: string;
  terminalType: string;
  targetType: string | null;
  targetId: number | null;
  detail: unknown;
  operatorName: string | null;
  operatorUsername: string | null;
  roleCode: string | null;
};

const ROLE_LABEL: Record<string, string> = {
  super_admin: '超级管理员',
  school_admin: '学校管理员',
  academic_admin: '教务管理员',
  moral_admin: '德育管理员',
  grade_admin: '年级管理员',
  homeroom_teacher: '班主任',
  subject_teacher: '学科教师',
};

function asDetailRecord(detail: unknown): Record<string, unknown> {
  return detail && typeof detail === 'object' && !Array.isArray(detail) ? (detail as Record<string, unknown>) : {};
}

export function getAuditModuleLabel(module: string): string {
  return MODULE_LABEL[module] ?? `业务模块（${module}）`;
}

export function getAuditActionLabel(module: string, action: string): string {
  const composite = ACTION_LABEL_COMPOSITE[`${module}.${action}`];
  if (composite) return composite;
  return GENERIC_ACTION[action] ?? `操作（${action}）`;
}

/** 敏感度：用于列表角标与筛选「重点关注」的子集对照 */
export function getAuditSensitivity(module: string, action: string): 'high' | 'medium' | 'normal' {
  const key = `${module}.${action}`;
  const highKeys = new Set([
    'permission_user.reset_password',
    'permission_user.import_teachers',
    'permission_user.update_status',
    'school.update',
    'semester.update',
    'display_config.update',
    'grade_config.update',
    'school_pet_growth.update',
    'student.import',
    'academic.import',
    'pet.delete',
    'reward.delete',
    'honor.grant',
  ]);
  const mediumKeys = new Set([
    'permission_user.create',
    'permission_user.update',
    'class.create',
    'class.update',
    'pet.status_update',
    'reward.status_update',
    'honor.status_update',
    'honor.create',
    'honor.update',
    'pet.create',
    'pet.update',
    'reward.create',
    'reward.update',
    'student.update',
  ]);
  if (highKeys.has(key)) return 'high';
  if (mediumKeys.has(key)) return 'medium';
  return 'normal';
}

function terminalPhrase(terminalType: string): string {
  return terminalType === 'display' ? '大屏终端' : '管理后台';
}

function operatorPhrase(row: AuditPresentSource): string {
  const name = row.operatorName?.trim() || '';
  const username = row.operatorUsername?.trim() || '';
  const role = row.roleCode ? ROLE_LABEL[row.roleCode] ?? row.roleCode : '';
  if (name && username) {
    return role ? `${name}（${username}，${role}）` : `${name}（${username}）`;
  }
  if (name) {
    return role ? `${name}（${role}）` : name;
  }
  if (username) {
    return role ? `${username}（${role}）` : username;
  }
  return '某位操作者';
}

function pickNum(d: Record<string, unknown>, ...keys: string[]): number | null {
  for (const k of keys) {
    const v = d[k];
    if (typeof v === 'number' && Number.isFinite(v)) return v;
  }
  return null;
}

function pickStr(d: Record<string, unknown>, ...keys: string[]): string | null {
  for (const k of keys) {
    const v = d[k];
    if (typeof v === 'string' && v.trim()) return v.trim();
  }
  return null;
}

/** 生成管理员可读的一句话摘要 */
export function buildAuditSummary(row: AuditPresentSource): string {
  const op = operatorPhrase(row);
  const term = terminalPhrase(row.terminalType);
  const d = asDetailRecord(row.detail);
  const tid = row.targetId;
  const key = `${row.module}.${row.action}`;

  switch (key) {
    case 'permission_user.reset_password':
      return `${op} 在${term}将教师账号（内部编号 ${tid ?? '—'}）的登录密码重置为系统临时口令，请通知对方尽快修改密码。`;
    case 'permission_user.update_status': {
      const st = pickStr(d, 'status');
      const verb =
        st === 'disabled' ? '停用' : st === 'enabled' ? '启用' : '调整了状态';
      return `${op} 在${term}${verb}了教师账号（内部编号 ${tid ?? '—'}）。`;
    }
    case 'permission_user.import_teachers': {
      const created = pickNum(d, 'createdCount');
      const updated = pickNum(d, 'updatedCount');
      const parts = [
        created != null ? `新建 ${created} 人` : null,
        updated != null ? `更新 ${updated} 人` : null,
      ].filter(Boolean);
      return `${op} 在${term}批量维护教师账号${parts.length ? `（${parts.join('，')}）` : ''}。`;
    }
    case 'permission_user.create':
      return `${op} 在${term}新建了一名教师账号（内部编号 ${tid ?? '—'}）。`;
    case 'permission_user.update':
      return `${op} 在${term}修改了教师账号资料（内部编号 ${tid ?? '—'}）。`;
    case 'school.update':
      return `${op} 在${term}修改了学校基础设置（名称、联系方式等）。`;
    case 'semester.update':
      return `${op} 在${term}调整了当前学期或学年相关配置。`;
    case 'display_config.update':
      return `${op} 在${term}修改了大屏展示相关参数。`;
    case 'grade_config.update':
      return `${op} 在${term}调整了年级或班级结构配置。`;
    case 'school_pet_growth.update':
      return `${op} 在${term}修改了萌宠成长/积分兑换相关规则。`;
    case 'student.import': {
      const created = pickNum(d, 'createdCount');
      const updated = pickNum(d, 'updatedCount');
      const changed = pickNum(d, 'classChangedCount');
      const unchanged = pickNum(d, 'unchangedCount');
      const parts = [
        created != null ? `新增 ${created} 条` : null,
        updated != null ? `更新 ${updated} 条` : null,
        changed != null ? `调班 ${changed} 条` : null,
        unchanged != null ? `未变更 ${unchanged} 条` : null,
      ].filter(Boolean);
      return `${op} 在${term}批量同步学生名册${parts.length ? `（${parts.join('，')}）` : ''}。`;
    }
    case 'student.update':
      return `${op} 在${term}修改了学生档案（学生内部编号 ${tid ?? '—'}）。`;
    case 'academic.import': {
      const exam = pickStr(d, 'examName');
      return `${op} 在${term}导入了一次学业成绩${exam ? `（${exam}）` : ''}。`;
    }
    case 'class.create':
      return `${op} 在${term}新建了班级「${pickStr(d, 'name') ?? '未命名'}」。`;
    case 'class.update':
      return `${op} 在${term}修改了班级资料（班级内部编号 ${tid ?? '—'}）。`;
    case 'class_group.update_members':
      return `${op} 在${term}调整了某个班级的小组划分或成员。`;
    case 'display_terminal.initialize':
      return `${op} 在大屏侧初始化了班级展示终端（终端编号见明细）。`;
    case 'display_terminal.delete':
      return `${op} 在${term}删除了大屏终端${pickStr(d, 'terminalName') ? `「${pickStr(d, 'terminalName')}」` : ''}。`;
    case 'display.unlock':
      return `${op} 在大屏侧解锁了班级展示内容。`;
    case 'display.lock':
      return `${op} 在大屏侧锁定了班级展示内容。`;
    case 'honor.grant':
      return `${op} 在${term}为学生或班级授予了荣誉记录。`;
    case 'reward_order.create':
      return `${op} 在${term}登记了一条奖品兑换记录（涉及学生内部编号 ${tid ?? '—'}）。`;
    case 'pet.delete':
      return `${op} 在${term}删除了自定义萌宠配置${pickStr(d, 'name') ? `「${pickStr(d, 'name')}」` : ''}。`;
    case 'reward.delete':
      return `${op} 在${term}删除了兑换奖品${pickStr(d, 'name') ? `「${pickStr(d, 'name')}」` : ''}。`;
    default: {
      const mod = getAuditModuleLabel(row.module);
      const act = getAuditActionLabel(row.module, row.action);
      const targetHint =
        tid != null ? `关联对象内部编号 ${tid}` : row.targetType ? `对象类型：${row.targetType}` : '';
      return `${op} 在${term}执行「${mod} → ${act}」${targetHint ? `（${targetHint}）` : ''}。`;
    }
  }
}

import type { ScoreRecord, SessionUser } from '../lib/api';

const WRITE_SCORE_ROLES = [
  'homeroom_teacher',
  'subject_teacher',
  'school_admin',
  'academic_admin',
  'grade_admin',
  'moral_admin',
  'super_admin',
] as const;

const ADMIN_REVERSE_ROLES = [
  'school_admin',
  'academic_admin',
  'grade_admin',
  'moral_admin',
  'super_admin',
] as const;

const REVERSE_WINDOW_MS = 24 * 60 * 60 * 1000;

/** 是否可在前端展示撤销按钮（后端仍会强校验） */
export function canShowScoreRecordReverse(
  record: ScoreRecord,
  user: SessionUser | null,
  options?: { homeroomClassIds?: number[] },
): boolean {
  if (!user) return false;
  if (record.id <= 0 || record.reversedAt) return false;
  if (!WRITE_SCORE_ROLES.includes(user.roleCode as (typeof WRITE_SCORE_ROLES)[number])) {
    return false;
  }

  if (ADMIN_REVERSE_ROLES.includes(user.roleCode as (typeof ADMIN_REVERSE_ROLES)[number])) {
    return true;
  }

  const homeroomClassIds = options?.homeroomClassIds ?? [];
  if (homeroomClassIds.includes(record.classId)) {
    return true;
  }

  if (record.operatorId === user.id) {
    return Date.now() - new Date(record.createdAt).getTime() <= REVERSE_WINDOW_MS;
  }

  return false;
}

export function formatScoreRecordLabel(record: ScoreRecord) {
  return record.ruleName || record.tag || record.dimension || record.sceneCode || '评价记录';
}

export function formatScoreDelta(scoreDelta: number) {
  return `${scoreDelta > 0 ? '+' : ''}${scoreDelta} 分`;
}

export function formatScoreRecordTime(value: string) {
  return new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(value));
}

const ROLE_LABEL_MAP: Record<string, string> = {
  homeroom_teacher: '班主任',
  subject_teacher: '任课教师',
  school_admin: '校管',
  academic_admin: '教务',
  grade_admin: '年级主任',
  moral_admin: '德育',
  super_admin: '管理员',
  display_account: '展示端',
};

export function formatScoreRecordOperator(record: ScoreRecord) {
  if (record.operatorName?.trim()) return record.operatorName.trim();
  if (record.sourceRole && ROLE_LABEL_MAP[record.sourceRole]) {
    return ROLE_LABEL_MAP[record.sourceRole];
  }
  return record.sourceRole || '教师';
}

export function formatScoreRecordExtraRemark(record: ScoreRecord, label: string) {
  const remark = record.remark?.trim();
  if (!remark || remark === label) return null;
  if (remark.includes(label) || label.includes(remark)) return null;
  return remark;
}

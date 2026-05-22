import type { AdminClass, PermissionUser } from '../lib/api';
import { formatPermissionScopeDisplay } from './adminForms';

/** 完整负责范围文案，用于悬停提示与详情 */
export function buildPermissionScopeDetail(row: PermissionUser, classes: AdminClass[]) {
  if (row.subjectScopes.length > 0) {
    return Array.from(
      new Set(
        row.subjectScopes.map((item) => {
          const classLabel = item.className ?? `班级${item.classId}`;
          return `${classLabel}·${item.subjectLabel}`;
        }),
      ),
    ).join('、');
  }

  const classNames = classes
    .filter((item) => row.classIds.includes(item.id))
    .map((item) => item.name);
  return classNames.join('、') || formatPermissionScopeDisplay(row.scopeDisplay) || '未分配负责范围';
}

/** 列表中的负责范围摘要，避免占满整行 */
export function formatPermissionScopeForTable(row: PermissionUser, classes: AdminClass[]) {
  const detail = buildPermissionScopeDetail(row, classes);
  if (detail === '未分配负责范围') return detail;

  if (row.subjectScopes.length > 0) {
    const classCount = new Set(row.subjectScopes.map((item) => item.classId)).size;
    const subjects = Array.from(new Set(row.subjectScopes.map((item) => item.subjectLabel)));

    if (classCount === 1 && subjects.length === 1) {
      const first = row.subjectScopes[0];
      const classLabel = first.className ?? `班级${first.classId}`;
      return `${classLabel}·${first.subjectLabel}`;
    }

    if (subjects.length === 1) {
      return `${classCount}个班·${subjects[0]}`;
    }

    if (classCount === 1) {
      const classLabel = row.subjectScopes[0].className ?? `班级${row.subjectScopes[0].classId}`;
      return `${classLabel}·${subjects.join('、')}`;
    }

    if (subjects.length <= 2) {
      return `${classCount}个班·${subjects.join('、')}`;
    }

    return `${classCount}个班·${subjects.length}科`;
  }

  const classNames = classes
    .filter((item) => row.classIds.includes(item.id))
    .map((item) => item.name);

  if (classNames.length > 0) {
    if (classNames.length <= 2) return classNames.join('、');
    return `${classNames[0]}等${classNames.length}个班`;
  }

  const formatted = formatPermissionScopeDisplay(row.scopeDisplay);
  if (formatted === '全校范围' || formatted === '全校') return formatted;

  const parts = formatted.split('、').map((part) => part.trim()).filter(Boolean);
  if (parts.length <= 2) return formatted;
  return `${parts[0]}等${parts.length}项`;
}

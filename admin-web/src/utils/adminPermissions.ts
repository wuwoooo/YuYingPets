import {
  navItems,
  roleAccessMap,
  roleNavHintMap,
  roleNavLabelMap,
  type NavKey,
} from '../constants/admin';

export type SidebarNavItem = { key: NavKey; label: string; hint?: string };

/** 班主任可见导航顺序（与产品「工作台→评价→学生→班级→…」一致） */
const TEACHER_NAV_ORDER_HOMEROOM: NavKey[] = [
  'dashboard',
  'analytics',
  'evaluation',
  'students',
  'classes',
  'rules',
  'rewards',
  'pets',
];

/** 任课教师侧栏：班级切换在顶部上下文，侧栏不含「我的授课班级」；教学概览紧随工作台 */
const TEACHER_NAV_ORDER_SUBJECT: NavKey[] = ['dashboard', 'analytics', 'evaluation', 'students'];

export function isTeacherWorkbenchRole(roleCode?: string | null) {
  return roleCode === 'homeroom_teacher' || roleCode === 'subject_teacher';
}

/** 任课教师可走 /rules 只读查阅，侧边栏不包含该项 */
export function canBrowseRulesSecondary(roleCode?: string | null) {
  return roleCode === 'subject_teacher';
}

function buildOrderedNav(roleCode: string, allowedKeys: NavKey[]): SidebarNavItem[] {
  const labelOverrides = roleNavLabelMap[roleCode] ?? {};
  const hintOverrides = roleNavHintMap[roleCode] ?? {};
  let orderPlan: NavKey[] | undefined;
  if (roleCode === 'homeroom_teacher') orderPlan = TEACHER_NAV_ORDER_HOMEROOM;
  if (roleCode === 'subject_teacher') orderPlan = TEACHER_NAV_ORDER_SUBJECT;

  const toItem = (key: NavKey, label: string): SidebarNavItem => {
    const hint = hintOverrides[key];
    return hint ? { key, label, hint } : { key, label };
  };

  if (orderPlan?.length) {
    return orderPlan
      .filter((key) => allowedKeys.includes(key))
      .map((key) => {
        const found = navItems.find(([navKey]) => navKey === key);
        if (!found) return null;
        return toItem(key, labelOverrides[key] ?? found[1]);
      })
      .filter((row): row is SidebarNavItem => Boolean(row));
  }

  return navItems
    .filter(([key]) => allowedKeys.includes(key))
    .map(([key, label]) => toItem(key, labelOverrides[key] ?? label));
}

export function getAccessibleNavItems(roleCode?: string | null): SidebarNavItem[] {
  const allowed = roleCode ? roleAccessMap[roleCode] ?? ['dashboard'] : [];
  return roleCode ? buildOrderedNav(roleCode, allowed) : [];
}

export function canAccessNav(roleCode: string | null | undefined, navKey: NavKey) {
  if (!roleCode) return false;
  if (navKey === 'rules' && canBrowseRulesSecondary(roleCode)) return true;

  const allowed = roleAccessMap[roleCode] ?? ['dashboard'];
  return allowed.includes(navKey);
}

export function canManageClasses(roleCode?: string | null) {
  return ['super_admin', 'school_admin', 'academic_admin'].includes(roleCode ?? '');
}

export function canEditClassSettings(roleCode?: string | null) {
  return ['super_admin', 'school_admin', 'academic_admin', 'homeroom_teacher'].includes(roleCode ?? '');
}

export function canImportStudents(roleCode?: string | null) {
  return ['super_admin', 'school_admin', 'academic_admin', 'homeroom_teacher', 'moral_admin', 'grade_admin'].includes(
    roleCode ?? '',
  );
}

/** 与后端 students.update / reset-pet 权限对齐 */
export function canEditStudents(roleCode?: string | null) {
  return canImportStudents(roleCode);
}

export function canManageTeachers(roleCode?: string | null) {
  return ['super_admin', 'school_admin', 'academic_admin'].includes(roleCode ?? '');
}

export function canManageRules(roleCode?: string | null) {
  return ['super_admin', 'school_admin', 'moral_admin'].includes(roleCode ?? '');
}

export function canManageRewards(roleCode?: string | null) {
  return ['super_admin', 'school_admin', 'moral_admin'].includes(roleCode ?? '');
}

export function canManagePets(roleCode?: string | null) {
  return ['super_admin', 'school_admin', 'moral_admin'].includes(roleCode ?? '');
}

export function canManageHonors(roleCode?: string | null) {
  return ['super_admin', 'school_admin', 'moral_admin'].includes(roleCode ?? '');
}

export function canManageAdminConfig(roleCode?: string | null) {
  return ['super_admin', 'school_admin'].includes(roleCode ?? '');
}

/** 可使用校级驾驶舱汇报展示模式（与 /presentation 路由一致） */
export function canViewSchoolPresentation(roleCode?: string | null) {
  return ['super_admin', 'school_admin', 'academic_admin', 'moral_admin', 'grade_admin'].includes(roleCode ?? '');
}

/** 可查看操作审计 API（与后端 audit 模块一致） */
export function canViewOperationAudit(roleCode?: string | null) {
  return ['super_admin', 'school_admin', 'academic_admin'].includes(roleCode ?? '');
}

/** 判断用户角色是否可以管理大屏展示终端 */
export function canManageDisplays(roleCode?: string | null) {
  return ['super_admin', 'school_admin', 'academic_admin', 'moral_admin'].includes(roleCode ?? '');
}


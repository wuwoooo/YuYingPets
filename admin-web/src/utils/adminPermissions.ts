import { navItems, roleAccessMap, roleNavLabelMap, type NavKey } from '../constants/admin';

export function getAccessibleNavItems(roleCode?: string | null) {
  const allowed = roleCode ? roleAccessMap[roleCode] ?? ['dashboard'] : [];
  const labelOverrides = roleCode ? roleNavLabelMap[roleCode] ?? {} : {};
  return navItems
    .filter(([key]) => allowed.includes(key))
    .map(([key, label]) => [key, labelOverrides[key] ?? label] as const);
}

export function canAccessNav(roleCode: string | null | undefined, navKey: NavKey) {
  return getAccessibleNavItems(roleCode).some(([key]) => key === navKey);
}

export function canManageClasses(roleCode?: string | null) {
  return ['super_admin', 'school_admin', 'moral_admin'].includes(roleCode ?? '');
}

export function canEditClassSettings(roleCode?: string | null) {
  return ['super_admin', 'school_admin', 'moral_admin', 'homeroom_teacher'].includes(roleCode ?? '');
}

export function canImportStudents(roleCode?: string | null) {
  return ['super_admin', 'school_admin', 'moral_admin', 'homeroom_teacher'].includes(roleCode ?? '');
}

export function canManageRules(roleCode?: string | null) {
  return ['super_admin', 'school_admin', 'moral_admin'].includes(roleCode ?? '');
}

export function canManageRewards(roleCode?: string | null) {
  return ['super_admin', 'school_admin', 'moral_admin'].includes(roleCode ?? '');
}

export function canManageHonors(roleCode?: string | null) {
  return ['super_admin', 'school_admin', 'moral_admin'].includes(roleCode ?? '');
}

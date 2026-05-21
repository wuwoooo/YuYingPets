import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import type { NavKey } from '../constants/admin';
import { canAccessNav, getAccessibleNavItems, isTeacherWorkbenchRole } from '../utils/adminPermissions';

type ProtectedRouteProps = {
  token: string | null;
  roleCode?: string | null;
  navKey?: NavKey;
  /** 班主任 / 任课不可访问（大屏展示、校级实时监控等） */
  blockTeacherWorkbench?: boolean;
  children: ReactNode;
};

export function ProtectedRoute({
  token,
  roleCode,
  navKey,
  blockTeacherWorkbench,
  children,
}: ProtectedRouteProps) {
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  if (blockTeacherWorkbench && isTeacherWorkbenchRole(roleCode)) {
    return <Navigate to="/dashboard" replace />;
  }
  if (navKey && !roleCode) {
    return <div className="status-card">正在校验权限...</div>;
  }
  if (navKey && !canAccessNav(roleCode, navKey)) {
    const fallback = getAccessibleNavItems(roleCode)[0]?.key ?? 'dashboard';
    return <Navigate to={`/${fallback}`} replace />;
  }
  return <>{children}</>;
}

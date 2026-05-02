import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import type { NavKey } from '../constants/admin';
import { canAccessNav, getAccessibleNavItems } from '../utils/adminPermissions';

type ProtectedRouteProps = {
  token: string | null;
  roleCode?: string | null;
  navKey?: NavKey;
  children: ReactNode;
};

export function ProtectedRoute({ token, roleCode, navKey, children }: ProtectedRouteProps) {
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  if (navKey && !roleCode) {
    return <div className="status-card">正在校验权限...</div>;
  }
  if (navKey && !canAccessNav(roleCode, navKey)) {
    const fallback = getAccessibleNavItems(roleCode)[0]?.[0] ?? 'dashboard';
    return <Navigate to={`/${fallback}`} replace />;
  }
  return <>{children}</>;
}

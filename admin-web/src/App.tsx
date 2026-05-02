import { Suspense, lazy, useEffect, useRef } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute';
import { useAdminData } from './hooks/useAdminData';
import './styles.css';

const LoginPage = lazy(() => import('./pages/LoginPage').then((module) => ({ default: module.LoginPage })));
const DashboardPage = lazy(() => import('./pages/DashboardPage').then((module) => ({ default: module.DashboardPage })));
const ClassesPage = lazy(() => import('./pages/ClassesPage').then((module) => ({ default: module.ClassesPage })));
const EvaluationPage = lazy(() => import('./pages/EvaluationPage').then((module) => ({ default: module.EvaluationPage })));
const TeachersPage = lazy(() => import('./pages/TeachersPage').then((module) => ({ default: module.TeachersPage })));
const PresentationModePage = lazy(() =>
  import('./pages/PresentationModePage').then((module) => ({ default: module.PresentationModePage })),
);
const StudentsPage = lazy(() => import('./pages/StudentsPage').then((module) => ({ default: module.StudentsPage })));
const RulesPage = lazy(() => import('./pages/RulesPage').then((module) => ({ default: module.RulesPage })));
const HonorsPage = lazy(() => import('./pages/HonorsPage').then((module) => ({ default: module.HonorsPage })));
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage').then((module) => ({ default: module.AnalyticsPage })));
const RewardsPage = lazy(() => import('./pages/RewardsPage').then((module) => ({ default: module.RewardsPage })));
const PetsPage = lazy(() => import('./pages/PetsPage').then((module) => ({ default: module.PetsPage })));
const SettingsPage = lazy(() => import('./pages/SettingsPage').then((module) => ({ default: module.SettingsPage })));
const OrganizationPage = lazy(() =>
  import('./pages/OrganizationPage').then((module) => ({ default: module.OrganizationPage })),
);

export function App() {
  const adminData = useAdminData();
  const location = useLocation();
  const lastPathRef = useRef<string | null>(null);
  const token = adminData.token;

  useEffect(() => {
    if (!token || location.pathname === '/login') {
      lastPathRef.current = location.pathname;
      return;
    }
    if (lastPathRef.current === null) {
      lastPathRef.current = location.pathname;
      return;
    }
    if (lastPathRef.current !== location.pathname) {
      adminData.refresh();
    }
    lastPathRef.current = location.pathname;
  }, [location.pathname, token]);

  async function handleRefresh() {
    adminData.refresh();
  }

  return (
    <Suspense fallback={<div className="status-card">页面加载中...</div>}>
      <Routes>
        <Route path="/login" element={<LoginPage onLoggedIn={adminData.setToken} />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute token={adminData.token}>
              <DashboardPage {...adminData} token={adminData.token ?? ''} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/presentation"
          element={
            <ProtectedRoute token={adminData.token}>
              <PresentationModePage
                token={adminData.token ?? ''}
                user={adminData.user}
                classes={adminData.classes}
                students={adminData.students}
                rules={adminData.rules}
                honors={adminData.honors}
                rewards={adminData.rewards}
              />
            </ProtectedRoute>
          }
        />
        <Route
          path="/classes"
          element={
            <ProtectedRoute token={adminData.token} roleCode={adminData.user?.roleCode} navKey="classes">
              <ClassesPage
                token={adminData.token ?? ''}
                user={adminData.user}
                classes={adminData.classes}
                loading={adminData.loading}
                error={adminData.error}
                onSaved={handleRefresh}
              />
            </ProtectedRoute>
          }
        />
        <Route
          path="/students"
          element={
            <ProtectedRoute token={adminData.token} roleCode={adminData.user?.roleCode} navKey="students">
              <StudentsPage
                token={adminData.token ?? ''}
                user={adminData.user}
                classes={adminData.classes}
                students={adminData.students}
                loading={adminData.loading}
                error={adminData.error}
                onSaved={handleRefresh}
              />
            </ProtectedRoute>
          }
        />
        <Route
          path="/evaluation"
          element={
            <ProtectedRoute token={adminData.token} roleCode={adminData.user?.roleCode} navKey="evaluation">
              <EvaluationPage
                token={adminData.token ?? ''}
                user={adminData.user}
                scopes={adminData.scopes}
                classes={adminData.classes}
                students={adminData.students}
                rules={adminData.rules}
                loading={adminData.loading}
                error={adminData.error}
                onSaved={handleRefresh}
              />
            </ProtectedRoute>
          }
        />
        <Route
          path="/class-evaluation"
          element={
            <ProtectedRoute token={adminData.token} roleCode={adminData.user?.roleCode} navKey="class-evaluation">
              <EvaluationPage
                token={adminData.token ?? ''}
                user={adminData.user}
                scopes={adminData.scopes}
                classes={adminData.classes}
                students={adminData.students}
                rules={adminData.rules}
                loading={adminData.loading}
                error={adminData.error}
                onSaved={handleRefresh}
              />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teachers"
          element={
            <ProtectedRoute token={adminData.token} roleCode={adminData.user?.roleCode} navKey="teachers">
              <TeachersPage
                token={adminData.token ?? ''}
                user={adminData.user}
                classes={adminData.classes}
                loading={adminData.loading}
                error={adminData.error}
              />
            </ProtectedRoute>
          }
        />
        <Route
          path="/rules"
          element={
            <ProtectedRoute token={adminData.token} roleCode={adminData.user?.roleCode} navKey="rules">
              <RulesPage
                token={adminData.token ?? ''}
                user={adminData.user}
                classes={adminData.classes}
                rules={adminData.rules}
                loading={adminData.loading}
                error={adminData.error}
                onSaved={handleRefresh}
              />
            </ProtectedRoute>
          }
        />
        <Route
          path="/honors"
          element={
            <ProtectedRoute token={adminData.token} roleCode={adminData.user?.roleCode} navKey="honors">
              <HonorsPage
                token={adminData.token ?? ''}
                user={adminData.user}
                honors={adminData.honors}
                loading={adminData.loading}
                error={adminData.error}
                onSaved={handleRefresh}
              />
            </ProtectedRoute>
          }
        />
        <Route
          path="/analytics"
          element={
            <ProtectedRoute token={adminData.token} roleCode={adminData.user?.roleCode} navKey="analytics">
              <AnalyticsPage
                token={adminData.token ?? ''}
                user={adminData.user}
                classes={adminData.classes}
                loading={adminData.loading}
                error={adminData.error}
              />
            </ProtectedRoute>
          }
        />
        <Route
          path="/rewards"
          element={
            <ProtectedRoute token={adminData.token} roleCode={adminData.user?.roleCode} navKey="rewards">
              <RewardsPage
                token={adminData.token ?? ''}
                user={adminData.user}
                classes={adminData.classes}
                students={adminData.students}
                rewards={adminData.rewards}
                loading={adminData.loading}
                error={adminData.error}
                onSaved={handleRefresh}
              />
            </ProtectedRoute>
          }
        />
        <Route
          path="/pets"
          element={
            <ProtectedRoute token={adminData.token} roleCode={adminData.user?.roleCode} navKey="pets">
              <PetsPage
                token={adminData.token ?? ''}
                user={adminData.user}
                loading={adminData.loading}
                error={adminData.error}
              />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute token={adminData.token} roleCode={adminData.user?.roleCode} navKey="settings">
              <SettingsPage
                token={adminData.token ?? ''}
                user={adminData.user}
                loading={adminData.loading}
                error={adminData.error}
              />
            </ProtectedRoute>
          }
        />
        <Route
          path="/organization"
          element={
            <ProtectedRoute token={adminData.token} roleCode={adminData.user?.roleCode} navKey="organization">
              <OrganizationPage
                token={adminData.token ?? ''}
                user={adminData.user}
                classes={adminData.classes}
                loading={adminData.loading}
                error={adminData.error}
              />
            </ProtectedRoute>
          }
        />
        <Route path="/" element={<Navigate to={adminData.token ? '/dashboard' : '/login'} replace />} />
      </Routes>
    </Suspense>
  );
}

import { useEffect, useState, type ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import presentationLogo from '../assets/presentation-logo.svg';
import type { SessionUser } from '../lib/api';
import type { NavKey } from '../constants/admin';
import { getAccessibleNavItems } from '../utils/adminPermissions';
import { PresentationGlyph, type PresentationGlyphName } from './PresentationGlyph';

type ShellProps = {
  title: string;
  subtitle: string;
  user: SessionUser | null;
  onLogout?: () => void;
  status?: ReactNode;
  children: ReactNode;
};

export function Shell({ title, subtitle: _subtitle, user, onLogout, status, children }: ShellProps) {
  const navIconMap: Record<NavKey, PresentationGlyphName> = {
    dashboard: 'display',
    classes: 'school',
    students: 'student',
    evaluation: 'summary',
    'class-evaluation': 'summary',
    teachers: 'student',
    rules: 'summary',
    honors: 'award',
    rewards: 'gift',
    pets: 'paw',
    analytics: 'trend',
    organization: 'shield',
    settings: 'gear',
  };
  const roleNameMap: Record<string, string> = {
    super_admin: '超级管理员',
    school_admin: '学校管理员',
    moral_admin: '德育管理员',
    homeroom_teacher: '班主任',
    subject_teacher: '学科教师',
  };

  const [nowText, setNowText] = useState(() =>
    new Intl.DateTimeFormat('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(new Date()),
  );

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNowText(
        new Intl.DateTimeFormat('zh-CN', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        }).format(new Date()),
      );
    }, 60_000);

    return () => window.clearInterval(timer);
  }, []);

  const roleLabel = roleNameMap[user?.roleCode ?? ''] ?? '未分配角色';

  function handleLogout() {
    if (onLogout) {
      onLogout();
      return;
    }
    window.location.href = '/login';
  }

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <img src={presentationLogo} alt="育英星宠 Logo" />
          </div>
          <span>育英星宠</span>
        </div>
        <nav className="sidebar-nav">
          {getAccessibleNavItems(user?.roleCode).map(([path, label]) => (
            <NavLink
              key={path}
              to={`/${path}`}
              className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
            >
              <PresentationGlyph name={navIconMap[path]} className="nav-icon" />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-user">
          <div className="avatar">{user?.name?.slice(0, 1) ?? '育'}</div>
          <div className="info">
            <div className="name">{user?.name ?? '未登录'}</div>
            <div className="role">{roleLabel}</div>
          </div>
          <button className="sidebar-logout" type="button" onClick={handleLogout} aria-label="退出登录">
            <PresentationGlyph name="logout" className="sidebar-logout-icon" />
          </button>
        </div>
      </aside>
      <section className="main-area">
        <header className="topbar">
          <PresentationGlyph name="menu" className="toggle-sidebar" />
          <div className="breadcrumb">
            首页 / <b>{title}</b>
          </div>
          <div className="semester">2026 春季学期</div>
          <div className="right-area">
            <span>{nowText}</span>
            <span className="notif">
              <PresentationGlyph name="bell" className="notif-icon" />
              <span className="notif-dot" />
            </span>
            <div className="user-drop">
              <span className="av">{user?.name?.slice(0, 1) ?? '育'}</span>
              <span>{user?.name ?? '未登录'}</span>
            </div>
            {onLogout ? (
              <button className="ghost-button" type="button" onClick={handleLogout}>
                退出
              </button>
            ) : null}
          </div>
        </header>
        <div className="content">
          {status}
          {children}
        </div>
      </section>
    </div>
  );
}

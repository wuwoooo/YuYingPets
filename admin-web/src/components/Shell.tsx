import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import presentationLogo from '../assets/presentation-logo.svg';
import { useAdminView } from '../context/AdminViewContext';
import { adminApi, type SessionUser } from '../lib/api';
import { getAdminLoginCredentials, getAdminToken, setAdminLoginCredentials } from '../lib/session';
import type { NavKey } from '../constants/admin';
import { getAccessibleNavItems } from '../utils/adminPermissions';
import { useCurrentSemesterName } from '../hooks/useCurrentSemesterName';
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
  const { originalUser, availableViews, activeView, setActiveViewKey, isActingSubjectView } = useAdminView();
  const location = useLocation();
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
    academic_admin: '教务管理员',
    moral_admin: '德育管理员',
    homeroom_teacher: '班主任',
    subject_teacher: '任课教师',
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
  const accountMenuRef = useRef<HTMLDivElement | null>(null);
  const [accountPopoverOpen, setAccountPopoverOpen] = useState(false);
  const [accountMenuView, setAccountMenuView] = useState<'menu' | 'profile' | 'password'>('menu');
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordSubmitting, setPasswordSubmitting] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

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

  useEffect(() => {
    setAccountPopoverOpen(false);
    setAccountMenuView('menu');
  }, [location.pathname]);

  useEffect(() => {
    if (!accountPopoverOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (accountMenuRef.current?.contains(event.target as Node)) return;
      setAccountPopoverOpen(false);
      setAccountMenuView('menu');
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setAccountPopoverOpen(false);
      setAccountMenuView('menu');
    };

    document.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [accountPopoverOpen]);

  const roleLabel = roleNameMap[user?.roleCode ?? ''] ?? '未分配角色';
  const originalRoleLabel = roleNameMap[originalUser?.roleCode ?? ''] ?? roleLabel;
  const dutyTags = (user?.dutyTags ?? []).filter((tag) => tag.trim());
  const currentSemesterName = useCurrentSemesterName(getAdminToken());

  function handleLogout() {
    if (onLogout) {
      onLogout();
      return;
    }
    window.location.href = '/login';
  }

  async function handlePasswordSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPasswordMessage(null);

    if (passwordForm.newPassword.length < 6) {
      setPasswordMessage({ type: 'error', text: '新密码至少 6 位' });
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordMessage({ type: 'error', text: '两次输入的新密码不一致' });
      return;
    }

    const token = getAdminToken();
    if (!token) {
      setPasswordMessage({ type: 'error', text: '登录已失效，请重新登录' });
      return;
    }

    setPasswordSubmitting(true);
    try {
      await adminApi.changePassword(token, {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      const storedCredentials = getAdminLoginCredentials();
      if (
        storedCredentials &&
        storedCredentials.username === user?.username &&
        storedCredentials.password === passwordForm.currentPassword
      ) {
        setAdminLoginCredentials(storedCredentials.username, passwordForm.newPassword);
      }
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setPasswordMessage({ type: 'success', text: '密码已更新，下次登录请使用新密码' });
    } catch (error) {
      setPasswordMessage({ type: 'error', text: error instanceof Error ? error.message : '密码修改失败' });
    } finally {
      setPasswordSubmitting(false);
    }
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
          {getAccessibleNavItems(user?.roleCode).map((item) => (
            <NavLink
              key={item.key}
              to={`/${item.key}`}
              className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
            >
              <PresentationGlyph name={navIconMap[item.key]} className="nav-icon" />
              <span className="nav-item-text">
                <span className="nav-item-label">{item.label}</span>
                {item.hint ? <span className="nav-item-hint">{item.hint}</span> : null}
              </span>
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
          <div className="semester">{currentSemesterName ?? '当前学期'}</div>
          <div className="right-area">
            <span>{nowText}</span>
            {availableViews.length > 1 ? (
              <label
                className={`topbar-view-pill${isActingSubjectView ? ' is-acting' : ''}`}
                title={isActingSubjectView ? '切换右上角菜单：可选择任课班级与学科' : '切换右上角菜单：平台管理与任课视图'}
              >
                <PresentationGlyph name="student" className="topbar-view-pill-icon" />
                <select
                  aria-label="切换班级或工作视图"
                  value={activeView.key}
                  onChange={(event) => setActiveViewKey(event.target.value)}
                >
                  {availableViews.map((item) => (
                    <option key={item.key} value={item.key}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
            <span className="notif">
              <PresentationGlyph name="bell" className="notif-icon" />
              <span className="notif-dot" />
            </span>
            <div
              ref={accountMenuRef}
              className={`account-menu${accountPopoverOpen ? ' is-open' : ''}`}
            >
              <button
                className="user-drop user-drop-button"
                type="button"
                onClick={() => {
                  setAccountPopoverOpen((prev) => {
                    const nextOpen = !prev;
                    setAccountMenuView('menu');
                    return nextOpen;
                  });
                }}
                aria-haspopup="dialog"
                aria-expanded={accountPopoverOpen}
              >
                <span className="av">{user?.name?.slice(0, 1) ?? '育'}</span>
                <span className="user-drop-main">
                  <span className="user-drop-name">{user?.name ?? '未登录'}</span>
                </span>
              </button>
              <div className="account-popover">
                {accountMenuView === 'menu' ? (
                  <>
                    <div className="account-popover-head">
                      <span className="account-popover-avatar">{user?.name?.slice(0, 1) ?? '育'}</span>
                      <div>
                        <strong>{user?.name ?? '未登录'}</strong>
                        <span>{user?.username ?? '当前账号'} · {roleLabel}</span>
                      </div>
                    </div>
                    {availableViews.length > 1 ? (
                      <div className="account-profile-card compact">
                        <div><span>主角色</span><strong>{originalRoleLabel}</strong></div>
                        <div><span>当前所选</span><strong>{activeView.label}</strong></div>
                      </div>
                    ) : null}
                    {dutyTags.length > 0 ? (
                      <div className="account-duty-tags compact">
                        {dutyTags.map((tag) => (
                          <span className="account-duty-tag" key={tag}>
                            {tag}
                          </span>
                        ))}
                      </div>
                    ) : null}
                    <div className="account-menu-list">
                      <button type="button" onClick={() => setAccountMenuView('profile')}>
                        个人中心
                      </button>
                      <button type="button" onClick={() => setAccountMenuView('password')}>
                        修改密码
                      </button>
                      <button type="button" onClick={handleLogout}>
                        退出登录
                      </button>
                    </div>
                  </>
                ) : null}
                {accountMenuView === 'profile' ? (
                  <>
                    <div className="account-popover-subhead">
                      <button type="button" onClick={() => setAccountMenuView('menu')}>返回</button>
                      <strong>个人中心</strong>
                    </div>
                    <div className="account-profile-card">
                      <div><span>姓名</span><strong>{user?.name ?? '未登录'}</strong></div>
                      <div><span>账号</span><strong>{user?.username ?? '-'}</strong></div>
                      <div><span>系统角色</span><strong>{originalRoleLabel}</strong></div>
                      <div><span>当前所选</span><strong>{activeView.label}</strong></div>
                      <div>
                        <span>职务标签</span>
                        <strong>{dutyTags.length > 0 ? dutyTags.join('、') : '未设置'}</strong>
                      </div>
                    </div>
                  </>
                ) : null}
                {accountMenuView === 'password' ? (
                  <form className="account-password-form" onSubmit={(event) => void handlePasswordSubmit(event)}>
                    <div className="account-popover-subhead">
                      <button type="button" onClick={() => setAccountMenuView('menu')}>返回</button>
                      <strong>修改密码</strong>
                    </div>
                    <label>
                      <span>当前密码</span>
                      <input
                        type="password"
                        value={passwordForm.currentPassword}
                        onChange={(event) => setPasswordForm((prev) => ({ ...prev, currentPassword: event.target.value }))}
                        autoComplete="current-password"
                        required
                      />
                    </label>
                    <label>
                      <span>新密码</span>
                      <input
                        type="password"
                        value={passwordForm.newPassword}
                        onChange={(event) => setPasswordForm((prev) => ({ ...prev, newPassword: event.target.value }))}
                        autoComplete="new-password"
                        minLength={6}
                        required
                      />
                    </label>
                    <label>
                      <span>确认新密码</span>
                      <input
                        type="password"
                        value={passwordForm.confirmPassword}
                        onChange={(event) => setPasswordForm((prev) => ({ ...prev, confirmPassword: event.target.value }))}
                        autoComplete="new-password"
                        minLength={6}
                        required
                      />
                    </label>
                    {passwordMessage ? (
                      <div className={`account-message ${passwordMessage.type}`}>{passwordMessage.text}</div>
                    ) : null}
                    <button className="account-save-button" type="submit" disabled={passwordSubmitting}>
                      {passwordSubmitting ? '保存中...' : '保存新密码'}
                    </button>
                  </form>
                ) : null}
              </div>
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

import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Modal } from '../components/Modal';
import { Shell } from '../components/Shell';
import { TablePagination } from '../components/TablePagination';
import { usePagination } from '../hooks/usePagination';
import type { AdminClass, PermissionUser, PermissionUserUpsertPayload, RoleTemplate, SessionUser } from '../lib/api';
import { adminApi } from '../lib/api';
import type { PermissionUserFormState } from '../types/admin';
import { createPermissionUserForm, formatEnabledStatus, normalizeKeyword } from '../utils/adminForms';

const adminRoleCodes = ['super_admin', 'school_admin', 'moral_admin'];
const subjectOptions = [
  { code: 'chinese', label: '语文' },
  { code: 'math', label: '数学' },
  { code: 'english', label: '英语' },
  { code: 'physics', label: '物理' },
  { code: 'chemistry', label: '化学' },
  { code: 'geography', label: '地理' },
  { code: 'biology', label: '生物' },
  { code: 'history', label: '历史' },
  { code: 'politics', label: '政治' },
  { code: 'computer', label: '计算机' },
  { code: 'art', label: '美术' },
  { code: 'music', label: '音乐' },
  { code: 'pe', label: '体育' },
] as const;
const tabOptions = [
  ['accounts', '账号中心'],
  ['admins', '管理员管理'],
  ['roles', '角色权限'],
] as const;

type OrganizationTab = (typeof tabOptions)[number][0];

type OrganizationPageProps = {
  token: string;
  user: SessionUser | null;
  classes: AdminClass[];
  loading: boolean;
  error: string | null;
};

function normalizeLoginUsername(value: string) {
  return value.trim().toLowerCase();
}

export function OrganizationPage({ token, user, classes, loading, error }: OrganizationPageProps) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<OrganizationTab>('accounts');
  const [quickFilter, setQuickFilter] = useState<'all' | 'disabled' | 'never_login' | 'high_privilege' | 'class_bound'>('all');
  const [users, setUsers] = useState<PermissionUser[]>([]);
  const [roleTemplates, setRoleTemplates] = useState<RoleTemplate[]>([]);
  const [showEditor, setShowEditor] = useState(false);
  const [editingUser, setEditingUser] = useState<PermissionUser | null>(null);
  const [selectedUser, setSelectedUser] = useState<PermissionUser | null>(null);
  const [form, setForm] = useState<PermissionUserFormState>(() => createPermissionUserForm());
  const [pageLoading, setPageLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [editorGradeFilter, setEditorGradeFilter] = useState('all');
  const [editorClassKeyword, setEditorClassKeyword] = useState('');
  const [editorActiveClassId, setEditorActiveClassId] = useState<number | null>(null);
  const returnTo = searchParams.get('returnTo');
  const returnLabel = searchParams.get('returnLabel') || '返回来源页面';

  const adminRoleTemplates = useMemo(
    () => roleTemplates.filter((item) => adminRoleCodes.includes(item.code)),
    [roleTemplates],
  );

  const availableRoleTemplates = activeTab === 'admins' ? adminRoleTemplates : roleTemplates;

  async function loadData() {
    const [usersResponse, rolesResponse] = await Promise.all([adminApi.permissionUsers(token), adminApi.roleTemplates(token)]);
    setUsers(usersResponse.data);
    setRoleTemplates(rolesResponse.data);
  }

  useEffect(() => {
    let active = true;
    setPageLoading(true);
    Promise.all([adminApi.permissionUsers(token), adminApi.roleTemplates(token)])
      .then(([usersResponse, rolesResponse]) => {
        if (!active) return;
        setUsers(usersResponse.data);
        setRoleTemplates(rolesResponse.data);
      })
      .catch((err) => {
        if (!active) return;
        setSubmitError(err instanceof Error ? err.message : '组织权限数据加载失败');
      })
      .finally(() => {
        if (active) setPageLoading(false);
      });

    return () => {
      active = false;
    };
  }, [token]);

  useEffect(() => {
    const nextTab = searchParams.get('activeTab');
    const nextQuickFilter = searchParams.get('quickFilter');
    const nextRoleFilter = searchParams.get('roleFilter');
    const nextSearch = searchParams.get('keyword');
    const targetUserId = searchParams.get('userId');

    if (nextTab === 'accounts' || nextTab === 'admins' || nextTab === 'roles') {
      setActiveTab(nextTab);
    }
    if (nextQuickFilter === 'all' || nextQuickFilter === 'disabled' || nextQuickFilter === 'never_login' || nextQuickFilter === 'high_privilege' || nextQuickFilter === 'class_bound') {
      setQuickFilter(nextQuickFilter);
    }
    if (nextRoleFilter) setRoleFilter(nextRoleFilter);
    if (nextSearch) setSearchKeyword(nextSearch);
    if (targetUserId && users.length > 0) {
      const matched = users.find((item) => item.id === Number(targetUserId));
      if (matched) setSelectedUser(matched);
    }
  }, [searchParams, users]);

  useEffect(() => {
    setRoleFilter('all');
    setSearchKeyword('');
    setQuickFilter('all');
    setShowEditor(false);
    setEditingUser(null);
    setSelectedUser(null);
    setSubmitError(null);
  }, [activeTab]);

  function openCreate() {
    setEditingUser(null);
    setForm({
      ...createPermissionUserForm(),
      roleCode: activeTab === 'admins' ? adminRoleTemplates[0]?.code ?? 'school_admin' : roleTemplates[0]?.code ?? 'school_admin',
    });
    setSubmitError(null);
    setEditorGradeFilter('all');
    setEditorClassKeyword('');
    setEditorActiveClassId(classes[0]?.id ?? null);
    setShowEditor(true);
  }

  function openEdit(row: PermissionUser) {
    setEditingUser(row);
    setForm(createPermissionUserForm(row));
    setSubmitError(null);
    setEditorGradeFilter('all');
    setEditorClassKeyword('');
    setEditorActiveClassId(row.classIds[0] ?? row.subjectScopes[0]?.classId ?? classes[0]?.id ?? null);
    setShowEditor(true);
  }

  function openDetail(row: PermissionUser) {
    setSelectedUser(row);
    const params = new URLSearchParams(searchParams);
    params.set('userId', String(row.id));
    setSearchParams(params, { replace: true });
  }

  function closeDetail() {
    setSelectedUser(null);
    const params = new URLSearchParams(searchParams);
    params.delete('userId');
    setSearchParams(params, { replace: true });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitError(null);
    setSubmitSuccess(null);

    try {
      const subjectScopes = Array.from(
        new Map(
          form.subjectScopeKeys.map((key) => {
            const [classId, subjectCode] = key.split(':');
            return [key, { classId: Number(classId), subjectCode }];
          }),
        ).values(),
      );
      const payload: PermissionUserUpsertPayload = {
        name: form.name.trim(),
        username: form.username.trim(),
        roleCode: form.roleCode,
        phone: form.phone.trim() || undefined,
        classIds:
          form.roleCode === 'subject_teacher'
            ? Array.from(new Set(subjectScopes.map((item) => item.classId)))
            : form.classIds.map(Number),
        subjectScopes: subjectScopes.length > 0 ? subjectScopes : undefined,
        resetPassword: form.resetPassword,
      };

      if (!payload.name || !payload.username) {
        throw new Error('请填写完整的姓名和登录账号');
      }
      if (activeTab === 'admins' && !adminRoleCodes.includes(payload.roleCode)) {
        throw new Error('管理员管理仅支持管理岗位账号');
      }
      if (payload.roleCode === 'subject_teacher' && subjectScopes.length === 0) {
        throw new Error('任课教师至少需要配置一个授课班级和学科');
      }
      const normalizedUsername = normalizeLoginUsername(payload.username);
      const duplicatedUser = users.find(
        (item) =>
          normalizeLoginUsername(item.username) === normalizedUsername &&
          item.id !== editingUser?.id,
      );
      if (duplicatedUser) {
        throw new Error(`登录账号重复：${payload.username} 已被占用`);
      }

      if (editingUser) {
        await adminApi.updatePermissionUser(token, editingUser.id, payload);
        setSubmitSuccess('账号信息已更新');
      } else {
        const result = await adminApi.createPermissionUser(token, payload);
        setSubmitSuccess(`账号已创建，默认密码 ${result.data.defaultPassword}`);
      }

      await loadData();
      setShowEditor(false);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : '账号保存失败');
    }
  }

  function toggleSubjectScope(classId: number, subjectCode: string, checked: boolean) {
    const scopeKey = `${classId}:${subjectCode}`;
    setForm((prev) => ({
      ...prev,
      subjectScopeKeys: checked
        ? Array.from(new Set([...prev.subjectScopeKeys, scopeKey]))
        : prev.subjectScopeKeys.filter((item) => item !== scopeKey),
    }));
  }

  function toggleClassScope(classId: number, checked: boolean) {
    setForm((prev) => ({
      ...prev,
      classIds: checked
        ? Array.from(new Set([...prev.classIds, String(classId)]))
        : prev.classIds.filter((item) => item !== String(classId)),
      subjectScopeKeys: checked
        ? prev.subjectScopeKeys
        : prev.subjectScopeKeys.filter((item) => !item.startsWith(`${classId}:`)),
    }));
  }

  function toggleAllSubjectsForClass(classId: number, checked: boolean) {
    const keys = subjectOptions.map((item) => `${classId}:${item.code}`);
    setForm((prev) => ({
      ...prev,
      subjectScopeKeys: checked
        ? Array.from(new Set([...prev.subjectScopeKeys, ...keys]))
        : prev.subjectScopeKeys.filter((item) => !keys.includes(item)),
    }));
  }

  async function handleResetPassword(id: number) {
    setSubmitError(null);
    setSubmitSuccess(null);
    try {
      const result = await adminApi.resetPermissionUserPassword(token, id);
      setSubmitSuccess(`密码已重置为 ${result.data.defaultPassword}`);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : '密码重置失败');
    }
  }

  async function handleToggleStatus(row: PermissionUser) {
    setSubmitError(null);
    setSubmitSuccess(null);
    try {
      const nextStatus = row.status === 'enabled' ? 'disabled' : 'enabled';
      await adminApi.updatePermissionUserStatus(token, row.id, { status: nextStatus });
      setSubmitSuccess(nextStatus === 'enabled' ? '账号已启用' : '账号已停用');
      await loadData();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : '账号状态更新失败');
    }
  }

  function formatLastLogin(value?: string | null) {
    if (!value) return '未登录';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '未登录';
    return new Intl.DateTimeFormat('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(date);
  }

  const visibleUsers = useMemo(() => {
    if (activeTab === 'admins') {
      return users.filter((row) => adminRoleCodes.includes(row.roleCode));
    }
    return users;
  }, [activeTab, users]);

  const filteredUsers = useMemo(() => {
    const keyword = normalizeKeyword(searchKeyword);
    return visibleUsers.filter((row) => {
      const matchesQuickFilter =
        quickFilter === 'all' ||
        (quickFilter === 'disabled' && row.status === 'disabled') ||
        (quickFilter === 'never_login' && !row.lastLoginAt) ||
        (quickFilter === 'high_privilege' && ['super_admin', 'school_admin'].includes(row.roleCode)) ||
        (quickFilter === 'class_bound' && row.classIds.length > 0);
      const matchesKeyword =
        !keyword ||
        normalizeKeyword(row.name).includes(keyword) ||
        normalizeKeyword(row.username).includes(keyword) ||
        normalizeKeyword(row.scopeDisplay).includes(keyword);
      const matchesRole = roleFilter === 'all' || row.roleCode === roleFilter;
      return matchesQuickFilter && matchesKeyword && matchesRole;
    });
  }, [quickFilter, roleFilter, searchKeyword, visibleUsers]);

  const listPagination = usePagination(filteredUsers, `${activeTab}|${searchKeyword}|${roleFilter}|${visibleUsers.length}`);
  const selectedRoleTemplate = roleTemplates.find((item) => item.code === form.roleCode);
  const selectedUserRoleTemplate = roleTemplates.find((item) => item.code === selectedUser?.roleCode);
  const isTeacherRole = form.roleCode === 'homeroom_teacher' || form.roleCode === 'subject_teacher';
  const selectedClasses = useMemo(
    () => classes.filter((item) => form.classIds.includes(String(item.id))),
    [classes, form.classIds],
  );
  const selectedSubjectClassIds = useMemo(
    () => Array.from(new Set(form.subjectScopeKeys.map((item) => Number(item.split(':')[0])))),
    [form.subjectScopeKeys],
  );
  const selectedClassPreview = useMemo(
    () =>
      classes.filter((item) =>
        form.roleCode === 'subject_teacher'
          ? selectedSubjectClassIds.includes(item.id)
          : form.classIds.includes(String(item.id)),
      ),
    [classes, form.classIds, form.roleCode, selectedSubjectClassIds],
  );
  const subjectAssignableClasses = useMemo(() => selectedClasses, [selectedClasses]);
  const editorGradeOptions = useMemo(
    () => Array.from(new Set(subjectAssignableClasses.map((item) => item.gradeName))),
    [subjectAssignableClasses],
  );
  const filteredEditorClasses = useMemo(() => {
    const keyword = normalizeKeyword(editorClassKeyword);
    return subjectAssignableClasses.filter((item) => {
      const matchesGrade = editorGradeFilter === 'all' || item.gradeName === editorGradeFilter;
      const matchesKeyword =
        !keyword ||
        normalizeKeyword(`${item.gradeName} ${item.name}`).includes(keyword) ||
        normalizeKeyword(item.code).includes(keyword);
      return matchesGrade && matchesKeyword;
    });
  }, [editorClassKeyword, editorGradeFilter, subjectAssignableClasses]);
  const activeEditorClass = filteredEditorClasses.find((item) => item.id === editorActiveClassId) ?? filteredEditorClasses[0] ?? null;
  const selectedSubjectScopeItems = useMemo(
    () =>
      form.subjectScopeKeys
        .map((key) => {
          const [classIdText, subjectCode] = key.split(':');
          const classId = Number(classIdText);
          const classInfo = classes.find((item) => item.id === classId);
          const subjectInfo = subjectOptions.find((item) => item.code === subjectCode);
          if (!classInfo || !subjectInfo) return null;
          return {
            key,
            classId,
            classLabel: `${classInfo.gradeName} ${classInfo.name}`,
            subjectLabel: subjectInfo.label,
          };
        })
        .filter((item): item is NonNullable<typeof item> => Boolean(item)),
    [classes, form.subjectScopeKeys],
  );

  useEffect(() => {
    if (!showEditor || !isTeacherRole) return;
    const nextActiveId = activeEditorClass?.id ?? subjectAssignableClasses[0]?.id ?? null;
    if (nextActiveId !== editorActiveClassId) {
      setEditorActiveClassId(nextActiveId);
    }
  }, [activeEditorClass?.id, editorActiveClassId, isTeacherRole, showEditor, subjectAssignableClasses]);

  const enabledCount = users.filter((row) => row.status === 'enabled').length;
  const adminCount = users.filter((row) => adminRoleCodes.includes(row.roleCode)).length;
  const roleCount = roleTemplates.length;
  const accountAlerts = [
    {
      title: '高权限账号',
      description: '超管与管理员岗位统一在此治理，避免分散到系统设置中。',
      value: `${adminCount} 个`,
    },
    {
      title: '角色模板',
      description: '角色模板决定默认能力边界，账号只做绑定，不重复定义权限。',
      value: `${roleCount} 个`,
    },
    {
      title: '启用率',
      description: '可用于观察账号是否存在冗余开通或长期未治理的风险。',
      value: users.length > 0 ? `${Math.round((enabledCount / users.length) * 100)}%` : '0%',
    },
  ];

  function buildOrganizationLocation(selectedUserId?: number) {
    const params = new URLSearchParams();
    if (activeTab !== 'accounts') params.set('activeTab', activeTab);
    if (quickFilter !== 'all') params.set('quickFilter', quickFilter);
    if (roleFilter !== 'all') params.set('roleFilter', roleFilter);
    if (searchKeyword.trim()) params.set('keyword', searchKeyword.trim());
    if (selectedUserId) params.set('userId', String(selectedUserId));
    return params.size > 0 ? `/organization?${params.toString()}` : '/organization';
  }

  function navigateWithQuery(path: string, query: Record<string, string | number | null | undefined>) {
    const params = new URLSearchParams();
    Object.entries(query).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') return;
      params.set(key, String(value));
    });
    navigate(params.size > 0 ? `${path}?${params.toString()}` : path);
  }

  return (
    <Shell
      title="组织权限"
      subtitle="统一承接账号中心、管理员管理和角色权限配置"
      user={user}
      status={
        <>
          {loading || pageLoading ? <div className="status-card">组织权限数据整理中...</div> : null}
          {error ? <div className="status-card error">{error}</div> : null}
          {submitError ? <div className="status-card error">{submitError}</div> : null}
          {submitSuccess ? <div className="status-card success">{submitSuccess}</div> : null}
        </>
      }
    >
      <div className="page-header">
        <div>
          <h2>组织权限</h2>
          <p className="page-desc">把身份底座和岗位授权收拢到一个轻量治理模块中。</p>
        </div>
        <div className="page-actions">
          {returnTo ? (
            <button className="ghost-button" type="button" onClick={() => navigate(returnTo)}>
              {returnLabel}
            </button>
          ) : null}
          {activeTab !== 'roles' ? (
            <>
              <div className="search-box">
                <span className="s-icon">⌕</span>
                <input
                  placeholder="搜索姓名/账号/负责范围..."
                  value={searchKeyword}
                  onChange={(event) => setSearchKeyword(event.target.value)}
                />
              </div>
              <select className="filter-select" value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)}>
                <option value="all">全部岗位</option>
                {availableRoleTemplates.map((item) => (
                  <option key={item.code} value={item.code}>
                    {item.name}
                  </option>
                ))}
              </select>
              <button className="btn btn-primary" type="button" onClick={openCreate}>
                {activeTab === 'admins' ? '新增管理员' : '新增账号'}
              </button>
            </>
          ) : null}
        </div>
      </div>

      <div className="tabs">
        {tabOptions.map(([key, label]) => (
          <button
            key={key}
            className={`tab${activeTab === key ? ' active' : ''}`}
            type="button"
            onClick={() => setActiveTab(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {activeTab === 'accounts' ? (
        <>
          <div className="metric-strip">
            <div className="metric-card">
              <span>账号总数</span>
              <strong>{users.length}</strong>
              <p>组织范围内可登录账号总量。</p>
            </div>
            <div className="metric-card">
              <span>启用账号</span>
              <strong>{enabledCount}</strong>
              <p>当前仍处于可登录状态的账号数量。</p>
            </div>
            <div className="metric-card">
              <span>管理岗位</span>
              <strong>{adminCount}</strong>
              <p>承担系统治理职责的高权限岗位账号。</p>
            </div>
            <div className="metric-card">
              <span>角色模板</span>
              <strong>{roleCount}</strong>
              <p>当前系统用于分配默认能力的角色模板数量。</p>
            </div>
          </div>
          <div className="detail-grid">
            <div className="detail-card">
              <h4>账号中心</h4>
              <div className="detail-list">
                <div><span>账号总数</span><strong>{users.length} 个</strong></div>
                <div><span>启用账号</span><strong>{enabledCount} 个</strong></div>
              </div>
            </div>
            <div className="detail-card">
              <h4>岗位分布</h4>
              <div className="detail-list">
                <div><span>角色模板</span><strong>{roleCount} 个</strong></div>
                <div><span>管理岗位</span><strong>{adminCount} 个</strong></div>
              </div>
            </div>
            <div className="detail-card span-2">
              <h4>治理提醒</h4>
              <div className="mini-list">
                {accountAlerts.map((item) => (
                  <div className="mini-list-item" key={item.title}>
                    <div>
                      <strong>{item.title}</strong>
                      <span>{item.description}</span>
                    </div>
                    <b>{item.value}</b>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="panel">
            <div className="page-header">
              <div>
                <div className="panel-title">账号列表</div>
                <p className="page-desc">通过快捷筛选快速定位停用账号、未登录账号和高权限账号。</p>
              </div>
            </div>
            <div className="tabs">
              {[
                ['all', '全部账号'],
                ['disabled', '停用账号'],
                ['never_login', '未登录账号'],
                ['high_privilege', '高权限账号'],
                ['class_bound', '已绑班级'],
              ].map(([key, label]) => (
                <button
                  key={key}
                  className={`tab${quickFilter === key ? ' active' : ''}`}
                  type="button"
                  onClick={() => setQuickFilter(key as typeof quickFilter)}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="data-table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>姓名</th>
                    <th>账号</th>
                    <th>岗位</th>
                    <th>负责范围</th>
                    <th>最近登录</th>
                    <th>状态</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {listPagination.pagedItems.map((row) => (
                    <tr key={row.id}>
                      <td className="permission-name">{row.name}</td>
                      <td>{row.username}</td>
                      <td>{row.roleName}</td>
                      <td>{row.scopeDisplay}</td>
                      <td>{formatLastLogin(row.lastLoginAt)}</td>
                      <td><span className={row.status === 'enabled' ? 'status-on' : 'status-off'}>{formatEnabledStatus(row.status)}</span></td>
                      <td>
                        <button className="op-btn" type="button" onClick={() => openDetail(row)}>查看详情</button>
                        <button className="op-btn" type="button" onClick={() => openEdit(row)}>编辑账号</button>
                        <button className="op-btn" type="button" onClick={() => void handleResetPassword(row.id)}>重置密码</button>
                        <button className="op-btn" type="button" onClick={() => void handleToggleStatus(row)}>
                          {row.status === 'enabled' ? '停用账号' : '启用账号'}
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="table-empty">
                        当前筛选条件下没有账号数据
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
            <TablePagination
              currentPage={listPagination.currentPage}
              pageSize={listPagination.pageSize}
              totalItems={listPagination.totalItems}
              totalPages={listPagination.totalPages}
              onPageChange={listPagination.setCurrentPage}
              onPageSizeChange={listPagination.setPageSize}
            />
          </div>
        </>
      ) : null}

      {activeTab === 'admins' ? (
        <>
          <div className="detail-grid">
            <div className="detail-card">
              <h4>管理员管理</h4>
              <div className="detail-list">
                <div><span>管理员账号</span><strong>{visibleUsers.length} 个</strong></div>
                <div><span>角色模板</span><strong>{adminRoleTemplates.length} 个</strong></div>
              </div>
            </div>
            <div className="detail-card span-2">
              <h4>岗位边界</h4>
              <div className="mini-list">
                {adminRoleTemplates.map((role) => (
                  <div className="mini-list-item" key={role.code}>
                    <div>
                      <strong>{role.name}</strong>
                      <span>{role.summary}</span>
                    </div>
                    <b>{role.permissions.length} 项</b>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="panel">
            <div className="panel-title">管理员列表</div>
            <div className="data-table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>姓名</th>
                    <th>账号</th>
                    <th>岗位</th>
                    <th>负责范围</th>
                    <th>岗位摘要</th>
                    <th>状态</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {listPagination.pagedItems.map((row) => (
                    <tr key={row.id}>
                      <td className="permission-name">{row.name}</td>
                      <td>{row.username}</td>
                      <td>{row.roleName}</td>
                      <td>{row.scopeDisplay}</td>
                      <td>{row.permissionSummary}</td>
                      <td><span className={row.status === 'enabled' ? 'status-on' : 'status-off'}>{formatEnabledStatus(row.status)}</span></td>
                      <td>
                        <button className="op-btn" type="button" onClick={() => openDetail(row)}>查看详情</button>
                        <button className="op-btn" type="button" onClick={() => openEdit(row)}>编辑管理员</button>
                        <button className="op-btn" type="button" onClick={() => void handleResetPassword(row.id)}>重置密码</button>
                        <button className="op-btn" type="button" onClick={() => void handleToggleStatus(row)}>
                          {row.status === 'enabled' ? '停用账号' : '启用账号'}
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="table-empty">
                        当前筛选条件下没有管理员数据
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
            <TablePagination
              currentPage={listPagination.currentPage}
              pageSize={listPagination.pageSize}
              totalItems={listPagination.totalItems}
              totalPages={listPagination.totalPages}
              onPageChange={listPagination.setCurrentPage}
              onPageSizeChange={listPagination.setPageSize}
            />
          </div>
        </>
      ) : null}

      {activeTab === 'roles' ? (
        <div className="detail-grid">
          {roleTemplates.map((role) => (
            <div className="detail-card" key={role.code}>
              <h4>{role.name}</h4>
              <div className="detail-list">
                <div><span>角色编码</span><strong>{role.code}</strong></div>
                <div><span>角色说明</span><strong>{role.summary}</strong></div>
              </div>
              <div className="settings-tag-row">
                {role.permissions.map((item) => (
                  <span className="settings-tag" key={item}>{item}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {showEditor ? (
        <Modal
          title={
            activeTab === 'admins'
              ? editingUser
                ? '编辑管理员'
                : '新增管理员'
              : editingUser
                ? '编辑账号'
                : '新增账号'
          }
          subtitle="统一维护身份信息、岗位角色和负责范围"
          onClose={() => setShowEditor(false)}
        >
          <form className={`settings-form${isTeacherRole ? ' teacher-editor-form' : ''}`} onSubmit={handleSubmit}>
            {isTeacherRole ? (
              <div className="teacher-editor-shell">
                <div className="teacher-editor-hero">
                  <div className="teacher-editor-hero-main">
                    <span className="teacher-editor-kicker">{editingUser ? '编辑账号' : '新增账号'}</span>
                    <h4>{form.name.trim() || '配置教师身份与任教范围'}</h4>
                    <p>组织权限页与教师管理页保持同一套教师配置逻辑，避免两个入口口径不一致。</p>
                    <div className="teacher-editor-meta-row">
                      <span className="teacher-editor-meta-pill">{form.roleCode === 'homeroom_teacher' ? '班主任主责' : '任课教师'}</span>
                      <span className="teacher-editor-meta-pill">已选班级 {form.classIds.length} 个</span>
                      <span className="teacher-editor-meta-pill">已选学科 {selectedSubjectScopeItems.length} 组</span>
                    </div>
                  </div>
                  <div className="teacher-editor-hero-side">
                    <div className="teacher-editor-summary-card">
                      <span>角色能力摘要</span>
                      <strong>{selectedRoleTemplate?.name ?? '教师岗位'}</strong>
                      <div className="settings-tag-row compact">
                        {(selectedRoleTemplate?.permissions ?? []).map((item) => (
                          <span className="settings-tag" key={item}>{item}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="teacher-editor-grid">
                  <div className="detail-card span-2">
                    <h4>基础信息</h4>
                    <div className="s-row permission-row-2">
                      <div className="s-field">
                        <label>姓名</label>
                        <input type="text" value={form.name} onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))} />
                      </div>
                      <div className="s-field">
                        <label>登录账号</label>
                        <input type="text" value={form.username} onChange={(event) => setForm((prev) => ({ ...prev, username: event.target.value }))} />
                      </div>
                    </div>
                    <div className="s-row permission-row-2">
                      <div className="s-field">
                        <label>岗位类型</label>
                        <select value={form.roleCode} onChange={(event) => setForm((prev) => ({ ...prev, roleCode: event.target.value }))}>
                          {availableRoleTemplates.map((item) => (
                            <option key={item.code} value={item.code}>
                              {item.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="s-field">
                        <label>联系电话</label>
                        <input type="text" value={form.phone} onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))} />
                      </div>
                    </div>
                  </div>

                  <div className="detail-card span-2">
                    <div className="teacher-editor-section-head">
                      <div>
                        <h4>{form.roleCode === 'homeroom_teacher' ? '负责班级' : '授课班级'}</h4>
                        <p>先确定班级范围，再补充学科配置。</p>
                      </div>
                      <b>{form.classIds.length} 个班级</b>
                    </div>
                    <div className="teacher-class-grid">
                      {classes.map((item) => {
                        const selected = form.classIds.includes(String(item.id));
                        return (
                          <button
                            key={item.id}
                            type="button"
                            className={`teacher-class-card${selected ? ' active' : ''}`}
                            onClick={() => toggleClassScope(item.id, !selected)}
                          >
                            <strong>{item.gradeName} {item.name}</strong>
                            <span>{item.studentCount} 名学生</span>
                            <b>{selected ? '已选择' : '点击选择'}</b>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="detail-card span-2">
                    <div className="teacher-editor-section-head">
                      <div>
                        <h4>{form.roleCode === 'homeroom_teacher' ? '授课学科（可选）' : '授课学科配置'}</h4>
                        <p>按班级逐个配置学科，支持搜索和年级筛选。</p>
                      </div>
                      <b>{selectedSubjectScopeItems.length} 组班级-学科</b>
                    </div>
                    {subjectAssignableClasses.length > 0 ? (
                      <div className="teacher-editor-scope-panel">
                        <div className="teacher-editor-scope-sidebar">
                          <div className="teacher-editor-filter-bar">
                            <input
                              type="text"
                              value={editorClassKeyword}
                              placeholder="搜索班级名称或编码"
                              onChange={(event) => setEditorClassKeyword(event.target.value)}
                            />
                            <select value={editorGradeFilter} onChange={(event) => setEditorGradeFilter(event.target.value)}>
                              <option value="all">全部年级</option>
                              {editorGradeOptions.map((item) => (
                                <option key={item} value={item}>{item}</option>
                              ))}
                            </select>
                          </div>
                          <div className="teacher-editor-class-list">
                            {filteredEditorClasses.map((item) => {
                              const selectedCount = selectedSubjectScopeItems.filter((scope) => scope.classId === item.id).length;
                              return (
                                <button
                                  key={item.id}
                                  type="button"
                                  className={`teacher-editor-class-item${activeEditorClass?.id === item.id ? ' active' : ''}`}
                                  onClick={() => setEditorActiveClassId(item.id)}
                                >
                                  <div>
                                    <strong>{item.gradeName} {item.name}</strong>
                                    <span>{item.studentCount} 名学生</span>
                                  </div>
                                  <b>{selectedCount} 科</b>
                                </button>
                              );
                            })}
                            {filteredEditorClasses.length === 0 ? <div className="teacher-editor-empty">当前筛选下没有可配置班级</div> : null}
                          </div>
                        </div>
                        <div className="teacher-editor-scope-main">
                          {activeEditorClass ? (
                            <>
                              <div className="teacher-editor-active-head">
                                <div>
                                  <strong>{activeEditorClass.gradeName} {activeEditorClass.name}</strong>
                                  <span>{activeEditorClass.studentCount} 名学生</span>
                                </div>
                                <div className="teacher-editor-inline-actions">
                                  <button type="button" className="ghost-button" onClick={() => toggleAllSubjectsForClass(activeEditorClass.id, true)}>本班全选</button>
                                  <button type="button" className="ghost-button" onClick={() => toggleAllSubjectsForClass(activeEditorClass.id, false)}>清空本班</button>
                                </div>
                              </div>
                              <div className="teacher-editor-subject-grid">
                                {subjectOptions.map((subject) => {
                                  const checked = form.subjectScopeKeys.includes(`${activeEditorClass.id}:${subject.code}`);
                                  return (
                                    <button
                                      key={`${activeEditorClass.id}-${subject.code}`}
                                      type="button"
                                      className={`teacher-editor-subject-chip${checked ? ' active' : ''}`}
                                      onClick={() => toggleSubjectScope(activeEditorClass.id, subject.code, !checked)}
                                    >
                                      <span>{subject.label}</span>
                                      <b>{checked ? '已选' : '选择'}</b>
                                    </button>
                                  );
                                })}
                              </div>
                            </>
                          ) : (
                            <div className="teacher-editor-empty">请选择左侧班级后再配置学科</div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="teacher-editor-empty">
                        {form.roleCode === 'homeroom_teacher' ? '请先选择负责班级，再补充授课学科。' : '请先选择授课班级。'}
                      </div>
                    )}
                  </div>

                  <div className="detail-card">
                    <h4>当前已选班级</h4>
                    <div className="teacher-editor-selection-list">
                      {selectedClassPreview.map((item) => (
                        <div className="teacher-editor-selection-item" key={item.id}>
                          <strong>{item.gradeName} {item.name}</strong>
                          <span>{item.studentCount} 名学生</span>
                        </div>
                      ))}
                      {selectedClassPreview.length === 0 ? <div className="teacher-editor-empty inline">尚未选择班级</div> : null}
                    </div>
                  </div>

                  <div className="detail-card">
                    <h4>当前已选学科组合</h4>
                    <div className="teacher-editor-selection-list">
                      {selectedSubjectScopeItems.map((item) => (
                        <div className="teacher-editor-selection-item" key={item.key}>
                          <strong>{item.classLabel}</strong>
                          <span>{item.subjectLabel}</span>
                        </div>
                      ))}
                      {selectedSubjectScopeItems.length === 0 ? <div className="teacher-editor-empty inline">尚未选择授课学科</div> : null}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="s-row permission-row-2">
                  <div className="s-field">
                    <label>姓名</label>
                    <input type="text" value={form.name} onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))} />
                  </div>
                  <div className="s-field">
                    <label>登录账号</label>
                    <input type="text" value={form.username} onChange={(event) => setForm((prev) => ({ ...prev, username: event.target.value }))} />
                  </div>
                </div>
                <div className="s-row permission-row-2">
                  <div className="s-field">
                    <label>岗位类型</label>
                    <select value={form.roleCode} onChange={(event) => setForm((prev) => ({ ...prev, roleCode: event.target.value }))}>
                      {availableRoleTemplates.map((item) => (
                        <option key={item.code} value={item.code}>
                          {item.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="s-field">
                    <label>联系电话</label>
                    <input type="text" value={form.phone} onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))} />
                  </div>
                </div>
                <div className="s-field">
                  <label>负责班级</label>
                  <div className="permission-check-grid">
                    {classes.map((item) => (
                      <label className="permission-check" key={item.id}>
                        <input
                          type="checkbox"
                          checked={form.classIds.includes(String(item.id))}
                          onChange={(event) => toggleClassScope(item.id, event.target.checked)}
                        />
                        {item.gradeName} {item.name}
                      </label>
                    ))}
                  </div>
                </div>
                <div className="detail-card">
                  <h4>角色能力摘要</h4>
                  <div className="settings-tag-row">
                    {(selectedRoleTemplate?.permissions ?? []).map((item) => (
                      <span className="settings-tag" key={item}>{item}</span>
                    ))}
                  </div>
                </div>
              </>
            )}
            {editingUser ? (
              <label className="checkbox-item">
                <input type="checkbox" checked={form.resetPassword} onChange={(event) => setForm((prev) => ({ ...prev, resetPassword: event.target.checked }))} />
                同时重置密码为 123456
              </label>
            ) : null}
            <div className="form-actions">
              <button className="ghost-button" type="button" onClick={() => setShowEditor(false)}>
                取消
              </button>
              <button className="toolbar-button" type="submit">
                {editingUser ? '保存修改' : '保存并开通'}
              </button>
            </div>
          </form>
        </Modal>
      ) : null}
      {selectedUser ? (
        <Modal
          title={`${selectedUser.name} · 账号详情`}
          subtitle="集中查看身份状态、岗位角色和负责范围"
          onClose={closeDetail}
        >
          <div className="detail-grid">
            <div className="detail-card">
              <h4>身份信息</h4>
              <div className="detail-list">
                <div><span>姓名</span><strong>{selectedUser.name}</strong></div>
                <div><span>登录账号</span><strong>{selectedUser.username}</strong></div>
                <div><span>联系电话</span><strong>{selectedUser.phone || '未填写'}</strong></div>
                <div><span>最近登录</span><strong>{formatLastLogin(selectedUser.lastLoginAt)}</strong></div>
              </div>
            </div>
            <div className="detail-card">
              <h4>岗位与状态</h4>
              <div className="detail-list">
                <div><span>岗位</span><strong>{selectedUser.roleName}</strong></div>
                <div><span>账号状态</span><strong>{formatEnabledStatus(selectedUser.status)}</strong></div>
                <div><span>负责范围</span><strong>{selectedUser.scopeDisplay}</strong></div>
                <div><span>岗位摘要</span><strong>{selectedUser.permissionSummary}</strong></div>
              </div>
            </div>
            <div className="detail-card span-2">
              <h4>角色能力</h4>
              <div className="settings-tag-row">
                {(selectedUserRoleTemplate?.permissions ?? selectedUser.permissions).map((item) => (
                  <span className="settings-tag" key={item}>{item}</span>
                ))}
              </div>
            </div>
            <div className="detail-card span-2">
              <h4>联动入口</h4>
              <div className="form-actions" style={{ justifyContent: 'flex-start', marginTop: 0 }}>
                {['homeroom_teacher', 'subject_teacher'].includes(selectedUser.roleCode) ? (
                  <button
                    className="ghost-button"
                    type="button"
                    onClick={() =>
                      navigateWithQuery('/teachers', {
                        userId: selectedUser.id,
                        returnTo: buildOrganizationLocation(selectedUser.id),
                        returnLabel: '返回组织权限',
                      })
                    }
                  >
                    查看教师详情
                  </button>
                ) : null}
                <button
                  className="ghost-button"
                  type="button"
                  onClick={() =>
                    navigateWithQuery('/classes', {
                      keyword: selectedUser.name,
                      returnTo: buildOrganizationLocation(selectedUser.id),
                      returnLabel: '返回组织权限',
                    })
                  }
                >
                  查看相关班级
                </button>
              </div>
            </div>
          </div>
        </Modal>
      ) : null}
    </Shell>
  );
}

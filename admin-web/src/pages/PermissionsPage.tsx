import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Modal } from '../components/Modal';
import { Shell } from '../components/Shell';
import { TablePagination } from '../components/TablePagination';
import { usePagination } from '../hooks/usePagination';
import type { 
  AdminClass,
  PermissionUser,
  PermissionUserUpsertPayload,
  RoleTemplate,
  SessionUser
} from '../lib/api';
import { adminApi } from '../lib/api';
import type {
  PermissionUserFormState
} from '../types/admin';
import {
  createPermissionUserForm,
  formatEnabledStatus,
  normalizeKeyword
} from '../utils/adminForms';

type PermissionsPageProps = {
  token: string;
  user: SessionUser | null;
  classes: AdminClass[];
  loading: boolean;
  error: string | null;
};

export function PermissionsPage({
  token,
  user,
  classes,
  loading,
  error,
}: PermissionsPageProps) {
  const [showAddPanel, setShowAddPanel] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<PermissionUser | null>(null);
  const [editingTeacher, setEditingTeacher] = useState<PermissionUser | null>(null);
  const [users, setUsers] = useState<PermissionUser[]>([]);
  const [roleTemplates, setRoleTemplates] = useState<RoleTemplate[]>([]);
  const [form, setForm] = useState<PermissionUserFormState>(() => createPermissionUserForm());
  const [pageLoading, setPageLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [resettingIds, setResettingIds] = useState<number[]>([]);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

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
        setSubmitError(err instanceof Error ? err.message : '账号数据加载失败');
      })
      .finally(() => {
        if (active) setPageLoading(false);
      });
    return () => {
      active = false;
    };
  }, [token]);

  function openCreate() {
    setEditingTeacher(null);
    setForm(createPermissionUserForm());
    setShowAddPanel(true);
    setSubmitError(null);
  }

  function openEdit(userRow: PermissionUser) {
    setEditingTeacher(userRow);
    setForm(createPermissionUserForm(userRow));
    setShowAddPanel(true);
    setSubmitError(null);
  }

  async function refreshPermissions() {
    const [usersResponse, rolesResponse] = await Promise.all([adminApi.permissionUsers(token), adminApi.roleTemplates(token)]);
    setUsers(usersResponse.data);
    setRoleTemplates(rolesResponse.data);
    return usersResponse.data;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(null);

    try {
      const name = form.name.trim();
      const username = form.username.trim();
      const classIds = Array.from(new Set(form.classIds.map(Number))).filter((item) => Number.isInteger(item) && item > 0);

      const payload: PermissionUserUpsertPayload = {
        name,
        username,
        roleCode: form.roleCode,
        phone: form.phone.trim() || undefined,
        classIds,
        resetPassword: form.resetPassword,
      };

      if (!payload.name || !payload.username) {
        throw new Error('请填写完整的姓名和登录账号');
      }
      if (!payload.roleCode.trim()) {
        throw new Error('请选择岗位类型');
      }

      if (editingTeacher) {
        await adminApi.updatePermissionUser(token, editingTeacher.id, payload);
        setSubmitSuccess('教师账号已更新');
      } else {
        const result = await adminApi.createPermissionUser(token, payload);
        setSubmitSuccess(`教师账号已创建，默认密码 ${result.data.defaultPassword}`);
      }

      const latestUsers = await refreshPermissions();
      if (selectedTeacher) {
        const latestTeacher = latestUsers.find((item) => item.id === selectedTeacher.id);
        if (latestTeacher) setSelectedTeacher(latestTeacher);
      }
      setShowAddPanel(false);
      setEditingTeacher(null);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : '教师账号保存失败');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResetPassword(id: number) {
    if (resettingIds.includes(id)) return;
    setSubmitError(null);
    setSubmitSuccess(null);
    setResettingIds((prev) => [...prev, id]);
    try {
      const result = await adminApi.resetPermissionUserPassword(token, id);
      setSubmitSuccess(`密码已重置为 ${result.data.defaultPassword}`);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : '密码重置失败');
    } finally {
      setResettingIds((prev) => prev.filter((item) => item !== id));
    }
  }

  const selectedRoleTemplate = roleTemplates.find((item) => item.code === (selectedTeacher?.roleCode ?? editingTeacher?.roleCode ?? form.roleCode));
  const filteredUsers = useMemo(() => {
    const keyword = normalizeKeyword(searchKeyword);
    return users.filter((row) => {
      const matchesKeyword =
        !keyword ||
        normalizeKeyword(row.name).includes(keyword) ||
        normalizeKeyword(row.username).includes(keyword) ||
        normalizeKeyword(row.scopeDisplay).includes(keyword);
      const matchesRole = roleFilter === 'all' || row.roleCode === roleFilter;
      return matchesKeyword && matchesRole;
    });
  }, [roleFilter, searchKeyword, users]);
  const permissionPagination = usePagination(filteredUsers, `${searchKeyword}|${roleFilter}|${users.length}`);

  return (
    <Shell
      title="账号管理"
      subtitle="统一维护教师账号、角色分工和负责班级"
      loading={loading || pageLoading}
      user={user}
      status={
        <>
          {loading || pageLoading ? <div className="status-card">账号数据整理中...</div> : null}
          {error ? <div className="status-card error">{error}</div> : null}
          {submitError ? <div className="status-card error">{submitError}</div> : null}
          {submitSuccess ? <div className="status-card success">{submitSuccess}</div> : null}
        </>
      }
    >
      <div className="page-header">
        <h2>账号管理</h2>
        <div className="page-actions">
          <div className="search-box">
            <span className="s-icon">⌕</span>
            <input
              placeholder="搜索教师姓名/账号..."
              value={searchKeyword}
              onChange={(event) => setSearchKeyword(event.target.value)}
            />
          </div>
          <select className="filter-select" value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)}>
            <option value="all">全部岗位</option>
            {roleTemplates.map((item) => (
              <option key={item.code} value={item.code}>
                {item.name}
              </option>
            ))}
          </select>
          <button className="btn btn-primary" type="button" onClick={openCreate}>
            添加教师
          </button>
        </div>
      </div>

      {showAddPanel ? (
        <Modal
          title={editingTeacher ? '编辑教师账号' : '新增教师账号'}
          subtitle="统一设置岗位、负责班级和登录信息"
          onClose={() => {
            if (submitting) return;
            setShowAddPanel(false);
            setEditingTeacher(null);
          }}
        >
          <form className="settings-form" onSubmit={handleSubmit}>
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
                  {roleTemplates.map((item) => (
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
                      onChange={(event) =>
                        setForm((prev) => ({
                          ...prev,
                          classIds: event.target.checked
                            ? [...prev.classIds, String(item.id)]
                            : prev.classIds.filter((classId) => classId !== String(item.id)),
                        }))
                      }
                    />
                    {item.gradeName} {item.name}
                  </label>
                ))}
              </div>
            </div>
            {editingTeacher ? (
              <label className="checkbox-item">
                <input type="checkbox" checked={form.resetPassword} onChange={(event) => setForm((prev) => ({ ...prev, resetPassword: event.target.checked }))} />
                同时重置为随机临时密码
              </label>
            ) : null}
            <div className="form-actions">
              <button
                className="ghost-button"
                type="button"
                onClick={() => {
                  if (submitting) return;
                  setShowAddPanel(false);
                  setEditingTeacher(null);
                }}
                disabled={submitting}
              >
                取消
              </button>
              <button className="toolbar-button" type="submit" disabled={submitting}>
                {submitting ? '提交中...' : editingTeacher ? '保存修改' : '保存并开通'}
              </button>
            </div>
          </form>
        </Modal>
      ) : null}

      <div className="panel">
        <div className="panel-title">教师账号列表</div>
        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>姓名</th>
                <th>账号</th>
                <th>岗位</th>
                <th>负责范围</th>
                <th>状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {permissionPagination.pagedItems.map((row) => (
                <tr key={row.id}>
                  <td className="permission-name">{row.name}</td>
                  <td>{row.username}</td>
                  <td>{row.roleName}</td>
                  <td>{row.scopeDisplay}</td>
                  <td><span className="status-on">{formatEnabledStatus(row.status)}</span></td>
                  <td>
                    <button className="op-btn" type="button" onClick={() => openEdit(row)}>编辑账号</button>
                    <button className="op-btn" type="button" onClick={() => void handleResetPassword(row.id)} disabled={resettingIds.includes(row.id)}>
                      {resettingIds.includes(row.id) ? '处理中...' : '重置密码'}
                    </button>
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="table-empty">
                    当前筛选条件下没有教师账号
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
        <TablePagination
          currentPage={permissionPagination.currentPage}
          pageSize={permissionPagination.pageSize}
          totalItems={permissionPagination.totalItems}
          totalPages={permissionPagination.totalPages}
          onPageChange={permissionPagination.setCurrentPage}
          onPageSizeChange={permissionPagination.setPageSize}
        />
      </div>

      {selectedTeacher ? (
        <Modal
          title={`${selectedTeacher.name} · 账号详情`}
          subtitle="查看教师账号、岗位分工和负责范围"
          onClose={() => setSelectedTeacher(null)}
        >
          <div className="detail-grid">
            <div className="detail-card">
              <h4>账号信息</h4>
              <div className="detail-list">
                <div><span>姓名</span><strong>{selectedTeacher.name}</strong></div>
                <div><span>登录账号</span><strong>{selectedTeacher.username}</strong></div>
                <div><span>岗位</span><strong>{selectedTeacher.roleName}</strong></div>
                <div><span>状态</span><strong>{formatEnabledStatus(selectedTeacher.status)}</strong></div>
              </div>
            </div>
            <div className="detail-card">
              <h4>负责范围</h4>
              <div className="detail-list">
                <div><span>负责班级</span><strong>{selectedTeacher.scopeDisplay}</strong></div>
                <div><span>岗位说明</span><strong>{selectedTeacher.permissionSummary}</strong></div>
                <div><span>开通方式</span><strong>按岗位自动分配功能</strong></div>
                <div><span>最近查看</span><strong>{new Date().toLocaleDateString('zh-CN')}</strong></div>
              </div>
            </div>
            <div className="detail-card span-2">
              <h4>岗位可用功能</h4>
              <div className="settings-tag-row">
                {(selectedRoleTemplate?.permissions ?? selectedTeacher.permissions).map((item) => (
                  <span className="settings-tag" key={item}>{item}</span>
                ))}
              </div>
            </div>
          </div>
        </Modal>
      ) : null}
    </Shell>
  );
}

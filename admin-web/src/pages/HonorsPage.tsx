import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from 'react';
import { Modal } from '../components/Modal';
import { Shell } from '../components/Shell';
import type { 
  Honor,
  HonorRecord,
  HonorUpsertPayload,
  SessionUser
} from '../lib/api';
import { adminApi } from '../lib/api';
import { resolveAssetUrl } from '../lib/assets';
import { validateHonorImageFile } from '../utils/honorImage';
import type {
  HonorFormState
} from '../types/admin';
import {
  buildAutoCode,
  createHonorForm,
  normalizeKeyword,
} from '../utils/adminForms';
import { canManageHonors } from '../utils/adminPermissions';

type HonorsPageProps = {
  token: string;
  user: SessionUser | null;
  honors: Honor[];
  loading: boolean;
  error: string | null;
  onSaved: () => Promise<void>;
};

export function HonorsPage({
  token,
  user,
  honors,
  loading,
  error,
  onSaved,
}: HonorsPageProps) {
  const [tab, setTab] = useState<'all' | 'personal' | 'collective' | 'phase' | 'longterm'>('all');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'enabled' | 'disabled'>('all');
  const [editingHonor, setEditingHonor] = useState<Honor | null>(null);
  const [showCreateHonor, setShowCreateHonor] = useState(false);
  const [form, setForm] = useState<HonorFormState>(() => createHonorForm());
  const [pageHonors, setPageHonors] = useState<Honor[]>(honors);
  const [submitting, setSubmitting] = useState(false);
  const [statusUpdatingId, setStatusUpdatingId] = useState<number | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [honorRecords, setHonorRecords] = useState<HonorRecord[]>([]);
  const [recordsLoading, setRecordsLoading] = useState(false);
  const allowManage = canManageHonors(user?.roleCode);

  useEffect(() => {
    let active = true;
    setRecordsLoading(true);
    adminApi
      .honorRecords(token)
      .then((response) => {
        if (!active) return;
        setHonorRecords(response.data);
      })
      .catch(() => {
        if (!active) return;
        setHonorRecords([]);
      })
      .finally(() => {
        if (!active) return;
        setRecordsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [token, submitSuccess]);

  function reloadHonorRecords() {
    setRecordsLoading(true);
    adminApi
      .honorRecords(token)
      .then((response) => setHonorRecords(response.data))
      .catch(() => setHonorRecords([]))
      .finally(() => setRecordsLoading(false));
  }

  useEffect(() => {
    if (!allowManage) {
      setPageHonors(honors);
      return;
    }
    let active = true;
    adminApi
      .honors(token, { includeDisabled: true })
      .then((response) => {
        if (!active) return;
        setPageHonors(response.data);
      })
      .catch(() => {
        if (!active) return;
        setPageHonors(honors);
      });
    return () => {
      active = false;
    };
  }, [allowManage, honors, token]);

  const visibleCards = useMemo(() => {
    const keyword = normalizeKeyword(searchKeyword);
    return pageHonors.filter((item) => {
      const matchesTab = tab === 'all' || item.category === tab;
      const matchesKeyword =
        !keyword ||
        normalizeKeyword(item.name).includes(keyword) ||
        normalizeKeyword(item.code).includes(keyword) ||
        normalizeKeyword(item.description ?? '').includes(keyword) ||
        normalizeKeyword(item.conditionType ?? '').includes(keyword);
      const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
      return matchesTab && matchesKeyword && matchesStatus;
    });
  }, [pageHonors, searchKeyword, statusFilter, tab]);

  const honorStats = useMemo(() => {
    const enabledCount = pageHonors.filter((item) => item.status === 'enabled').length;
    const grantedTotal = pageHonors.reduce((sum, item) => sum + item.grantedCount, 0);
    return {
      total: pageHonors.length,
      enabledCount,
      grantedTotal,
    };
  }, [pageHonors]);

  const categoryLabelMap = {
    personal: '个人荣誉',
    collective: '集体荣誉',
    phase: '阶段荣誉',
    longterm: '长期荣誉',
  } as const;

  const iconThemeMap: Record<string, string> = {
    personal: 'star',
    collective: 'trophy',
    phase: 'target',
    longterm: 'progress',
  };

  const tabOptions: Array<{ key: typeof tab; label: string }> = [
    { key: 'all', label: '全部' },
    { key: 'personal', label: '个人荣誉' },
    { key: 'collective', label: '集体荣誉' },
    { key: 'phase', label: '阶段荣誉' },
    { key: 'longterm', label: '长期荣誉' },
  ];

  function closeModal(force = false) {
    if (submitting && !force) return;
    setShowCreateHonor(false);
    setEditingHonor(null);
    setSubmitError(null);
  }

  function openCreateHonor() {
    setEditingHonor(null);
    setForm(createHonorForm());
    setSubmitError(null);
    setShowCreateHonor(true);
  }

  function openEditHonor(honor: Honor) {
    if (!allowManage) return;
    setShowCreateHonor(false);
    setEditingHonor(honor);
    setForm(createHonorForm(honor));
    setSubmitError(null);
  }

  async function refreshHonors() {
    await onSaved();
    if (!allowManage) return;
    const response = await adminApi.honors(token, { includeDisabled: true });
    setPageHonors(response.data);
  }

  async function handleHonorImageUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setUploadingImage(true);
    setSubmitError(null);
    try {
      await validateHonorImageFile(file);
      const response = await adminApi.uploadHonorAsset(token, file);
      setForm((prev) => ({ ...prev, iconUrl: response.data.url }));
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : '勋章图片上传失败');
    } finally {
      setUploadingImage(false);
    }
  }

  async function toggleHonorStatus(item: Honor) {
    if (statusUpdatingId) return;
    const nextStatus = item.status === 'enabled' ? 'disabled' : 'enabled';
    setStatusUpdatingId(item.id);
    setSubmitError(null);
    setSubmitSuccess(null);
    try {
      await adminApi.updateHonorStatus(token, item.id, nextStatus);
      await refreshHonors();
      setSubmitSuccess(nextStatus === 'enabled' ? '荣誉勋章已启用' : '荣誉勋章已停用');
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : '勋章状态更新失败');
    } finally {
      setStatusUpdatingId(null);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(null);

    try {
      const name = form.name.trim();
      if (!name) {
        throw new Error('请填写荣誉名称');
      }
      const iconUrl = form.iconUrl.trim();
      if (!iconUrl) {
        throw new Error('请先上传勋章图片');
      }

      const payload: HonorUpsertPayload = {
        code: buildAutoCode('honor', form.name, editingHonor?.code || form.code),
        name,
        category: form.category,
        iconUrl,
        ...(form.description.trim() ? { description: form.description.trim() } : {}),
        ...(form.conditionType.trim() ? { conditionType: form.conditionType.trim() } : {}),
      };

      if (editingHonor) {
        await adminApi.updateHonor(token, editingHonor.id, payload);
      } else {
        await adminApi.createHonor(token, payload);
      }

      await refreshHonors();
      setSubmitSuccess(editingHonor ? '荣誉勋章已更新' : '荣誉勋章已创建');
      closeModal(true);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : '提交失败');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Shell
      title="荣誉勋章"
      subtitle="按个人、集体、阶段与长期成长荣誉统一维护学校荣誉体系"
      loading={loading}
      user={user}
      status={
        <>
          {loading ? <div className="status-card">荣誉数据整理中...</div> : null}
          {error ? <div className="status-card error">{error}</div> : null}
          {submitError ? <div className="status-card error">{submitError}</div> : null}
          {submitSuccess ? <div className="status-card success">{submitSuccess}</div> : null}
        </>
      }
    >
      <div className="honors-desk">
      <div className="page-header admin-list-page-header">
        <div>
          <h2>荣誉勋章</h2>
          <p className="page-desc">维护个人、集体、阶段与长期成长荣誉，统一配置授予口径与展示样式</p>
        </div>
        <div className="page-actions">
          <div className="search-box">
            <span className="s-icon">⌕</span>
            <input
              placeholder="搜索勋章名称..."
              value={searchKeyword}
              onChange={(event) => setSearchKeyword(event.target.value)}
            />
          </div>
          <select
            className="filter-select"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}
          >
            <option value="all">全部状态</option>
            <option value="enabled">启用中</option>
            <option value="disabled">已停用</option>
          </select>
          {allowManage ? (
            <button className="btn btn-primary" type="button" onClick={openCreateHonor}>
              + 新建勋章
            </button>
          ) : null}
        </div>
      </div>

      <div className="honors-summary-strip">
        <div className="honors-summary-item">
          <span>勋章总数</span>
          <strong>{honorStats.total}</strong>
        </div>
        <div className="honors-summary-item">
          <span>启用中</span>
          <strong>{honorStats.enabledCount}</strong>
        </div>
        <div className="honors-summary-item">
          <span>累计授予</span>
          <strong>{honorStats.grantedTotal}</strong>
        </div>
        <div className="honors-summary-item">
          <span>当前筛选</span>
          <strong>{visibleCards.length}</strong>
        </div>
      </div>

      <div className="reward-tabs">
        {tabOptions.map((item) => (
          <button
            key={item.key}
            type="button"
            className={`reward-tab${tab === item.key ? ' active' : ''}`}
            onClick={() => setTab(item.key)}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="honor-grid">
        {visibleCards.map((item) => (
          <article
            className={`honor-card${item.status === 'disabled' ? ' is-disabled' : ''}`}
            key={item.id}
            data-icon={iconThemeMap[item.category]}
          >
            <div className="honor-card-media">
              {item.iconUrl ? (
                <img src={resolveAssetUrl(item.iconUrl)} alt="" />
              ) : (
                <span className="honor-fallback">{item.name.slice(0, 2)}</span>
              )}
              {item.status === 'disabled' ? <span className="honor-card-flag">已停用</span> : null}
              {allowManage ? (
                <div className="honor-card-toolbar">
                  <button type="button" className="honor-tool-btn" onClick={() => openEditHonor(item)} title="编辑">
                    编
                  </button>
                  <button
                    type="button"
                    className="honor-tool-btn"
                    onClick={() => void toggleHonorStatus(item)}
                    disabled={statusUpdatingId === item.id}
                    title={item.status === 'enabled' ? '停用' : '启用'}
                  >
                    {item.status === 'enabled' ? '停' : '启'}
                  </button>
                </div>
              ) : null}
            </div>
            <div className="honor-card-body">
              <div className="honor-card-head">
                <h3 className="h-name">{item.name}</h3>
                <span className={`h-cat ${item.category}`}>{categoryLabelMap[item.category]}</span>
              </div>
              <p className="honor-card-summary">
                已授予 <strong>{item.grantedCount}</strong> 次
                {item.conditionType ? (
                  <>
                    <span className="honor-card-sep">·</span>
                    {item.conditionType}
                  </>
                ) : null}
              </p>
            </div>
          </article>
        ))}
        {visibleCards.length === 0 ? <div className="settings-note">当前筛选条件下暂无荣誉勋章。</div> : null}
      </div>

      <section className="honor-records-panel">
        <div className="honor-records-panel-head">
          <h3>最近授予记录</h3>
          <button type="button" className="ghost-button" onClick={reloadHonorRecords} disabled={recordsLoading}>
            刷新
          </button>
        </div>
        {recordsLoading ? <div className="settings-note">授予记录加载中...</div> : null}
        {!recordsLoading && honorRecords.length === 0 ? (
          <div className="settings-note">暂无授予记录。教师可在「学生评价」或「班级管理」中为学生 / 班级颁发荣誉。</div>
        ) : null}
        {!recordsLoading && honorRecords.length > 0 ? (
          <div className="honor-records-table-wrap">
            <table className="honor-records-table">
              <thead>
                <tr>
                  <th>授予时间</th>
                  <th>荣誉</th>
                  <th>对象</th>
                  <th>班级</th>
                  <th>授予人</th>
                  <th>备注</th>
                </tr>
              </thead>
              <tbody>
                {honorRecords.slice(0, 20).map((item) => (
                  <tr key={item.id}>
                    <td>{new Date(item.grantedAt).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}</td>
                    <td>{item.honorName}</td>
                    <td className="honor-records-target">
                      <strong>{item.targetType === 'student' ? item.studentName ?? '—' : item.className}</strong>
                      <span>{item.targetType === 'student' ? '学生' : '集体'}</span>
                    </td>
                    <td>{item.className}</td>
                    <td>{item.grantedByName ?? '系统'}</td>
                    <td>{item.remark ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>
      </div>

      {showCreateHonor || editingHonor ? (
        <Modal
          title={editingHonor ? '编辑荣誉勋章' : '新增荣誉勋章'}
          subtitle=""
          onClose={closeModal}
        >
          <form className="form-grid" onSubmit={handleSubmit}>
            <label>
              <span>勋章名称</span>
              <input type="text" value={form.name} onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))} />
            </label>
            <label>
              <span>荣誉分类</span>
              <select value={form.category} onChange={(event) => setForm((prev) => ({ ...prev, category: event.target.value as Honor['category'] }))}>
                <option value="personal">个人荣誉</option>
                <option value="collective">集体荣誉</option>
                <option value="phase">阶段荣誉</option>
                <option value="longterm">长期荣誉</option>
              </select>
            </label>
            <label>
              <span>授予规则说明</span>
              <input type="text" value={form.conditionType} onChange={(event) => setForm((prev) => ({ ...prev, conditionType: event.target.value }))} placeholder="选填，例如：达到月度积分目标" />
            </label>
            <label className="span-2">
              <span>勋章图片（必传，300×300 像素）</span>
              <input type="file" accept="image/*" onChange={handleHonorImageUpload} disabled={uploadingImage || submitting} />
              <div className="settings-note">请上传 300×300 像素的 PNG、JPG、WebP 或 SVG，避免大图拖慢大屏加载。</div>
              {form.iconUrl ? (
                <div className="honor-upload-preview">
                  <img src={resolveAssetUrl(form.iconUrl)} alt="勋章预览" />
                  <span>{form.iconUrl}</span>
                </div>
              ) : null}
            </label>
            <label className="span-2">
              <span>勋章说明</span>
              <textarea
                rows={4}
                value={form.description}
                onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
              />
            </label>
            {submitError ? <div className="status-card error span-2">{submitError}</div> : null}
            <div className="form-actions span-2">
              <button type="button" className="ghost-button" onClick={() => closeModal()} disabled={submitting}>
                取消
              </button>
              <button type="submit" className="toolbar-button" disabled={submitting}>
                {submitting ? '提交中...' : editingHonor ? '保存勋章' : '创建勋章'}
              </button>
            </div>
          </form>
        </Modal>
      ) : null}
    </Shell>
  );
}

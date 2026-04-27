import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import { Modal } from '../components/Modal';
import { Shell } from '../components/Shell';
import type { 
  Honor,
  HonorUpsertPayload,
  SessionUser
} from '../lib/api';
import { adminApi } from '../lib/api';
import { resolveAssetUrl } from '../lib/assets';
import type {
  HonorFormState
} from '../types/admin';
import {
  buildAutoCode,
  createHonorForm,
  formatEnabledStatus
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
  const [editingHonor, setEditingHonor] = useState<Honor | null>(null);
  const [showCreateHonor, setShowCreateHonor] = useState(false);
  const [form, setForm] = useState<HonorFormState>(() => createHonorForm());
  const [pageHonors, setPageHonors] = useState<Honor[]>(honors);
  const [submitting, setSubmitting] = useState(false);
  const [statusUpdatingId, setStatusUpdatingId] = useState<number | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const allowManage = canManageHonors(user?.roleCode);

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

  const visibleCards = pageHonors.filter((item) => tab === 'all' || item.category === tab);

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
      if (!form.code.trim() || !name) {
        throw new Error('请填写完整的荣誉名称');
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
      user={user}
      status={
        <>
          {loading ? <div className="status-card">荣誉数据整理中...</div> : null}
          {error ? <div className="status-card error">{error}</div> : null}
          {submitSuccess ? <div className="status-card success">{submitSuccess}</div> : null}
        </>
      }
    >
      <div className="page-header">
        <h2>荣誉勋章管理</h2>
        {allowManage ? (
          <div className="page-actions">
            <button className="btn btn-primary" type="button" onClick={openCreateHonor}>
              + 新建勋章
            </button>
          </div>
        ) : null}
      </div>
      <div className="honor-tabs">
        {[
          ['all', '全部'],
          ['personal', '个人荣誉'],
          ['collective', '集体荣誉'],
          ['phase', '阶段荣誉'],
          ['longterm', '长期荣誉'],
        ].map(([key, label]) => (
          <button
            key={key}
            type="button"
            className={`honor-tab${tab === key ? ' active' : ''}`}
            onClick={() => setTab(key as typeof tab)}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="honor-grid">
        {visibleCards.map((item) => (
          <div className="honor-card" key={item.id} data-icon={iconThemeMap[item.category]}>
            <span className="h-icon">
              {item.iconUrl ? (
                <img className="honor-icon-image" src={resolveAssetUrl(item.iconUrl)} alt={item.name} />
              ) : (
                item.name.slice(0, 1)
              )}
            </span>
            <div className="h-name">{item.name}</div>
            <span className={`h-cat ${item.category}`}>{categoryLabelMap[item.category]}</span>
            <div className="h-desc">{item.description ?? '暂无勋章说明，建议补充授予场景与评定口径。'}</div>
            <div className="h-bottom">
              <span className={`h-status ${item.status === 'enabled' ? 'on' : 'off'}`}>{formatEnabledStatus(item.status, '启用中', '已停用')}</span>
              <div className="h-actions">
                <span>已授予 {item.grantedCount} 次</span>
                {allowManage ? (
                  <>
                    <button className="link-button" type="button" onClick={() => openEditHonor(item)}>
                      编辑
                    </button>
                    <button
                      className="link-button"
                      type="button"
                      onClick={() => void toggleHonorStatus(item)}
                      disabled={statusUpdatingId === item.id}
                    >
                      {item.status === 'enabled' ? '停用' : '启用'}
                    </button>
                  </>
                ) : null}
              </div>
            </div>
          </div>
        ))}
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
              <span>勋章图片（必传）</span>
              <input type="file" accept="image/*" onChange={handleHonorImageUpload} disabled={uploadingImage || submitting} />
              {form.iconUrl ? <div className="settings-note">当前图片：{form.iconUrl}</div> : null}
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

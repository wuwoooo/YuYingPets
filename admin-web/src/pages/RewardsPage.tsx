import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from 'react';
import { Modal } from '../components/Modal';
import { Shell } from '../components/Shell';
import type { AdminClass, AdminStudent, Reward, RewardOrder, RewardUpsertPayload, SessionUser } from '../lib/api';
import { adminApi } from '../lib/api';
import { useConfirmDialog } from '../context/ConfirmDialogContext';
import { resolveAssetUrl } from '../lib/assets';
import type { RewardFormState } from '../types/admin';
import { createRewardForm, formatEnabledStatus, normalizeKeyword } from '../utils/adminForms';
import { canManageClassRewards, canManageRewards } from '../utils/adminPermissions';

type RewardsPageProps = {
  token: string;
  user: SessionUser | null;
  classes: AdminClass[];
  students: AdminStudent[];
  rewards: Reward[];
  loading: boolean;
  error: string | null;
  onSaved: () => Promise<void>;
};

type RewardListTab = 'school' | 'class' | 'orders';
type TeacherTab = 'rewards' | 'orders';
const DEFAULT_ORDER_STATUS_OPTIONS = ['all', 'received'] as const;

export function RewardsPage({
  token,
  user,
  classes,
  students,
  rewards,
  loading,
  error,
  onSaved,
}: RewardsPageProps) {
  const { confirm } = useConfirmDialog();
  const allowManageGlobal = canManageRewards(user?.roleCode);
  const allowManageClass = canManageClassRewards(user?.roleCode);
  const isTeacherRewardRole = allowManageClass && !allowManageGlobal;

  const accessibleClasses = useMemo(() => {
    if (allowManageGlobal) {
      return [...classes].sort((left, right) => left.gradeName.localeCompare(right.gradeName, 'zh-CN') || left.name.localeCompare(right.name, 'zh-CN'));
    }
    const assignedClassIds = new Set(user?.classAssignments?.map((item) => item.classId) ?? []);
    return classes
      .filter((item) => assignedClassIds.has(item.id) || item.homeroomTeacher?.id === user?.id)
      .sort((left, right) => left.gradeName.localeCompare(right.gradeName, 'zh-CN') || left.name.localeCompare(right.name, 'zh-CN'));
  }, [allowManageGlobal, classes, user?.classAssignments, user?.id]);

  const [rewardTab, setRewardTab] = useState<RewardListTab>('school');
  const [teacherTab, setTeacherTab] = useState<TeacherTab>('rewards');
  const [selectedGradeCode, setSelectedGradeCode] = useState<string>('all');
  const [activeClassId, setActiveClassId] = useState<number | null>(null);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'enabled' | 'disabled'>('all');
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null);
  const [rewardModalMode, setRewardModalMode] = useState<'records' | 'edit'>('records');
  const [showCreateReward, setShowCreateReward] = useState(false);
  const [rewardOrders, setRewardOrders] = useState<RewardOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [classRewardOrders, setClassRewardOrders] = useState<RewardOrder[]>([]);
  const [classOrdersLoading, setClassOrdersLoading] = useState(false);
  const [classOrdersError, setClassOrdersError] = useState<string | null>(null);
  const [orderStatusFilter, setOrderStatusFilter] = useState<'all' | string>('all');
  const [form, setForm] = useState<RewardFormState>(() => createRewardForm());
  const [submitting, setSubmitting] = useState(false);
  const [uploadingRewardImage, setUploadingRewardImage] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  const gradeOptions = useMemo(
    () => ['all', ...Array.from(new Set(accessibleClasses.map((item) => item.gradeCode).filter(Boolean)))],
    [accessibleClasses],
  );

  const selectableClasses = useMemo(
    () => accessibleClasses.filter((item) => selectedGradeCode === 'all' || item.gradeCode === selectedGradeCode),
    [accessibleClasses, selectedGradeCode],
  );

  useEffect(() => {
    if (selectedGradeCode === 'all' || accessibleClasses.some((item) => item.gradeCode === selectedGradeCode)) return;
    setSelectedGradeCode('all');
  }, [accessibleClasses, selectedGradeCode]);

  useEffect(() => {
    if (activeClassId && selectableClasses.some((item) => item.id === activeClassId)) return;
    setActiveClassId(null);
  }, [activeClassId, selectableClasses]);

  useEffect(() => {
    if (allowManageGlobal) {
      setRewardTab('school');
      return;
    }
    if (isTeacherRewardRole) {
      setTeacherTab('rewards');
    }
  }, [allowManageGlobal, isTeacherRewardRole]);

  useEffect(() => {
    if (!allowManageClass) {
      setClassRewardOrders([]);
      return;
    }

    let active = true;
    setClassOrdersLoading(true);
    setClassOrdersError(null);
    adminApi
      .rewardOrders(token, activeClassId ? { classId: activeClassId } : undefined)
      .then((response) => {
        if (!active) return;
        setClassRewardOrders(response.data);
      })
      .catch((err) => {
        if (!active) return;
        setClassRewardOrders([]);
        setClassOrdersError(err instanceof Error ? err.message : '兑换记录加载失败');
      })
      .finally(() => {
        if (!active) return;
        setClassOrdersLoading(false);
      });

    return () => {
      active = false;
    };
  }, [activeClassId, allowManageClass, token]);

  const activeClass = useMemo(
    () => accessibleClasses.find((item) => item.id === activeClassId) ?? null,
    [activeClassId, accessibleClasses],
  );

  const selectedClassIds = useMemo(() => new Set(selectableClasses.map((item) => item.id)), [selectableClasses]);

  const classStudents = useMemo(
    () => students.filter((item) => {
      if (activeClassId) return item.classId === activeClassId;
      return selectedClassIds.has(item.classId);
    }),
    [activeClassId, selectedClassIds, students],
  );

  const visibleRewards = useMemo(() => {
    const keyword = normalizeKeyword(searchKeyword);
    const base = rewards.filter((item) => {
      if (statusFilter !== 'all' && item.status !== statusFilter) return false;
      if (keyword) {
        const matched = [
          item.name,
          item.code,
          item.createdByName ?? '',
          item.sourceLabel,
          item.category,
        ].some((value) => normalizeKeyword(value).includes(keyword));
        if (!matched) return false;
      }

      if (allowManageGlobal) {
        if (rewardTab === 'school') return item.scopeType === 'global';
        if (rewardTab === 'class') {
          if (item.scopeType !== 'class') return false;
          if (activeClassId && item.classId !== activeClassId) return false;
          if (!activeClassId && item.classId && !selectedClassIds.has(item.classId)) return false;
          return true;
        }
        return false;
      }

      if (item.scopeType !== 'class') return false;
      if (activeClassId && item.classId !== activeClassId) return false;
      if (!activeClassId && item.classId && !selectedClassIds.has(item.classId)) return false;
      return true;
    });

    return base.sort((left, right) => left.scoreCost - right.scoreCost || left.name.localeCompare(right.name, 'zh-CN'));
  }, [activeClassId, allowManageGlobal, rewardTab, rewards, searchKeyword, selectedClassIds, statusFilter]);

  const filteredClassOrders = useMemo(() => {
    const keyword = normalizeKeyword(searchKeyword);
    return classRewardOrders.filter((item) => {
      if (!activeClassId && !selectedClassIds.has(item.classId)) return false;
      if (orderStatusFilter !== 'all' && item.status !== orderStatusFilter) return false;
      if (!keyword) return true;
      return [item.student.name, item.student.studentNo, item.reward.name].some((value) => normalizeKeyword(value).includes(keyword));
    });
  }, [activeClassId, classRewardOrders, orderStatusFilter, searchKeyword, selectedClassIds]);

  const classOrderStats = useMemo(() => {
    const studentIds = new Set(filteredClassOrders.map((item) => item.studentId));
    const totalScoreCost = filteredClassOrders.reduce((sum, item) => sum + item.scoreCost, 0);
    return {
      orderCount: filteredClassOrders.length,
      studentCount: studentIds.size,
      totalScoreCost,
      latestOrder: filteredClassOrders[0] ?? null,
    };
  }, [filteredClassOrders]);

  const orderStatusOptions = useMemo(() => DEFAULT_ORDER_STATUS_OPTIONS, []);

  const studentOrderCounts = useMemo(() => {
    const map = new Map<number, { name: string; count: number; scoreCost: number }>();
    filteredClassOrders.forEach((item) => {
      const current = map.get(item.studentId) ?? { name: item.student.name, count: 0, scoreCost: 0 };
      current.count += 1;
      current.scoreCost += item.scoreCost;
      map.set(item.studentId, current);
    });
    return Array.from(map.values()).sort((left, right) => right.count - left.count || right.scoreCost - left.scoreCost).slice(0, 6);
  }, [filteredClassOrders]);

  function formatOrderStatus(status: string) {
    return status === 'received' ? '已领取' : status === 'cancelled' ? '已取消' : status;
  }

  function canEditReward(item: Reward) {
    if (allowManageGlobal) return true;
    return item.scopeType === 'class' && item.createdBy === user?.id;
  }

  function openCreateReward() {
    const defaultClassId =
      activeClassId ?? selectableClasses[0]?.id ?? accessibleClasses[0]?.id ?? null;
    setRewardModalMode('edit');
    setSelectedReward(null);
    setShowCreateReward(true);
    setSubmitError(null);
    setForm({
      ...createRewardForm(),
      scopeType: allowManageGlobal && rewardTab === 'school' ? 'global' : 'class',
      classId: defaultClassId ? String(defaultClassId) : '',
      isInfiniteStock: true,
      category: allowManageGlobal && rewardTab === 'school' ? '' : 'class_custom',
    });
  }

  function openRewardEditor(reward: Reward) {
    setRewardModalMode('edit');
    setSelectedReward(reward);
    setShowCreateReward(false);
    setSubmitError(null);
    setForm(createRewardForm(reward));
  }

  async function openRewardRecords(reward: Reward) {
    setSelectedReward(reward);
    setRewardModalMode('records');
    setOrdersLoading(true);
    setSubmitError(null);
    try {
      const response = await adminApi.rewardOrders(token, reward.classId ? { classId: reward.classId } : undefined);
      setRewardOrders(response.data.filter((item) => item.rewardId === reward.id));
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : '奖励记录加载失败');
    } finally {
      setOrdersLoading(false);
    }
  }

  async function reloadClassRewardOrders() {
    setClassOrdersLoading(true);
    setClassOrdersError(null);
    try {
      const response = await adminApi.rewardOrders(token, activeClassId ? { classId: activeClassId } : undefined);
      setClassRewardOrders(response.data);
    } catch (err) {
      setClassOrdersError(err instanceof Error ? err.message : '兑换记录加载失败');
    } finally {
      setClassOrdersLoading(false);
    }
  }

  async function handleRewardSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(null);

    try {
      const name = form.name.trim();
      const scopeType = form.scopeType;
      const scoreCostText = form.scoreCost.trim();
      const stockQtyText = form.stockQty.trim();
      const classId = form.classId ? Number(form.classId) : undefined;

      if (!name || !scoreCostText) {
        throw new Error('请填写完整的奖励名称和所需积分');
      }
      if (!/^\d+$/.test(scoreCostText)) {
        throw new Error('所需积分必须是大于等于 0 的整数');
      }
      if (scopeType === 'class' && !classId) {
        throw new Error('班级奖励必须选择班级');
      }
      if (!form.isInfiniteStock && !stockQtyText) {
        throw new Error('有限库存奖励必须填写库存数量');
      }
      if (!form.isInfiniteStock && stockQtyText && !/^\d+$/.test(stockQtyText)) {
        throw new Error('库存数量必须是大于等于 0 的整数');
      }

      const payload: RewardUpsertPayload = {
        name,
        scopeType,
        classId,
        scoreCost: Number(scoreCostText),
        isInfiniteStock: form.isInfiniteStock,
        ...(!form.isInfiniteStock && stockQtyText ? { stockQty: Number(stockQtyText) } : {}),
      };

      if (scopeType === 'global') {
        payload.code = form.code.trim() || undefined;
        payload.category = form.category.trim() || undefined;
        payload.imageUrl = form.imageUrl.trim() || undefined;
      }

      if (selectedReward) {
        await adminApi.updateReward(token, selectedReward.id, payload);
      } else {
        await adminApi.createReward(token, payload);
      }

      await onSaved();
      setSubmitSuccess(selectedReward ? '奖励已更新' : '奖励已创建');
      setSelectedReward(null);
      setShowCreateReward(false);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : '奖励保存失败');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRewardImageUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setUploadingRewardImage(true);
    setSubmitError(null);
    try {
      const response = await adminApi.uploadRewardAsset(token, file);
      setForm((prev) => ({ ...prev, imageUrl: response.data.url }));
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : '奖励图片上传失败');
    } finally {
      setUploadingRewardImage(false);
    }
  }

  async function toggleRewardStatus(item: Reward) {
    try {
      setSubmitError(null);
      setSubmitSuccess(null);
      const nextStatus = item.status === 'enabled' ? 'disabled' : 'enabled';
      await adminApi.updateRewardStatus(token, item.id, nextStatus);
      await onSaved();
      setSubmitSuccess(nextStatus === 'enabled' ? '奖励已启用' : '奖励已停用');
      if (selectedReward?.id === item.id) {
        setSelectedReward({ ...item, status: nextStatus });
      }
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : '奖励状态更新失败');
    }
  }

  async function deleteReward(item: Reward) {
    const confirmed = await confirm({
      title: '删除奖励',
      message: `确认删除奖励「${item.name}」吗？${item.rewardOrderCount > 0 ? '\n该奖励已有兑换记录，通常应改为停用。' : ''}`,
      confirmLabel: '确认删除',
      tone: 'danger',
    });
    if (!confirmed) return;

    try {
      setSubmitError(null);
      setSubmitSuccess(null);
      await adminApi.deleteReward(token, item.id);
      await onSaved();
      setSubmitSuccess('奖励已删除');
      if (selectedReward?.id === item.id) {
        setSelectedReward(null);
      }
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : '奖励删除失败');
    }
  }

  function renderRewardForm(submitLabel: string, close: () => void) {
    const isClassReward = form.scopeType === 'class';
    const selectedClassLabel =
      accessibleClasses.find((item) => String(item.id) === form.classId)
        ? `${accessibleClasses.find((item) => String(item.id) === form.classId)?.gradeName} ${accessibleClasses.find((item) => String(item.id) === form.classId)?.name}`
        : '未选择班级';

    return (
      <form className="reward-editor-form" onSubmit={handleRewardSubmit}>
        <div className="reward-editor-hero">
          <div className="reward-editor-hero-main">
            <span className="reward-editor-kicker">{isClassReward ? '班级激励' : '学校奖励'}</span>
            <h4>{isClassReward ? '创建一个更贴近日常班级管理的奖励' : '配置面向全校展示的统一奖励'}</h4>
            <p>
              {isClassReward
                ? '班级奖励只在当前班级奖励池里出现。建议用简短、明确、容易兑现的名称，避免做成模糊口号。'
                : '学校奖励适合做统一兑换项，可配置分类和图片，用于全校公共奖励中心展示。'}
            </p>
            <div className="reward-editor-meta-row">
              <span className="reward-editor-meta-pill">当前范围：{isClassReward ? '班级奖励' : '学校奖励'}</span>
              <span className="reward-editor-meta-pill">库存模式：{form.isInfiniteStock ? '不限库存' : '有限库存'}</span>
            </div>
          </div>
          <div className="reward-editor-summary-card">
            <span>奖励预览</span>
            <strong>{form.name.trim() || '未命名奖励'}</strong>
            <b>{form.scoreCost.trim() || '0'} 分可兑</b>
            <p>{isClassReward ? selectedClassLabel : (form.category.trim() || '学校公共奖励')}</p>
          </div>
        </div>

        <div className="reward-editor-layout">
          <section className="reward-editor-card">
            <div className="reward-editor-card-head">
              <div>
                <h5>基础信息</h5>
                <p>先确定奖励名称、范围和适用对象。</p>
              </div>
            </div>
            <div className="reward-editor-fields">
              <label className="reward-editor-field">
                <span>奖励名称</span>
                <input type="text" value={form.name} onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))} placeholder="例如：作业免写券、值日优先权" />
              </label>
              <label className="reward-editor-field">
                <span>奖励范围</span>
                <select
                  value={form.scopeType}
                  disabled={!allowManageGlobal || Boolean(selectedReward?.scopeType === 'class')}
                  onChange={(event) => setForm((prev) => ({ ...prev, scopeType: event.target.value as 'global' | 'class' }))}
                >
                  <option value="global">学校奖励</option>
                  <option value="class">班级奖励</option>
                </select>
              </label>
              <label className="reward-editor-field reward-editor-field-wide">
                <span>适用班级</span>
                <select value={form.classId} disabled={!isClassReward || Boolean(selectedReward)} onChange={(event) => setForm((prev) => ({ ...prev, classId: event.target.value }))}>
                  <option value="">请选择班级</option>
                  {accessibleClasses.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.gradeName} {item.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </section>

          <section className="reward-editor-card">
            <div className="reward-editor-card-head">
              <div>
                <h5>兑换规则</h5>
                <p>控制学生需要多少分，以及是否限制可兑换次数。</p>
              </div>
            </div>
            <div className="reward-editor-fields">
              <label className="reward-editor-field">
                <span>所需分值</span>
                <input type="text" value={form.scoreCost} onChange={(event) => setForm((prev) => ({ ...prev, scoreCost: event.target.value }))} placeholder="20" />
              </label>
              <label className="reward-editor-field">
                <span>库存数量</span>
                <input
                  type="text"
                  value={form.stockQty}
                  disabled={form.isInfiniteStock}
                  onChange={(event) => setForm((prev) => ({ ...prev, stockQty: event.target.value }))}
                  placeholder={isClassReward ? '有限库存时必填' : '不限库存可留空'}
                />
              </label>
              <label className="reward-editor-switch reward-editor-field-wide">
                <div>
                  <strong>不限库存</strong>
                  <span>适合长期有效的精神奖励或班级特权</span>
                </div>
                <input
                  type="checkbox"
                  checked={form.isInfiniteStock}
                  onChange={(event) => setForm((prev) => ({ ...prev, isInfiniteStock: event.target.checked, stockQty: event.target.checked ? '' : prev.stockQty }))}
                />
              </label>
            </div>
          </section>

          {!isClassReward ? (
            <section className="reward-editor-card reward-editor-card-wide">
              <div className="reward-editor-card-head">
                <div>
                  <h5>展示信息</h5>
                  <p>学校奖励可补充分类和图片，用于奖励中心卡片展示。</p>
                </div>
              </div>
              <div className="reward-editor-fields">
                <label className="reward-editor-field">
                  <span>奖励分类</span>
                  <input type="text" value={form.category} onChange={(event) => setForm((prev) => ({ ...prev, category: event.target.value }))} placeholder="如：文化周边、实物奖励" />
                </label>
                <label className="reward-editor-field reward-editor-field-wide">
                  <span>图片地址</span>
                  <input type="text" value={form.imageUrl} onChange={(event) => setForm((prev) => ({ ...prev, imageUrl: event.target.value }))} placeholder="可留空" />
                </label>
                <label className="reward-editor-field reward-editor-field-wide">
                  <span>上传图片</span>
                  <input type="file" accept="image/*" onChange={handleRewardImageUpload} disabled={uploadingRewardImage || submitting} />
                </label>
                {form.imageUrl.trim() ? (
                  <div className="image-upload-preview reward-upload-preview reward-editor-field-wide">
                    <button
                      type="button"
                      className="image-upload-preview-button"
                      onClick={() => setPreviewImageUrl(form.imageUrl)}
                      aria-label="预览奖励图片"
                    >
                      <img src={resolveAssetUrl(form.imageUrl)} alt="奖励预览" />
                    </button>
                    <span>{form.imageUrl}</span>
                  </div>
                ) : null}
              </div>
            </section>
          ) : null}
        </div>

        {submitError ? <div className="status-card error">{submitError}</div> : null}

        <div className="reward-editor-actions">
          <button type="button" className="ghost-button" onClick={close} disabled={submitting}>
            取消
          </button>
          <button type="submit" className="toolbar-button" disabled={submitting}>
            {submitting ? '提交中...' : submitLabel}
          </button>
        </div>
      </form>
    );
  }

  function renderRewardCards(items: Reward[]) {
    return (
      <div className="reward-grid">
        {items.map((item) => {
          const editable = canEditReward(item);
          const showImage = item.scopeType === 'global' && item.imageUrl;
          return (
            <article className={`reward-card${item.status === 'disabled' ? ' is-disabled' : ''}`} key={item.id}>
              <div className="reward-card-media">
                {showImage ? <img src={resolveAssetUrl(item.imageUrl!)} alt="" /> : <span className="reward-fallback">{item.name.slice(0, 2)}</span>}
                {item.status === 'disabled' ? <span className="reward-card-flag">已停用</span> : null}
                <div className="reward-card-toolbar">
                  <button type="button" className="reward-tool-btn" onClick={() => void openRewardRecords(item)} title="兑换记录">
                    记录
                  </button>
                  {editable ? (
                    <>
                      <button type="button" className="reward-tool-btn" onClick={() => openRewardEditor(item)} title="编辑">
                        编
                      </button>
                      <button type="button" className="reward-tool-btn" onClick={() => void toggleRewardStatus(item)} title={item.status === 'enabled' ? '停用' : '启用'}>
                        {item.status === 'enabled' ? '停' : '启'}
                      </button>
                      <button type="button" className="reward-tool-btn danger" onClick={() => void deleteReward(item)} title="删除">
                        删
                      </button>
                    </>
                  ) : null}
                </div>
              </div>
              <div className="reward-card-body">
                <div className="reward-card-head">
                  <h3 className="r-name">{item.name}</h3>
                  <span className={`r-cat ${item.scopeType === 'class' ? 'privilege' : item.category}`}>{item.sourceLabel}</span>
                </div>
                <p className="reward-card-summary">
                  <strong>{item.scoreCost}</strong> 积分
                  <span className="reward-card-sep">·</span>
                  {item.isInfiniteStock ? '库存不限' : `剩余 ${item.stockQty ?? 0} 份`}
                  {item.createdByName ? (
                    <>
                      <span className="reward-card-sep">·</span>
                      {item.createdByName}
                    </>
                  ) : null}
                  {item.rewardOrderCount > 0 ? (
                    <>
                      <span className="reward-card-sep">·</span>
                      {item.rewardOrderCount} 笔兑换
                    </>
                  ) : null}
                </p>
              </div>
            </article>
          );
        })}
        {items.length === 0 ? <div className="settings-note">当前条件下暂无奖励数据。</div> : null}
      </div>
    );
  }

  function renderOrdersPanel() {
    return (
      <>
        <div className="metric-strip">
          <div className="metric-card mc-blue">
            <div className="label">兑换记录</div>
            <div className="metric-value-line"><span className="value">{classOrderStats.orderCount}</span><span className="metric-value-suffix">条</span></div>
            <div className="metric-footer"><span className="metric-sub">{activeClass ? '本班累计兑换' : '当前筛选范围累计兑换'}</span></div>
          </div>
          <div className="metric-card mc-green">
            <div className="label">涉及学生</div>
            <div className="metric-value-line"><span className="value">{classOrderStats.studentCount}</span><span className="metric-value-suffix">人</span></div>
            <div className="metric-footer"><span className="metric-sub">范围内学生共 {classStudents.length} 人</span></div>
          </div>
          <div className="metric-card mc-gold">
            <div className="label">消耗积分</div>
            <div className="metric-value-line"><span className="value">{classOrderStats.totalScoreCost}</span><span className="metric-value-suffix">分</span></div>
            <div className="metric-footer"><span className="metric-sub">学生兑换消耗</span></div>
          </div>
          <div className="metric-card mc-teal">
            <div className="label">最近兑换</div>
            <div className="metric-value-line"><span className="value">{classOrderStats.latestOrder ? formatOrderStatus(classOrderStats.latestOrder.status) : '暂无'}</span></div>
            <div className="metric-footer">
              <span className="metric-sub">
                {classOrderStats.latestOrder ? `${classOrderStats.latestOrder.student.name} · ${classOrderStats.latestOrder.reward.name}` : '兑换后会出现在这里'}
              </span>
            </div>
          </div>
        </div>

        <div className="exchange-processing-grid">
          <div className="data-table-wrap exchange-orders-table">
            <table className="data-table">
              <thead>
                <tr>
                  <th>学生</th>
                  <th>兑换奖励</th>
                  <th>消耗积分</th>
                  <th>状态</th>
                  <th>发起时间</th>
                  <th>来源</th>
                </tr>
              </thead>
              <tbody>
                {filteredClassOrders.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <strong>{item.student.name}</strong>
                      <div className="page-desc">学号 {item.student.studentNo}</div>
                    </td>
                    <td>{item.reward.name}</td>
                    <td>{item.scoreCost} 分</td>
                    <td><span className="status-on">{formatOrderStatus(item.status)}</span></td>
                    <td>{new Date(item.createdAt).toLocaleString('zh-CN', { hour12: false })}</td>
                    <td>{item.sourceTerminal === 'display' ? '展示端' : '管理端'}</td>
                  </tr>
                ))}
                {!classOrdersLoading && filteredClassOrders.length === 0 ? (
                  <tr>
                    <td className="table-empty" colSpan={6}>
                      {classRewardOrders.length === 0 ? '当前筛选范围暂无兑换记录。' : '没有匹配当前筛选条件的兑换记录。'}
                    </td>
                  </tr>
                ) : null}
                {classOrdersLoading ? (
                  <tr>
                    <td className="table-empty" colSpan={6}>兑换记录加载中...</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>

          <div className="panel">
            <div className="panel-title">学生兑换排行</div>
            <div className="mini-list">
              {studentOrderCounts.map((item) => (
                <div className="mini-list-item" key={item.name}>
                  <div>
                    <strong>{item.name}</strong>
                    <span>累计兑换 {item.count} 次，消耗 {item.scoreCost} 分</span>
                  </div>
                  <b>{item.count} 次</b>
                </div>
              ))}
              {studentOrderCounts.length === 0 ? (
                <div className="mini-list-item">
                  <div>
                    <strong>暂无兑换</strong>
                    <span>学生发起兑换后，这里会显示排行。</span>
                  </div>
                  <b>待更新</b>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </>
    );
  }

  const shellTitle = allowManageGlobal ? '奖励中心' : '班级奖励';
  const shellSubtitle = allowManageGlobal ? '统一维护学校奖励与班级奖励，并跟踪学生兑换情况' : '为自己的班级维护奖励，并查看学生兑换记录';
  const showClassFilters =
    (allowManageGlobal && rewardTab !== 'school') ||
    (isTeacherRewardRole && (teacherTab === 'rewards' || teacherTab === 'orders'));
  const selectedGradeName =
    selectedGradeCode === 'all'
      ? '全部年级'
      : accessibleClasses.find((item) => item.gradeCode === selectedGradeCode)?.gradeName ?? selectedGradeCode;

  return (
    <Shell
      title={shellTitle}
      subtitle={shellSubtitle}
      loading={loading || ordersLoading}
      user={user}
      status={
        <>
          {loading ? <div className="status-card">奖励数据加载中...</div> : null}
          {error ? <div className="status-card error">{error}</div> : null}
          {classOrdersError ? <div className="status-card error">{classOrdersError}</div> : null}
          {submitSuccess ? <div className="status-card success">{submitSuccess}</div> : null}
        </>
      }
    >
      <div className="page-header">
        <div>
          <h2>{allowManageGlobal ? '奖励与兑换' : '班级奖励维护'}</h2>
          <p className="page-desc">
            {allowManageGlobal
              ? '学校奖励与班级奖励共用同一兑换链路，管理员可统一查看与代管。'
              : activeClass
                ? `${activeClass.gradeName} ${activeClass.name} · 可维护本班奖励并查看兑换记录`
                : selectableClasses.length > 0
                  ? `${selectedGradeName} · 可维护所选范围内的班级奖励并查看兑换记录`
                : '当前账号尚未绑定班级'}
          </p>
        </div>
        <div className="page-actions">
          {showClassFilters && gradeOptions.length > 0 ? (
            <select className="filter-select" value={selectedGradeCode} onChange={(event) => setSelectedGradeCode(event.target.value)}>
              <option value="all">全部年级</option>
              {gradeOptions.filter((item) => item !== 'all').map((item) => (
                <option key={item} value={item}>
                  {accessibleClasses.find((row) => row.gradeCode === item)?.gradeName ?? item}
                </option>
              ))}
            </select>
          ) : null}
          {showClassFilters && selectableClasses.length > 0 ? (
            <select className="filter-select" value={activeClassId ?? ''} onChange={(event) => setActiveClassId(Number(event.target.value) || null)}>
              <option value="">全部班级</option>
              {selectableClasses.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.gradeName} {item.name}
                </option>
              ))}
            </select>
          ) : null}
          <div className="search-box">
            <span className="s-icon">⌕</span>
            <input
              placeholder={allowManageGlobal ? '搜索奖励名称、来源或老师...' : '搜索奖励、老师或学生...'}
              value={searchKeyword}
              onChange={(event) => setSearchKeyword(event.target.value)}
            />
          </div>
          <select className="filter-select" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}>
            <option value="all">全部状态</option>
            <option value="enabled">启用中</option>
            <option value="disabled">已停用</option>
          </select>
          {((allowManageGlobal && rewardTab !== 'orders') || (isTeacherRewardRole && teacherTab === 'rewards')) ? (
            <button className="btn btn-primary" type="button" onClick={openCreateReward} disabled={!allowManageGlobal && selectableClasses.length === 0}>
              + 添加奖励
            </button>
          ) : null}
          {((allowManageGlobal && rewardTab === 'orders') || (isTeacherRewardRole && teacherTab === 'orders')) ? (
            <button className="ghost-button" type="button" onClick={() => void reloadClassRewardOrders()} disabled={classOrdersLoading}>
              {classOrdersLoading ? '刷新中...' : '刷新'}
            </button>
          ) : null}
        </div>
      </div>

      {allowManageGlobal ? (
        <div className="reward-tabs">
          {[
            { key: 'school', label: '学校奖励' },
            { key: 'class', label: '班级奖励' },
            { key: 'orders', label: '兑换记录' },
          ].map((item) => (
            <button key={item.key} type="button" className={`reward-tab${rewardTab === item.key ? ' active' : ''}`} onClick={() => setRewardTab(item.key as RewardListTab)}>
              {item.label}
            </button>
          ))}
        </div>
      ) : null}

      {isTeacherRewardRole ? (
        <div className="reward-tabs">
          {[
            { key: 'rewards', label: '班级奖励' },
            { key: 'orders', label: '兑换记录' },
          ].map((item) => (
            <button key={item.key} type="button" className={`reward-tab${teacherTab === item.key ? ' active' : ''}`} onClick={() => setTeacherTab(item.key as TeacherTab)}>
              {item.label}
            </button>
          ))}
        </div>
      ) : null}

      {((allowManageGlobal && rewardTab === 'orders') || (isTeacherRewardRole && teacherTab === 'orders')) ? (
        <>
          <div className="page-actions" style={{ marginBottom: 16 }}>
            <select className="filter-select" value={orderStatusFilter} onChange={(event) => setOrderStatusFilter(event.target.value)}>
              {orderStatusOptions.map((item) => (
                <option key={item} value={item}>
                  {item === 'all' ? '全部状态' : formatOrderStatus(item)}
                </option>
              ))}
            </select>
          </div>
          {renderOrdersPanel()}
        </>
      ) : renderRewardCards(visibleRewards)}

      {selectedReward ? (
        <Modal
          title={`${selectedReward.name} · ${rewardModalMode === 'edit' ? '奖励编辑' : '奖励详情'}`}
          subtitle={rewardModalMode === 'edit' ? '维护奖励名称、分值、库存与适用范围' : '查看奖励详情与最近兑换记录'}
          onClose={() => {
            if (submitting && rewardModalMode === 'edit') return;
            setSelectedReward(null);
          }}
        >
          {rewardModalMode === 'edit' ? (
            renderRewardForm('保存奖励', () => setSelectedReward(null))
          ) : (
            <div className="detail-grid">
              <div className="detail-card">
                <h4>奖励信息</h4>
                <div className="detail-list">
                  <div><span>奖励名称</span><strong>{selectedReward.name}</strong></div>
                  <div><span>奖励范围</span><strong>{selectedReward.sourceLabel}</strong></div>
                  <div><span>状态</span><strong>{formatEnabledStatus(selectedReward.status)}</strong></div>
                  <div><span>创建老师</span><strong>{selectedReward.createdByName ?? '系统预置'}</strong></div>
                </div>
              </div>
              <div className="detail-card">
                <h4>兑换配置</h4>
                <div className="detail-list">
                  <div><span>所需分值</span><strong>{selectedReward.scoreCost}</strong></div>
                  <div><span>库存</span><strong>{selectedReward.isInfiniteStock ? '不限' : selectedReward.stockQty ?? 0}</strong></div>
                  <div><span>展示方式</span><strong>{selectedReward.imageUrl ? '图片卡片' : '文字卡片'}</strong></div>
                </div>
              </div>
              <div className="detail-card span-2">
                <h4>最近兑换</h4>
                {ordersLoading ? <div className="status-card">兑换记录加载中...</div> : null}
                {submitError ? <div className="status-card error">{submitError}</div> : null}
                {!ordersLoading ? (
                  <div className="settings-note-list">
                    {rewardOrders.length > 0 ? (
                      rewardOrders.slice(0, 6).map((item) => (
                        <div className="settings-note" key={item.id}>
                          {item.student.name} 于 {new Date(item.createdAt).toLocaleString('zh-CN', { hour12: false })} 兑换，消耗 {item.scoreCost} 积分。
                        </div>
                      ))
                    ) : (
                      <div className="settings-note">当前奖励暂无兑换记录。</div>
                    )}
                  </div>
                ) : null}
              </div>
            </div>
          )}
        </Modal>
      ) : null}

      {showCreateReward ? (
        <Modal
          title="新增奖励"
          subtitle={form.scopeType === 'class' ? '班级奖励仅对当前班学生可见和可兑换' : '学校奖励面向全校统一展示'}
          onClose={() => {
            if (submitting) return;
            setShowCreateReward(false);
          }}
        >
          {renderRewardForm('创建奖励', () => setShowCreateReward(false))}
        </Modal>
      ) : null}
      {previewImageUrl ? (
        <Modal title="图片预览" subtitle="" onClose={() => setPreviewImageUrl(null)}>
          <div className="image-upload-preview-modal">
            <img src={resolveAssetUrl(previewImageUrl)} alt="图片预览" />
          </div>
        </Modal>
      ) : null}
    </Shell>
  );
}

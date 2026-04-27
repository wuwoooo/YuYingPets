import { useMemo, useState, type ChangeEvent, type FormEvent } from 'react';
import { Modal } from '../components/Modal';
import { Shell } from '../components/Shell';
import type { 
  Reward,
  RewardOrder,
  RewardUpsertPayload,
  SessionUser
} from '../lib/api';
import { adminApi } from '../lib/api';
import { resolveAssetUrl } from '../lib/assets';
import type {
  RewardFormState
} from '../types/admin';
import {
  buildAutoCode,
  createRewardForm,
  formatEnabledStatus,
  normalizeKeyword
} from '../utils/adminForms';
import { canManageRewards } from '../utils/adminPermissions';

type RewardsPageProps = {
  token: string;
  user: SessionUser | null;
  rewards: Reward[];
  loading: boolean;
  error: string | null;
  onSaved: () => Promise<void>;
};

export function RewardsPage({
  token,
  user,
  rewards,
  loading,
  error,
  onSaved,
}: RewardsPageProps) {
  const [tab, setTab] = useState('all');
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null);
  const [rewardModalMode, setRewardModalMode] = useState<'records' | 'edit'>('records');
  const [showCreateReward, setShowCreateReward] = useState(false);
  const [rewardOrders, setRewardOrders] = useState<RewardOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [form, setForm] = useState<RewardFormState>(() => createRewardForm());
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'enabled' | 'disabled'>('all');
  const [uploadingImage, setUploadingImage] = useState(false);
  const allowManage = canManageRewards(user?.roleCode);

  const rewardCategories = useMemo(
    () => ['all', ...Array.from(new Set(rewards.map((item) => item.category).filter(Boolean)))],
    [rewards],
  );

  const rewardCards = useMemo(() => {
    const keyword = normalizeKeyword(searchKeyword);
    return rewards.filter((item) => {
      const matchesTab = tab === 'all' || item.category === tab;
      const matchesKeyword =
        !keyword ||
        normalizeKeyword(item.name).includes(keyword) ||
        normalizeKeyword(item.code).includes(keyword) ||
        normalizeKeyword(item.category).includes(keyword);
      const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
      return matchesTab && matchesKeyword && matchesStatus;
    });
  }, [rewards, searchKeyword, statusFilter, tab]);

  async function openRewardRecords(reward: Reward) {
    setSelectedReward(reward);
    setRewardModalMode('records');
    setOrdersLoading(true);
    setSubmitError(null);

    try {
      const response = await adminApi.rewardOrders(token);
      setRewardOrders(response.data.filter((item) => item.rewardId === reward.id));
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : '奖励记录加载失败');
    } finally {
      setOrdersLoading(false);
    }
  }

  function openRewardEditor(reward?: Reward) {
    setRewardModalMode('edit');
    setSelectedReward(reward ?? null);
    setShowCreateReward(!reward);
    setForm(createRewardForm(reward));
    setSubmitError(null);
  }

  async function handleRewardImageUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setUploadingImage(true);
    setSubmitError(null);
    try {
      const response = await adminApi.uploadRewardAsset(token, file);
      setForm((prev) => ({ ...prev, imageUrl: response.data.url }));
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : '奖励图片上传失败');
    } finally {
      setUploadingImage(false);
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
      const scoreCostText = form.scoreCost.trim();
      const stockQtyText = form.stockQty.trim();

      if (!form.code.trim() || !name || !scoreCostText) {
        throw new Error('请填写完整的奖励名称和所需积分');
      }
      if (!/^\d+$/.test(scoreCostText)) {
        throw new Error('积分成本必须是大于等于 0 的整数');
      }
      if (!form.isInfiniteStock && stockQtyText && !/^\d+$/.test(stockQtyText)) {
        throw new Error('库存数量必须是大于等于 0 的整数');
      }

      const payload: RewardUpsertPayload = {
        code: buildAutoCode('reward', form.name, selectedReward?.code || form.code),
        name,
        ...(form.category.trim() ? { category: form.category.trim() } : {}),
        ...(form.imageUrl.trim() ? { imageUrl: form.imageUrl.trim() } : {}),
        scoreCost: Number(scoreCostText),
        ...(!form.isInfiniteStock && stockQtyText ? { stockQty: Number(stockQtyText) } : {}),
        isInfiniteStock: form.isInfiniteStock,
      };

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

  async function toggleRewardStatus(item: Reward) {
    try {
      setSubmitError(null);
      setSubmitSuccess(null);
      const nextStatus = item.status === 'enabled' ? 'disabled' : 'enabled';
      await adminApi.updateRewardStatus(token, item.id, nextStatus);
      await onSaved();
      setSubmitSuccess(nextStatus === 'enabled' ? '奖励已启用' : '奖励已停用');
      if (selectedReward?.id === item.id) {
        setSelectedReward((prev) => (prev ? { ...prev, status: nextStatus } : prev));
      }
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : '奖励状态更新失败');
    }
  }

  async function deleteReward(item: Reward) {
    const riskText =
      item.rewardOrderCount > 0
        ? `当前已有 ${item.rewardOrderCount} 条兑换记录，后端会阻止删除。建议改为停用。`
        : '当前没有兑换记录，可以安全删除。';
    if (!window.confirm(`确认删除奖励「${item.name}」吗？\n${riskText}`)) {
      return;
    }
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

  return (
    <Shell
      title="奖励中心"
      subtitle="围绕积分兑换、精神奖励与班级特权做统一配置和运营管理"
      user={user}
      status={
        <>
          {loading ? <div className="status-card">奖励数据加载中...</div> : null}
          {error ? <div className="status-card error">{error}</div> : null}
          {submitSuccess ? <div className="status-card success">{submitSuccess}</div> : null}
        </>
      }
    >
      <div className="page-header">
        <h2>奖励中心</h2>
        <div className="page-actions">
          <div className="search-box">
            <span className="s-icon">⌕</span>
            <input
              placeholder="搜索奖励名称..."
              value={searchKeyword}
              onChange={(event) => setSearchKeyword(event.target.value)}
            />
          </div>
          <select className="filter-select" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}>
            <option value="all">全部状态</option>
            <option value="enabled">启用中</option>
            <option value="disabled">已停用</option>
          </select>
          {allowManage ? (
            <button
              className="btn btn-primary"
              type="button"
              onClick={() => openRewardEditor()}
            >
              + 添加奖励
            </button>
          ) : null}
        </div>
      </div>
      <div className="reward-tabs">
        {rewardCategories.map((key) => (
          <button
            key={key}
            type="button"
            className={`reward-tab${tab === key ? ' active' : ''}`}
            onClick={() => setTab(key)}
          >
            {key === 'all' ? '全部' : key}
          </button>
        ))}
      </div>
      <div className="reward-grid">
        {rewardCards.map((item) => (
          <div className="reward-card" key={item.id}>
            <div className="r-icon-area">
              {item.imageUrl ? (
                <img src={resolveAssetUrl(item.imageUrl)} alt={item.name} />
              ) : (
                <span className="reward-fallback">{item.name.slice(0, 2)}</span>
              )}
            </div>
            <div className="r-body">
              <div className="r-name">{item.name}</div>
              <span className={`r-cat ${item.category}`}>{item.category}</span>
              <div className="r-cost">兑换需 {item.scoreCost} 积分</div>
              <div className="r-stock">{item.isInfiniteStock ? '库存不限' : `库存：${item.stockQty ?? 0}`}</div>
              <div className="r-stock">{item.status === 'enabled' ? '启用中' : '已停用'}</div>
              <div className="r-stock">兑换记录：{item.rewardOrderCount}</div>
              <div className="r-actions">
                <button
                  type="button"
                  className="link-button"
                  onClick={() => void openRewardRecords(item)}
                >
                  兑换记录
                </button>
                {allowManage ? (
                  <>
                    <button
                      type="button"
                      className="link-button"
                      onClick={() => openRewardEditor(item)}
                    >
                      编辑
                    </button>
                    <button
                      type="button"
                      className="link-button"
                      onClick={() => void toggleRewardStatus(item)}
                    >
                      {item.status === 'enabled' ? '停用' : '启用'}
                    </button>
                    <button
                      type="button"
                      className="link-button"
                      onClick={() => void deleteReward(item)}
                    >
                      删除
                    </button>
                  </>
                ) : null}
              </div>
            </div>
          </div>
        ))}
        {rewardCards.length === 0 ? <div className="settings-note">当前分类下暂无奖励数据。</div> : null}
      </div>

      {selectedReward ? (
        <Modal
          title={`${selectedReward.name} · ${rewardModalMode === 'edit' ? '奖励编辑' : '奖励配置'}`}
          subtitle={rewardModalMode === 'edit' ? '统一维护奖励资料、兑换成本与展示方式' : '查看奖励详情、兑换成本、库存状态与运营说明'}
          onClose={() => {
            if (submitting && rewardModalMode === 'edit') return;
            setSelectedReward(null);
          }}
        >
          {rewardModalMode === 'edit' ? (
            <form className="form-grid" onSubmit={handleRewardSubmit}>
              <label>
                <span>奖励名称</span>
                <input type="text" value={form.name} onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))} />
              </label>
              <label>
                <span>奖励分类</span>
                <input type="text" value={form.category} onChange={(event) => setForm((prev) => ({ ...prev, category: event.target.value }))} />
              </label>
              <label>
                <span>图片地址</span>
                <input type="text" value={form.imageUrl} onChange={(event) => setForm((prev) => ({ ...prev, imageUrl: event.target.value }))} placeholder="可留空" />
              </label>
              <label className="span-2">
                <span>上传奖励图片</span>
                <input type="file" accept="image/*" onChange={handleRewardImageUpload} disabled={uploadingImage || submitting} />
                {form.imageUrl ? <div className="settings-note">当前图片：{form.imageUrl}</div> : null}
              </label>
              <label>
                <span>积分成本</span>
                <input type="text" value={form.scoreCost} onChange={(event) => setForm((prev) => ({ ...prev, scoreCost: event.target.value }))} />
              </label>
              <label>
                <span>库存数量</span>
                <input type="text" value={form.stockQty} onChange={(event) => setForm((prev) => ({ ...prev, stockQty: event.target.value }))} placeholder="不限库存可留空" />
              </label>
              <label className="checkbox-item span-2">
                <input type="checkbox" checked={form.isInfiniteStock} onChange={(event) => setForm((prev) => ({ ...prev, isInfiniteStock: event.target.checked }))} />
                不限库存
              </label>
              {submitError ? <div className="status-card error span-2">{submitError}</div> : null}
              <div className="form-actions span-2">
                <button type="button" className="ghost-button" onClick={() => setSelectedReward(null)} disabled={submitting}>
                  取消
                </button>
                <button type="submit" className="toolbar-button" disabled={submitting}>
                  {submitting ? '提交中...' : '保存奖励'}
                </button>
              </div>
            </form>
          ) : (
            <div className="detail-grid">
              <div className="detail-card">
                <h4>奖励信息</h4>
                <div className="detail-list">
                  <div><span>奖励名称</span><strong>{selectedReward.name}</strong></div>
                  <div><span>奖励分类</span><strong>{selectedReward.category}</strong></div>
                  <div><span>状态</span><strong>{formatEnabledStatus(selectedReward.status)}</strong></div>
                </div>
              </div>
              <div className="detail-card">
                <h4>兑换配置</h4>
                <div className="detail-list">
                  <div><span>积分成本</span><strong>{selectedReward.scoreCost}</strong></div>
                  <div><span>库存</span><strong>{selectedReward.isInfiniteStock ? '不限' : selectedReward.stockQty ?? 0}</strong></div>
                  <div><span>运营模式</span><strong>{selectedReward.isInfiniteStock ? '长期可兑换' : '库存型奖励'}</strong></div>
                  <div><span>展示方式</span><strong>{selectedReward.imageUrl ? '含图片展示' : '文字卡片展示'}</strong></div>
                </div>
              </div>
              <div className="detail-card span-2">
                <h4>兑换记录概览</h4>
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
          subtitle=""
          onClose={() => {
            if (submitting) return;
            setShowCreateReward(false);
          }}
        >
          <form className="form-grid" onSubmit={handleRewardSubmit}>
            <label>
              <span>奖励名称</span>
              <input type="text" value={form.name} onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))} />
            </label>
            <label>
              <span>奖励分类</span>
              <input type="text" value={form.category} onChange={(event) => setForm((prev) => ({ ...prev, category: event.target.value }))} />
            </label>
            <label>
              <span>图片地址</span>
              <input type="text" value={form.imageUrl} onChange={(event) => setForm((prev) => ({ ...prev, imageUrl: event.target.value }))} placeholder="可留空" />
            </label>
            <label className="span-2">
              <span>上传奖励图片</span>
              <input type="file" accept="image/*" onChange={handleRewardImageUpload} disabled={uploadingImage || submitting} />
              {form.imageUrl ? <div className="settings-note">当前图片：{form.imageUrl}</div> : null}
            </label>
            <label>
              <span>积分成本</span>
              <input type="text" value={form.scoreCost} onChange={(event) => setForm((prev) => ({ ...prev, scoreCost: event.target.value }))} />
            </label>
            <label>
              <span>库存数量</span>
              <input type="text" value={form.stockQty} onChange={(event) => setForm((prev) => ({ ...prev, stockQty: event.target.value }))} placeholder="不限库存可留空" />
            </label>
            <label className="checkbox-item span-2">
              <input type="checkbox" checked={form.isInfiniteStock} onChange={(event) => setForm((prev) => ({ ...prev, isInfiniteStock: event.target.checked }))} />
              不限库存
            </label>
            {submitError ? <div className="status-card error span-2">{submitError}</div> : null}
            <div className="form-actions span-2">
              <button
                type="button"
                className="ghost-button"
                onClick={() => {
                  if (submitting) return;
                  setShowCreateReward(false);
                }}
                disabled={submitting}
              >
                取消
              </button>
              <button type="submit" className="toolbar-button" disabled={submitting}>
                {submitting ? '提交中...' : '创建奖励'}
              </button>
            </div>
          </form>
        </Modal>
      ) : null}
    </Shell>
  );
}

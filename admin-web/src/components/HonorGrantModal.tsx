import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { Modal } from './Modal';
import type { Honor } from '../lib/api';
import { adminApi } from '../lib/api';
import { resolveAssetUrl } from '../lib/assets';

export type HonorGrantTarget =
  | {
      targetType: 'student';
      classId: number;
      className: string;
      studentId: number;
      studentName: string;
    }
  | {
      targetType: 'class';
      classId: number;
      className: string;
    };

type HonorGrantModalProps = {
  token: string;
  target: HonorGrantTarget;
  honors: Honor[];
  onClose: () => void;
  onGranted?: () => void | Promise<void>;
};

const categoryLabelMap = {
  personal: '个人',
  collective: '集体',
  phase: '阶段',
  longterm: '长期',
} as const;

const QUICK_HONOR_LIMIT = 10;

function compareHonorsForGrant(left: Honor, right: Honor) {
  if (right.grantedCount !== left.grantedCount) {
    return right.grantedCount - left.grantedCount;
  }
  const rightUpdated = new Date(right.updatedAt).getTime();
  const leftUpdated = new Date(left.updatedAt).getTime();
  if (rightUpdated !== leftUpdated) {
    return rightUpdated - leftUpdated;
  }
  return right.id - left.id;
}

function buildQuickHonors(honors: Honor[]) {
  if (honors.length <= QUICK_HONOR_LIMIT) {
    return [...honors].sort(compareHonorsForGrant);
  }
  const byUsage = [...honors]
    .filter((item) => item.grantedCount > 0)
    .sort(compareHonorsForGrant)
    .slice(0, 5);
  const byRecent = [...honors]
    .sort((left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime() || right.id - left.id)
    .slice(0, 5);
  return Array.from(new Map([...byRecent, ...byUsage].map((item) => [item.id, item])).values()).slice(0, QUICK_HONOR_LIMIT);
}

export function HonorGrantModal({ token, target, honors, onClose, onGranted }: HonorGrantModalProps) {
  const [honorCatalog, setHonorCatalog] = useState<Honor[]>(honors);
  const [catalogLoading, setCatalogLoading] = useState(false);

  const reloadHonorCatalog = useCallback(async () => {
    setCatalogLoading(true);
    try {
      const response = await adminApi.honors(token);
      setHonorCatalog(response.data);
    } catch {
      setHonorCatalog(honors);
    } finally {
      setCatalogLoading(false);
    }
  }, [honors, token]);

  useEffect(() => {
    void reloadHonorCatalog();
  }, [reloadHonorCatalog]);

  const eligibleHonors = useMemo(() => {
    const enabled = honorCatalog.filter((item) => item.status === 'enabled');
    if (target.targetType === 'class') {
      return enabled.filter((item) => item.category === 'collective');
    }
    return enabled.filter((item) => item.category !== 'collective');
  }, [honorCatalog, target.targetType]);

  const sortedHonors = useMemo(
    () => [...eligibleHonors].sort(compareHonorsForGrant),
    [eligibleHonors],
  );

  const quickHonors = useMemo(() => buildQuickHonors(sortedHonors), [sortedHonors]);

  const [honorId, setHonorId] = useState<number | null>(sortedHonors[0]?.id ?? null);
  const [remark, setRemark] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (sortedHonors.length === 0) {
      setHonorId(null);
      return;
    }
    if (!sortedHonors.some((item) => item.id === honorId)) {
      setHonorId(sortedHonors[0].id);
    }
  }, [honorId, sortedHonors]);

  const selectedHonor = sortedHonors.find((item) => item.id === honorId) ?? null;
  const quickHiddenCount = Math.max(0, sortedHonors.length - quickHonors.length);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!honorId) {
      setSubmitError('请选择要颁发的荣誉');
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    try {
      await adminApi.createHonorRecord(token, {
        honorId,
        targetType: target.targetType,
        targetId: target.targetType === 'student' ? target.studentId : target.classId,
        classId: target.classId,
        remark: remark.trim() || undefined,
      });
      await onGranted?.();
      onClose();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : '颁发荣誉失败');
    } finally {
      setSubmitting(false);
    }
  }

  const title =
    target.targetType === 'student'
      ? `为学生颁发荣誉 · ${target.studentName}`
      : `为班级颁发集体荣誉 · ${target.className}`;

  const subtitle =
    target.targetType === 'student'
      ? `${target.className} · 个人 / 阶段 / 长期荣誉`
      : `${target.className} · 仅可选择集体类荣誉`;

  return (
    <Modal title={title} subtitle={subtitle} onClose={onClose}>
      <form className="honor-grant-form" onSubmit={(event) => void handleSubmit(event)}>
        {catalogLoading && sortedHonors.length === 0 ? (
          <div className="honor-grant-empty">荣誉列表加载中...</div>
        ) : null}
        {!catalogLoading && sortedHonors.length === 0 ? (
          <div className="honor-grant-empty">
            当前没有可颁发的{target.targetType === 'class' ? '集体' : '学生'}荣誉，请先在「荣誉勋章」中创建并启用。
            {target.targetType === 'student' ? '（集体类荣誉仅用于班级颁发）' : '（请创建「集体荣誉」分类的勋章）'}
          </div>
        ) : null}
        {sortedHonors.length > 0 ? (
          <>
            <div className="honor-grant-quick">
              <span className="honor-grant-label">
                快捷选择
                {quickHiddenCount > 0 ? (
                  <em className="honor-grant-quick-hint">另有 {quickHiddenCount} 项可在下方下拉选择</em>
                ) : null}
              </span>
              <div className="honor-grant-quick-grid">
                {quickHonors.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={`honor-grant-chip${honorId === item.id ? ' active' : ''}`}
                    onClick={() => setHonorId(item.id)}
                  >
                    {item.iconUrl ? (
                      <img src={resolveAssetUrl(item.iconUrl)} alt="" className="honor-grant-chip-icon" />
                    ) : (
                      <span className="honor-grant-chip-fallback">{item.name.slice(0, 1)}</span>
                    )}
                    <span className="honor-grant-chip-name">{item.name}</span>
                    <em>{categoryLabelMap[item.category]}</em>
                  </button>
                ))}
              </div>
            </div>

            <label className="honor-grant-field">
              <span>选择荣誉</span>
              <select value={honorId ?? ''} onChange={(event) => setHonorId(Number(event.target.value))}>
                {sortedHonors.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}（{categoryLabelMap[item.category]} · 已授 {item.grantedCount} 次）
                  </option>
                ))}
              </select>
            </label>

            {selectedHonor ? (
              <div className="honor-grant-preview">
                {selectedHonor.iconUrl ? (
                  <img src={resolveAssetUrl(selectedHonor.iconUrl)} alt="" />
                ) : (
                  <span className="honor-grant-preview-fallback">{selectedHonor.name.slice(0, 2)}</span>
                )}
                <div>
                  <strong>{selectedHonor.name}</strong>
                  <p>{selectedHonor.description || selectedHonor.conditionType || '暂无说明'}</p>
                </div>
              </div>
            ) : null}

            <label className="honor-grant-field">
              <span>授予备注（选填）</span>
              <textarea
                rows={3}
                value={remark}
                onChange={(event) => setRemark(event.target.value)}
                placeholder="例如：本周课堂表现突出、主动帮助同学"
              />
            </label>
          </>
        ) : null}

        {submitError ? <div className="status-card error">{submitError}</div> : null}

        <div className="form-actions">
          <button type="button" className="ghost-button" onClick={onClose} disabled={submitting}>
            取消
          </button>
          <button type="submit" className="toolbar-button" disabled={submitting || sortedHonors.length === 0}>
            {submitting ? '颁发中...' : '确认颁发'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

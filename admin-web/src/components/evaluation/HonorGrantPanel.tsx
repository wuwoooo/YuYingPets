import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import type { Honor, HonorRecord } from '../../lib/api';
import { adminApi } from '../../lib/api';
import { resolveAssetUrl } from '../../lib/assets';

export type HonorGrantStudentTarget = {
  targetType: 'student';
  classId: number;
  className: string;
  studentId: number;
  studentName: string;
};

type HonorGrantPanelProps = {
  token: string;
  target: HonorGrantStudentTarget;
  honors: Honor[];
  honorRecords: HonorRecord[];
  honorsLoading: boolean;
  onGranted?: () => void | Promise<void>;
  /** 嵌入弹窗 Tab 时不显示取消按钮 */
  embedded?: boolean;
  onCancel?: () => void;
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

function buildQuickHonors(honorList: Honor[]) {
  if (honorList.length <= QUICK_HONOR_LIMIT) {
    return [...honorList].sort(compareHonorsForGrant);
  }
  const byUsage = [...honorList]
    .filter((item) => item.grantedCount > 0)
    .sort(compareHonorsForGrant)
    .slice(0, 5);
  const byRecent = [...honorList]
    .sort((left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime() || right.id - left.id)
    .slice(0, 5);
  return Array.from(new Map([...byRecent, ...byUsage].map((item) => [item.id, item])).values()).slice(0, QUICK_HONOR_LIMIT);
}

export function HonorGrantPanel({
  token,
  target,
  honors,
  honorRecords,
  honorsLoading,
  onGranted,
  embedded = false,
  onCancel,
}: HonorGrantPanelProps) {
  const [honorCatalog, setHonorCatalog] = useState<Honor[]>(honors);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [honorId, setHonorId] = useState<number | null>(null);
  const [remark, setRemark] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [grantSuccess, setGrantSuccess] = useState<string | null>(null);

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
    return enabled.filter((item) => item.category !== 'collective');
  }, [honorCatalog]);

  const sortedHonors = useMemo(() => [...eligibleHonors].sort(compareHonorsForGrant), [eligibleHonors]);
  const quickHonors = useMemo(() => buildQuickHonors(sortedHonors), [sortedHonors]);

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
    setGrantSuccess(null);
    try {
      await adminApi.createHonorRecord(token, {
        honorId,
        targetType: 'student',
        targetId: target.studentId,
        classId: target.classId,
        remark: remark.trim() || undefined,
      });
      await onGranted?.();
      setRemark('');
      setGrantSuccess(`已为 ${target.studentName} 颁发「${selectedHonor?.name ?? '荣誉'}」`);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : '颁发荣誉失败');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      className={`honor-grant-form honor-grant-panel${embedded ? ' ssm-honor-panel' : ''}`}
      onSubmit={(event) => void handleSubmit(event)}
    >
      {catalogLoading && sortedHonors.length === 0 ? (
        <div className="honor-grant-empty">荣誉列表加载中...</div>
      ) : null}
      {!catalogLoading && sortedHonors.length === 0 ? (
        <div className="honor-grant-empty">
          当前没有可颁发的学生荣誉，请先在「荣誉勋章」中创建并启用。（集体类荣誉仅用于班级颁发）
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
              rows={2}
              value={remark}
              onChange={(event) => setRemark(event.target.value)}
              placeholder="例如：本周课堂表现突出、主动帮助同学"
            />
          </label>
        </>
      ) : null}

      <div className={`ssm-honor-owned${embedded ? '' : ' evaluation-student-honors student-score-modal-honors'}`}>
        <div className="ssm-honor-owned-head">
          <strong>已获荣誉</strong>
          {honorsLoading ? <span>加载中...</span> : <span>共 {honorRecords.length} 项</span>}
        </div>
        {honorsLoading ? null : honorRecords.length > 0 ? (
          <ul className="ssm-honor-owned-list">
            {honorRecords.slice(0, 8).map((item) => (
              <li key={item.id}>
                <strong>{item.honorName}</strong>
                <span>
                  {new Date(item.grantedAt).toLocaleDateString('zh-CN')}
                  {item.grantedByName ? ` · ${item.grantedByName}` : ''}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <div className="ssm-empty">该学生暂无荣誉记录</div>
        )}
      </div>

      {grantSuccess ? <div className="ssm-alert success">{grantSuccess}</div> : null}
      {submitError ? <div className="ssm-alert error">{submitError}</div> : null}

      <div className={`ssm-form-actions${embedded ? '' : ' form-actions'}`}>
        {embedded && onCancel ? (
          <button type="button" className="ghost-button" onClick={onCancel} disabled={submitting}>
            关闭
          </button>
        ) : null}
        {!embedded ? (
          <button type="button" className="ghost-button" onClick={onCancel} disabled={submitting}>
            取消
          </button>
        ) : null}
        <button type="submit" className="toolbar-button" disabled={submitting || sortedHonors.length === 0}>
          {submitting ? '颁发中...' : '确认颁发'}
        </button>
      </div>
    </form>
  );
}

export { compareHonorsForGrant, buildQuickHonors, categoryLabelMap };

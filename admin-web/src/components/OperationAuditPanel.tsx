import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import { TablePagination } from './TablePagination';
import { AUDIT_MODULE_FILTER_OPTIONS, getAuditActionFilterOptions } from '../constants/auditUi';
import { adminApi, type OperationAuditLogItem } from '../lib/api';

type OperationAuditPanelProps = {
  token: string;
  loading: boolean;
  error: string | null;
};

function formatDetailJson(detail: unknown): string {
  if (detail === null || detail === undefined) {
    return '—';
  }
  if (typeof detail === 'object') {
    return JSON.stringify(detail, null, 2);
  }
  return String(detail);
}

function sensitivityChip(level: OperationAuditLogItem['sensitivity']) {
  switch (level) {
    case 'high':
      return <span className="audit-sense-chip audit-sense-high">高风险</span>;
    case 'medium':
      return <span className="audit-sense-chip audit-sense-medium">需注意</span>;
    default:
      return <span className="audit-sense-chip audit-sense-normal">常规</span>;
  }
}

function terminalLabel(value: string) {
  return value === 'display' ? '大屏终端' : '管理后台';
}

/** 嵌入「安全中心」页的审计面板（无 Shell） */
export function OperationAuditPanel({ token, loading, error }: OperationAuditPanelProps) {
  const [items, setItems] = useState<OperationAuditLogItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [appliedScope, setAppliedScope] = useState<'all' | 'sensitive'>('sensitive');
  const [draftModule, setDraftModule] = useState('');
  const [draftAction, setDraftAction] = useState('');
  const [draftTerminal, setDraftTerminal] = useState<'all' | 'admin' | 'display'>('all');
  const [appliedModule, setAppliedModule] = useState('');
  const [appliedAction, setAppliedAction] = useState('');
  const [appliedTerminal, setAppliedTerminal] = useState<'all' | 'admin' | 'display'>('all');
  const [pageLoading, setPageLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const actionOptions = useMemo(() => getAuditActionFilterOptions(draftModule), [draftModule]);

  const load = useCallback(async () => {
    setPageLoading(true);
    setFetchError(null);
    try {
      const response = await adminApi.operationAuditLogs(token, {
        page,
        limit: pageSize,
        module: appliedModule || undefined,
        action: appliedAction || undefined,
        terminalType: appliedTerminal === 'all' ? undefined : appliedTerminal,
        scope: appliedScope,
      });
      setItems(response.data.items);
      setTotal(response.data.total);
    } catch (err) {
      setFetchError(err instanceof Error ? err.message : '加载审计日志失败');
      setItems([]);
      setTotal(0);
    } finally {
      setPageLoading(false);
    }
  }, [token, page, pageSize, appliedModule, appliedAction, appliedTerminal, appliedScope]);

  useEffect(() => {
    void load();
  }, [load]);

  function handleApplyFilters() {
    setAppliedModule(draftModule);
    setAppliedAction(draftAction);
    setAppliedTerminal(draftTerminal);
    setPage(1);
  }

  function handleScopeChange(next: 'all' | 'sensitive') {
    setAppliedScope(next);
    setPage(1);
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  useEffect(() => {
    setPage((prev) => Math.min(prev, totalPages));
  }, [totalPages]);

  return (
    <div className="security-audit-desk">
      {loading || pageLoading ? <div className="status-card">审计数据加载中...</div> : null}
      {error ? <div className="status-card error">{error}</div> : null}
      {fetchError ? <div className="status-card error">{fetchError}</div> : null}

      <div className="security-filter-card">
        <div className="security-filter-card__head">
          <div className="security-chip-row">
            <button
              type="button"
              className={`security-chip${appliedScope === 'sensitive' ? ' active' : ''}`}
              onClick={() => handleScopeChange('sensitive')}
            >
              重点关注
            </button>
            <button
              type="button"
              className={`security-chip${appliedScope === 'all' ? ' active' : ''}`}
              onClick={() => handleScopeChange('all')}
            >
              全部记录
            </button>
          </div>
          <p className="security-filter-hint">
            {appliedScope === 'sensitive'
              ? '仅列出权限与配置变更、批量导入、高危业务操作等条目，便于管理员日常巡查。'
              : '包含积分加减、观测记录等全部落库动作；可通过下方筛选缩小范围。'}
          </p>
        </div>

        <div className="security-filter-grid">
          <label className="security-filter-field">
            <span className="security-filter-label">业务模块</span>
            <select
              className="filter-select security-filter-select"
              value={draftModule}
              onChange={(event) => {
                setDraftModule(event.target.value);
                setDraftAction('');
              }}
            >
              {AUDIT_MODULE_FILTER_OPTIONS.map((option) => (
                <option key={option.value || 'all'} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="security-filter-field">
            <span className="security-filter-label">操作类型</span>
            <select
              className="filter-select security-filter-select"
              value={draftAction}
              onChange={(event) => setDraftAction(event.target.value)}
            >
              {actionOptions.map((option) => (
                <option key={option.value || 'all-act'} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="security-filter-field">
            <span className="security-filter-label">终端</span>
            <select
              className="filter-select security-filter-select"
              value={draftTerminal}
              onChange={(event) => setDraftTerminal(event.target.value as typeof draftTerminal)}
            >
              <option value="all">全部终端</option>
              <option value="admin">管理后台</option>
              <option value="display">大屏终端</option>
            </select>
          </label>
          <div className="security-filter-actions">
            <button className="btn btn-primary" type="button" onClick={handleApplyFilters}>
              应用筛选
            </button>
          </div>
        </div>
      </div>

      <div className="panel security-audit-panel">
        <div className="data-table-wrap security-table-wrap">
          <table className="data-table audit-table security-table">
            <thead>
              <tr>
                <th>时间</th>
                <th>风险</th>
                <th>做了什么（可读摘要）</th>
                <th>操作者</th>
                <th>终端</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {items.length === 0 && !pageLoading ? (
                <tr>
                  <td colSpan={6} className="audit-empty-cell">
                    暂无记录，可尝试切换到「全部记录」或放宽筛选条件。
                  </td>
                </tr>
              ) : null}
              {items.map((row) => (
                <Fragment key={row.id}>
                  <tr>
                    <td className="audit-time-cell">{new Date(row.createdAt).toLocaleString('zh-CN', { hour12: false })}</td>
                    <td>{sensitivityChip(row.sensitivity)}</td>
                    <td>
                      <div className="audit-summary-main">{row.summary}</div>
                      <div className="audit-summary-sub">
                        {row.moduleLabel} · {row.actionLabel}
                      </div>
                    </td>
                    <td className="audit-operator-cell">
                      <div className="audit-operator-name">{row.operatorName ?? '—'}</div>
                      {row.operatorUsername ? (
                        <div className="audit-operator-login">@{row.operatorUsername}</div>
                      ) : null}
                    </td>
                    <td>{terminalLabel(row.terminalType)}</td>
                    <td>
                      <button
                        className="op-btn"
                        type="button"
                        onClick={() => setExpandedId((prev) => (prev === row.id ? null : row.id))}
                      >
                        {expandedId === row.id ? '收起' : '更多'}
                      </button>
                    </td>
                  </tr>
                  {expandedId === row.id ? (
                    <tr className="audit-expand-row">
                      <td colSpan={6}>
                        <div className="audit-tech-line">
                          系统标识：<code>{row.module}</code> / <code>{row.action}</code>
                          {row.targetId != null ? (
                            <>
                              {' '}
                              · 目标编号 <code>{row.targetId}</code>
                            </>
                          ) : null}
                        </div>
                        <pre className="audit-json-pre">{formatDetailJson(row.detail)}</pre>
                      </td>
                    </tr>
                  ) : null}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>

        <TablePagination
          currentPage={page}
          pageSize={pageSize}
          totalItems={total}
          totalPages={totalPages}
          onPageChange={setPage}
          onPageSizeChange={(next) => {
            setPageSize(next);
            setPage(1);
          }}
        />
      </div>
    </div>
  );
}

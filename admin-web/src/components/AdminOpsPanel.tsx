import { Fragment, useEffect, useMemo, useState } from 'react';
import { adminApi, type AdminOpsLogItem, type AdminOpsLogsResponse, type AdminOpsOverview } from '../lib/api';

type AdminOpsPanelProps = {
  token: string;
  loading: boolean;
  error: string | null;
};

function formatDateTime(value?: string | null) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('zh-CN', { hour12: false });
}

function formatPercent(value?: number | null) {
  if (value === null || value === undefined || !Number.isFinite(value)) return '—';
  return `${Math.round(value * 100)}%`;
}

function formatBytes(value?: number | null) {
  if (value === null || value === undefined || !Number.isFinite(value)) return '—';
  if (value < 1024) return `${value} B`;
  const units = ['KB', 'MB', 'GB', 'TB'];
  let current = value;
  let unitIndex = -1;
  while (current >= 1024 && unitIndex < units.length - 1) {
    current /= 1024;
    unitIndex += 1;
  }
  return `${current >= 100 ? current.toFixed(0) : current.toFixed(1)} ${units[unitIndex]}`;
}

function formatDuration(seconds?: number | null) {
  if (seconds === null || seconds === undefined || !Number.isFinite(seconds)) return '—';
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (days > 0) return `${days}天 ${hours}小时`;
  if (hours > 0) return `${hours}小时 ${minutes}分钟`;
  return `${minutes}分钟`;
}

function opsLevelChip(level: AdminOpsLogItem['level']) {
  switch (level) {
    case 'fatal':
      return <span className="audit-sense-chip audit-sense-high">致命</span>;
    case 'error':
      return <span className="audit-sense-chip audit-sense-high">错误</span>;
    case 'warn':
      return <span className="audit-sense-chip audit-sense-medium">警告</span>;
    case 'info':
      return <span className="audit-sense-chip audit-sense-normal">信息</span>;
    default:
      return <span className="audit-sense-chip audit-sense-normal">未知</span>;
  }
}

function opsStatusMeta(overview: AdminOpsOverview | null) {
  if (!overview) {
    return {
      label: '加载中',
      className: 'ops-status-chip ops-status-chip--loading',
      hint: '正在拉取后端运行状态',
    };
  }
  if (overview.status === 'ok') {
    return {
      label: '正常',
      className: 'ops-status-chip ops-status-chip--ok',
      hint: '应用与数据库连接正常',
    };
  }
  return {
    label: '降级',
    className: 'ops-status-chip ops-status-chip--degraded',
    hint: overview.error || '存在依赖异常，请优先查看最近错误日志',
  };
}

/** 运行监控面板：面向校级管理员的轻量巡检视图 */
export function AdminOpsPanel({ token, loading, error }: AdminOpsPanelProps) {
  const [overview, setOverview] = useState<AdminOpsOverview | null>(null);
  const [overviewLoading, setOverviewLoading] = useState(false);
  const [overviewError, setOverviewError] = useState<string | null>(null);
  const [logsData, setLogsData] = useState<AdminOpsLogsResponse | null>(null);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsError, setLogsError] = useState<string | null>(null);
  const [logLevel, setLogLevel] = useState<'all' | 'warn' | 'error' | 'fatal'>('error');
  const [sinceHours, setSinceHours] = useState(24);
  const [limit, setLimit] = useState(50);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  async function loadOverview() {
    setOverviewLoading(true);
    setOverviewError(null);
    try {
      const response = await adminApi.opsOverview(token);
      setOverview(response.data);
    } catch (err) {
      setOverviewError(err instanceof Error ? err.message : '运行状态加载失败');
      setOverview(null);
    } finally {
      setOverviewLoading(false);
    }
  }

  async function loadLogs() {
    setLogsLoading(true);
    setLogsError(null);
    try {
      const response = await adminApi.opsLogs(token, {
        level: logLevel,
        sinceHours,
        limit,
      });
      setLogsData(response.data);
    } catch (err) {
      setLogsError(err instanceof Error ? err.message : '运行日志加载失败');
      setLogsData(null);
    } finally {
      setLogsLoading(false);
    }
  }

  useEffect(() => {
    void loadOverview();
    const timer = window.setInterval(() => {
      void loadOverview();
    }, 30_000);
    return () => window.clearInterval(timer);
  }, [token]);

  useEffect(() => {
    void loadLogs();
  }, [token, logLevel, sinceHours, limit]);

  const statusMeta = useMemo(() => opsStatusMeta(overview), [overview]);
  const pm2 = overview?.process.pm2;
  const resourceCards = useMemo(() => {
    if (!overview) return [];
    return [
      { label: 'CPU 负载', value: formatPercent(overview.server.cpu.usageRate), hint: `${overview.server.cpu.coreCount} 核 · ${overview.server.cpu.model}` },
      { label: '内存占用', value: formatPercent(overview.server.memory.usageRate), hint: `${formatBytes(overview.server.memory.usedBytes)} / ${formatBytes(overview.server.memory.totalBytes)}` },
      { label: '磁盘占用', value: formatPercent(overview.server.disk.usageRate), hint: overview.server.disk.error || `${formatBytes(overview.server.disk.usedBytes)} / ${formatBytes(overview.server.disk.totalBytes)}` },
      { label: 'Node 进程内存', value: formatBytes(overview.process.memoryBytes), hint: `PID ${overview.process.pid}` },
      { label: 'PM2 状态', value: pm2?.available ? pm2.status : '不可用', hint: pm2?.available ? `重启 ${pm2.restarts} 次 · 在线 ${formatDuration(pm2.uptimeMs != null ? Math.round(pm2.uptimeMs / 1000) : null)}` : pm2?.reason || '当前环境未启用 PM2' },
      { label: 'PM2 CPU', value: pm2?.available ? `${pm2.cpuPercent ?? 0}%` : '—', hint: pm2?.available ? `进程内存 ${formatBytes(pm2.memoryBytes)}` : '无 PM2 监控数据' },
    ];
  }, [overview, pm2]);

  return (
    <div className="security-ops-desk">
      {loading ? <div className="status-card">全局数据刷新中...</div> : null}
      {error ? <div className="status-card error">{error}</div> : null}
      {overviewError ? <div className="status-card error">{overviewError}</div> : null}
      {logsError ? <div className="status-card error">{logsError}</div> : null}

      <div className="ops-hero">
        <div className="ops-hero-main">
          <div className="ops-hero-top">
            <span className={statusMeta.className}>{statusMeta.label}</span>
            <span className="ops-hero-time">最近检查：{formatDateTime(overview?.checkedAt)}</span>
          </div>
          <div className="panel-title">后端运行监控</div>
          <p className="page-desc">{statusMeta.hint}</p>
          <div className="ops-hero-meta">
            <span>数据库：{overview?.dependencies.database === 'ok' ? '正常' : '异常'}</span>
            <span>后端在线：{formatDuration(overview?.app.uptimeSeconds)}</span>
            <span>Node：{overview?.app.nodeVersion ?? '—'}</span>
            <span>主机：{overview?.server.hostname ?? '—'}</span>
          </div>
        </div>
        <div className="ops-hero-actions">
          <button className="btn btn-primary" type="button" onClick={() => void loadOverview()} disabled={overviewLoading}>
            {overviewLoading ? '刷新中...' : '刷新状态'}
          </button>
        </div>
      </div>

      <div className="std-metric-grid std-metric-grid--3 ops-metric-grid">
        {resourceCards.map((card) => (
          <div className="std-metric-card std-metric-card--blue ops-metric-card" key={card.label}>
            <div className="std-metric-card__top">
              <span className="std-metric-card__label">{card.label}</span>
            </div>
            <div className="std-metric-card__value">{card.value}</div>
            <div className="std-metric-card__hint">{card.hint}</div>
          </div>
        ))}
      </div>

      <div className="security-filter-card">
        <div className="security-filter-card__head">
          <div>
            <div className="panel-title">运行事件日志</div>
            <p className="security-filter-hint">
              默认仅展示最近告警/错误事件，已自动过滤常规 200 请求访问日志。
              {logsData?.sources.errorLog || logsData?.sources.outLog
                ? ` 当前来源：${[logsData.sources.errorLog, logsData.sources.outLog].filter(Boolean).join(' · ')}`
                : ''}
            </p>
          </div>
        </div>
        <div className="security-filter-grid ops-filter-grid">
          <label className="security-filter-field">
            <span className="security-filter-label">级别</span>
            <select value={logLevel} className="filter-select security-filter-select" onChange={(event) => setLogLevel(event.target.value as typeof logLevel)}>
              <option value="all">全部级别</option>
              <option value="warn">仅警告</option>
              <option value="error">仅错误</option>
              <option value="fatal">仅致命</option>
            </select>
          </label>
          <label className="security-filter-field">
            <span className="security-filter-label">时间范围</span>
            <select value={sinceHours} className="filter-select security-filter-select" onChange={(event) => setSinceHours(Number(event.target.value))}>
              <option value={6}>最近 6 小时</option>
              <option value={24}>最近 24 小时</option>
              <option value={72}>最近 3 天</option>
              <option value={168}>最近 7 天</option>
            </select>
          </label>
          <label className="security-filter-field">
            <span className="security-filter-label">条数</span>
            <select value={limit} className="filter-select security-filter-select" onChange={(event) => setLimit(Number(event.target.value))}>
              <option value={20}>20 条</option>
              <option value={50}>50 条</option>
              <option value={100}>100 条</option>
            </select>
          </label>
          <div className="security-filter-actions">
            <button className="btn btn-primary" type="button" onClick={() => void loadLogs()} disabled={logsLoading}>
              {logsLoading ? '刷新中...' : '刷新日志'}
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
                <th>级别</th>
                <th>来源</th>
                <th>摘要</th>
                <th>请求 ID</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {!logsLoading && (!logsData || logsData.items.length === 0) ? (
                <tr>
                  <td colSpan={6} className="audit-empty-cell">
                    当前无告警/错误事件。
                  </td>
                </tr>
              ) : null}
              {logsData?.items.map((row) => (
                <Fragment key={row.id}>
                  <tr>
                    <td className="audit-time-cell">{formatDateTime(row.time)}</td>
                    <td>{opsLevelChip(row.level)}</td>
                    <td className="security-muted-cell">{row.source}</td>
                    <td>
                      <div className="audit-summary-main">{row.summary}</div>
                    </td>
                    <td className="security-muted-cell">{row.requestId ?? '—'}</td>
                    <td>
                      <button className="op-btn" type="button" onClick={() => setExpandedId((prev) => (prev === row.id ? null : row.id))}>
                        {expandedId === row.id ? '收起' : '更多'}
                      </button>
                    </td>
                  </tr>
                  {expandedId === row.id ? (
                    <tr className="audit-expand-row">
                      <td colSpan={6}>
                        <div className="audit-tech-line">
                          级别：<code>{row.level}</code> · 来源：<code>{row.source}</code>
                          {row.requestId ? (
                            <>
                              {' '}
                              · 请求标识 <code>{row.requestId}</code>
                            </>
                          ) : null}
                        </div>
                        <pre className="audit-json-pre">
                          {row.detail ? JSON.stringify(row.detail, null, 2) : row.raw}
                        </pre>
                      </td>
                    </tr>
                  ) : null}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

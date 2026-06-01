import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { io, type Socket } from 'socket.io-client';
import { PresentationGlyph } from '../components/PresentationGlyph';
import { Shell } from '../components/Shell';
import {
  adminApi,
  type AdminClass,
  type AdminStudent,
  type DisplayTerminal,
  type ScoreRecord,
  type SessionUser,
} from '../lib/api';
import { canManageDisplays } from '../utils/adminPermissions';


type RealtimeMonitorPageProps = {
  token: string;
  user: SessionUser | null;
};

type ConnectionStatus = 'connecting' | 'online' | 'offline';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ??
  (typeof window !== 'undefined' ? `${window.location.origin}/api/v1` : 'http://127.0.0.1:3000/api/v1');
const WS_BASE_URL = API_BASE_URL.replace(/\/api(?:\/v\d+)?\/?$/, '');

function formatDateTime(value: string | null | undefined) {
  if (!value) return '暂无记录';
  return new Date(value).toLocaleString('zh-CN', { hour12: false });
}

function formatDelta(value: number) {
  if (value > 0) return `+${value}`;
  return `${value}`;
}

function isToday(value: string) {
  const input = new Date(value);
  const now = new Date();
  return input.getFullYear() === now.getFullYear() && input.getMonth() === now.getMonth() && input.getDate() === now.getDate();
}

function isWithinHours(value: string, hours: number) {
  return Date.now() - new Date(value).getTime() <= hours * 60 * 60 * 1000;
}

export function RealtimeMonitorPage({ token, user }: RealtimeMonitorPageProps) {
  const navigate = useNavigate();
  const [classes, setClasses] = useState<AdminClass[]>([]);
  const [students, setStudents] = useState<AdminStudent[]>([]);
  const [records, setRecords] = useState<ScoreRecord[]>([]);
  const [displayTerminals, setDisplayTerminals] = useState<DisplayTerminal[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('connecting');
  const [pollingFallback, setPollingFallback] = useState(false);

  const refreshTimerRef = useRef<number | null>(null);
  const pollingTimerRef = useRef<number | null>(null);
  const inFlightRef = useRef(false);
  const socketRef = useRef<Socket | null>(null);

  const fetchSnapshot = useCallback(
    async (source: 'initial' | 'manual' | 'realtime' | 'poll') => {
      if (inFlightRef.current) return;
      inFlightRef.current = true;
      setError(null);
      setRefreshing(source !== 'initial');
      try {
        const canManageDisp = canManageDisplays(user?.roleCode);
        const [classesResponse, studentsResponse, recordsResponse, terminalsResponse] = await Promise.all([
          adminApi.classes(token),
          adminApi.students(token),
          adminApi.scoreRecords(token),
          canManageDisp ? adminApi.displayTerminals(token) : Promise.resolve({ data: [] }),
        ]);
        setClasses(classesResponse.data);
        setStudents(studentsResponse.data);
        setRecords(
          recordsResponse.data.sort(
            (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
          ),
        );
        setDisplayTerminals(terminalsResponse.data);
        setLastUpdatedAt(new Date().toLocaleString('zh-CN', { hour12: false }));
      } catch (err) {
        setError(err instanceof Error ? err.message : '实时运行数据加载失败');
      } finally {
        setLoading(false);
        setRefreshing(false);
        inFlightRef.current = false;
      }
    },
    [token],
  );

  const scheduleRefresh = useCallback(() => {
    if (refreshTimerRef.current) window.clearTimeout(refreshTimerRef.current);
    refreshTimerRef.current = window.setTimeout(() => {
      void fetchSnapshot('realtime');
    }, 800);
  }, [fetchSnapshot]);

  useEffect(() => {
    void fetchSnapshot('initial');
  }, [fetchSnapshot]);

  useEffect(
    () => () => {
      if (refreshTimerRef.current) window.clearTimeout(refreshTimerRef.current);
      if (pollingTimerRef.current) window.clearInterval(pollingTimerRef.current);
      socketRef.current?.disconnect();
    },
    [],
  );

  useEffect(() => {
    const schoolId = classes[0]?.schoolId;
    if (!schoolId || classes.length === 0) return;

    setConnectionStatus('connecting');
    const socket = io(`${WS_BASE_URL}/ws`, {
      transports: ['websocket'],
      reconnection: true,
      auth: { token },
    });
    socketRef.current = socket;

    const subscribeRooms = () => {
      socket.emit('subscribe.school', { schoolId });
      classes.forEach((item) => socket.emit('subscribe.class', { classId: item.id }));
    };

    socket.on('auth.ready', (payload: { ok?: boolean }) => {
      if (payload?.ok === false) {
        setConnectionStatus('offline');
        return;
      }
      setConnectionStatus('online');
      subscribeRooms();
    });
    socket.on('disconnect', () => setConnectionStatus('offline'));
    socket.on('connect_error', () => setConnectionStatus('offline'));
    socket.on('class.score.changed', scheduleRefresh);
    socket.on('class.student.changed', scheduleRefresh);
    socket.on('class.group.changed', scheduleRefresh);
    socket.on('reward.order.created', scheduleRefresh);

    return () => {
      socket.off('class.score.changed', scheduleRefresh);
      socket.off('class.student.changed', scheduleRefresh);
      socket.off('class.group.changed', scheduleRefresh);
      socket.off('reward.order.created', scheduleRefresh);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [classes, scheduleRefresh, token]);

  useEffect(() => {
    const shouldPoll = connectionStatus !== 'online';
    setPollingFallback(shouldPoll);
    if (!shouldPoll) {
      if (pollingTimerRef.current) {
        window.clearInterval(pollingTimerRef.current);
        pollingTimerRef.current = null;
      }
      return;
    }
    pollingTimerRef.current = window.setInterval(() => {
      void fetchSnapshot('poll');
    }, 10_000);
    return () => {
      if (pollingTimerRef.current) {
        window.clearInterval(pollingTimerRef.current);
        pollingTimerRef.current = null;
      }
    };
  }, [connectionStatus, fetchSnapshot]);

  const classById = useMemo(() => new Map(classes.map((item) => [item.id, item])), [classes]);
  const studentById = useMemo(() => new Map(students.map((item) => [item.id, item])), [students]);
  const terminalsByClass = useMemo(() => {
    const map = new Map<number, DisplayTerminal[]>();
    displayTerminals.forEach((terminal) => {
      if (!terminal.classId) return;
      const rows = map.get(terminal.classId) ?? [];
      rows.push(terminal);
      map.set(terminal.classId, rows);
    });
    return map;
  }, [displayTerminals]);

  const todayRecords = useMemo(() => records.filter((item) => isToday(item.createdAt)), [records]);
  const recentRecords = useMemo(() => records.slice(0, 24), [records]);
  const recentClassEventCount = useMemo(() => {
    const map = new Map<number, { total: number; negative: number; latestAt: string | null }>();
    records.filter((item) => isWithinHours(item.createdAt, 24)).forEach((record) => {
      const current = map.get(record.classId) ?? { total: 0, negative: 0, latestAt: null };
      current.total += 1;
      if (record.scoreDelta < 0 || record.sentiment === 'negative') current.negative += 1;
      if (!current.latestAt || new Date(record.createdAt).getTime() > new Date(current.latestAt).getTime()) {
        current.latestAt = record.createdAt;
      }
      map.set(record.classId, current);
    });
    return map;
  }, [records]);

  const onlineTerminals = displayTerminals.filter((item) => item.onlineStatus === 'online');
  const offlineTerminals = displayTerminals.filter((item) => item.onlineStatus !== 'online');
  const displayReadyClassCount = classes.filter((item) => item.displayStatus === 'enabled').length;
  const negativeToday = todayRecords.filter((item) => item.scoreDelta < 0 || item.sentiment === 'negative').length;
  const activeClassToday = new Set(todayRecords.map((item) => item.classId)).size;
  const averageClassScore = classes.length ? classes.reduce((sum, item) => sum + item.classScore, 0) / classes.length : 0;

  const riskClasses = useMemo(
    () =>
      classes
        .map((item) => {
          const eventInfo = recentClassEventCount.get(item.id);
          const terminals = terminalsByClass.get(item.id) ?? [];
          const onlineCount = terminals.filter((terminal) => terminal.onlineStatus === 'online').length;
          const reasons = [
            (eventInfo?.negative ?? 0) >= 3 ? `近 24 小时负向事件 ${eventInfo?.negative} 条` : null,
            item.classScore < averageClassScore * 0.65 ? `当前积分低于全校均值 ${Math.round(averageClassScore)}` : null,
            item.displayStatus === 'enabled' && terminals.length > 0 && onlineCount === 0 ? '展示终端离线' : null,
            item.displayStatus !== 'enabled' ? '班级展示未开启' : null,
          ].filter((reason): reason is string => Boolean(reason));
          return {
            classInfo: item,
            eventInfo,
            onlineCount,
            terminalCount: terminals.length,
            reasons,
          };
        })
        .filter((item) => item.reasons.length > 0)
        .sort((left, right) => (right.eventInfo?.negative ?? 0) - (left.eventInfo?.negative ?? 0) || left.classInfo.classScore - right.classInfo.classScore)
        .slice(0, 8),
    [averageClassScore, classes, recentClassEventCount, terminalsByClass],
  );

  const monitorMetrics = [
    {
      label: '实时通道',
      glyph: '通',
      value: connectionStatus === 'online' ? '在线' : connectionStatus === 'connecting' ? '连接中' : '离线',
      sub: pollingFallback ? '已启用 10 秒轮询兜底' : 'WebSocket 事件触发刷新',
      tone: connectionStatus === 'online' ? 'green' : connectionStatus === 'connecting' ? 'amber' : 'danger',
    },
    {
      label: '在线大屏',
      glyph: '屏',
      value: `${onlineTerminals.length}/${displayTerminals.length}`,
      sub: offlineTerminals.length > 0 ? `${offlineTerminals.length} 块离线` : '全部终端在线',
      tone: offlineTerminals.length > 0 ? 'amber' : 'blue',
    },
    {
      label: '今日评价事件',
      glyph: '评',
      value: todayRecords.length.toLocaleString('zh-CN'),
      sub: `负向 ${negativeToday} 条 · 活跃班级 ${activeClassToday}`,
      tone: negativeToday > 0 ? 'amber' : 'purple',
    },
    {
      label: '关注班级',
      glyph: '班',
      value: `${riskClasses.length}`,
      sub: `展示覆盖 ${displayReadyClassCount}/${classes.length}`,
      tone: riskClasses.length > 0 ? 'danger' : 'green',
    },
  ] as const;

  function openClass(classId: number) {
    const params = new URLSearchParams();
    params.set('classId', String(classId));
    params.set('returnTo', '/realtime-monitor');
    params.set('returnLabel', '返回实时运行监控');
    navigate(`/classes?${params.toString()}`);
  }

  function openStudent(studentId: number, classId: number) {
    const params = new URLSearchParams();
    params.set('studentId', String(studentId));
    params.set('classId', String(classId));
    params.set('statsView', 'student');
    params.set('returnTo', '/realtime-monitor');
    params.set('returnLabel', '返回实时运行监控');
    navigate(`/students?${params.toString()}`);
  }

  return (
    <Shell
      title="实时运行监控"
      subtitle="监控评价事件、展示终端和需要处理的班级异常"
      loading={loading}
      user={user}
      status={
        <>
          {loading ? <div className="status-card">正在读取实时运行数据...</div> : null}
          {error ? <div className="status-card error">{error}</div> : null}
        </>
      }
    >
      <div className="monitor-desk">
        <div className="monitor-hero">
          <div className="monitor-hero-main">
            <div className="monitor-hero-eyebrow">REALTIME MONITOR</div>
            <h2>实时运行监控</h2>
            <p className="monitor-hero-desc">
              {lastUpdatedAt ? `最近同步 ${lastUpdatedAt}` : '等待首帧数据'} · 当前用户 {user?.name ?? '管理员'}
            </p>
            <div className="monitor-status-row">
              <span className={`monitor-connection-chip ${connectionStatus}`}>
                {connectionStatus === 'online' ? '通道在线' : connectionStatus === 'connecting' ? '通道连接中' : '通道离线'}
              </span>
              {pollingFallback ? <span className="monitor-polling-chip">10 秒轮询兜底</span> : null}
              {refreshing ? <span className="monitor-polling-chip">数据刷新中</span> : null}
            </div>
          </div>
          <div className="monitor-hero-actions">
            <button className="ghost-button monitor-ghost-btn" type="button" onClick={() => navigate('/dashboard')}>
              返回驾驶舱
            </button>
            <button
              className="toolbar-button monitor-primary-btn"
              type="button"
              onClick={() => void fetchSnapshot('manual')}
              disabled={refreshing}
            >
              <PresentationGlyph name="trend" className="present-trigger-icon" />
              {refreshing ? '刷新中...' : '立即刷新'}
            </button>
          </div>
        </div>

        <div className="std-metric-grid std-metric-grid--4">
          {monitorMetrics.map((item) => (
            <div className={`std-metric-card std-metric-card--${item.tone}`} key={item.label}>
              <div className="std-metric-card__top">
                <div className="std-metric-card__icon">
                  <span className="sec-metric-glyph">{item.glyph}</span>
                </div>
                <span className="std-metric-card__label">{item.label}</span>
              </div>
              <div className="std-metric-card__value std-metric-card__value--text">{item.value}</div>
              <div className="std-metric-card__hint">{item.sub}</div>
            </div>
          ))}
        </div>

        <div className="monitor-layout">
          <div className="panel admin-list-panel monitor-main-panel">
            <div className="monitor-panel-head">
              <div>
                <div className="panel-title">最近事件流</div>
                <p className="page-desc">点击事件可跳转学生档案，便于快速跟进课堂评价</p>
              </div>
              <button className="ghost-button" type="button" onClick={() => navigate('/analytics')}>
                查看数据分析
              </button>
            </div>
            <div className="monitor-event-list">
              {recentRecords.map((record) => {
                const classInfo = classById.get(record.classId);
                const student = studentById.get(record.studentId);
                return (
                  <button
                    className="monitor-event-row"
                    type="button"
                    key={`${record.id}-${record.createdAt}`}
                    onClick={() => openStudent(record.studentId, record.classId)}
                  >
                    <div className={`monitor-event-delta ${record.scoreDelta >= 0 ? 'up' : 'down'}`}>
                      {formatDelta(record.scoreDelta)}
                    </div>
                    <div className="monitor-event-main">
                      <strong>
                        {student?.name ?? `学生#${record.studentId}`} ·{' '}
                        {classInfo ? `${classInfo.gradeName}${classInfo.name}` : `班级#${record.classId}`}
                      </strong>
                      <span>
                        {record.ruleName || record.tag || record.dimension || '学生评价'} ·{' '}
                        {record.operatorName || '系统记录'} · {formatDateTime(record.createdAt)}
                      </span>
                      {record.remark ? <em>{record.remark}</em> : null}
                    </div>
                    <span className="monitor-event-arrow">›</span>
                  </button>
                );
              })}
              {recentRecords.length === 0 ? <div className="table-empty">暂无评价事件。</div> : null}
            </div>
          </div>

          <aside className="monitor-side">
            <section className="panel admin-list-panel">
              <div className="monitor-panel-head monitor-panel-head--compact">
                <div className="panel-title">需要关注的班级</div>
                <span className="monitor-side-badge">{riskClasses.length}</span>
              </div>
              <div className="mini-list">
                {riskClasses.map((item) => (
                  <button
                    className="mini-list-item mini-list-item-button monitor-risk-item"
                    type="button"
                    key={item.classInfo.id}
                    onClick={() => openClass(item.classInfo.id)}
                  >
                    <div>
                      <strong>
                        {item.classInfo.gradeName}
                        {item.classInfo.name}
                      </strong>
                      <span>{item.reasons.join(' · ')}</span>
                    </div>
                    <b>{item.classInfo.classScore} 分</b>
                  </button>
                ))}
                {riskClasses.length === 0 ? (
                  <div className="mini-list-item monitor-risk-item monitor-risk-item--safe">
                    <div>
                      <strong>暂无异常班级</strong>
                      <span>最近运行状态稳定，未发现离线终端或明显负向波动。</span>
                    </div>
                    <b>稳定</b>
                  </div>
                ) : null}
              </div>
            </section>

            <section className="panel admin-list-panel">
              <div className="monitor-panel-head monitor-panel-head--compact">
                <div className="panel-title">离线大屏</div>
                <button className="ghost-button" type="button" onClick={() => navigate('/classes')}>
                  大屏列表
                </button>
              </div>
              <div className="mini-list">
                {offlineTerminals.slice(0, 6).map((terminal) => (
                  <div className="mini-list-item monitor-terminal-item" key={terminal.id}>
                    <div>
                      <strong>{terminal.terminalName || terminal.terminalCode}</strong>
                      <span>
                        {terminal.classInfo
                          ? `${terminal.classInfo.gradeName}${terminal.classInfo.className}`
                          : '未绑定班级'}
                        {' · 最近在线 '}
                        {formatDateTime(terminal.lastOnlineAt)}
                      </span>
                    </div>
                    <b className="monitor-terminal-offline">离线</b>
                  </div>
                ))}
                {offlineTerminals.length === 0 ? (
                  <div className="mini-list-item monitor-terminal-item monitor-terminal-item--online">
                    <div>
                      <strong>全部大屏在线</strong>
                      <span>当前没有离线展示终端。</span>
                    </div>
                    <b>在线</b>
                  </div>
                ) : null}
              </div>
            </section>
          </aside>
        </div>
      </div>
    </Shell>
  );
}

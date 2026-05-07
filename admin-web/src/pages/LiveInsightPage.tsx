import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { io, type Socket } from 'socket.io-client';
import { PresentationGlyph } from '../components/PresentationGlyph';
import { Shell } from '../components/Shell';
import { adminApi, type AdminClass, type AdminStudent, type ScoreRecord, type SessionUser } from '../lib/api';

type LiveInsightPageProps = {
  token: string;
  user: SessionUser | null;
};

type ConnectionStatus = 'connecting' | 'online' | 'offline';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000/api/v1';
const WS_BASE_URL = API_BASE_URL.replace(/\/api(?:\/v\d+)?\/?$/, '');

function formatClock(input: Date) {
  return input.toLocaleString('zh-CN', {
    hour12: false,
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function formatDelta(value: number) {
  if (value > 0) return `+${value}`;
  return `${value}`;
}

export function LiveInsightPage({ token, user }: LiveInsightPageProps) {
  const navigate = useNavigate();
  const [classes, setClasses] = useState<AdminClass[]>([]);
  const [students, setStudents] = useState<AdminStudent[]>([]);
  const [records, setRecords] = useState<ScoreRecord[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null>(null);
  const [clock, setClock] = useState(() => formatClock(new Date()));
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('connecting');
  const [pollingFallback, setPollingFallback] = useState(false);

  const refreshTimerRef = useRef<number | null>(null);
  const pollingTimerRef = useRef<number | null>(null);
  const inFlightRef = useRef(false);
  const socketRef = useRef<Socket | null>(null);
  const previousClassRef = useRef<number | null>(null);
  const selectedClassRef = useRef<number | null>(null);

  const fetchSnapshot = useCallback(
    async (source: 'initial' | 'manual' | 'realtime' | 'poll') => {
      if (inFlightRef.current) return;
      inFlightRef.current = true;
      setError(null);
      setRefreshing(source !== 'initial');
      try {
        const [classesResponse, studentsResponse, recordsResponse] = await Promise.all([
          adminApi.classes(token),
          adminApi.students(token),
          adminApi.scoreRecords(token),
        ]);

        const classRows = classesResponse.data;
        const studentRows = studentsResponse.data;
        const recordRows = recordsResponse.data;

        setClasses(classRows);
        setStudents(studentRows);
        setRecords(recordRows);
        setSelectedClassId((current) => {
          if (current && classRows.some((item) => item.id === current)) return current;
          return classRows[0]?.id ?? null;
        });
        setLastUpdatedAt(new Date().toLocaleString('zh-CN', { hour12: false }));
      } catch (err) {
        setError(err instanceof Error ? err.message : '实时数据加载失败');
      } finally {
        setLoading(false);
        setRefreshing(false);
        inFlightRef.current = false;
      }
    },
    [token],
  );

  const scheduleRefresh = useCallback(() => {
    if (refreshTimerRef.current) {
      window.clearTimeout(refreshTimerRef.current);
    }
    refreshTimerRef.current = window.setTimeout(() => {
      void fetchSnapshot('realtime');
    }, 800);
  }, [fetchSnapshot]);

  useEffect(() => {
    void fetchSnapshot('initial');
  }, [fetchSnapshot]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setClock(formatClock(new Date()));
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    selectedClassRef.current = selectedClassId;
  }, [selectedClassId]);

  useEffect(() => {
    const schoolId = classes[0]?.schoolId;
    if (!schoolId) return;

    setConnectionStatus('connecting');
    const socket = io(`${WS_BASE_URL}/ws`, {
      transports: ['websocket'],
      reconnection: true,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      setConnectionStatus('online');
      socket.emit('subscribe.school', { schoolId });
      if (selectedClassRef.current) {
        socket.emit('subscribe.class', { classId: selectedClassRef.current });
        previousClassRef.current = selectedClassRef.current;
      }
    });

    socket.on('disconnect', () => {
      setConnectionStatus('offline');
    });

    socket.on('connect_error', () => {
      setConnectionStatus('offline');
    });

    socket.on('class.score.changed', scheduleRefresh);
    socket.on('class.student.changed', scheduleRefresh);
    socket.on('class.group.changed', scheduleRefresh);

    return () => {
      socket.off('class.score.changed', scheduleRefresh);
      socket.off('class.student.changed', scheduleRefresh);
      socket.off('class.group.changed', scheduleRefresh);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [classes, scheduleRefresh]);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || !selectedClassId || connectionStatus !== 'online') return;

    const previousClassId = previousClassRef.current;
    if (previousClassId && previousClassId !== selectedClassId) {
      socket.emit('unsubscribe.room', { room: `class:${previousClassId}` });
    }
    socket.emit('subscribe.class', { classId: selectedClassId });
    previousClassRef.current = selectedClassId;
  }, [connectionStatus, selectedClassId]);

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
    }, 10000);

    return () => {
      if (pollingTimerRef.current) {
        window.clearInterval(pollingTimerRef.current);
        pollingTimerRef.current = null;
      }
    };
  }, [connectionStatus, fetchSnapshot]);

  useEffect(
    () => () => {
      if (refreshTimerRef.current) {
        window.clearTimeout(refreshTimerRef.current);
      }
    },
    [],
  );

  const sortedClasses = useMemo(
    () =>
      [...classes].sort(
        (left, right) =>
          right.classScore - left.classScore ||
          right.studentCount - left.studentCount ||
          left.name.localeCompare(right.name, 'zh-CN'),
      ),
    [classes],
  );

  const selectedClass = useMemo(
    () => sortedClasses.find((item) => item.id === selectedClassId) ?? sortedClasses[0] ?? null,
    [selectedClassId, sortedClasses],
  );

  const selectedStudents = useMemo(() => {
    if (!selectedClass) return [];
    return students
      .filter((item) => item.classId === selectedClass.id)
      .sort((left, right) => right.currentScore - left.currentScore || right.currentPetLevel - left.currentPetLevel);
  }, [selectedClass, students]);

  const classEventMap = useMemo(() => {
    const map = new Map<number, { count: number; latestAt: string | null; latestDelta: number }>();
    records.forEach((record) => {
      const current = map.get(record.classId) ?? { count: 0, latestAt: null, latestDelta: 0 };
      current.count += 1;
      if (!current.latestAt || new Date(record.createdAt).getTime() > new Date(current.latestAt).getTime()) {
        current.latestAt = record.createdAt;
        current.latestDelta = record.scoreDelta;
      }
      map.set(record.classId, current);
    });
    return map;
  }, [records]);

  const topStudents = useMemo(
    () =>
      [...students]
        .sort((left, right) => right.currentScore - left.currentScore || right.currentPetLevel - left.currentPetLevel)
        .slice(0, 8),
    [students],
  );

  const selectedClassEvents = useMemo(() => {
    if (!selectedClass) return [];
    return records
      .filter((record) => record.classId === selectedClass.id)
      .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())
      .slice(0, 10);
  }, [records, selectedClass]);

  const globalEvents = useMemo(
    () =>
      [...records]
        .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())
        .slice(0, 14),
    [records],
  );

  const schoolMetrics = useMemo(() => {
    const totalClassScore = classes.reduce((sum, item) => sum + item.classScore, 0);
    const activeClassCount = classes.filter((item) => item.displayStatus === 'enabled').length;
    const avgStudentScore = students.length
      ? Math.round(students.reduce((sum, item) => sum + item.currentScore, 0) / students.length)
      : 0;
    return { totalClassScore, activeClassCount, avgStudentScore };
  }, [classes, students]);

  return (
    <Shell
      title="实时数据透视"
      subtitle="全校班级与学生数据动态展示"
      user={user}
      status={
        <>
          {loading ? <div className="status-card">正在加载实时数据透视...</div> : null}
          {error ? <div className="status-card error">{error}</div> : null}
        </>
      }
    >
      <div className="live-insight-shell">
        <div className="live-insight-header">
          <div className="live-insight-header-main">
            <div className="live-insight-title">实时数据透视 · 全校总览</div>
            <div className="live-insight-subtitle">
              当前时间 {clock} · 最近刷新 {lastUpdatedAt ?? '尚未同步'}
            </div>
          </div>
          <div className="live-insight-actions">
            <span className={`live-insight-connection ${connectionStatus}`}>
              {connectionStatus === 'online' ? '实时通道在线' : connectionStatus === 'connecting' ? '实时通道连接中' : '实时通道离线'}
              {pollingFallback ? '（已启用轮询）' : ''}
            </span>
            <button className="ghost-button" type="button" onClick={() => void fetchSnapshot('manual')} disabled={refreshing}>
              {refreshing ? '刷新中...' : '立即刷新'}
            </button>
            <button className="toolbar-button" type="button" onClick={() => navigate('/dashboard')}>
              返回校园驾驶舱
            </button>
          </div>
        </div>

        <div className="live-insight-metrics">
          <div className="live-insight-metric-card">
            <span>班级总数</span>
            <strong>{classes.length}</strong>
            <p>覆盖全校班级实时状态</p>
          </div>
          <div className="live-insight-metric-card">
            <span>全校总积分</span>
            <strong>{schoolMetrics.totalClassScore.toLocaleString('zh-CN')}</strong>
            <p>所有班级当前积分累计</p>
          </div>
          <div className="live-insight-metric-card">
            <span>在线展示班级</span>
            <strong>{schoolMetrics.activeClassCount}</strong>
            <p>已启用展示终端的班级</p>
          </div>
          <div className="live-insight-metric-card">
            <span>学生平均分</span>
            <strong>{schoolMetrics.avgStudentScore}</strong>
            <p>全校学生当前平均积分</p>
          </div>
        </div>

        <div className="live-insight-grid">
          <section className="live-insight-panel">
            <div className="live-insight-panel-title">
              <span>班级热力总览</span>
              <PresentationGlyph name="school" className="present-trigger-icon" />
            </div>
            <div className="live-insight-class-list">
              {sortedClasses.map((item, index) => {
                const eventInfo = classEventMap.get(item.id);
                return (
                  <button
                    key={item.id}
                    type="button"
                    className={`live-insight-class-row${selectedClass?.id === item.id ? ' active' : ''}`}
                    onClick={() => setSelectedClassId(item.id)}
                  >
                    <div>
                      <strong>
                        {index + 1}. {item.gradeName} {item.name}
                      </strong>
                      <span>
                        {item.studentCount} 人 · 最近事件 {eventInfo?.count ?? 0} 条
                      </span>
                    </div>
                    <b>{item.classScore} 分</b>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="live-insight-panel">
            <div className="live-insight-panel-title">
              <span>班级实时焦点</span>
              <PresentationGlyph name="chart" className="present-trigger-icon" />
            </div>
            {selectedClass ? (
              <div className="live-insight-focus">
                <div className="live-insight-focus-head">
                  <h3>
                    {selectedClass.gradeName} {selectedClass.name}
                  </h3>
                  <p>{selectedClass.slogan || '实时透视聚焦当前班级动态'}</p>
                </div>
                <div className="live-insight-focus-cards">
                  <div>
                    <span>当前积分</span>
                    <strong>{selectedClass.classScore}</strong>
                  </div>
                  <div>
                    <span>总积分</span>
                    <strong>{selectedClass.classTotalScore}</strong>
                  </div>
                  <div>
                    <span>学生人数</span>
                    <strong>{selectedClass.studentCount}</strong>
                  </div>
                  <div>
                    <span>展示状态</span>
                    <strong>{selectedClass.displayStatus === 'enabled' ? '展示中' : '未展示'}</strong>
                  </div>
                </div>
                <div className="live-insight-focus-events">
                  {selectedClassEvents.map((item) => (
                    <div className="live-insight-event-item" key={`${item.id}-${item.createdAt}`}>
                      <span>{new Date(item.createdAt).toLocaleTimeString('zh-CN', { hour12: false })}</span>
                      <span>{item.ruleName || item.tag || item.dimension || '学生评价'}</span>
                      <b className={item.scoreDelta >= 0 ? 'up' : 'down'}>{formatDelta(item.scoreDelta)}</b>
                    </div>
                  ))}
                  {selectedClassEvents.length === 0 ? <div className="table-empty">当前班级暂无最近事件。</div> : null}
                </div>
              </div>
            ) : (
              <div className="table-empty">暂无班级数据。</div>
            )}
          </section>

          <section className="live-insight-panel">
            <div className="live-insight-panel-title">
              <span>学生流式榜单</span>
              <PresentationGlyph name="student" className="present-trigger-icon" />
            </div>
            <div className="live-insight-student-list">
              {selectedStudents.slice(0, 14).map((item, index) => (
                <div className="live-insight-student-row" key={item.id}>
                  <div className="live-insight-student-rank">{index + 1}</div>
                  <div className="live-insight-student-main">
                    <strong>{item.name}</strong>
                    <span>
                      当前积分 {item.currentScore} · Lv.{item.currentPetLevel}
                    </span>
                  </div>
                  <div className="live-insight-student-bar">
                    <i style={{ width: `${Math.max(12, Math.min(100, item.currentScore / 2))}%` }} />
                  </div>
                </div>
              ))}
              {selectedStudents.length === 0 ? <div className="table-empty">当前班级暂无学生数据。</div> : null}
            </div>
          </section>
        </div>

        <div className="live-insight-grid live-insight-grid-bottom">
          <section className="live-insight-panel">
            <div className="live-insight-panel-title">
              <span>全校尖子生快照</span>
            </div>
            <div className="live-insight-mini-list">
              {topStudents.map((item) => (
                <div className="live-insight-mini-row" key={item.id}>
                  <strong>
                    {item.name} · {item.className}
                  </strong>
                  <span>{item.currentScore} 分 / Lv.{item.currentPetLevel}</span>
                </div>
              ))}
            </div>
          </section>
          <section className="live-insight-panel">
            <div className="live-insight-panel-title">
              <span>全校最近事件流</span>
            </div>
            <div className="live-insight-mini-list">
              {globalEvents.map((item) => (
                <div className="live-insight-mini-row" key={`${item.id}-${item.createdAt}`}>
                  <strong>
                    班级#{item.classId} · 学生#{item.studentId} · {formatDelta(item.scoreDelta)} 分
                  </strong>
                  <span>
                    {item.ruleName || item.tag || item.dimension || '评价事件'} · {new Date(item.createdAt).toLocaleString('zh-CN', { hour12: false })}
                  </span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </Shell>
  );
}

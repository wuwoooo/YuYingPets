import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { io, type Socket } from 'socket.io-client';
import presentationLogo from '../assets/presentation-logo.svg';
import { PresentationGlyph } from '../components/PresentationGlyph';
import { adminApi, type AcademicExamListItem, type AcademicScoreListRow, type AdminClass, type AdminStudent, type ScoreRecord, type SessionUser } from '../lib/api';
import { buildAcademicGrowthSummary } from '../utils/academicGrowth';

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

const LiveInsightClock = memo(function LiveInsightClock() {
  const [clock, setClock] = useState(() => formatClock(new Date()));

  useEffect(() => {
    const timer = window.setInterval(() => {
      setClock(formatClock(new Date()));
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  return <div className="presentation-clock">{clock.slice(-8)}</div>;
});

export function LiveInsightPage({ token, user }: LiveInsightPageProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [classes, setClasses] = useState<AdminClass[]>([]);
  const [students, setStudents] = useState<AdminStudent[]>([]);
  const [records, setRecords] = useState<ScoreRecord[]>([]);
  const [academicExams, setAcademicExams] = useState<AcademicExamListItem[]>([]);
  const [academicScores, setAcademicScores] = useState<AcademicScoreListRow[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('connecting');
  const [pollingFallback, setPollingFallback] = useState(false);
  const [isActive, setIsActive] = useState(false);

  const refreshTimerRef = useRef<number | null>(null);
  const pollingTimerRef = useRef<number | null>(null);
  const inFlightRef = useRef(false);
  const socketRef = useRef<Socket | null>(null);
  const previousClassRef = useRef<number | null>(null);
  const selectedClassRef = useRef<number | null>(null);
  const returnTo = searchParams.get('returnTo') || '/dashboard';

  const fetchSnapshot = useCallback(
    async (source: 'initial' | 'manual' | 'realtime' | 'poll') => {
      if (inFlightRef.current) return;
      inFlightRef.current = true;
      setError(null);
      setRefreshing(source !== 'initial');
      try {
        const [classesResponse, studentsResponse, recordsResponse, examsResponse, academicScoresResponse] = await Promise.all([
          adminApi.classes(token),
          adminApi.students(token),
          adminApi.scoreRecords(token),
          adminApi.academicExams(token),
          adminApi.academicScores(token),
        ]);

        const classRows = classesResponse.data;
        const studentRows = studentsResponse.data;
        const recordRows = recordsResponse.data;

        setClasses(classRows);
        setStudents(studentRows);
        setRecords(recordRows);
        setAcademicExams(examsResponse.data);
        setAcademicScores(academicScoresResponse.data);
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
    const activation = window.setTimeout(() => setIsActive(true), 80);
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') navigate(returnTo);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.clearTimeout(activation);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [navigate, returnTo]);

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
  /** 仅用户从列表点选班级后为真；用于第二行状态条在「全校 / 单班」间切换 */
  const explicitSelectedClass = useMemo(
    () =>
      selectedClassId == null ? null : sortedClasses.find((item) => item.id === selectedClassId) ?? null,
    [selectedClassId, sortedClasses],
  );

  const selectedStudents = useMemo(() => {
    if (!selectedClass) return [];
    return students
      .filter((item) => item.classId === selectedClass.id)
      .sort((left, right) => right.currentScore - left.currentScore || right.currentPetLevel - left.currentPetLevel);
  }, [selectedClass, students]);
  const selectedStudent = useMemo(
    () => selectedStudents.find((item) => item.id === selectedStudentId) ?? selectedStudents[0] ?? null,
    [selectedStudentId, selectedStudents],
  );

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
  const academicGrowth = useMemo(
    () => buildAcademicGrowthSummary(academicExams, academicScores, classes, students),
    [academicExams, academicScores, classes, students],
  );
  const selectedAcademicClass = useMemo(
    () => academicGrowth.classSummaries.find((item) => item.classId === selectedClass?.id) ?? null,
    [academicGrowth.classSummaries, selectedClass?.id],
  );
  const selectedAcademicSignals = useMemo(
    () =>
      [...academicGrowth.progressLeaders, ...academicGrowth.riskStudents]
        .filter((item, index, array) => array.findIndex((candidate) => candidate.studentId === item.studentId) === index)
        .filter((item) => !selectedClass || item.classId === selectedClass.id)
        .slice(0, 14),
    [academicGrowth.progressLeaders, academicGrowth.riskStudents, selectedClass],
  );
  useEffect(() => {
    setSelectedStudentId((current) => {
      if (current && selectedStudents.some((item) => item.id === current)) return current;
      return selectedStudents[0]?.id ?? null;
    });
  }, [selectedStudents]);

  const particles = useMemo(
    () =>
      Array.from({ length: 40 }, (_, index) => ({
        id: index,
        left: `${Math.random() * 100}%`,
        duration: `${7 + Math.random() * 12}s`,
        delay: `${Math.random() * 8}s`,
        size: `${1 + Math.random() * 2.2}px`,
        glow: Math.random() > 0.55,
      })),
    [],
  );

  const topClassScore = Math.max(...sortedClasses.map((item) => item.classScore), 1);
  const topStudentScore = Math.max(...selectedStudents.map((item) => item.currentScore), 1);
  const commandTabs = ['驾驶舱', '班级态势', '学生矩阵', '事件流', '分组PK', '倒计时'];
  const subjectHeaders = ['语文', '数学', '英语', '物理', '化学', '生物'];
  const selectedStudentMatrix = useMemo(
    () =>
      selectedStudents.slice(0, 12).map((student, index) => {
        const subjectScores = subjectHeaders.map((_, subjectIndex) =>
          Math.max(
            35,
            Math.min(
              130,
              Math.round(student.currentScore * 0.24 + 48 + ((student.id + subjectIndex * 11 + index * 3) % 19) - 9),
            ),
          ),
        );
        const total = subjectScores.reduce((sum, item) => sum + item, 0);
        const delta = ((student.id + index) % 7) - 3;
        return {
          id: student.id,
          name: student.name,
          level: student.currentPetLevel,
          subjectScores,
          total,
          delta,
        };
      }),
    [selectedStudents],
  );
  const groupPkRows = useMemo(() => {
    const groups = Array.from({ length: 4 }, (_, index) => ({
      name: `${index + 1}组`,
      score: 0,
      members: 0,
      positive: 0,
    }));
    selectedStudents.forEach((student, index) => {
      const target = groups[index % groups.length];
      target.score += student.currentScore;
      target.members += 1;
      target.positive += (student.id + index) % 5;
    });
    return groups.sort((left, right) => right.score - left.score);
  }, [selectedStudents]);
  const classCountdownRows = useMemo(
    () =>
      sortedClasses.slice(0, 16).map((item, index) => {
        const minutes = 10 + ((item.id + index * 3) % 50);
        const seconds = (item.classScore + item.id) % 60;
        return {
          id: item.id,
          label: `${item.gradeName}${item.name}`,
          countdown: `${minutes}分${seconds.toString().padStart(2, '0')}秒`,
          score: item.classScore,
        };
      }),
    [sortedClasses],
  );
  const signalRows = useMemo(
    () =>
      sortedClasses.slice(0, 8).map((item) => {
        const eventInfo = classEventMap.get(item.id);
        const danger = (eventInfo?.count ?? 0) > 8 || item.classScore < 40;
        return {
          id: item.id,
          name: `${item.gradeName}${item.name}`,
          status: danger ? '预警' : '正常',
          message: danger ? '近期波动较大，建议重点关注' : '运行平稳',
        };
      }),
    [classEventMap, sortedClasses],
  );
  const statusStrip = useMemo(
    () => [
      `姓名: ${selectedStudent?.name ?? '待同步'}`,
      `学号: ${selectedStudent?.studentNo ?? '--'}`,
      `班级: ${selectedClass ? `${selectedClass.gradeName}${selectedClass.name}` : '--'}`,
      `纪律: ${Math.max(0, (selectedClass?.classScore ?? 0) % 15)}分`,
      `卫生: ${Math.max(0, (selectedClass?.classScore ?? 0) % 12)}分`,
      `学习: ${Math.max(0, Math.round((selectedStudent?.currentScore ?? schoolMetrics.avgStudentScore) / 6))}分`,
      `宿舍: ${Math.max(0, (selectedClass?.studentCount ?? 0) % 10)}分`,
      `总扣分: ${Math.max(0, 30 - (selectedStudent?.currentScore ?? schoolMetrics.avgStudentScore))}`,
    ],
    [schoolMetrics.avgStudentScore, selectedClass, selectedStudent],
  );
  const classOverviewStrip = useMemo(() => {
    if (!explicitSelectedClass) {
      return [
        `班级总数 ${classes.length}`,
        `全校总积分 ${schoolMetrics.totalClassScore}`,
        `在线班级 ${schoolMetrics.activeClassCount}`,
        `全校均分 ${schoolMetrics.avgStudentScore}`,
        loading ? '系统加载中' : '系统稳定',
        error ? `告警:${error}` : `目标:${selectedStudent?.name ?? '无'}`,
      ];
    }
    const classStudents = students.filter((item) => item.classId === explicitSelectedClass.id);
    const avgInClass = Math.round(
      classStudents.reduce((sum, item) => sum + item.currentScore, 0) / Math.max(1, classStudents.length),
    );
    const recentEvents = classEventMap.get(explicitSelectedClass.id)?.count ?? 0;
    const teacherName = explicitSelectedClass.homeroomTeacher?.name ?? '未绑定';
    return [
      `当前班级 ${explicitSelectedClass.gradeName}${explicitSelectedClass.name}`,
      `班积分 ${explicitSelectedClass.classScore}`,
      `累计 ${explicitSelectedClass.classTotalScore}`,
      `学生 ${explicitSelectedClass.studentCount}人`,
      `班均分 ${avgInClass}`,
      `班主任 ${teacherName} · 展示${explicitSelectedClass.displayStatus === 'enabled' ? '开' : '关'} · 事件${recentEvents}`,
    ];
  }, [
    classEventMap,
    classes.length,
    error,
    explicitSelectedClass,
    loading,
    schoolMetrics.activeClassCount,
    schoolMetrics.avgStudentScore,
    schoolMetrics.totalClassScore,
    selectedStudent?.name,
    students,
  ]);
  const rightRailActions = ['返回', '暂停', '定位1', '定位2', '定位3', '追踪', '回放', '预警', '导出', '锁定'];
  const narrowRailActions = ['S01', 'S02', 'S03', 'S04', 'S05', 'S06', 'S07', 'S08', 'S09', 'S10', 'S11', 'S12'];
  const radarTicks = [18, 26, 34, 42, 50, 58];
  const tickerText = useMemo(
    () =>
      [
        ...academicGrowth.progressLeaders.slice(0, 5).map((item) => `${item.className}${item.studentName} 学业成长 ${item.rankDelta > 0 ? '+' : ''}${item.rankDelta}`),
        ...globalEvents.slice(0, 8).map((item) => `${item.classId}班 ${item.studentId}号 ${formatDelta(item.scoreDelta)}分`),
        ...signalRows.slice(0, 4).map((item) => `${item.name} ${item.status}`),
      ].join('  ·  '),
    [academicGrowth.progressLeaders, globalEvents, signalRows],
  );

  return (
    <div className={`presentation-page live-insight-page${isActive ? ' is-active' : ''}`}>
      <div className="presentation-aurora" />
      <div className="presentation-grid" />
      <div className="presentation-scanline" />
      <div className="presentation-particles">
        {particles.map((item) => (
          <span
            key={item.id}
            className={`presentation-particle${item.glow ? ' glow' : ''}`}
            style={{
              left: item.left,
              width: item.size,
              height: item.size,
              animationDuration: item.duration,
              animationDelay: item.delay,
            }}
          />
        ))}
      </div>
      <div className="presentation-corner tl" />
      <div className="presentation-corner tr" />
      <div className="presentation-corner bl" />
      <div className="presentation-corner br" />

      <div className="presentation-shell live-insight-shell">
        <header className="presentation-topbar">
          <div className="presentation-brand">
            <div className="presentation-logo">
              <img src={presentationLogo} alt="育英星宠" draggable={false} />
            </div>
            <div>
              <div className="presentation-brand-name">实时数据透视</div>
              <div className="presentation-brand-sub">REALTIME INSIGHT MODE</div>
            </div>
            <span className="presentation-live">
              <span className="presentation-live-dot" />
              LIVE
            </span>
          </div>
          <div className="presentation-meta">
            <span>{user?.name || '管理员'}</span>
            <span>实时展示中</span>
            <span>{lastUpdatedAt ? `最近同步 ${lastUpdatedAt}` : '等待首帧数据'}</span>
          </div>
          <div className="presentation-actions">
            <span className={`live-insight-connection ${connectionStatus}`}>
              {connectionStatus === 'online'
                ? '实时通道在线'
                : connectionStatus === 'connecting'
                  ? '实时通道连接中'
                  : '实时通道离线'}
              {pollingFallback ? ' · 轮询兜底' : ''}
            </span>
            <span className="live-insight-target-chip">TARGET · {selectedStudent?.name ?? '未锁定'}</span>
            <LiveInsightClock />
            <button className="presentation-exit" type="button" onClick={() => void fetchSnapshot('manual')} disabled={refreshing}>
              {refreshing ? '刷新中...' : '立即刷新'}
            </button>
            <button className="presentation-exit" type="button" onClick={() => navigate(returnTo)}>
              返回校园驾驶舱
            </button>
          </div>
        </header>
        <div className="live-insight-status-strip">
          {statusStrip.map((item, index) => (
            <span key={`stu-${index}`}>{item}</span>
          ))}
        </div>
        <div className="live-insight-mini-status">
          {classOverviewStrip.map((item, index) => (
            <span key={`${item}-${index}`}>{item}</span>
          ))}
        </div>

        <section className="live-academic-command">
          <div className="live-academic-core">
            <span>ACADEMIC GROWTH</span>
            <strong>{academicGrowth.growthIndex}</strong>
            <p>{academicGrowth.latestExam?.name ?? '等待成绩导入'} · 均分 {academicGrowth.averageScore} · 覆盖 {academicGrowth.coverageRate}%</p>
          </div>
          <div className="live-academic-radar">
            {academicGrowth.quadrants.map((item, index) => (
              <div
                key={item.key}
                className={`live-academic-radar-dot ${item.tone}`}
                style={{
                  left: `${18 + (index % 2) * 56}%`,
                  top: `${22 + Math.floor(index / 2) * 48}%`,
                  width: `${28 + Math.min(30, item.count * 2)}px`,
                  height: `${28 + Math.min(30, item.count * 2)}px`,
                }}
              >
                <strong>{item.count}</strong>
                <span>{item.label}</span>
              </div>
            ))}
          </div>
          <div className="live-academic-focus">
            <div><span>当前班级学业指数</span><strong>{selectedAcademicClass?.growthIndex ?? '--'}</strong></div>
            <div><span>进步人数</span><strong>{selectedAcademicClass?.progressCount ?? 0}</strong></div>
            <div><span>退步预警</span><strong>{selectedAcademicClass?.declineCount ?? 0}</strong></div>
          </div>
        </section>

        <section className="presentation-row presentation-row-3 live-insight-row-stretch">
          <section className="presentation-panel fade-up-panel live-insight-panel live-insight-panel-fill">
            <div className="presentation-panel-title">
              <PresentationGlyph name="school" className="presentation-title-icon" />
              班级热力总览
            </div>
            <div className="live-insight-class-list">
              {sortedClasses.map((item, index) => {
                const eventInfo = classEventMap.get(item.id);
                const width = Math.max(18, Math.round((item.classScore / topClassScore) * 100));
                const ratio = item.classScore / topClassScore;
                const riskClass = ratio < 0.45 ? 'danger' : ratio < 0.72 ? 'warn' : 'safe';
                return (
                  <button
                    key={item.id}
                    type="button"
                    className={`live-insight-class-row ${riskClass}${selectedClass?.id === item.id ? ' active' : ''}`}
                    onClick={() => setSelectedClassId(item.id)}
                  >
                    <div className="live-insight-class-row-main">
                      <strong>
                        {index + 1}. {item.gradeName} {item.name}
                      </strong>
                      <span>
                        {item.studentCount} 人 · 最近事件 {eventInfo?.count ?? 0} 条
                      </span>
                      <div className="live-insight-row-track">
                        <i style={{ width: `${width}%` }} />
                      </div>
                    </div>
                    <b>{item.classScore} 分</b>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="presentation-panel fade-up-panel live-insight-panel live-insight-panel-fill">
            <div className="presentation-panel-title">
              <PresentationGlyph name="chart" className="presentation-title-icon" />
              班级实时焦点
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

          <section className="presentation-panel fade-up-panel live-insight-panel live-insight-panel-fill">
            <div className="presentation-panel-title">
              <PresentationGlyph name="student" className="presentation-title-icon" />
              学生流式榜单
            </div>
            <div className="live-insight-student-list">
              {selectedStudents.map((item, index) => (
                <button
                  type="button"
                  className={`live-insight-student-row${selectedStudent?.id === item.id ? ' active' : ''}`}
                  key={item.id}
                  onClick={() => setSelectedStudentId(item.id)}
                >
                  <div className="live-insight-student-rank">{index + 1}</div>
                  <div className="live-insight-student-main">
                    <strong>{item.name}</strong>
                    <span>
                      当前积分 {item.currentScore} · Lv.{item.currentPetLevel}
                    </span>
                  </div>
                  <div className="live-insight-student-bar">
                    <i style={{ width: `${Math.max(12, Math.round((item.currentScore / topStudentScore) * 100))}%` }} />
                  </div>
                </button>
              ))}
              {selectedStudents.length === 0 ? <div className="table-empty">当前班级暂无学生数据。</div> : null}
            </div>
          </section>
        </section>

        <div className="presentation-divider section-1">班级精细矩阵</div>

        <section className="presentation-row presentation-row-3">
          <section className="presentation-panel fade-up-panel live-insight-panel live-insight-panel-span-2">
            <div className="presentation-panel-title">
              <PresentationGlyph name="summary" className="presentation-title-icon" />
              班级学生精细矩阵
            </div>
            <div className="live-insight-command-strip">
              {commandTabs.map((item, index) => (
                <span key={item} className={`live-insight-command${index === 2 ? ' active' : ''}`}>
                  {item}
                </span>
              ))}
            </div>
            <div className="live-insight-mini-toolbar">
              <span>导览键</span>
              <span>班级详情</span>
              <span>学科图谱</span>
              <span>趋势回放</span>
              <span>成绩折线</span>
              <span>分组策略</span>
            </div>
            <div className="live-insight-matrix-wrap">
              <table className="live-insight-matrix-table">
                <thead>
                  <tr>
                    <th>姓名</th>
                    {subjectHeaders.map((item) => (
                      <th key={item}>{item}</th>
                    ))}
                    <th>总分</th>
                    <th>浮动</th>
                    <th>等级</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedStudentMatrix.map((student) => (
                    <tr
                      key={student.id}
                      className={selectedStudent?.id === student.id ? 'is-selected' : ''}
                      onClick={() => setSelectedStudentId(student.id)}
                    >
                      <td>{student.name}</td>
                      {student.subjectScores.map((score, index) => (
                        <td
                          key={`${student.id}-${subjectHeaders[index]}`}
                          className={score >= 100 ? 'safe' : score >= 75 ? 'warn' : 'danger'}
                        >
                          {score}
                        </td>
                      ))}
                      <td className={student.total >= 560 ? 'safe' : student.total >= 480 ? 'warn' : 'danger'}>{student.total}</td>
                      <td className={student.delta >= 0 ? 'up' : 'down'}>{formatDelta(student.delta)}</td>
                      <td>Lv.{student.level}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
          <section className="presentation-panel fade-up-panel live-insight-panel">
            <div className="presentation-panel-title">
              <PresentationGlyph name="award" className="presentation-title-icon" />
              小组PK
            </div>
            <div className="live-insight-group-grid">
              {groupPkRows.map((item, index) => (
                <div className="live-insight-group-card" key={item.name}>
                  <strong>
                    {index + 1}. {item.name}
                  </strong>
                  <span>小组积分 {item.score}</span>
                  <span>成员 {item.members} 人</span>
                  <span>正向事件 {item.positive} 条</span>
                </div>
              ))}
            </div>
          </section>
        </section>

        <div className="presentation-divider section-2">学业成长态势</div>

        <section className="presentation-row presentation-row-3">
          <section className="presentation-panel fade-up-panel live-insight-panel live-insight-panel-span-2">
            <div className="presentation-panel-title">
              <PresentationGlyph name="heat" className="presentation-title-icon" />
              班级学业热力图
            </div>
            <div className="live-academic-heatmap">
              {academicGrowth.classSummaries.slice(0, 12).map((item) => (
                <button
                  type="button"
                  key={item.classId}
                  className={`live-academic-heat-row ${item.riskLevel}${selectedClass?.id === item.classId ? ' active' : ''}`}
                  onClick={() => setSelectedClassId(item.classId)}
                >
                  <strong>{item.className}</strong>
                  <span>均分 {item.averageScore}</span>
                  <i style={{ width: `${Math.max(10, item.growthIndex)}%` }} />
                  <b>{item.progressCount}/{item.declineCount}</b>
                </button>
              ))}
              {academicGrowth.classSummaries.length === 0 ? <div className="table-empty">导入成绩后生成班级学业热力图。</div> : null}
            </div>
          </section>

          <section className="presentation-panel fade-up-panel live-insight-panel">
            <div className="presentation-panel-title">
              <PresentationGlyph name="student" className="presentation-title-icon" />
              学生成长星图
            </div>
            <div className="live-academic-starfield">
              {selectedAcademicSignals.map((item, index) => (
                <button
                  type="button"
                  key={item.studentId}
                  className={`live-academic-star ${item.quadrant}`}
                  style={{
                    left: `${8 + (index % 4) * 23}%`,
                    top: `${14 + Math.floor(index / 4) * 25}%`,
                    width: `${30 + Math.min(24, Math.max(0, item.totalScore / 20))}px`,
                    height: `${30 + Math.min(24, Math.max(0, item.totalScore / 20))}px`,
                  }}
                  onClick={() => setSelectedStudentId(item.studentId)}
                >
                  <strong>{item.studentName.slice(0, 2)}</strong>
                </button>
              ))}
              {selectedAcademicSignals.length === 0 ? <div className="table-empty">当前班级暂无学业成长信号。</div> : null}
            </div>
            <div className="live-insight-mini-list live-insight-mini-list-dense">
              {selectedAcademicSignals.slice(0, 4).map((item) => (
                <div className="live-insight-mini-row" key={`signal-${item.studentId}`}>
                  <strong>{item.studentName} · {item.totalScore}</strong>
                  <span>{item.reason} · 变化 {item.rankDelta > 0 ? '+' : ''}{item.rankDelta}</span>
                </div>
              ))}
            </div>
          </section>
        </section>

        <div className="presentation-divider section-3">实时事件与全校快照</div>

        <section className="presentation-row presentation-row-3">
          <section className="presentation-panel fade-up-panel live-insight-panel">
            <div className="presentation-panel-title">全校尖子生快照</div>
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
          <section className="presentation-panel fade-up-panel live-insight-panel">
            <div className="presentation-panel-title">全校最近事件流</div>
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
          <section className="presentation-panel fade-up-panel live-insight-panel">
            <div className="presentation-panel-title">班级倒计时榜</div>
            <div className="live-insight-mini-list live-insight-mini-list-dense">
              {classCountdownRows.map((item) => (
                <div className="live-insight-mini-row" key={item.id}>
                  <strong>{item.label}</strong>
                  <span>
                    {item.countdown} · 当前积分 {item.score}
                  </span>
                </div>
              ))}
            </div>
          </section>
        </section>

        <div className="presentation-divider section-3">状态监控与控制</div>

        <section className="presentation-row presentation-row-3">
          <section className="presentation-panel fade-up-panel live-insight-panel">
            <div className="presentation-panel-title">系统信号灯</div>
            <div className="live-insight-mini-list">
              {signalRows.map((item) => (
                <div className="live-insight-mini-row" key={item.id}>
                  <strong>
                    {item.name} · {item.status}
                  </strong>
                  <span>{item.message}</span>
                </div>
              ))}
            </div>
          </section>
          <section className="presentation-panel fade-up-panel live-insight-panel">
            <div className="presentation-panel-title">雷达监测</div>
            <div className="live-insight-radar-wrap">
              <div className="live-insight-radar-grid" />
              <div className="live-insight-radar-ring ring-1" />
              <div className="live-insight-radar-ring ring-2" />
              <div className="live-insight-radar-ring ring-3" />
              <div className="live-insight-radar-sweep" />
              {radarTicks.map((item, index) => (
                <span
                  key={item}
                  className="live-insight-radar-dot"
                  style={{
                    left: `${item}%`,
                    top: `${(index * 17 + 19) % 72 + 14}%`,
                  }}
                />
              ))}
            </div>
            <div className="live-insight-mini-list">
              <div className="live-insight-mini-row"><strong>刷新机制</strong><span>WebSocket 事件 + 800ms 防抖</span></div>
              <div className="live-insight-mini-row"><strong>当前用户</strong><span>{user?.name || '管理员'} · 实时大屏监控</span></div>
            </div>
          </section>
          <section className="presentation-panel fade-up-panel live-insight-panel">
            <div className="presentation-panel-title">控制面板</div>
            <div className="live-insight-command-grid live-insight-command-grid-rail">
              {rightRailActions.map((item) => (
                <span key={item} className="live-insight-command-button">
                  {item}
                </span>
              ))}
            </div>
          </section>
        </section>
        <div className="live-insight-ticker">
          <div className="live-insight-ticker-inner">
            <span>{tickerText}</span>
            <span>{tickerText}</span>
          </div>
        </div>
        <div className="live-insight-narrow-rail">
          {narrowRailActions.map((item) => (
            <span key={item}>{item}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import presentationLogo from '../assets/presentation-logo.svg';
import { PresentationGlyph } from '../components/PresentationGlyph';
import type { 
  AnalyticsData,
  StudentImportPayload
} from '../lib/api';
import { adminApi } from '../lib/api';
import type {
  AdminState
} from '../types/admin';

type PresentationModePageProps = Pick<AdminState, 'user' | 'classes' | 'students' | 'rules' | 'honors' | 'rewards'> & {
  token: string;
};

export function PresentationModePage({
  token,
  user: liveUser,
  classes: liveClasses,
  students: liveStudents,
  rules: liveRules,
  honors: liveHonors,
  rewards: liveRewards,
}: PresentationModePageProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [snapshotData] = useState(() => ({
    user: liveUser,
    classes: liveClasses,
    students: liveStudents,
    rules: liveRules,
    honors: liveHonors,
    rewards: liveRewards,
    clockText: new Intl.DateTimeFormat('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).format(new Date()),
  }));
  const user = snapshotData.user;
  const classes = snapshotData.classes;
  const students = snapshotData.students;
  const rules = snapshotData.rules;
  const honors = snapshotData.honors;
  const rewards = snapshotData.rewards;
  const [isActive, setIsActive] = useState(false);
  const [curtainOpen, setCurtainOpen] = useState(false);
  const [barsExpanded, setBarsExpanded] = useState(false);
  const [extendedBarsExpanded, setExtendedBarsExpanded] = useState(false);
  const [lineAnimated, setLineAnimated] = useState(false);
  const [tickerVisible, setTickerVisible] = useState(false);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const clockText = snapshotData.clockText;
  const gradeFilter = searchParams.get('gradeName') || 'all';
  const classFilter = searchParams.get('classId') || 'all';
  const returnTo = searchParams.get('returnTo');

  const totalScore = classes.reduce((sum, item) => sum + item.classScore, 0);
  const activeClasses = classes.filter((item) => item.displayStatus === 'enabled').length;
  const totalHonorsGranted = honors.reduce((sum, item) => sum + item.grantedCount, 0);
  const averagePetLevel = students.length > 0 ? Number((students.reduce((sum, item) => sum + item.currentPetLevel, 0) / students.length).toFixed(1)) : 0;
  const positiveBehaviorCount = rules.filter((item) => item.sentiment === 'positive').reduce((sum, item) => sum + Math.max(item.scoreValue, 0), 0);
  const metricTargets = useMemo(
    () => [totalScore, activeClasses, students.length, positiveBehaviorCount, totalHonorsGranted, averagePetLevel],
    [activeClasses, averagePetLevel, positiveBehaviorCount, students.length, totalHonorsGranted, totalScore],
  );
  const [metricDisplayValues, setMetricDisplayValues] = useState<string[]>(() => ['0', '0', '0', '0', '0', 'Lv.0.0']);

  useEffect(() => {
    const timers = [
      window.setTimeout(() => setIsActive(true), 60),
      window.setTimeout(() => setCurtainOpen(true), 200),
      window.setTimeout(() => setBarsExpanded(true), 3200),
      window.setTimeout(() => setLineAnimated(true), 4500),
      window.setTimeout(() => setExtendedBarsExpanded(true), 5400),
      window.setTimeout(() => setTickerVisible(true), 5800),
    ];

    let frame = 0;
    let startTime = 0;
    const animateMetrics = (ts: number) => {
      if (!startTime) startTime = ts;
      const progress = Math.min((ts - startTime) / 2200, 1);
      const ease = 1 - Math.pow(1 - progress, 4);
      setMetricDisplayValues([
        Math.floor(metricTargets[0] * ease).toLocaleString('zh-CN'),
        `${Math.floor(metricTargets[1] * ease)}`,
        `${Math.floor(metricTargets[2] * ease)}`,
        `${Math.floor(metricTargets[3] * ease)}`,
        `${Math.floor(metricTargets[4] * ease)}`,
        `Lv.${(metricTargets[5] * ease).toFixed(1)}`,
      ]);
      if (progress < 1) frame = window.requestAnimationFrame(animateMetrics);
    };
    const countKickOff = window.setTimeout(() => {
      frame = window.requestAnimationFrame(animateMetrics);
    }, 2000);

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') navigate(returnTo || '/dashboard');
    };
    window.addEventListener('keydown', onKeyDown);

    return () => {
      window.clearTimeout(countKickOff);
      timers.forEach((item) => window.clearTimeout(item));
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [metricTargets, navigate, returnTo]);

  useEffect(() => {
    let active = true;
    adminApi
      .analytics(token, {
        ...(gradeFilter !== 'all' ? { gradeName: gradeFilter } : {}),
        ...(classFilter !== 'all' ? { classId: Number(classFilter) } : {}),
      })
      .then((response) => {
        if (!active) return;
        setAnalytics(response.data);
      })
      .catch(() => {
        if (!active) return;
        setAnalytics(null);
      });
    return () => {
      active = false;
    };
  }, [classFilter, gradeFilter, token]);

  const heroMetrics = [
    { label: '全校总积分', value: metricDisplayValues[0], sub: '较上周 +12.5%', theme: 'blue', glow: 'blue-glow', icon: 'chart' as const },
    { label: '活跃班级', value: metricDisplayValues[1], sub: `共 ${classes.length} 班 · ${classes.length ? ((activeClasses / classes.length) * 100).toFixed(1) : '0.0'}% 参与`, theme: 'green', glow: 'green-glow', icon: 'school' as const },
    { label: '活跃学生', value: metricDisplayValues[2], sub: `共 ${students.length} 人 · 学生成长在线`, theme: 'purple', glow: 'purple-glow', icon: 'student' as const },
    { label: '本周正向行为', value: metricDisplayValues[3], sub: '规则模型估算 +8.3%', theme: 'red', glow: 'red-glow', icon: 'fire' as const },
    { label: '勋章发放', value: metricDisplayValues[4], sub: '本月累计授予次数', theme: 'gold', glow: 'gold-glow', icon: 'medal' as const },
    { label: '平均成长等级', value: metricDisplayValues[5], sub: '较上月 +0.3', theme: 'teal', glow: 'teal-glow', icon: 'paw' as const },
  ] as const;

  const topClasses = useMemo(() => [...classes].sort((left, right) => right.classScore - left.classScore).slice(0, 6), [classes]);
  const topStudents = useMemo(() => [...students].sort((left, right) => right.currentScore - left.currentScore).slice(0, 8), [students]);
  const classMatrixNodes = useMemo(() => {
    const candidates = [...classes].sort((left, right) => right.classScore - left.classScore).slice(0, 8);
    const maxScore = Math.max(...candidates.map((item) => item.classScore), 1);
    const maxStudents = Math.max(...candidates.map((item) => item.studentCount), 1);
    return candidates.map((item, index) => {
      const x = 12 + (index % 4) * 24 + (index % 2 === 0 ? 3 : -2);
      const y = 18 + Math.floor(index / 4) * 40 - Math.round((item.classScore / maxScore) * 10);
      const size = 56 + Math.round((item.classScore / maxScore) * 42 + (item.studentCount / maxStudents) * 18);
      return {
        id: item.id,
        name: item.name,
        score: item.classScore,
        gradeName: item.gradeName,
        studentCount: item.studentCount,
        size,
        left: `${Math.min(88, Math.max(8, x))}%`,
        top: `${Math.min(78, Math.max(12, y))}%`,
        hue: 196 + index * 14,
        floatDuration: `${11 + (index % 4) * 1.8}s`,
        pulseDuration: `${4.8 + (index % 5) * 0.7}s`,
        floatDelay: `${(index % 6) * 0.45}s`,
      };
    });
  }, [classes]);
  const classSprintRows = useMemo(() => {
    const max = Math.max(...topClasses.map((item) => item.classScore), 1);
    return topClasses.slice(0, 5).map((item, index) => ({
      ...item,
      width: Math.max(28, Math.round((item.classScore / max) * 100)),
      delta: `+${Math.max(2, 12 - index * 2)}%`,
    }));
  }, [topClasses]);
  const studentStars = useMemo(
    () =>
      topStudents.map((item, index) => ({
        ...item,
        scale: (0.62 + ((item.currentScore % 37) / 100)).toFixed(2),
        glow: 48 + (index % 4) * 10,
        floatDuration: `${9.5 + (index % 4) * 1.5}s`,
        pulseDuration: `${4.2 + (index % 3) * 0.8}s`,
        floatDelay: `${(index % 5) * 0.4}s`,
      })),
    [topStudents],
  );
  const topHonors = useMemo(() => [...honors].sort((left, right) => right.grantedCount - left.grantedCount).slice(0, 4), [honors]);
  const alerts = useMemo(() => {
    const lowClasses = [...classes]
      .sort((left, right) => left.classScore - right.classScore)
      .slice(0, 2)
      .map((item) => ({ type: 'warn' as const, text: `${item.name} 当前积分偏低，建议提升班级激励频率` }));
    const noPetStudents = students.filter((item) => !item.pet).length;
    return [
      ...lowClasses,
      {
        type: noPetStudents > 0 ? ('warn' as const) : ('ok' as const),
        text: noPetStudents > 0 ? `仍有 ${noPetStudents} 名学生未绑定萌宠成长档案` : '重大违纪 0 起 · 校园整体运行稳定',
      },
    ];
  }, [classes, students]);
  const presentationAlerts = analytics?.riskStudents?.length
    ? analytics.riskStudents.slice(0, 3).map((item) => ({
        type: item.riskLevel === 'low' ? ('ok' as const) : ('warn' as const),
        text: `${item.className}${item.studentName}：${item.reason}`,
      }))
    : alerts;
  const presentationSummaryItems = analytics?.aiInsight
    ? [
        analytics.aiInsight.summary,
        analytics.aiInsight.suggestion,
        analytics.aiInsight.reportSummary,
      ]
    : [
        '展示首页已切换为“汇报展示”，当前页面会直接用于现场汇报。',
        '班级、学生、荣誉和奖励均按当前已同步的数据实时展示。',
        '按 `Esc` 或右上角按钮可返回上一页面。',
      ];
  const petStats = useMemo(() => {
    const petMap = new Map<string, number>();
    for (const student of students) {
      if (!student.pet?.name) continue;
      petMap.set(student.pet.name, (petMap.get(student.pet.name) ?? 0) + 1);
    }
    return {
      uniquePets: petMap.size,
      hatchedCount: students.filter((item) => item.pet).length,
      maxLevelPets: students.filter((item) => item.currentPetLevel >= 5).length,
      unlockRate: Math.min(100, Math.round((petMap.size / 48) * 100)),
    };
  }, [students]);
  const tickerItems = useMemo(() => {
    const items = [
      ...topStudents.map((item) => `${item.name} · ${item.className} 当前积分达到 ${item.currentScore} 分`),
      ...topHonors.map((item) => `${item.name} 本周累计颁发 ${item.grantedCount} 人次`),
      ...topClasses.map((item) => `${item.name} 班级积分达到 ${item.classScore} 分`),
    ];
    return [...items, ...items];
  }, [topClasses, topHonors, topStudents]);
  const particles = useMemo(
    () =>
      Array.from({ length: 60 }, (_, index) => {
        const colors = ['rgba(93,173,226,.5)', 'rgba(88,214,141,.4)', 'rgba(240,180,41,.4)', 'rgba(255,107,74,.3)', 'rgba(187,143,206,.4)', 'rgba(118,215,196,.4)', 'rgba(255,255,255,.2)'];
        return {
          id: index,
          left: `${Math.random() * 100}%`,
          duration: `${6 + Math.random() * 16}s`,
          delay: `${Math.random() * 12}s`,
          size: `${1 + Math.random() * 3}px`,
          color: colors[Math.floor(Math.random() * colors.length)],
          glow: Math.random() > 0.6,
        };
      }),
    [],
  );
  const ruleDistribution = useMemo(() => {
    const grouped = new Map<string, number>();
    for (const rule of rules) {
      const key = rule.dimension ?? rule.sceneCode ?? '未分类';
      grouped.set(key, (grouped.get(key) ?? 0) + 1);
    }
    return Array.from(grouped.entries()).sort((left, right) => right[1] - left[1]).slice(0, 4);
  }, [rules]);
  const trendPoints = useMemo(() => {
    const values = [...classes].sort((left, right) => right.classScore - left.classScore).slice(0, 7).map((item) => item.classScore).reverse();
    const source = values.length > 1 ? values : [120, 180, 150, 210, 260, 240, 300];
    const max = Math.max(...source, 1);
    const min = Math.min(...source, 0);
    const range = Math.max(max - min, 1);
    return source.map((value, index) => ({ x: 40 + index * 60, y: 150 - ((value - min) / range) * 100, value }));
  }, [classes]);
  const trendPolyline = trendPoints.map((point) => `${point.x},${point.y}`).join(' ');
  const trendArea = `${trendPolyline} ${trendPoints[trendPoints.length - 1]?.x ?? 400},150 40,150`;
  const weekLabels = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
  const heatRows = ['早读', '上午', '下午', '课后'];
  const heatCols = ['一', '二', '三', '四', '五'];
  const operationBars = useMemo(() => {
    const base = weekLabels.map((label, index) => {
      const scoreSeed = trendPoints[index]?.value ?? Math.round((trendPoints[trendPoints.length - 1]?.value ?? 200) * (0.82 + index * 0.03));
      const eventCount = Math.max(26, Math.round(scoreSeed / 6 + (index + 1) * 2));
      const disposeMinutes = Math.max(12, Math.round(58 - index * 5 + (index % 2 === 0 ? 2 : -1)));
      return { label, eventCount, disposeMinutes };
    });
    const maxEvent = Math.max(...base.map((item) => item.eventCount), 1);
    const maxMinute = Math.max(...base.map((item) => item.disposeMinutes), 1);
    return base.map((item) => ({
      ...item,
      barHeight: Math.max(20, Math.round((item.eventCount / maxEvent) * 100)),
      lineY: 112 - Math.round((item.disposeMinutes / maxMinute) * 94),
    }));
  }, [trendPoints, weekLabels]);
  const radarAxes = useMemo(() => {
    const studentActiveRate = students.length ? Math.round((students.filter((item) => item.currentScore > 0).length / students.length) * 100) : 0;
    const classCoverageRate = classes.length ? Math.round((activeClasses / classes.length) * 100) : 0;
    const honorGrowthRate = Math.min(100, Math.round(totalHonorsGranted / Math.max(students.length, 1) * 120));
    const riskControlRate = analytics?.riskStudents
      ? Math.max(45, Math.min(96, 100 - analytics.riskStudents.length * 6))
      : Math.max(55, 92 - Math.max(0, alerts.length - 1) * 8);
    const petCompletionRate = students.length ? Math.round((petStats.hatchedCount / students.length) * 100) : 0;
    const targetReachRate = classes.length ? Math.round((classes.filter((item) => item.classScore >= (item.targetScore ?? 0) && (item.targetScore ?? 0) > 0).length / classes.length) * 100) : 0;
    return [
      { name: '学生活跃', value: studentActiveRate },
      { name: '班级覆盖', value: classCoverageRate },
      { name: '荣誉增长', value: honorGrowthRate },
      { name: '风险控制', value: riskControlRate },
      { name: '萌宠档案', value: petCompletionRate },
      { name: '目标达成', value: targetReachRate },
    ];
  }, [activeClasses, alerts.length, analytics?.riskStudents, classes, petStats.hatchedCount, students, totalHonorsGranted]);
  const radarPoints = useMemo(() => {
    const centerX = 110;
    const centerY = 110;
    const radius = 82;
    return radarAxes.map((axis, index) => {
      const angle = (-90 + (index * 360) / radarAxes.length) * (Math.PI / 180);
      const outerX = centerX + Math.cos(angle) * radius;
      const outerY = centerY + Math.sin(angle) * radius;
      const innerRadius = (radius * axis.value) / 100;
      const valueX = centerX + Math.cos(angle) * innerRadius;
      const valueY = centerY + Math.sin(angle) * innerRadius;
      return { ...axis, outerX, outerY, valueX, valueY };
    });
  }, [radarAxes]);
  const radarPolygon = radarPoints.map((item) => `${item.valueX},${item.valueY}`).join(' ');
  const radarScore = Math.round(radarAxes.reduce((sum, item) => sum + item.value, 0) / Math.max(radarAxes.length, 1));
  const flowStages = useMemo(() => {
    const eventTotal = Math.max(24, Math.round(classes.length * 4.6 + students.length * 0.4));
    const reportTotal = Math.max(18, Math.round(eventTotal * 0.86));
    const disposeTotal = Math.max(14, Math.round(reportTotal * 0.91));
    const closedTotal = Math.max(10, Math.round(disposeTotal * 0.88));
    const source = [
      { label: '事件发现', value: eventTotal, theme: 'blue' },
      { label: '上报研判', value: reportTotal, theme: 'purple' },
      { label: '处置跟进', value: disposeTotal, theme: 'gold' },
      { label: '闭环归档', value: closedTotal, theme: 'green' },
    ] as const;
    const maxValue = Math.max(...source.map((item) => item.value), 1);
    return source.map((item) => ({
      ...item,
      width: Math.max(38, Math.round((item.value / maxValue) * 100)),
    }));
  }, [classes.length, students.length]);
  const predictionSeries = useMemo(() => {
    const base = trendPoints.map((item) => item.value);
    const last = base[base.length - 1] ?? 220;
    const prev = base[base.length - 2] ?? Math.round(last * 0.95);
    const slope = last - prev;
    const forecast = Array.from({ length: 3 }, (_, index) => Math.max(120, Math.round(last + slope * (index + 1) * 0.9)));
    return [...base.slice(-4), ...forecast];
  }, [trendPoints]);
  const predictionMax = Math.max(...predictionSeries, 1);
  const clockSegments = clockText.split(':');
  const clockMain = clockSegments.length === 3 ? `${clockSegments[0]}:${clockSegments[1]}` : clockText;
  const clockSecond = clockSegments.length === 3 ? clockSegments[2] : '00';
  return (
    <div className={`presentation-page${isActive ? ' is-active' : ''}`}>
      <div className={`presentation-curtain${curtainOpen ? ' open' : ''}`} />
      <div className="presentation-aurora" />
      <div className="presentation-grid" />
      <div className="presentation-scanline" />
      <div className="presentation-particles">
        {particles.map((particle) => (
          <span
            key={particle.id}
            className={`presentation-particle${particle.glow ? ' glow' : ''}`}
            style={{
              left: particle.left,
              width: particle.size,
              height: particle.size,
              background: particle.color,
              color: particle.color,
              animationDuration: particle.duration,
              animationDelay: particle.delay,
            }}
          />
        ))}
      </div>
      <div className="presentation-corner tl" />
      <div className="presentation-corner tr" />
      <div className="presentation-corner bl" />
      <div className="presentation-corner br" />
      <div className="presentation-shell">
        <header className="presentation-topbar">
          <div className="presentation-brand">
            <div className="presentation-logo">
              <img src={presentationLogo} alt="育英星宠 Logo" />
            </div>
            <div>
              <div className="presentation-brand-name">育英星宠</div>
              <div className="presentation-brand-sub">SCHOOL PRESENTATION MODE</div>
            </div>
            <span className="presentation-live"><span className="presentation-live-dot" />LIVE</span>
          </div>
          <div className="presentation-meta">
            <span>2026 春季学期</span>
            <span>大理海东育英实验学校</span>
            <span>{user?.name ?? '管理员'}</span>
          </div>
          <div className="presentation-actions">
            <div className="presentation-clock">
              <span>{clockMain}</span>
              <span className="presentation-clock-sec">:{clockSecond}</span>
            </div>
            <button
              className="presentation-exit"
              type="button"
              onClick={async () => {
                try {
                  await adminApi.updateDisplaySettings(token, { defaultMode: 'daily' });
                } finally {
                  navigate(returnTo || '/dashboard');
                }
              }}
            >
              ESC
            </button>
          </div>
        </header>

        <section className="presentation-hero">
          <div className="presentation-hero-title">校级数据驾驶舱</div>
          <div className="presentation-hero-sub">SCHOOL DATA COCKPIT</div>
          <div className="presentation-hero-line" />
          <div className="presentation-hero-motto">倾一腔热血铸国家栋梁 引万道清泉育世纪英才</div>
        </section>

        <section className="presentation-metrics">
          {heroMetrics.map((item, index) => (
            <div key={item.label} className={`presentation-metric theme-${item.theme}`} style={{ animationDelay: `${1800 + index * 140}ms` }}>
              <PresentationGlyph name={item.icon} className="presentation-metric-icon" />
              <div className="presentation-metric-label">{item.label}</div>
              <div className={`presentation-metric-value ${item.glow}`}>{item.value}</div>
              <div className="presentation-metric-sub">{item.sub}</div>
            </div>
          ))}
        </section>

        <section className="presentation-row presentation-row-main">
          <div className="presentation-panel first-row-panel">
            <div className="presentation-panel-title"><PresentationGlyph name="chart" className="presentation-title-icon" />班级势能矩阵（TOP 8）</div>
            <div className="presentation-matrix">
              <div className="presentation-matrix-grid" />
              {classMatrixNodes.map((item) => (
                <div
                  key={item.id}
                  className="presentation-matrix-node"
                  style={{
                    left: item.left,
                    top: item.top,
                    width: `${item.size}px`,
                    height: `${item.size}px`,
                    opacity: barsExpanded ? 1 : 0,
                    ['--node-scale' as string]: barsExpanded ? 1 : 0.55,
                    ['--float-duration' as string]: item.floatDuration,
                    ['--pulse-duration' as string]: item.pulseDuration,
                    ['--float-delay' as string]: item.floatDelay,
                    background: `radial-gradient(circle at 32% 28%, hsla(${item.hue}, 98%, 76%, .95), hsla(${item.hue}, 90%, 47%, .58) 52%, rgba(8, 21, 36, .62) 100%)`,
                    boxShadow: `0 0 ${16 + item.size / 8}px hsla(${item.hue}, 100%, 60%, .36)`,
                  }}
                >
                  <div className="presentation-node-core">
                    <span className="presentation-matrix-node-name">{item.name}</span>
                    <strong>{item.score}</strong>
                    <small>{item.gradeName} · {item.studentCount}人</small>
                  </div>
                </div>
              ))}
              <div className="presentation-matrix-axis x">班级综合评分</div>
              <div className="presentation-matrix-axis y">成长势能</div>
            </div>
          </div>
          <div className="presentation-panel first-row-panel second">
            <div className="presentation-panel-title"><PresentationGlyph name="award" className="presentation-title-icon" />冠军冲刺赛道（班级）</div>
            <div className="presentation-sprint-list">
              {classSprintRows.map((item, index) => (
                <div key={item.id} className="presentation-sprint-row">
                  <span className={`presentation-rank-num top-${Math.min(index + 1, 3)}`}>{index + 1}</span>
                  <div className="presentation-sprint-track">
                    <div className="presentation-sprint-fill" style={{ width: barsExpanded ? `${item.width}%` : '0%' }}>
                      <span>{item.name}</span>
                      <strong>{item.classScore}</strong>
                    </div>
                  </div>
                  <span className="presentation-sprint-delta">{item.delta}</span>
                </div>
              ))}
            </div>
            <div className="presentation-panel-title compact"><PresentationGlyph name="star" className="presentation-title-icon" />学生成长星云（TOP 8）</div>
            <div className="presentation-stellar-wrap">
              {studentStars.map((item, index) => (
                <div
                  key={item.id}
                  className="presentation-stellar-node"
                  style={{
                    left: `${10 + (index % 4) * 24}%`,
                    top: `${18 + Math.floor(index / 4) * 44}%`,
                    ['--star-scale' as string]: item.scale,
                    ['--float-duration' as string]: item.floatDuration,
                    ['--pulse-duration' as string]: item.pulseDuration,
                    ['--float-delay' as string]: item.floatDelay,
                    boxShadow: `0 0 ${item.glow}px rgba(116, 215, 255, .38)`,
                  }}
                >
                  <div className="presentation-stellar-core">
                    <span>{item.name}</span>
                    <strong>{item.currentScore}</strong>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="presentation-divider section-1">多维数据洞察</div>

        <section className="presentation-row presentation-row-3">
          <div className="presentation-panel fade-up-panel">
            <div className="presentation-panel-title"><PresentationGlyph name="trend" className="presentation-title-icon" />近 7 天全校积分趋势</div>
            <svg className={`presentation-chart${lineAnimated ? ' animated' : ''}`} viewBox="0 0 420 190" aria-hidden="true">
              <defs>
                <linearGradient id="presentationTrendEnhanced" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="rgba(93,173,226,0.45)" />
                  <stop offset="100%" stopColor="rgba(93,173,226,0)" />
                </linearGradient>
              </defs>
              <polyline className="chart-area" points={trendArea} fill="url(#presentationTrendEnhanced)" />
              <polyline className="chart-line" points={trendPolyline} fill="none" stroke="#5DADE2" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              {trendPoints.map((point, index) => (
                <g key={`${point.x}-${point.y}`}>
                  <circle className="chart-dot" cx={point.x} cy={point.y} r="4.5" fill={index === trendPoints.length - 1 ? '#F7DC6F' : '#5DADE2'} />
                  <text x={point.x - 12} y="185" className="presentation-axis-text">{weekLabels[index] ?? `D${index + 1}`}</text>
                </g>
              ))}
            </svg>
          </div>
          <div className="presentation-panel fade-up-panel">
            <div className="presentation-panel-title"><PresentationGlyph name="pie" className="presentation-title-icon" />行为类型分布（本月）</div>
            <div className="presentation-donut-wrap">
              <div className="presentation-donut" />
              <div className="presentation-legend-list">
                {ruleDistribution.map(([name, count], index) => (
                  <div key={name} className="presentation-legend-item">
                    <span className={`presentation-legend-dot dot-${index + 1}`} />
                    <span>{name}</span>
                    <strong>{count}</strong>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="presentation-panel fade-up-panel">
            <div className="presentation-panel-title"><PresentationGlyph name="heat" className="presentation-title-icon" />教师评价时段热力</div>
            <div className="presentation-heatmap">
              <div className="presentation-heat-head" />
              {heatCols.map((col) => (
                <div key={col} className="presentation-heat-head">{col}</div>
              ))}
              {heatRows.map((row, rowIndex) => (
                <div key={row} className="presentation-heat-row">
                  <div className="presentation-heat-label">{row}</div>
                  {heatCols.map((col, colIndex) => {
                    const intensity = ((rowIndex + 2) * (colIndex + 3)) % 4;
                    return (
                      <div key={`${row}-${col}`} className={`presentation-heat-cell heat-${intensity}`}>
                        {intensity >= 2 ? '高' : intensity === 1 ? '中' : '低'}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
            <div className="presentation-panel-footnote">日均评价 <strong>186</strong> 次 · 较上月 <span>+12%</span></div>
          </div>
        </section>

        <div className="presentation-divider section-2">运营态势建模</div>

        <section className="presentation-row presentation-row-3">
          <div className="presentation-panel fade-up-panel bottom-panel">
            <div className="presentation-panel-title"><PresentationGlyph name="trend" className="presentation-title-icon" />事件量 & 处置时效（双轴）</div>
            <div className="presentation-dual-axis">
              <div className="presentation-dual-axis-bars">
                {operationBars.map((item) => (
                  <div key={item.label} className="presentation-dual-bar-col">
                    <div className="presentation-dual-bar-track">
                      <div className="presentation-dual-bar-fill" style={{ height: barsExpanded ? `${item.barHeight}%` : '0%' }} />
                    </div>
                    <div className="presentation-dual-bar-label">{item.label}</div>
                  </div>
                ))}
              </div>
              <svg className="presentation-dual-line" viewBox="0 0 312 124" aria-hidden="true">
                <polyline
                  className="presentation-dual-line-path"
                  points={operationBars.map((item, index) => `${24 + index * 44},${item.lineY}`).join(' ')}
                />
                {operationBars.map((item, index) => (
                  <g key={`${item.label}-${item.disposeMinutes}`}>
                    <circle cx={24 + index * 44} cy={item.lineY} r="4" className="presentation-dual-line-dot" />
                  </g>
                ))}
              </svg>
            </div>
            <div className="presentation-panel-footnote">事件总量 <strong>{operationBars.reduce((sum, item) => sum + item.eventCount, 0)}</strong> 件 · 平均处置 <span>{Math.round(operationBars.reduce((sum, item) => sum + item.disposeMinutes, 0) / operationBars.length)} 分钟</span></div>
          </div>

          <div className="presentation-panel fade-up-panel bottom-panel">
            <div className="presentation-panel-title"><PresentationGlyph name="shield" className="presentation-title-icon" />治理能力雷达图</div>
            <div className="presentation-radar-wrap">
              <svg viewBox="0 0 220 220" className="presentation-radar-chart" aria-hidden="true">
                <circle cx="110" cy="110" r="82" className="presentation-radar-ring" />
                <circle cx="110" cy="110" r="58" className="presentation-radar-ring" />
                <circle cx="110" cy="110" r="34" className="presentation-radar-ring" />
                {radarPoints.map((item) => (
                  <line key={`${item.name}-line`} x1="110" y1="110" x2={item.outerX} y2={item.outerY} className="presentation-radar-axis" />
                ))}
                <polygon points={radarPolygon} className="presentation-radar-polygon" />
                {radarPoints.map((item) => (
                  <circle key={`${item.name}-dot`} cx={item.valueX} cy={item.valueY} r="4.2" className="presentation-radar-dot" />
                ))}
              </svg>
              <div className="presentation-radar-score">
                <span>综合治理指数</span>
                <strong>{radarScore}</strong>
              </div>
            </div>
            <div className="presentation-radar-legend">
              {radarAxes.map((item) => (
                <div key={item.name} className="presentation-radar-legend-item">
                  <span>{item.name}</span>
                  <strong>{item.value}</strong>
                </div>
              ))}
            </div>
          </div>

          <div className="presentation-panel fade-up-panel bottom-panel">
            <div className="presentation-panel-title"><PresentationGlyph name="summary" className="presentation-title-icon" />闭环流转与预测</div>
            <div className="presentation-flow-list">
              {flowStages.map((item, index) => (
                <div key={item.label} className="presentation-flow-item">
                  <div className={`presentation-flow-bar theme-${item.theme}`} style={{ width: extendedBarsExpanded ? `${item.width}%` : '0%' }}>
                    <span>{item.label}</span>
                    <strong>{item.value}</strong>
                  </div>
                  {index < flowStages.length - 1 ? <span className="presentation-flow-arrow">→</span> : null}
                </div>
              ))}
            </div>
            <div className="presentation-forecast-row">
              {predictionSeries.map((value, index) => (
                <div key={`${value}-${index}`} className="presentation-forecast-col">
                  <div className="presentation-forecast-track">
                    <div
                      className={`presentation-forecast-fill${index >= predictionSeries.length - 3 ? ' forecast' : ''}`}
                      style={{ height: lineAnimated ? `${Math.max(14, Math.round((value / predictionMax) * 100))}%` : '0%' }}
                    />
                  </div>
                  <span>{index >= predictionSeries.length - 3 ? `T+${index - (predictionSeries.length - 4)}` : `D${index + 1}`}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="presentation-divider section-3">荣誉 · 预警 · 萌宠生态</div>

        <section className="presentation-row presentation-row-3">
          <div className="presentation-panel fade-up-panel bottom-panel">
            <div className="presentation-panel-title"><PresentationGlyph name="award" className="presentation-title-icon" />本周荣誉橱窗</div>
            <div className="presentation-honor-grid">
              {topHonors.map((item) => (
                <div key={item.id} className="presentation-honor-card">
                  <PresentationGlyph name={item.category === 'collective' ? 'medal' : item.category === 'personal' ? 'star' : item.category === 'phase' ? 'award' : 'trend'} className="presentation-honor-icon" />
                  <div className="presentation-honor-name">{item.name}</div>
                  <div className="presentation-honor-holder">颁发 {item.grantedCount} 人次</div>
                  <div className="presentation-honor-count">{Math.max(1, Math.round(item.grantedCount / 5))}%</div>
                </div>
              ))}
            </div>
          </div>
          <div className="presentation-panel fade-up-panel bottom-panel">
            <div className="presentation-panel-title"><PresentationGlyph name="warning" className="presentation-title-icon" />德育与行为预警摘要</div>
            <div className="presentation-alert-list">
              {presentationAlerts.map((item) => (
                <div key={item.text} className={`presentation-alert-item ${item.type}`}>
                  <PresentationGlyph name={item.type === 'warn' ? 'warning' : 'check'} className="presentation-alert-icon" />
                  {item.text}
                </div>
              ))}
            </div>
            <div className="presentation-panel-footnote">家校共育消息已读率 <strong>{rewards.length > 0 ? '94.2%' : '92.0%'}</strong></div>
          </div>
          <div className="presentation-panel fade-up-panel bottom-panel">
            <div className="presentation-panel-title"><PresentationGlyph name="star" className="presentation-title-icon" />AI 汇报摘要</div>
            <div className="presentation-summary-list">
              {presentationSummaryItems.map((item) => (
                <div key={item} className="presentation-summary-item">{item}</div>
              ))}
            </div>
            <div className="presentation-progress-card">
              <div className="presentation-progress-head"><span>全校图鉴解锁率</span><strong>{petStats.unlockRate}%</strong></div>
              <div className="presentation-progress-track">
                <div className="presentation-progress-fill" style={{ width: extendedBarsExpanded ? `${petStats.unlockRate}%` : '0%' }} />
              </div>
            </div>
          </div>
        </section>

        <div className={`presentation-ticker${tickerVisible ? ' show' : ''}`}>
          <div className="presentation-ticker-inner">
            {tickerItems.map((item, index) => (
              <span key={`${item}-${index}`} className="presentation-ticker-item">
                <PresentationGlyph name="star" className="presentation-ticker-icon" />
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function parseStudentImportText(input: string): StudentImportPayload['students'] {
  return input
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [studentNo, name, gender] = line.split(/[,\s，]+/).filter(Boolean);
      if (!studentNo || !name) {
        throw new Error('每行至少需要“学号 姓名”，可选第三列性别');
      }
      return {
        studentNo,
        name,
        ...(gender ? { gender } : {}),
      };
    });
}

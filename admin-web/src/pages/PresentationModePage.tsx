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
  user,
  classes,
  students,
  rules,
  honors,
  rewards,
}: PresentationModePageProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isActive, setIsActive] = useState(false);
  const [curtainOpen, setCurtainOpen] = useState(false);
  const [barsExpanded, setBarsExpanded] = useState(false);
  const [extendedBarsExpanded, setExtendedBarsExpanded] = useState(false);
  const [lineAnimated, setLineAnimated] = useState(false);
  const [tickerVisible, setTickerVisible] = useState(false);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [clockText, setClockText] = useState(() =>
    new Intl.DateTimeFormat('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).format(new Date()),
  );
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
    const clockTimer = window.setInterval(() => {
      setClockText(
        new Intl.DateTimeFormat('zh-CN', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        }).format(new Date()),
      );
    }, 1000);

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
      window.clearInterval(clockTimer);
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

  const gradeStats = useMemo(() => {
    const grouped = new Map<string, number>();
    for (const item of classes) grouped.set(item.gradeName, (grouped.get(item.gradeName) ?? 0) + item.classScore);
    const rows = Array.from(grouped.entries()).map(([name, score]) => ({ name, score }));
    const max = Math.max(...rows.map((item) => item.score), 1);
    return rows.map((item, index) => ({
      ...item,
      displayPercent: classes.length ? Math.min(99, 70 + index * 5 + Math.round((item.score / max) * 20)) : 0,
      theme: index % 3 === 0 ? 'blue' : index % 3 === 1 ? 'green' : 'red',
    }));
  }, [classes]);

  const topClasses = useMemo(() => [...classes].sort((left, right) => right.classScore - left.classScore).slice(0, 3), [classes]);
  const topStudents = useMemo(() => [...students].sort((left, right) => right.currentScore - left.currentScore).slice(0, 3), [students]);
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
            <div className="presentation-panel-title"><PresentationGlyph name="chart" className="presentation-title-icon" />年级参与度对比</div>
            <div className="presentation-bar-list">
              {gradeStats.map((item) => (
                <div key={item.name} className="presentation-bar-row">
                  <span className="presentation-bar-label">{item.name}</span>
                  <div className="presentation-bar-track">
                    <div className={`presentation-bar-fill theme-${item.theme}`} style={{ width: barsExpanded ? `${item.displayPercent}%` : '0%' }}>
                      {`${item.displayPercent}%`}
                    </div>
                  </div>
                  <span className="presentation-bar-value">{`${item.displayPercent}%`}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="presentation-panel first-row-panel second">
            <div className="presentation-panel-title"><PresentationGlyph name="award" className="presentation-title-icon" />高光榜单 · 明星班级</div>
            <div className="presentation-rank-group">
              {topClasses.map((item, index) => (
                <div key={item.id} className="presentation-rank-item" style={{ ['--rank-glow' as string]: index === 0 ? 'rgba(240,180,41,.3)' : index === 1 ? 'rgba(136,153,170,.2)' : 'rgba(230,126,34,.2)' }}>
                  <span className={`presentation-rank-num top-${index + 1}`}>{index + 1}</span>
                  <span className="presentation-rank-name">{item.name}</span>
                  <span className="presentation-rank-score">{item.classScore} 分</span>
                </div>
              ))}
            </div>
            <div className="presentation-panel-title compact"><PresentationGlyph name="star" className="presentation-title-icon" />高光榜单 · 明星学生</div>
            <div className="presentation-rank-group">
              {topStudents.map((item, index) => (
                <div key={item.id} className="presentation-rank-item" style={{ ['--rank-glow' as string]: index === 0 ? 'rgba(240,180,41,.3)' : index === 1 ? 'rgba(136,153,170,.2)' : 'rgba(230,126,34,.2)' }}>
                  <span className={`presentation-rank-num top-${index + 1}`}>{index + 1}</span>
                  <span className="presentation-rank-name">{item.name} · {item.className}</span>
                  <span className="presentation-rank-score">{item.currentScore} 分</span>
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

        <div className="presentation-divider section-2">荣誉 · 预警 · 萌宠生态</div>

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

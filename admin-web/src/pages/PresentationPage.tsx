import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminApi } from '../lib/api';
import type { 
  AdminState
} from '../types/admin';

type PresentationPageProps = Pick<AdminState, 'user' | 'classes' | 'students' | 'rules' | 'honors' | 'rewards'> & {
  token: string;
};

export function PresentationPage({
  token,
  user,
  classes,
  students,
  rules,
  honors,
  rewards,
}: PresentationPageProps) {
  const navigate = useNavigate();
  const [clockText, setClockText] = useState(() =>
    new Intl.DateTimeFormat('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).format(new Date()),
  );

  useEffect(() => {
    const timer = window.setInterval(() => {
      setClockText(
        new Intl.DateTimeFormat('zh-CN', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        }).format(new Date()),
      );
    }, 1000);

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') navigate('/dashboard');
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [navigate]);

  const totalScore = classes.reduce((sum, item) => sum + item.classScore, 0);
  const activeClasses = classes.filter((item) => item.displayStatus === 'enabled').length;
  const averagePetLevel =
    students.length > 0 ? (students.reduce((sum, item) => sum + item.currentPetLevel, 0) / students.length).toFixed(1) : '0.0';
  const positiveBehaviorCount = rules.filter((item) => item.sentiment === 'positive').reduce((sum, item) => sum + Math.max(item.scoreValue, 0), 0);

  const heroMetrics = [
    { label: '全校总积分', value: totalScore.toLocaleString('zh-CN'), sub: '实时汇总', theme: 'blue' },
    { label: '活跃班级', value: `${activeClasses}`, sub: `共 ${classes.length} 个班级`, theme: 'green' },
    { label: '活跃学生', value: `${students.length}`, sub: '学生档案在线', theme: 'purple' },
    { label: '正向行为值', value: `${positiveBehaviorCount}`, sub: '规则模型估算', theme: 'red' },
    { label: '勋章发放', value: `${honors.reduce((sum, item) => sum + item.grantedCount, 0)}`, sub: '累计授予次数', theme: 'gold' },
    { label: '平均成长等级', value: `Lv.${averagePetLevel}`, sub: '萌宠成长均值', theme: 'teal' },
  ] as const;

  const gradeStats = useMemo(() => {
    const grouped = new Map<string, number>();
    for (const item of classes) grouped.set(item.gradeName, (grouped.get(item.gradeName) ?? 0) + item.classScore);
    const rows = Array.from(grouped.entries()).map(([name, score]) => ({ name, score }));
    const max = Math.max(...rows.map((item) => item.score), 1);
    return rows.map((item, index) => ({
      ...item,
      percent: Math.max(26, Math.round((item.score / max) * 100)),
      theme: index % 3 === 0 ? 'blue' : index % 3 === 1 ? 'green' : 'red',
    }));
  }, [classes]);

  const topClasses = useMemo(() => [...classes].sort((left, right) => right.classScore - left.classScore).slice(0, 3), [classes]);
  const topStudents = useMemo(() => [...students].sort((left, right) => right.currentScore - left.currentScore).slice(0, 3), [students]);
  const topHonors = useMemo(() => [...honors].sort((left, right) => right.grantedCount - left.grantedCount).slice(0, 3), [honors]);
  const topRewards = useMemo(() => [...rewards].sort((left, right) => left.scoreCost - right.scoreCost).slice(0, 3), [rewards]);

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
    return source.map((value, index) => {
      const x = 36 + index * 56;
      const y = 146 - ((value - min) / range) * 92;
      return { x, y, value };
    });
  }, [classes]);

  const trendPolyline = trendPoints.map((point) => `${point.x},${point.y}`).join(' ');
  const trendArea = `${trendPolyline} ${trendPoints[trendPoints.length - 1]?.x ?? 372},152 36,152`;
  const weekLabels = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
  const heatRows = ['早读', '上午', '下午', '课后'];
  const heatCols = ['一', '二', '三', '四', '五'];

  return (
    <div className="presentation-page">
      <div className="presentation-aurora" />
      <div className="presentation-grid" />
      <div className="presentation-shell">
        <header className="presentation-topbar">
          <div className="presentation-brand">
            <div className="presentation-logo">育</div>
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
            <div className="presentation-clock">{clockText}</div>
            <button
              className="presentation-exit"
              type="button"
              onClick={async () => {
                try {
                  await adminApi.updateDisplaySettings(token, { defaultMode: 'daily' });
                } finally {
                  navigate('/dashboard');
                }
              }}
            >
              退出汇报
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
          {heroMetrics.map((item) => (
            <div key={item.label} className={`presentation-metric theme-${item.theme}`}>
              <div className="presentation-metric-label">{item.label}</div>
              <div className="presentation-metric-value">{item.value}</div>
              <div className="presentation-metric-sub">{item.sub}</div>
            </div>
          ))}
        </section>

        <section className="presentation-row presentation-row-main">
          <div className="presentation-panel">
            <div className="presentation-panel-title">年级参与度对比</div>
            <div className="presentation-bar-list">
              {gradeStats.map((item) => (
                <div key={item.name} className="presentation-bar-row">
                  <span className="presentation-bar-label">{item.name}</span>
                  <div className="presentation-bar-track">
                    <div className={`presentation-bar-fill theme-${item.theme}`} style={{ width: `${item.percent}%` }}>
                      {item.score}
                    </div>
                  </div>
                  <span className="presentation-bar-value">{item.score}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="presentation-panel">
            <div className="presentation-panel-title">高光榜单</div>
            <div className="presentation-rank-group">
              <div className="presentation-rank-subtitle">明星班级</div>
              {topClasses.map((item, index) => (
                <div key={item.id} className="presentation-rank-item">
                  <span className={`presentation-rank-num top-${index + 1}`}>{index + 1}</span>
                  <span className="presentation-rank-name">{item.name}</span>
                  <span className="presentation-rank-score">{item.classScore} 分</span>
                </div>
              ))}
            </div>
            <div className="presentation-rank-group">
              <div className="presentation-rank-subtitle">明星学生</div>
              {topStudents.map((item, index) => (
                <div key={item.id} className="presentation-rank-item">
                  <span className={`presentation-rank-num top-${index + 1}`}>{index + 1}</span>
                  <span className="presentation-rank-name">{item.name} · {item.className}</span>
                  <span className="presentation-rank-score">{item.currentScore} 分</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="presentation-divider">多维数据洞察</div>

        <section className="presentation-row presentation-row-3">
          <div className="presentation-panel">
            <div className="presentation-panel-title">近 7 天全校积分趋势</div>
            <svg className="presentation-chart" viewBox="0 0 392 176" aria-hidden="true">
              <defs>
                <linearGradient id="presentationTrend" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="rgba(93,173,226,0.45)" />
                  <stop offset="100%" stopColor="rgba(93,173,226,0)" />
                </linearGradient>
              </defs>
              <polyline points={trendArea} fill="url(#presentationTrend)" />
              <polyline points={trendPolyline} fill="none" stroke="#71c7ff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              {trendPoints.map((point, index) => (
                <g key={`${point.x}-${point.y}`}>
                  <circle cx={point.x} cy={point.y} r="4.5" fill={index === trendPoints.length - 1 ? '#f3d36b' : '#71c7ff'} />
                  <text x={point.x - 12} y="168" className="presentation-axis-text">{weekLabels[index] ?? `D${index + 1}`}</text>
                </g>
              ))}
            </svg>
          </div>
          <div className="presentation-panel">
            <div className="presentation-panel-title">行为类型分布</div>
            <div className="presentation-legend-list">
              {ruleDistribution.map(([name, count], index) => (
                <div key={name} className="presentation-legend-item">
                  <span className={`presentation-legend-dot dot-${index + 1}`} />
                  <span>{name}</span>
                  <strong>{count}</strong>
                </div>
              ))}
            </div>
            <div className="presentation-donut" />
          </div>
          <div className="presentation-panel">
            <div className="presentation-panel-title">教师评价时段热力</div>
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
          </div>
        </section>

        <div className="presentation-divider">荣誉与激励概况</div>

        <section className="presentation-row presentation-row-3">
          <div className="presentation-panel">
            <div className="presentation-panel-title">荣誉勋章热度</div>
            <div className="presentation-rank-group">
              {topHonors.map((item, index) => (
                <div key={item.id} className="presentation-rank-item">
                  <span className={`presentation-rank-num top-${index + 1}`}>{index + 1}</span>
                  <span className="presentation-rank-name">{item.name}</span>
                  <span className="presentation-rank-score">{item.grantedCount} 次</span>
                </div>
              ))}
            </div>
          </div>
          <div className="presentation-panel">
            <div className="presentation-panel-title">奖励中心关注项</div>
            <div className="presentation-rank-group">
              {topRewards.map((item) => (
                <div key={item.id} className="presentation-reward-item">
                  <div>
                    <div className="presentation-rank-name">{item.name}</div>
                    <div className="presentation-rank-desc">{item.category} · {item.isInfiniteStock ? '不限库存' : `库存 ${item.stockQty ?? 0}`}</div>
                  </div>
                  <div className="presentation-rank-score">{item.scoreCost} 分</div>
                </div>
              ))}
            </div>
          </div>
          <div className="presentation-panel">
            <div className="presentation-panel-title">汇报摘要</div>
            <div className="presentation-summary-list">
              <div className="presentation-summary-item">展示首页已切换为“汇报展示”，当前页面会直接用于现场汇报。</div>
              <div className="presentation-summary-item">班级、学生、荣誉和奖励均按当前已同步的数据实时展示。</div>
              <div className="presentation-summary-item">按 `Esc` 或右上角“退出汇报”可返回后台主驾驶舱。</div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}


import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { PickerInput } from '../components/PickerInput';
import { Shell } from '../components/Shell';
import type { 
  AdminClass,
  AnalyticsData,
  SessionUser
} from '../lib/api';
import { adminApi } from '../lib/api';
import { ruleSubjectLabelMap } from '../constants/admin';
import { exportCsvFile } from '../utils/csv';
import { exportTextFile } from '../utils/text';

type AnalyticsPageProps = {
  token: string;
  user: SessionUser | null;
  classes: AdminClass[];
  loading: boolean;
  error: string | null;
};

export function AnalyticsPage({
  token,
  user,
  classes,
  loading,
  error,
}: AnalyticsPageProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [pageLoading, setPageLoading] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);
  const [exportSuccess, setExportSuccess] = useState<string | null>(null);
  const [batchExporting, setBatchExporting] = useState(false);
  const [aiRefreshing, setAiRefreshing] = useState(false);
  const [reportGenerating, setReportGenerating] = useState(false);
  const [reportMaskText, setReportMaskText] = useState('正在生成班级 AI 报告，请稍候...');
  const [gradeFilter, setGradeFilter] = useState('all');
  const [classFilter, setClassFilter] = useState('all');
  const today = new Date().toISOString().slice(0, 10);
  const defaultStartDate = new Date(Date.now() - 29 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const [startDate, setStartDate] = useState(defaultStartDate);
  const [endDate, setEndDate] = useState(today);
  const quickRangeOptions = [
    { key: '7d', label: '近7天' },
    { key: '30d', label: '近30天' },
    { key: 'month', label: '本月' },
  ] as const;

  const gradeOptions = useMemo(
    () => Array.from(new Set(classes.map((item) => item.gradeName).filter(Boolean))),
    [classes],
  );
  const classOptions = useMemo(
    () => classes.filter((item) => gradeFilter === 'all' || item.gradeName === gradeFilter),
    [classes, gradeFilter],
  );

  useEffect(() => {
    if (classFilter === 'all') return;
    const exists = classOptions.some((item) => String(item.id) === classFilter);
    if (!exists) {
      setClassFilter('all');
    }
  }, [classFilter, classOptions]);

  async function loadAnalytics(options?: {
    regenerateAi?: boolean;
    showGeneratingMask?: boolean;
    successMessage?: string;
  }) {
    if (classFilter === 'all') {
      setPageLoading(true);
      setPageError(null);
      if (options?.regenerateAi) {
        setAiRefreshing(true);
        setReportGenerating(true);
        setReportMaskText('正在重新生成全局 AI 概览，请稍候...');
      }
      try {
        if (!options?.regenerateAi) {
          const status = await adminApi.analyticsReportStatus(token, {
            ...(gradeFilter !== 'all' ? { gradeName: gradeFilter } : {}),
            startDate,
            endDate,
          });
          if (!status.data.hasTodayReport) {
            setReportGenerating(true);
            setReportMaskText('今日首次进入当前汇总视图，正在生成 AI 全局概览，请稍候...');
          }
        }

        const response = await adminApi.analytics(token, {
          ...(gradeFilter !== 'all' ? { gradeName: gradeFilter } : {}),
          startDate,
          endDate,
          ...(options?.regenerateAi ? { regenerateAi: true } : {}),
        });
        setAnalytics(response.data);
        if (options?.successMessage) {
          setExportSuccess(options.successMessage);
        }
      } catch (err) {
        setPageError(err instanceof Error ? err.message : '分析数据加载失败');
      } finally {
        setPageLoading(false);
        setAiRefreshing(false);
        setReportGenerating(false);
      }
      return;
    }

    setPageLoading(true);
    setPageError(null);
    if (options?.regenerateAi) {
      setAiRefreshing(true);
      setReportGenerating(true);
      setReportMaskText('正在重新生成班级 AI 报告，请稍候...');
    }

    try {
      if (!options?.regenerateAi) {
        const status = await adminApi.analyticsReportStatus(token, { classId: Number(classFilter), startDate, endDate });
        if (!status.data.hasTodayReport) {
          setReportGenerating(true);
          setReportMaskText('今日首次进入该班级，正在生成班级 AI 报告，请稍候...');
        }
      }

      const response = await adminApi.analytics(token, {
        ...(gradeFilter !== 'all' ? { gradeName: gradeFilter } : {}),
        classId: Number(classFilter),
        startDate,
        endDate,
        ...(options?.regenerateAi ? { regenerateAi: true } : {}),
      });
      setAnalytics(response.data);
      if (options?.successMessage) {
        setExportSuccess(options.successMessage);
      }
    } catch (err) {
      setPageError(err instanceof Error ? err.message : '分析数据加载失败');
    } finally {
      setPageLoading(false);
      setAiRefreshing(false);
      setReportGenerating(false);
    }
  }

  useEffect(() => {
    void loadAnalytics();
  }, [classFilter, gradeFilter, startDate, endDate, token]);

  const totalScore = analytics?.totalScore ?? 0;
  const positiveRuleCount = analytics?.positiveRuleCount ?? 0;
  const averageScore = analytics?.averageScore ?? 0;
  const activeDays = analytics?.activeDays ?? 0;
  const gradeTrend = analytics?.gradeTrend ?? [];
  const ruleDistribution = analytics?.ruleDistribution ?? [];
  const subjectDistribution = analytics?.subjectDistribution ?? [];
  const topClasses = analytics?.topClasses ?? [];
  const topStudents = analytics?.topStudents ?? [];
  const riskStudents = analytics?.riskStudents ?? [];
  const aiInsight = analytics?.aiInsight ?? null;
  const heatMapRows = analytics?.heatMap.rows ?? ['早读', '上午', '午后', '晚辅'];
  const heatMapCols = analytics?.heatMap.cols ?? ['一', '二', '三', '四', '五'];
  const heatMapData = analytics?.heatMap.data ?? [];
  const isGlobalOverview = classFilter === 'all';
  const aiPanelTitle = isGlobalOverview ? 'AI 全局概览' : 'AI 班级报告';
  const isClassScoped = classFilter !== 'all';
  const isGradeScoped = classFilter === 'all' && gradeFilter !== 'all';

  const overviewTitle = isClassScoped
    ? '个人积分总览'
    : isGradeScoped
      ? '班级积分分布总览'
      : '年级积分分布总览';
  const rankingTitle = isClassScoped
    ? '个人积分排行'
    : isGradeScoped
      ? `班级积分排行（${gradeFilter}）`
      : '班级积分排行';
  const overviewBars: Array<{ key: string | number; name: string; value: number }> = isClassScoped
    ? topStudents.map((item) => ({
        key: item.studentId,
        name: item.studentName,
        value: item.currentScore,
      }))
    : isGradeScoped
      ? topClasses.map((item) => ({
          key: item.id,
          name: item.name,
          value: item.currentScoreTotal,
        }))
      : gradeTrend.map((item) => ({
          key: item.name,
          name: item.name,
          value: item.value,
        }));
  const overviewMax = Math.max(...overviewBars.map((item) => item.value), 1);
  const rankingBars: Array<{ key: string | number; name: string; value: number }> = isClassScoped
    ? topStudents.map((item) => ({
        key: item.studentId,
        name: item.studentName,
        value: item.currentScore,
      }))
    : topClasses.map((item) => ({
        key: item.id,
        name: item.name,
        value: item.currentScoreTotal,
      }));
  const rankingMax = Math.max(...rankingBars.map((item) => item.value), 1);
  const reportSummaryText = aiInsight?.reportSummary?.trim() ?? '';
  const reportSentences = reportSummaryText
    .split(/[。！？]/)
    .map((item) => item.trim())
    .filter(Boolean);
  const reportLead = reportSentences[0] ?? '';
  const reportPoints = reportSentences.slice(1);
  const activeQuickRange = useMemo(() => {
    const monthStart = `${today.slice(0, 8)}01`;
    if (endDate === today) {
      if (startDate === new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)) return '7d';
      if (startDate === new Date(Date.now() - 29 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)) return '30d';
      if (startDate === monthStart) return 'month';
    }
    return null;
  }, [startDate, endDate, today]);

  function formatSubjectLabel(subjectName: string) {
    if (!subjectName || subjectName === '通用') return '通用';
    return ruleSubjectLabelMap[subjectName] ?? subjectName;
  }

  function shiftDate(date: string, offsetDays: number) {
    const d = new Date(`${date}T00:00:00`);
    d.setDate(d.getDate() + offsetDays);
    return d.toISOString().slice(0, 10);
  }

  function applyQuickRange(key: '7d' | '30d' | 'month') {
    if (key === '7d') {
      setEndDate(today);
      setStartDate(shiftDate(today, -6));
      return;
    }
    if (key === '30d') {
      setEndDate(today);
      setStartDate(shiftDate(today, -29));
      return;
    }
    setEndDate(today);
    setStartDate(`${today.slice(0, 8)}01`);
  }

  function buildAnalyticsReturnTo() {
    const params = new URLSearchParams();
    if (gradeFilter !== 'all') params.set('gradeName', gradeFilter);
    if (classFilter !== 'all') params.set('classId', classFilter);
    if (startDate) params.set('startDate', startDate);
    if (endDate) params.set('endDate', endDate);
    return params.size > 0 ? `${location.pathname}?${params.toString()}` : location.pathname;
  }

  function openRiskStudent(studentId: number) {
    const params = new URLSearchParams();
    params.set('studentId', String(studentId));
    params.set('statsView', 'student');
    params.set('returnTo', buildAnalyticsReturnTo());
    params.set('returnLabel', '返回数据分析');
    if (gradeFilter !== 'all') params.set('gradeName', gradeFilter);
    navigate(`/students?${params.toString()}`);
  }

  function openPresentationMode() {
    const params = new URLSearchParams();
    if (gradeFilter !== 'all') params.set('gradeName', gradeFilter);
    if (classFilter !== 'all') params.set('classId', classFilter);
    params.set('returnTo', buildAnalyticsReturnTo());
    navigate(`/presentation?${params.toString()}`);
  }

  async function handleRegenerateAiReport() {
    if (aiRefreshing) return;
    setExportSuccess(null);
    await loadAnalytics({
      regenerateAi: true,
      successMessage: isGlobalOverview ? 'AI 全局概览已重新生成' : '班级 AI 报告已重新生成',
    });
  }

  function handleExportReport() {
    if (!analytics) {
      setPageError('分析数据尚未加载完成，暂时无法导出');
      return;
    }
    const rows: Array<Array<string | number>> = [
      ['指标', '值'],
      ['本学期总积分', totalScore],
      ['正向规则数', positiveRuleCount],
      ['人均积分', averageScore],
      ['活跃天数', activeDays],
      [],
      ['年级', '积分'],
      ...gradeTrend.map((item) => [item.name, item.value]),
      [],
      ['行为分类', '规则数'],
      ...ruleDistribution.map((item) => [item.name, item.value]),
      [],
      ['学科', '事件数'],
      ...subjectDistribution.map((item) => [formatSubjectLabel(item.name), item.value]),
      [],
      ['班级', '总积分'],
      ...topClasses.map((item) => [item.name, item.currentScoreTotal]),
    ];
    exportCsvFile(`育英星宠-数据分析-${new Date().toISOString().slice(0, 10)}.csv`, rows);
    setExportSuccess('分析报表已导出为 CSV');
    setPageError(null);
  }

  function handleExportSummary() {
    if (!analytics || !aiInsight) {
      setPageError('AI 汇报摘要尚未加载完成，暂时无法导出');
      return;
    }

    const scopeLabel = classFilter === 'all'
      ? gradeFilter !== 'all'
        ? `${gradeFilter}汇总`
        : '全部班级汇总'
      : classOptions.find((item) => String(item.id) === classFilter)?.name ?? '当前班级';
    const content = [
      `育英星宠${isGlobalOverview ? '全局概览' : '汇报摘要'}`,
      `生成日期：${new Date().toLocaleDateString('zh-CN')}`,
      `统计范围：${scopeLabel}`,
      `统计周期：${startDate} 至 ${endDate}`,
      '',
      '一、核心概况',
      aiInsight.summary,
      '',
      '二、建议动作',
      aiInsight.suggestion,
      '',
      '三、汇报口径',
      aiInsight.reportSummary,
    ].join('\n');

    exportTextFile(`育英星宠-${isGlobalOverview ? '全局概览' : '汇报摘要'}-${new Date().toISOString().slice(0, 10)}.txt`, content);
    setExportSuccess(isGlobalOverview ? 'AI 全局概览已导出为文本' : 'AI 汇报摘要已导出为文本');
    setPageError(null);
  }

  async function handleBatchExportClassSummaries() {
    if (batchExporting) return;

    const targetClasses =
      classFilter !== 'all'
        ? classOptions.filter((item) => String(item.id) === classFilter)
        : classOptions;

    if (targetClasses.length === 0) {
      setPageError('当前筛选范围内没有可导出的班级');
      return;
    }

    setBatchExporting(true);
    setPageError(null);
    setExportSuccess(null);

    try {
      const sections: string[] = [
        '育英星宠班级汇报摘要合集',
        `生成日期：${new Date().toLocaleDateString('zh-CN')}`,
        `统计范围：${classFilter !== 'all' ? '单班级' : gradeFilter !== 'all' ? gradeFilter : '全校全部班级'}`,
        `统计周期：${startDate} 至 ${endDate}`,
        '',
      ];

      for (const item of targetClasses) {
        const response = await adminApi.analytics(token, { classId: item.id, startDate, endDate });
        const insight = response.data.aiInsight;
        sections.push(
          `【${item.gradeName} ${item.name}】`,
          `核心概况：${insight.summary}`,
          `建议动作：${insight.suggestion}`,
          `汇报口径：${insight.reportSummary}`,
          '',
        );
      }

      exportTextFile(`育英星宠-班级汇报摘要合集-${new Date().toISOString().slice(0, 10)}.txt`, sections.join('\n'));
      setExportSuccess(`已导出 ${targetClasses.length} 个班级的汇报摘要合集`);
    } catch (err) {
      setPageError(err instanceof Error ? err.message : '批量导出班级汇报摘要失败');
    } finally {
      setBatchExporting(false);
    }
  }

  return (
    <Shell
      title="数据分析"
      subtitle="围绕学期、年级、班级与行为维度提供学校汇报级分析视图"
      user={user}
      status={
        <>
          {loading || pageLoading ? <div className="status-card">分析数据加载中...</div> : null}
          {error ? <div className="status-card error">{error}</div> : null}
          {pageError ? <div className="status-card error">{pageError}</div> : null}
          {exportSuccess ? <div className="status-card success">{exportSuccess}</div> : null}
        </>
      }
    >
      <div className="page-header">
        <h2>数据分析</h2>
        <div className="page-actions">
          <PickerInput wrapperClassName="picker-input-inline" className="filter-select" type="date" value={startDate} max={endDate} onChange={(event) => setStartDate(event.target.value)} />
          <PickerInput wrapperClassName="picker-input-inline" className="filter-select" type="date" value={endDate} min={startDate} max={today} onChange={(event) => setEndDate(event.target.value)} />
          <div className="analytics-quick-range">
            {quickRangeOptions.map((item) => (
              <button
                key={item.key}
                type="button"
                className={`btn btn-outline analytics-quick-btn ${activeQuickRange === item.key ? 'active' : ''}`}
                onClick={() => applyQuickRange(item.key)}
              >
                {item.label}
              </button>
            ))}
          </div>
          <select className="filter-select" value={gradeFilter} onChange={(event) => setGradeFilter(event.target.value)}>
            <option value="all">全部年级</option>
            {gradeOptions.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <select className="filter-select" value={classFilter} onChange={(event) => setClassFilter(event.target.value)}>
            <option value="all">全部班级</option>
            {classOptions.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
          <button className="btn btn-outline" type="button" onClick={openPresentationMode}>进入汇报模式</button>
          <button className="btn btn-outline" type="button" onClick={() => void handleBatchExportClassSummaries()} disabled={batchExporting}>
            {batchExporting ? '批量导出中...' : '批量导出班级摘要'}
          </button>
          <button className="btn btn-outline" type="button" onClick={handleExportSummary}>
            {isGlobalOverview ? '导出全局概览' : '导出汇报摘要'}
          </button>
          <button className="btn btn-outline" type="button" onClick={handleExportReport}>导出报表</button>
        </div>
      </div>
      <div className="analytics-summary">
        <div className="a-summary-card">
          <div className="a-s-icon">◫</div>
          <div className="a-s-label">本学期总积分</div>
          <div className="a-s-value">{totalScore.toLocaleString('zh-CN')}</div>
          <div className="a-s-sub">来自班级真实积分汇总</div>
        </div>
        <div className="a-summary-card">
          <div className="a-s-icon">✓</div>
          <div className="a-s-label">正向事件数</div>
          <div className="a-s-value">{positiveRuleCount}</div>
          <div className="a-s-sub">按当前筛选范围内真实正向记录统计</div>
        </div>
        <div className="a-summary-card">
          <div className="a-s-icon">✦</div>
          <div className="a-s-label">人均积分</div>
          <div className="a-s-value">{averageScore}</div>
          <div className="a-s-sub">按学生当前积分均值计算</div>
        </div>
        <div className="a-summary-card">
          <div className="a-s-icon">◌</div>
          <div className="a-s-label">活跃天数</div>
          <div className="a-s-value">{activeDays}<span className="a-s-inline">/60</span></div>
          <div className="a-s-sub">按当前班级活跃推估</div>
        </div>
      </div>
      <div className="analytics-ai-panel">
        <div className="analytics-ai-card">
          <div className="analytics-ai-card-head">
            <div className="acp-title">{aiPanelTitle}</div>
            <button className="btn btn-outline" type="button" onClick={() => void handleRegenerateAiReport()} disabled={aiRefreshing}>
              {aiRefreshing ? '重新生成中...' : isGlobalOverview ? '重新生成概览' : '重新生成'}
            </button>
          </div>
          <div className="analytics-ai-meta">
            {classFilter === 'all'
              ? `当前为${gradeFilter !== 'all' ? `${gradeFilter}汇总` : '全部班级汇总'}视图；这里展示 AI 全局概览。`
              : aiInsight?.className
                ? `基准班级：${aiInsight.className}`
                : 'AI 报告按班级生成'}
            {aiInsight?.reportDate ? ` · 报告日期：${aiInsight.reportDate}` : ''}
            {` · 统计周期：${startDate} 至 ${endDate}`}
            {aiInsight?.generatedAt ? ` · 生成时间：${new Date(aiInsight.generatedAt).toLocaleString('zh-CN')}` : ''}
            {aiInsight ? ` · ${aiInsight.isCached ? '复用当日报告' : '本次新生成'}` : ''}
          </div>
          <p>{aiInsight?.summary ?? '当前筛选范围暂无 AI 洞察。'}</p>
        </div>
        <div className="analytics-ai-card analytics-ai-card-soft">
          <div className="acp-title">建议动作</div>
          <p>{aiInsight?.suggestion ?? '当前筛选范围暂无建议。'}</p>
        </div>
      </div>
      <div className="analytics-chart-panel">
        <div className="acp-title">汇报摘要</div>
        {reportSummaryText ? (
          <div className="analytics-report-card">
            <div className="analytics-report-lead">{reportLead}</div>
            {reportPoints.length > 0 ? (
              <ul className="analytics-report-points">
                {reportPoints.map((item, index) => (
                  <li key={`${index}-${item}`}>{item}</li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : (
          <p className="analytics-report-copy">当前筛选范围暂无汇报摘要。</p>
        )}
      </div>
      {reportGenerating ? (
        <div className="analytics-mask" role="status" aria-live="polite">
          <div className="analytics-mask-card">
            <div className="analytics-mask-spinner" />
            <strong>{isGlobalOverview ? 'AI 全局概览生成中' : 'AI 报告生成中'}</strong>
            <p>{reportMaskText}</p>
          </div>
        </div>
      ) : null}
      <div className="analytics-chart-panel">
        <div className="acp-title">{overviewTitle}</div>
        <div className="bar-chart">
          {overviewBars.map(({ key, name, value }, index) => (
            <div className="bar-row" key={key}>
              <span className="bar-label analytics-label">{name}</span>
              <div className="bar-track">
                <div
                  className={`bar-fill ${index % 3 === 0 ? 'bar-blue' : index % 3 === 1 ? 'bar-green' : 'bar-red'}`}
                    style={{ width: `${Math.max(30, Math.round((value / overviewMax) * 100))}%` }}
                >
                  {value}
                </div>
              </div>
              <span className="bar-val">{value}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="row-2 c50">
        <div className="analytics-chart-panel">
          <div className="acp-title">行为类型分布</div>
          <div className="bar-chart">
            {ruleDistribution.map(({ name, value: count }, index) => (
              <div className="bar-row" key={name}>
                <span className="bar-label analytics-label">{name}</span>
                <div className="bar-track">
                  <div
                    className={`bar-fill ${index % 3 === 0 ? 'bar-blue' : index % 3 === 1 ? 'bar-green' : 'bar-red'}`}
                    style={{ width: `${Math.max(28, Math.round((count / Math.max(...ruleDistribution.map((item) => item.value), 1)) * 100))}%` }}
                  >
                    {count}
                  </div>
                </div>
                <span className="bar-val">{count}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="analytics-chart-panel">
          <div className="acp-title">评分事件分布</div>
          <div className="bar-chart">
            {subjectDistribution.map(({ name, value: count }, index) => (
              <div className="bar-row" key={name}>
                <span className="bar-label analytics-label">{formatSubjectLabel(name)}</span>
                <div className="bar-track">
                  <div
                    className={`bar-fill ${index % 3 === 0 ? 'bar-blue' : index % 3 === 1 ? 'bar-green' : 'bar-red'}`}
                    style={{ width: `${Math.max(28, Math.round((count / Math.max(...subjectDistribution.map((item) => item.value), 1)) * 100))}%` }}
                  >
                    {count}
                  </div>
                </div>
                <span className="bar-val">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="row-2 c50">
        <div className="analytics-chart-panel">
          <div className="acp-title">{rankingTitle}</div>
          <div className="bar-chart analytics-ranking">
            {rankingBars.map((item, index) => (
              <div className="bar-row" key={item.key}>
                <span className="bar-label analytics-label">{item.name}</span>
                <div className="bar-track">
                  <div
                    className={`bar-fill ${index % 4 === 0 ? 'bar-red' : index % 4 === 1 ? 'bar-blue' : index % 4 === 2 ? 'bar-green' : 'bar-gold'}`}
                    style={{ width: `${Math.max(26, Math.round((item.value / rankingMax) * 100))}%` }}
                  >
                    {item.value}
                  </div>
                </div>
                <span className="bar-val">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="analytics-chart-panel">
          <div className="acp-title">风险学生提示</div>
          <div className="analytics-risk-list">
            {riskStudents.map((item) => (
              <div className="analytics-risk-item" key={item.studentId}>
                <div>
                  <strong>{item.studentName}</strong>
                  <span>{item.className} · 负向 {item.negativeCount} 次 · 净变化 {item.scoreDelta}</span>
                  <p>{item.reason}</p>
                </div>
                <div className="analytics-risk-actions">
                  <b className={`risk-level ${item.riskLevel}`}>{item.riskLevel === 'high' ? '高风险' : item.riskLevel === 'medium' ? '中风险' : '低风险'}</b>
                  <button className="op-btn" type="button" onClick={() => openRiskStudent(item.studentId)}>
                    查看学生
                  </button>
                </div>
              </div>
            ))}
            {riskStudents.length === 0 ? (
              <div className="analytics-risk-item empty">
                <div>
                  <strong>当前暂无明显风险学生</strong>
                  <span>当前筛选范围内，未发现负向事件明显聚集的学生。</span>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
      <div className="analytics-chart-panel">
        <div className="acp-title">评价时段分布</div>
        <div className="heatmap-grid">
          <div className="heatmap-cell heatmap-header" />
          {heatMapCols.map((col) => (
            <div key={col} className="heatmap-cell heatmap-header">{col}</div>
          ))}
          {heatMapRows.map((row, rowIndex) => (
            <div className="heatmap-row" key={row}>
              <div className="heatmap-cell heatmap-label">{row}</div>
              {heatMapCols.map((col, colIndex) => {
                const count = heatMapData[rowIndex]?.values[colIndex] ?? 0;
                const intensity = count >= 8 ? 4 : count >= 5 ? 3 : count >= 2 ? 2 : count >= 1 ? 1 : 0;
                return (
                  <div
                    key={`${row}-${col}`}
                    className={`heatmap-cell heat-${intensity}`}
                  >
                    {count}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </Shell>
  );
}

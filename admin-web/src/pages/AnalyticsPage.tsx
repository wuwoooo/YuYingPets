import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAdminView } from '../context/AdminViewContext';
import { PickerInput } from '../components/PickerInput';
import { Shell } from '../components/Shell';
import type {
  AdminClass,
  AdminStudent,
  AnalyticsData,
  SessionUser,
  TeacherReviewContext,
} from '../lib/api';
import { adminApi } from '../lib/api';
import { ruleSubjectLabelMap } from '../constants/admin';
import { isTeacherWorkbenchRole } from '../utils/adminPermissions';
import { exportCsvFile } from '../utils/csv';
import { exportTextFile } from '../utils/text';

type AnalyticsPageProps = {
  token: string;
  user: SessionUser | null;
  classes: AdminClass[];
  students: AdminStudent[];
  loading: boolean;
  error: string | null;
};

export function AnalyticsPage({
  token,
  user,
  classes,
  students,
  loading,
  error,
}: AnalyticsPageProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { subjectViews, activeSubjectView, setActiveViewKey } = useAdminView();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [pageLoading, setPageLoading] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);
  const [exportSuccess, setExportSuccess] = useState<string | null>(null);
  const [batchExporting, setBatchExporting] = useState(false);
  const [aiRefreshing, setAiRefreshing] = useState(false);
  const [reportGenerating, setReportGenerating] = useState(false);
  const [reportMaskText, setReportMaskText] = useState('正在生成班级 AI 报告，请稍候...');
  const [teacherReview, setTeacherReview] = useState<TeacherReviewContext | null>(null);
  const [teacherReviewLoading, setTeacherReviewLoading] = useState(false);

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

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const queryGrade = params.get('gradeName');
    const queryClassId = params.get('classId');
    const queryStartDate = params.get('startDate');
    const queryEndDate = params.get('endDate');

    if (queryGrade) setGradeFilter(queryGrade);
    if (queryClassId) setClassFilter(queryClassId);
    if (queryStartDate) setStartDate(queryStartDate);
    if (queryEndDate) setEndDate(queryEndDate);
  }, [location.search]);

  const teacherWorkbench = isTeacherWorkbenchRole(user?.roleCode);
  const isHomeroomTeacher = user?.roleCode === 'homeroom_teacher';
  const isSubjectTeacher = user?.roleCode === 'subject_teacher';
  const gradeOptions = useMemo(
    () => Array.from(new Set(classes.map((item) => item.gradeName).filter(Boolean))),
    [classes],
  );
  const classOptions = useMemo(
    () => classes.filter((item) => gradeFilter === 'all' || item.gradeName === gradeFilter),
    [classes, gradeFilter],
  );

  /** 任课教师：AI 与基于积分记录的图表仅统计当前所选学科（与顶部菜单一致） */
  const analyticsSubjectFilter = useMemo(() => {
    if (!teacherWorkbench || !isSubjectTeacher || !activeSubjectView || classFilter === 'all') return undefined;
    if (String(activeSubjectView.classId) !== classFilter) return undefined;
    return activeSubjectView.subjectCode;
  }, [teacherWorkbench, isSubjectTeacher, activeSubjectView, classFilter]);

  /** 教师工作台：默认班级与年级与数据范围对齐 */
  useEffect(() => {
    if (!teacherWorkbench || classes.length === 0) return;
    if (isSubjectTeacher && activeSubjectView) {
      const meta = classes.find((item) => item.id === activeSubjectView.classId);
      setClassFilter(String(activeSubjectView.classId));
      if (meta?.gradeName) setGradeFilter(meta.gradeName);
      return;
    }
    setClassFilter((prev) => {
      const nextPref =
        prev !== 'all' && classes.some((c) => String(c.id) === prev)
          ? prev
          : String(classes[0].id);
      const meta = classes.find((item) => String(item.id) === nextPref);
      if (meta?.gradeName) {
        setGradeFilter(meta.gradeName);
      }
      return nextPref;
    });
  }, [activeSubjectView, classes, isSubjectTeacher, teacherWorkbench]);

  useEffect(() => {
    if (classFilter === 'all') return;
    const exists = classOptions.some((item) => String(item.id) === classFilter);
    if (!exists) {
      if (teacherWorkbench && classOptions[0]) {
        const pivot = classOptions[0];
        setGradeFilter(pivot.gradeName || 'all');
        setClassFilter(String(pivot.id));
      } else if (teacherWorkbench && classes[0]) {
        setGradeFilter(classes[0].gradeName || 'all');
        setClassFilter(String(classes[0].id));
      } else {
        setClassFilter('all');
      }
    }
  }, [classFilter, classOptions, classes, teacherWorkbench]);

  /** 任课 / 班主任手动切换班级时，年级下拉与班级保持一致 */
  useEffect(() => {
    if (!teacherWorkbench || classFilter === 'all') return;
    const meta = classes.find((item) => String(item.id) === classFilter);
    if (!meta?.gradeName) return;
    setGradeFilter((previous) =>
      previous === meta.gradeName ? previous : meta.gradeName!,
    );
  }, [teacherWorkbench, classFilter, classes]);

  async function loadAnalytics(options?: {
    regenerateAi?: boolean;
    showGeneratingMask?: boolean;
    successMessage?: string;
  }) {
    if (classFilter === 'all') {
      if (teacherWorkbench) {
        setPageLoading(false);
        return;
      }
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
        const status = await adminApi.analyticsReportStatus(token, {
          classId: Number(classFilter),
          startDate,
          endDate,
          ...(analyticsSubjectFilter ? { subjectCode: analyticsSubjectFilter } : {}),
        });
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
        ...(analyticsSubjectFilter ? { subjectCode: analyticsSubjectFilter } : {}),
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
    if (teacherWorkbench && isSubjectTeacher) return;
    void loadAnalytics();
  }, [classFilter, gradeFilter, startDate, endDate, token, analyticsSubjectFilter, isSubjectTeacher, teacherWorkbench]);

  useEffect(() => {
    if (!teacherWorkbench || !isSubjectTeacher || !activeSubjectView) {
      setTeacherReview(null);
      setTeacherReviewLoading(false);
      return;
    }
    let active = true;
    setTeacherReviewLoading(true);
    setPageError(null);
    adminApi
      .teacherReviewContext(token, {
        classId: activeSubjectView.classId,
        subjectCode: activeSubjectView.subjectCode,
        startDate,
        endDate,
      })
      .then((response) => {
        if (!active) return;
        setTeacherReview(response.data);
      })
      .catch((err) => {
        if (!active) return;
        setTeacherReview(null);
        setPageError(err instanceof Error ? err.message : '教学复盘加载失败');
      })
      .finally(() => {
        if (active) setTeacherReviewLoading(false);
      });
    return () => {
      active = false;
    };
  }, [activeSubjectView, endDate, isSubjectTeacher, startDate, teacherWorkbench, token]);

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
  const aiPanelTitle = isGlobalOverview
    ? 'AI 全局概览'
    : isSubjectTeacher && analyticsSubjectFilter
      ? `AI · ${ruleSubjectLabelMap[analyticsSubjectFilter] ?? analyticsSubjectFilter}学科小结`
      : 'AI 班级报告';
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
  const analyticsDeskClassNumericId =
    teacherWorkbench &&
    classFilter !== 'all' &&
    Number.isFinite(Number(classFilter)) &&
    Number(classFilter) > 0
      ? Number(classFilter)
      : null;

  const reportSummaryText = aiInsight?.reportSummary?.trim() ?? '';
  const reportSentences = reportSummaryText
    .split(/[。！？]/)
    .map((item) => item.trim())
    .filter(Boolean);
  const reportLead = reportSentences[0] ?? '';
  const reportPoints = reportSentences.slice(1);
  const rawAiSummary = (aiInsight?.summary ?? '').trim();
  const summarySentences = useMemo(
    () =>
      rawAiSummary
        .split(/[。！？]/)
        .map((item) => item.trim())
        .filter(Boolean),
    [rawAiSummary],
  );
  const currentSubjectViewLabel = useMemo(() => {
    if (!isSubjectTeacher || !activeSubjectView) return '';
    const classInfo = classes.find((item) => item.id === activeSubjectView.classId);
    const subjectLabel = ruleSubjectLabelMap[activeSubjectView.subjectCode] ?? activeSubjectView.subjectCode;
    const classLabel = classInfo ? `${classInfo.gradeName} ${classInfo.name}` : `班级 #${activeSubjectView.classId}`;
    return `${classLabel} · ${subjectLabel}`;
  }, [activeSubjectView, classes, isSubjectTeacher]);
  const subjectContextCards = useMemo(
    () =>
      subjectViews.map((item) => {
        const classInfo = classes.find((row) => row.id === item.classId) ?? null;
        return {
          key: item.key,
          classLabel: classInfo ? `${classInfo.gradeName} ${classInfo.name}` : `班级 #${item.classId}`,
          subjectLabel: ruleSubjectLabelMap[item.subjectCode] ?? item.subjectCode,
          studentCount: students.filter((student) => student.classId === item.classId).length,
          isActive: activeSubjectView?.key === item.key,
        };
      }),
    [activeSubjectView?.key, classes, students, subjectViews],
  );
  const aiSuggestionSentences = useMemo(
    () =>
      (aiInsight?.suggestion ?? '')
        .split(/[。！？]/)
        .map((item) => item.trim())
        .filter(Boolean),
    [aiInsight?.suggestion],
  );
  const aiActionItems = aiSuggestionSentences.slice(0, 3);
  const homeroomReasoning = [
    summarySentences[1],
    reportPoints[0],
    reportPoints[1],
  ].filter(Boolean) as string[];
  const homeroomRiskFocus = riskStudents.slice(0, 3);
  const homeroomStrategyItems =
    aiActionItems.length > 0
      ? aiActionItems
      : [
          '先检查本周期负向事件和风险学生是否集中在同一批对象。',
          '结合最近一次考试快照，判断问题更偏行为还是偏学业。',
          '为重点学生设定 1 个可追踪的下周期小目标。',
        ];
  const homeroomEvidenceItems = useMemo(() => {
    const primaryReason = homeroomReasoning[0]
      ? compactReasonText(homeroomReasoning[0])
      : null;
    const coverageText =
      activeDays <= 2
        ? `记录覆盖：仅 ${activeDays} 天有积分记录，过程数据偏少。`
        : `记录覆盖：近 ${activeDays} 天有持续记录，可支持阶段判断。`;
    const riskText =
      homeroomRiskFocus.length > 0
        ? `风险聚焦：优先关注 ${homeroomRiskFocus.length} 名学生，先跟进${homeroomRiskFocus[0]?.studentName ?? '重点对象'}。`
        : '风险聚焦：当前没有集中爆发的高风险学生。';
    const signalText = primaryReason
      ? `热点归因：${primaryReason}`
      : positiveRuleCount > 0
        ? `热点归因：本周期累计正向事件 ${positiveRuleCount} 次，需结合负向聚集继续判断。`
        : '热点归因：当前行为侧信号偏弱，建议继续补充课堂记录。';

    return [coverageText, riskText, signalText];
  }, [activeDays, homeroomReasoning, homeroomRiskFocus, positiveRuleCount]);
  const currentHomeroomClass = useMemo(
    () =>
      classFilter !== 'all'
        ? classes.find((item) => String(item.id) === classFilter) ?? null
        : null,
    [classFilter, classes],
  );
  const homeroomReportPeriodLabel = useMemo(() => {
    const days = diffDaysInclusive(startDate, endDate);
    if (days <= 8) return '周报';
    if (days <= 31) return '阶段简报';
    return '周期复盘';
  }, [endDate, startDate]);
  const homeroomConclusionTitle = useMemo(() => {
    if (homeroomReportPeriodLabel === '周报') return '本周结论';
    if (homeroomReportPeriodLabel === '阶段简报') return '本阶段结论';
    return '本周期结论';
  }, [homeroomReportPeriodLabel]);
  const fallbackHomeroomConclusion = useMemo(() => {
    const classLabel = currentHomeroomClass
      ? `${currentHomeroomClass.gradeName} ${currentHomeroomClass.name}`
      : '当前班级';
    const signalBalance =
      homeroomRiskFocus.length >= 3
        ? '近期波动偏明显'
        : positiveRuleCount >= Math.max(activeDays, 1)
          ? '整体表现偏稳'
          : '班级状态处于拉锯';
    const riskLead = homeroomRiskFocus[0];
    const riskText = homeroomRiskFocus.length
      ? `当前需优先关注 ${homeroomRiskFocus.length} 名学生，首先建议跟进${riskLead?.studentName ?? '重点对象'}。`
      : '当前没有明显聚集的高风险学生，可继续按日常节奏追踪。';
    return `${classLabel} 在 ${startDate} 至 ${endDate} 这段时间里${signalBalance}，累计正向事件 ${positiveRuleCount} 次、活跃记录覆盖 ${activeDays} 天。${riskText}`;
  }, [
    activeDays,
    currentHomeroomClass,
    endDate,
    homeroomRiskFocus,
    positiveRuleCount,
    startDate,
  ]);
  const homeroomConclusion = useMemo(() => {
    const first = summarySentences[0] ?? reportLead ?? '';
    const weak =
      !first ||
      first.length < 18 ||
      /^统计范围/.test(first) ||
      /^统计周期/.test(first) ||
      /^当前/.test(first);
    if (weak) return fallbackHomeroomConclusion;
    const extra =
      summarySentences[1] && !summarySentences[1].includes('统计')
        ? ` ${summarySentences[1]}`
        : '';
    return `${first}${extra}`;
  }, [fallbackHomeroomConclusion, reportLead, summarySentences]);
  const homeroomWeeklyReport = useMemo(() => {
    const classLabel = currentHomeroomClass
      ? `${currentHomeroomClass.gradeName} ${currentHomeroomClass.name}`
      : '当前班级';
    return {
      title: `${classLabel} 班主任${homeroomReportPeriodLabel}`,
      meta: `统计周期：${startDate} 至 ${endDate}`,
    };
  }, [
    currentHomeroomClass,
    endDate,
    homeroomReportPeriodLabel,
    startDate,
  ]);
  const analyticsRiskHighlights = useMemo(() => riskStudents.slice(0, 3), [riskStudents]);
  const analyticsAiActionChecklist = useMemo(() => {
    if (!teacherWorkbench || !isSubjectTeacher) return [];

    const items: Array<{
      id: string;
      title: string;
      detail: string;
      actionLabel: string;
      action: () => void;
      badge?: string;
    }> = [];

    if (analyticsRiskHighlights[0]) {
      const student = analyticsRiskHighlights[0];
      items.push({
        id: `risk-${student.studentId}`,
        title: `优先跟进 ${student.studentName}`,
        detail: `${student.className} 近期负向 ${student.negativeCount} 次，净变化 ${student.scoreDelta}。建议先查看学生档案与最近记录。`,
        actionLabel: '查看学生',
        action: () => openRiskStudent(student.studentId),
        badge: student.riskLevel === 'high' ? '高风险' : student.riskLevel === 'medium' ? '中风险' : '低风险',
      });
    }

    if (aiActionItems[0]) {
      items.push({
        id: 'ai-suggestion-primary',
        title: '落实一条 AI 建议动作',
        detail: aiActionItems[0],
        actionLabel: '去学科评价',
        action: () => navigate('/evaluation'),
        badge: 'AI',
      });
    }

    if (aiActionItems[1]) {
      items.push({
        id: 'ai-suggestion-secondary',
        title: '补做一项 AI 建议动作',
        detail: aiActionItems[1],
        actionLabel: '刷新 AI',
        action: () => void handleRegenerateAiReport(),
        badge: 'AI',
      });
    }

    return items.slice(0, 4);
  }, [
    aiActionItems,
    analyticsRiskHighlights,
    isSubjectTeacher,
    navigate,
    teacherWorkbench,
  ]);
  const activeQuickRange = useMemo(() => {
    const monthStart = `${today.slice(0, 8)}01`;
    const quick7dStart = shiftDate(today, -6);
    const quick30dStart = shiftDate(today, -29);
    if (endDate === today) {
      if (startDate === quick7dStart) return '7d';
      if (startDate === quick30dStart) return '30d';
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

  function diffDaysInclusive(start: string, end: string) {
    const startMs = new Date(`${start}T00:00:00`).getTime();
    const endMs = new Date(`${end}T00:00:00`).getTime();
    return Math.max(1, Math.round((endMs - startMs) / (24 * 60 * 60 * 1000)) + 1);
  }

  function compactReasonText(text: string, maxLength = 34) {
    const cleaned = text
      .replace(/^归因[^：:]*[:：]\s*/, '')
      .replace(/^形成原因[^：:]*[:：]\s*/, '')
      .replace(/^补充说明[^：:]*[:：]\s*/, '')
      .trim();
    if (cleaned.length <= maxLength) return cleaned;
    return `${cleaned.slice(0, maxLength).trim()}...`;
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
    if (isSubjectTeacher && activeSubjectView) {
      params.set('classId', String(activeSubjectView.classId));
    } else if (classFilter !== 'all') {
      params.set('classId', classFilter);
    }
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

  function openInsightsDeskScores(payload: {
    tab?: string;
    examId?: number;
    classId?: number;
    studentId?: number;
  }) {
    if (classFilter === 'all') return;
    const params = new URLSearchParams();
    params.set('tab', payload.tab ?? 'scores');
    params.set('classId', String(payload.classId ?? classFilter));
    if (payload.examId !== undefined)
      params.set('examId', String(payload.examId));
    if (payload.studentId !== undefined)
      params.set('studentId', String(payload.studentId));
    params.set('returnTo', buildAnalyticsReturnTo());
    params.set(
      'returnLabel',
      user?.roleCode === 'homeroom_teacher'
        ? '返回班级概览'
        : user?.roleCode === 'subject_teacher'
          ? '返回教学概览'
          : '返回数据分析',
    );
    navigate(`/students?${params.toString()}`);
  }

  function openDashboardWorkbench() {
    navigate('/dashboard');
  }

  async function handleRegenerateAiReport() {
    if (aiRefreshing) return;
    setExportSuccess(null);
    if (teacherWorkbench && isSubjectTeacher && activeSubjectView) {
      setAiRefreshing(true);
      setPageError(null);
      try {
        const response = await adminApi.teacherReviewContext(token, {
          classId: activeSubjectView.classId,
          subjectCode: activeSubjectView.subjectCode,
          startDate,
          endDate,
          regenerateAi: true,
        });
        setTeacherReview(response.data);
        setExportSuccess('教学复盘 AI 已重新生成');
      } catch (err) {
        setPageError(err instanceof Error ? err.message : '教学复盘 AI 重新生成失败');
      } finally {
        setAiRefreshing(false);
      }
      return;
    }
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

  const analyticsPageTitle =
    teacherWorkbench && user?.roleCode === 'homeroom_teacher'
      ? '班级概览'
      : teacherWorkbench
        ? isSubjectTeacher
          ? '教学复盘'
          : '教学概览'
        : '数据分析';

  return (
    <Shell
      title={analyticsPageTitle}
      subtitle={
        teacherWorkbench
          ? isHomeroomTeacher
            ? '周期复盘：这里看近7/30天的班级变化、重点风险和 AI 策略；最近一次考试快照作为补充专题，不随日期变化。'
            : '上面的日期用来统计积分与图表；成绩单式的学业快照在工作台查看、不按这里的日期变化。同一班级、同一日期范围内的 AI 小结会自动沿用近期生成的结果，需要更新时点「重新生成」。'
          : '围绕学期、年级、班级与行为维度提供学校汇报级分析视图'
      }
      user={user}
      status={
        <>
          {loading || pageLoading || teacherReviewLoading ? <div className="status-card">分析数据加载中...</div> : null}
          {error ? <div className="status-card error">{error}</div> : null}
          {pageError ? <div className="status-card error">{pageError}</div> : null}
          {exportSuccess ? <div className="status-card success">{exportSuccess}</div> : null}
        </>
      }
    >
      <div className="page-header">
        <h2>{analyticsPageTitle}</h2>
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
            {!teacherWorkbench ? <option value="all">全部年级</option> : null}
            {gradeOptions.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          {!isSubjectTeacher ? (
            <select className="filter-select" value={classFilter} onChange={(event) => setClassFilter(event.target.value)}>
              {!teacherWorkbench ? <option value="all">全部班级</option> : null}
              {classOptions.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          ) : null}
          {!teacherWorkbench ? (
            <>
              <button className="btn btn-outline" type="button" onClick={openPresentationMode}>
                进入汇报模式
              </button>
              <button
                className="btn btn-outline"
                type="button"
                onClick={() => void handleBatchExportClassSummaries()}
                disabled={batchExporting}
              >
                {batchExporting ? '批量导出中...' : '批量导出班级摘要'}
              </button>
            </>
          ) : null}
          {!isSubjectTeacher ? (
            <>
              {teacherWorkbench ? (
                <button className="btn btn-outline" type="button" onClick={openDashboardWorkbench}>
                  回到今日待办
                </button>
              ) : null}
              <button className="btn btn-outline" type="button" onClick={handleExportSummary}>
                {isGlobalOverview ? '导出全局概览' : '导出汇报摘要'}
              </button>
              <button className="btn btn-outline" type="button" onClick={handleExportReport}>导出报表</button>
            </>
          ) : null}
        </div>
      </div>
      {teacherWorkbench && isSubjectTeacher ? (
        <>
          <div className="teacher-hero-card">
            <div className="teacher-hero-main">
              <span className="teacher-hero-kicker">当前复盘</span>
              <h3>{currentSubjectViewLabel || '请在顶部选择班级与学科'}</h3>
              <p>
                教学复盘只围绕<strong>当前所选班级与学科</strong>展开，回答这段时间发生了什么、风险在哪里、下一阶段该怎么调。
              </p>
              <div className="teacher-hero-actions">
                <button
                  type="button"
                  className="toolbar-button"
                  onClick={() =>
                    openInsightsDeskScores({
                      tab: 'scores',
                      classId: analyticsDeskClassNumericId ?? undefined,
                    })
                  }
                >
                  查看当前班学生
                </button>
                <button
                  type="button"
                  className="ghost-button"
                  onClick={() => navigate('/evaluation')}
                >
                  去学科评价
                </button>
                <button
                  type="button"
                  className="ghost-button"
                  onClick={() => void handleRegenerateAiReport()}
                  disabled={aiRefreshing}
                >
                  {aiRefreshing ? 'AI 重算中...' : '刷新 AI 复盘'}
                </button>
              </div>
            </div>
            <div className="teacher-hero-aside">
              <div className="teacher-hero-stat">
                <span>覆盖学生</span>
                <strong>{teacherReview?.summaryKpis.coveredStudents ?? 0}</strong>
              </div>
              <div className="teacher-hero-stat">
                <span>风险学生</span>
                <strong>{teacherReview?.summaryKpis.riskStudentCount ?? 0}</strong>
              </div>
              <div className="teacher-hero-stat">
                <span>活跃天数</span>
                <strong>{teacherReview?.summaryKpis.activeDays ?? 0}</strong>
              </div>
            </div>
          </div>

          <div className="analytics-summary">
            <div className="a-summary-card">
              <div className="a-s-icon">◫</div>
              <div className="a-s-label">评价事件数</div>
              <div className="a-s-value">{teacherReview?.summaryKpis.totalEvents ?? 0}</div>
              <div className="a-s-sub">当前班级当前学科在所选区间的总记录</div>
            </div>
            <div className="a-summary-card">
              <div className="a-s-icon">✓</div>
              <div className="a-s-label">正向事件</div>
              <div className="a-s-value">{teacherReview?.summaryKpis.positiveCount ?? 0}</div>
              <div className="a-s-sub">用于判断本学科课堂正向反馈密度</div>
            </div>
            <div className="a-summary-card">
              <div className="a-s-icon">!</div>
              <div className="a-s-label">负向事件</div>
              <div className="a-s-value">{teacherReview?.summaryKpis.negativeCount ?? 0}</div>
              <div className="a-s-sub">用于识别课堂问题是否持续聚集</div>
            </div>
            <div className="a-summary-card">
              <div className="a-s-icon">◌</div>
              <div className="a-s-label">活跃天数</div>
              <div className="a-s-value">{teacherReview?.summaryKpis.activeDays ?? 0}</div>
              <div className="a-s-sub">说明这段时间真实留下了多少课堂过程记录</div>
            </div>
          </div>

          <div className="row-2 c50">
            <div className="analytics-chart-panel">
              <div className="acp-title">AI 复盘结论</div>
              <div className="analytics-ai-card analytics-ai-card-soft">
                <p>{teacherReview?.aiRetrospective.conclusion ?? '暂无 AI 复盘结论，可先积累更多课堂记录后再看。'}</p>
              </div>
              <div className="analytics-report-card">
                <div className="analytics-report-lead">
                  {teacherReview?.aiRetrospective.problemAnalysis ?? 'AI 正在等待更多课堂与学业数据，以形成更稳定的问题归因。'}
                </div>
                {(teacherReview?.aiRetrospective.basis.length ?? 0) > 0 ? (
                  <ul className="analytics-report-points">
                    {teacherReview?.aiRetrospective.basis.map((item, index) => (
                      <li key={`${index}-${item}`}>{item}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </div>
            <div className="analytics-chart-panel">
              <div className="acp-title">下阶段建议</div>
              <div className="mini-list">
                {(teacherReview?.recommendedAdjustments ?? []).map((item, index) => (
                  <div className="mini-list-item" key={`${index}-${item}`}>
                    <div>
                      <strong>建议 {index + 1}</strong>
                      <span>{item}</span>
                    </div>
                    <b>AI</b>
                  </div>
                ))}
                {(teacherReview?.recommendedAdjustments.length ?? 0) === 0 ? (
                  <div className="mini-list-item">
                    <div>
                      <strong>建议待生成</strong>
                      <span>暂时还没有可用的复盘建议，可先积累更多课堂记录或稍后重试。</span>
                    </div>
                    <b>待补</b>
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          <div className="row-2 c50">
            <div className="analytics-chart-panel">
              <div className="acp-title">日趋势</div>
              <div className="bar-chart">
                {(teacherReview?.trendSlices.dailyTrend ?? []).map((item) => (
                  <div className="bar-row" key={item.date}>
                    <span className="bar-label analytics-label">{item.date.slice(5)}</span>
                    <div className="bar-track">
                      <div
                        className="bar-fill bar-blue"
                        style={{
                          width: `${Math.max(
                            28,
                            Math.round(
                              (item.total /
                                Math.max(
                                  ...(teacherReview?.trendSlices.dailyTrend.map((row) => row.total) ?? [1]),
                                  1,
                                )) *
                                100,
                            ),
                          )}%`,
                        }}
                      >
                        {item.total}
                      </div>
                    </div>
                    <span className="bar-val">
                      +{item.positive} / -{item.negative}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className="analytics-chart-panel">
              <div className="acp-title">区间风险学生</div>
              <div className="analytics-risk-list">
                {(teacherReview?.riskStudents ?? []).slice(0, 4).map((item) => (
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
                {(teacherReview?.riskStudents.length ?? 0) === 0 ? (
                  <div className="analytics-risk-item empty">
                    <div>
                      <strong>当前上下文暂无明显风险学生</strong>
                      <span>AI 暂未发现负向事件明显聚集的学生，可继续关注课堂评价与学业变化。</span>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          <div className="analytics-chart-panel">
            <div className="acp-title">策略调整建议</div>
            <div className="bar-chart">
              {(teacherReview?.trendSlices.dimensionDistribution ?? []).map((item, index, list) => (
                <div className="bar-row" key={item.name}>
                  <span className="bar-label analytics-label">{item.name}</span>
                  <div className="bar-track">
                    <div
                      className={`bar-fill ${index % 3 === 0 ? 'bar-blue' : index % 3 === 1 ? 'bar-green' : 'bar-red'}`}
                      style={{ width: `${Math.max(28, Math.round((item.value / Math.max(...list.map((row) => row.value), 1)) * 100))}%` }}
                    >
                      {item.value}
                    </div>
                  </div>
                  <span className="bar-val">次</span>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : null}
      {teacherWorkbench && classFilter !== 'all' ? (
        <div className="analytics-chart-panel analytics-academic-promo-panel">
          <div className="acp-title">{isHomeroomTeacher ? '学业专题卡' : '教务学业快照（在工作台）'}</div>
          <div className="analytics-academic-promo-body">
            <p>
              最近一次归档成绩、联考对标与成绩单链路由<strong>工作台学业快照区块</strong>承载；
              <strong>不受本页上方日期区间筛选影响</strong>。
              {isHomeroomTeacher
                ? ' 这里把它当作复盘补充视角，用来判断本周期问题更偏行为还是偏学业。'
                : ' 下方 KPI、图表与 AI 摘要仍按所选区间统计积分类指标。'}
            </p>
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => navigate('/dashboard#teacher-academic-snapshot')}
            >
              前往工作台学业快照
            </button>
          </div>
        </div>
      ) : null}
      {!isSubjectTeacher ? (
        <>
      <div className="analytics-summary">
        <div className="a-summary-card">
          <div className="a-s-icon">◫</div>
          <div className="a-s-label">{isHomeroomTeacher ? '本周期总积分' : '本学期总积分'}</div>
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
        {isHomeroomTeacher ? (
          <div className="analytics-chart-panel homeroom-weekly-report-panel">
            <div className="analytics-ai-card-head">
              <div>
                <div className="acp-title">AI 班主任{homeroomReportPeriodLabel}</div>
                <div className="analytics-ai-meta">
                  {homeroomWeeklyReport.title}
                  {` · ${homeroomWeeklyReport.meta}`}
                  {aiInsight?.generatedAt ? ` · 生成时间：${new Date(aiInsight.generatedAt).toLocaleString('zh-CN')}` : ''}
                </div>
              </div>
              <button className="btn btn-outline" type="button" onClick={() => void handleRegenerateAiReport()} disabled={aiRefreshing}>
                {aiRefreshing ? '重新生成中...' : `刷新${homeroomReportPeriodLabel}`}
              </button>
            </div>
            <div className="homeroom-weekly-report-grid">
              <div className="teacher-draft-card homeroom-weekly-report-conclusion">
                <div className="panel-title compact">{homeroomConclusionTitle}</div>
                <p>{homeroomConclusion}</p>
                <div className="mini-list" style={{ marginTop: 14 }}>
                  {homeroomEvidenceItems.slice(0, 2).map((item, index) => (
                    <div className="mini-list-item" key={item}>
                      <div>
                        <strong>{`补充依据 ${index + 1}`}</strong>
                        <span>{item}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="teacher-draft-card">
                <div className="panel-title compact">形成原因</div>
                <div className="mini-list">
                  {homeroomEvidenceItems.map((item, index) => (
                    <div className="mini-list-item" key={item}>
                      <div>
                        <strong>{`依据 ${index + 1}`}</strong>
                        <span>{item}</span>
                      </div>
                    </div>
                  ))}
                  {homeroomEvidenceItems.length === 0 ? (
                    <div className="mini-list-item">
                      <div>
                        <strong>待补充</strong>
                        <span>当前 AI 还没有形成稳定归因，建议继续积累评价记录。</span>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
              <div className="teacher-draft-card">
                <div className="panel-title compact">重点风险</div>
                <div className="mini-list">
                  {homeroomRiskFocus.map((item) => (
                    <div className="mini-list-item" key={item.studentId}>
                      <div>
                        <strong>{item.studentName}</strong>
                        <span>{item.className} · 负向 {item.negativeCount} 次 · {item.reason}</span>
                      </div>
                    </div>
                  ))}
                  {homeroomRiskFocus.length === 0 ? (
                    <div className="mini-list-item">
                      <div>
                        <strong>暂无高优先级风险</strong>
                        <span>本周期没有明显聚集的风险对象，可继续关注常规波动。</span>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
              <div className="teacher-draft-card">
                <div className="panel-title compact">下周期策略</div>
                <div className="mini-list">
                  {homeroomStrategyItems.map((item, index) => (
                    <div className="mini-list-item" key={`${index}-${item}`}>
                      <div>
                        <strong>策略 {index + 1}</strong>
                        <span>{item}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
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
                {aiInsight ? ` · ${aiInsight.isCached ? '沿用近期已生成的小结' : '本次新生成的小结'}` : ''}
              </div>
              <p>{aiInsight?.summary ?? '当前筛选范围暂无 AI 洞察。'}</p>
            </div>
            <div className="analytics-ai-card analytics-ai-card-soft">
              <div className="acp-title">建议动作</div>
              <p>{aiInsight?.suggestion ?? '当前筛选范围暂无建议。'}</p>
            </div>
          </>
        )}
      </div>
      {isHomeroomTeacher ? (
        <div className="row-2 c50">
          <div className="analytics-chart-panel homeroom-overview-analysis-panel">
            <div className="acp-title">周报附录：原因证据</div>
            <div className="mini-list">
              {homeroomReasoning.map((item) => (
                <div className="mini-list-item" key={item}>
                  <div>
                    <strong>形成原因</strong>
                    <span>{item}</span>
                  </div>
                </div>
              ))}
              {homeroomReasoning.length === 0 ? (
                <div className="mini-list-item">
                  <div>
                    <strong>原因待补充</strong>
                    <span>当前 AI 还没有给出稳定归因，可结合下方分布与风险学生继续判断。</span>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
          <div className="analytics-chart-panel homeroom-overview-risk-panel">
            <div className="acp-title">周报附录：重点学生详情</div>
            <div className="analytics-risk-list">
              {homeroomRiskFocus.map((item) => (
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
              {homeroomRiskFocus.length === 0 ? (
                <div className="analytics-risk-item empty">
                  <div>
                    <strong>当前暂无明显风险学生</strong>
                    <span>本周期暂未发现负向事件持续聚集的学生，可继续结合趋势和学业专题卡观察。</span>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : (
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
      )}
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
          {isHomeroomTeacher ? (
            <>
              <div className="acp-title">下周期建议动作</div>
              <div className="mini-list">
                {homeroomStrategyItems.map((item, index) => (
                  <div className="mini-list-item" key={`${index}-${item}`}>
                    <div>
                      <strong>建议 {index + 1}</strong>
                      <span>{item}</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <>
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
            </>
          )}
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
        </>
      ) : null}
    </Shell>
  );
}

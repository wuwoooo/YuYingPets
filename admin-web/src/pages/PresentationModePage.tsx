import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import presentationLogo from '../assets/presentation-logo.svg';
import { PresentationGlyph } from '../components/PresentationGlyph';
import { PresentationFullscreenButton } from '../components/PresentationFullscreenButton';
import { PresentationHero3D } from '../components/PresentationHero3D';
import '../presentation.css';
import type { 
  AcademicExamListItem,
  AcademicScoreListRow,
  AnalyticsData,
  DisplayWeatherPayload,
  DisplayTerminal,
  HonorRecord,
  ScoreRecord,
  StudentImportPayload
} from '../lib/api';
import { adminApi } from '../lib/api';
import { useCurrentSemesterName } from '../hooks/useCurrentSemesterName';
import { buildAcademicGrowthSummary } from '../utils/academicGrowth';
import { canManageDisplays } from '../utils/adminPermissions';
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
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const aiSummaryListRef = useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [clockText] = useState(() =>
    new Intl.DateTimeFormat('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).format(new Date()),
  );
  const user = liveUser;
  const classes = liveClasses;
  const students = liveStudents;
  const rules = liveRules;
  const honors = liveHonors;
  const rewards = liveRewards;
  const [isActive, setIsActive] = useState(false);
  const [curtainOpen, setCurtainOpen] = useState(false);
  const [barsExpanded, setBarsExpanded] = useState(false);
  const [extendedBarsExpanded, setExtendedBarsExpanded] = useState(false);
  const [lineAnimated, setLineAnimated] = useState(false);
  const [tickerVisible, setTickerVisible] = useState(false);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [mapCenter, setMapCenter] = useState({ city: '未设置城市', lat: 25.651, lng: 100.173, source: '默认坐标' });
  const [displayTerminals, setDisplayTerminals] = useState<DisplayTerminal[]>([]);
  const [scoreRecords, setScoreRecords] = useState<ScoreRecord[]>([]);
  const [honorRecords, setHonorRecords] = useState<HonorRecord[]>([]);
  const [weatherInfo, setWeatherInfo] = useState<DisplayWeatherPayload | null>(null);
  const [academicExams, setAcademicExams] = useState<AcademicExamListItem[]>([]);
  const [academicScores, setAcademicScores] = useState<AcademicScoreListRow[]>([]);
  const currentSemesterName = useCurrentSemesterName(token, user?.roleCode);
  const gradeFilter = searchParams.get('gradeName') || 'all';
  const classFilter = searchParams.get('classId') || 'all';
  const returnTo = searchParams.get('returnTo');
  const studentById = useMemo(() => new Map(students.map((item) => [item.id, item])), [students]);
  const classById = useMemo(() => new Map(classes.map((item) => [item.id, item])), [classes]);

  const totalScore = students.reduce((sum, item) => sum + item.currentScore, 0);
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
      window.setTimeout(() => setBarsExpanded(true), 800),
      window.setTimeout(() => setLineAnimated(true), 1200),
      window.setTimeout(() => setExtendedBarsExpanded(true), 1600),
      window.setTimeout(() => setTickerVisible(true), 2000),
    ];

    let frame = 0;
    let startTime = 0;
    let lastRenderedAt = 0;
    const animateMetrics = (ts: number) => {
      if (!startTime) startTime = ts;
      const progress = Math.min((ts - startTime) / 2200, 1);
      const ease = 1 - Math.pow(1 - progress, 4);
      if (ts - lastRenderedAt >= 80 || progress === 1) {
        lastRenderedAt = ts;
        setMetricDisplayValues([
          Math.floor(metricTargets[0] * ease).toLocaleString('zh-CN'),
          `${Math.floor(metricTargets[1] * ease)}`,
          `${Math.floor(metricTargets[2] * ease)}`,
          `${Math.floor(metricTargets[3] * ease)}`,
          `${Math.floor(metricTargets[4] * ease)}`,
          `Lv.${(metricTargets[5] * ease).toFixed(1)}`,
        ]);
      }
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
    const query = {
      ...(gradeFilter !== 'all' ? { gradeName: gradeFilter } : {}),
      ...(classFilter !== 'all' ? { classId: Number(classFilter) } : {}),
      skipDetailSummary: true,
    };
    Promise.allSettled([
      adminApi.analyticsSummary(token, query),
      adminApi.analyticsAi(token, query),
    ])
      .then(([summaryResult, aiResult]) => {
        if (!active) return;
        if (summaryResult.status !== 'fulfilled') {
          setAnalytics(null);
          return;
        }
        setAnalytics({
          ...summaryResult.value.data,
          aiInsight: aiResult.status === 'fulfilled' ? aiResult.value.data.aiInsight : undefined,
        });
      })
      .catch(() => {
        if (!active) return;
        setAnalytics(null);
      });
    return () => {
      active = false;
    };
  }, [classFilter, gradeFilter, token]);

  useEffect(() => {
    const node = aiSummaryListRef.current;
    if (!node) return;

    let dragging = false;
    let startY = 0;
    let startScrollTop = 0;

    const handlePointerDown = (event: PointerEvent) => {
      if (event.pointerType === 'mouse' && event.button !== 0) return;
      dragging = true;
      startY = event.clientY;
      startScrollTop = node.scrollTop;
      node.classList.add('is-dragging');
      node.setPointerCapture?.(event.pointerId);
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (!dragging) return;
      const deltaY = event.clientY - startY;
      node.scrollTop = startScrollTop - deltaY;
    };

    const stopDragging = (event?: PointerEvent) => {
      if (!dragging) return;
      dragging = false;
      node.classList.remove('is-dragging');
      if (event) node.releasePointerCapture?.(event.pointerId);
    };
    const handleLostPointerCapture = () => stopDragging();

    node.addEventListener('pointerdown', handlePointerDown);
    node.addEventListener('pointermove', handlePointerMove);
    node.addEventListener('pointerup', stopDragging);
    node.addEventListener('pointercancel', stopDragging);
    node.addEventListener('lostpointercapture', handleLostPointerCapture);

    return () => {
      node.removeEventListener('pointerdown', handlePointerDown);
      node.removeEventListener('pointermove', handlePointerMove);
      node.removeEventListener('pointerup', stopDragging);
      node.removeEventListener('pointercancel', stopDragging);
      node.removeEventListener('lostpointercapture', handleLostPointerCapture);
    };
  }, []);

  useEffect(() => {
    let active = true;
    adminApi
      .displaySettings(token)
      .then((response) => {
        if (!active) return;
        const lat = Number(response.data.weatherLatitude);
        const lng = Number(response.data.weatherLongitude);
        setMapCenter({
          city: response.data.weatherLabel?.trim() || '未设置城市',
          lat: Number.isFinite(lat) ? Number(lat.toFixed(4)) : 25.651,
          lng: Number.isFinite(lng) ? Number(lng.toFixed(4)) : 100.173,
          source: Number.isFinite(lat) && Number.isFinite(lng) ? '系统经纬度' : '默认坐标',
        });
      })
      .catch(() => {
        if (!active) return;
      });
    return () => {
      active = false;
    };
  }, [token]);

  useEffect(() => {
    let active = true;
    adminApi
      .displayWeather(token, {
        latitude: mapCenter.lat,
        longitude: mapCenter.lng,
        label: mapCenter.city,
      })
      .then((response) => {
        if (!active) return;
        setWeatherInfo(response.data);
      })
      .catch(() => {
        if (!active) return;
        setWeatherInfo(null);
      });
    return () => {
      active = false;
    };
  }, [mapCenter.city, mapCenter.lat, mapCenter.lng, token]);

  useEffect(() => {
    const AMapLib = (window as unknown as { AMap?: any }).AMap;
    if (!AMapLib || !mapContainerRef.current) return;
    const center: [number, number] = [mapCenter.lng, mapCenter.lat];
    if (!mapInstanceRef.current) {
      const map = new AMapLib.Map(mapContainerRef.current, {
        viewMode: '2D',
        zoom: 11,
        center,
        mapStyle: 'amap://styles/dark',
        dragEnable: false,
        zoomEnable: false,
        doubleClickZoom: false,
        keyboardEnable: false,
        scrollWheel: false,
        touchZoom: false,
        rotateEnable: false,
        pitchEnable: false,
      });
      new AMapLib.Marker({
        position: center,
        map,
      });
      mapInstanceRef.current = map;
      return;
    }
    mapInstanceRef.current.setCenter(center);
  }, [mapCenter]);

  useEffect(
    () => () => {
      if (!mapInstanceRef.current) return;
      mapInstanceRef.current.destroy();
      mapInstanceRef.current = null;
    },
    [],
  );

  useEffect(() => {
    if (!canManageDisplays(user?.roleCode)) {
      setDisplayTerminals([]);
      return;
    }
    let active = true;
    adminApi
      .displayTerminals(token)
      .then((response) => {
        if (!active) return;
        setDisplayTerminals(response.data);
      })
      .catch(() => {
        if (!active) return;
        setDisplayTerminals([]);
      });
    return () => {
      active = false;
    };
  }, [token, user?.roleCode]);

  useEffect(() => {
    let active = true;
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 13);
    const formatDate = (value: Date) => value.toISOString().slice(0, 10);
    adminApi
      .scoreRecords(token, { startDate: formatDate(startDate), endDate: formatDate(endDate) })
      .then((response) => {
        if (!active) return;
        setScoreRecords(
          response.data
            .slice()
            .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()),
        );
      })
      .catch(() => {
        if (!active) return;
        setScoreRecords([]);
      });
    return () => {
      active = false;
    };
  }, [token]);

  useEffect(() => {
    let active = true;
    adminApi
      .honorRecords(token)
      .then((response) => {
        if (!active) return;
        setHonorRecords(
          response.data
            .slice()
            .sort((left, right) => new Date(right.grantedAt).getTime() - new Date(left.grantedAt).getTime()),
        );
      })
      .catch(() => {
        if (!active) return;
        setHonorRecords([]);
      });
    return () => {
      active = false;
    };
  }, [token]);

  useEffect(() => {
    let active = true;
    Promise.all([
      adminApi.academicExams(token, { currentSemesterOnly: true }),
      adminApi.academicScores(token, { includeSubjects: true, currentSemesterOnly: true, recentExamLimit: 2 }),
    ])
      .then(([examsResponse, scoresResponse]) => {
        if (!active) return;
        setAcademicExams(examsResponse.data);
        setAcademicScores(scoresResponse.data);
      })
      .catch(() => {
        if (!active) return;
        setAcademicExams([]);
        setAcademicScores([]);
      });
    return () => {
      active = false;
    };
  }, [token]);

  const heroMetrics = [
    { label: '全校总积分', value: metricDisplayValues[0], sub: '较上周 +12.5%', theme: 'blue', glow: 'blue-glow', icon: 'chart' as const },
    { label: '活跃班级', value: metricDisplayValues[1], sub: `共 ${classes.length} 班 · ${classes.length ? ((activeClasses / classes.length) * 100).toFixed(1) : '0.0'}% 参与`, theme: 'green', glow: 'green-glow', icon: 'school' as const },
    { label: '活跃学生', value: metricDisplayValues[2], sub: `共 ${students.length} 人 · 学生成长在线`, theme: 'purple', glow: 'purple-glow', icon: 'student' as const },
    { label: '本周正向行为', value: metricDisplayValues[3], sub: '规则模型估算 +8.3%', theme: 'red', glow: 'red-glow', icon: 'fire' as const },
    { label: '勋章发放', value: metricDisplayValues[4], sub: '本月累计授予次数', theme: 'gold', glow: 'gold-glow', icon: 'medal' as const },
    { label: '平均成长等级', value: metricDisplayValues[5], sub: '较上月 +0.3', theme: 'teal', glow: 'teal-glow', icon: 'paw' as const },
  ] as const;

  const academicGrowth = useMemo(
    () => buildAcademicGrowthSummary(academicExams, academicScores, classes, students),
    [academicExams, academicScores, classes, students],
  );
  const academicSubjectSummaries = useMemo(() => {
    if (!academicGrowth.latestExam) return [];
    const totalRows = academicScores.filter(
      (row) => row.examId === academicGrowth.latestExam?.id && row.totalScore !== null && (!row.subjectCode || row.subjectCode === 'total'),
    );
    const totalByStudent = new Map(totalRows.map((row) => [row.studentId, row.totalScore ?? 0]));
    const totalAverage = totalRows.length
      ? totalRows.reduce((sum, row) => sum + (row.totalScore ?? 0), 0) / totalRows.length
      : academicGrowth.averageScore;
    const correlation = (pairs: Array<{ subject: number; total: number }>) => {
      if (pairs.length < 2) return 0;
      const subjectAvg = pairs.reduce((sum, item) => sum + item.subject, 0) / pairs.length;
      const totalAvg = pairs.reduce((sum, item) => sum + item.total, 0) / pairs.length;
      const numerator = pairs.reduce((sum, item) => sum + (item.subject - subjectAvg) * (item.total - totalAvg), 0);
      const subjectVariance = pairs.reduce((sum, item) => sum + Math.pow(item.subject - subjectAvg, 2), 0);
      const totalVariance = pairs.reduce((sum, item) => sum + Math.pow(item.total - totalAvg, 2), 0);
      const denominator = Math.sqrt(subjectVariance * totalVariance);
      return denominator ? numerator / denominator : 0;
    };
    const subjectRows = academicScores.filter(
      (row) => row.examId === academicGrowth.latestExam?.id && row.totalScore !== null && row.subjectCode && row.subjectCode !== 'total',
    );
    const grouped = subjectRows.reduce((map, row) => {
      const key = row.subjectCode ?? row.subjectName ?? 'unknown';
      const current = map.get(key) ?? {
        subjectCode: key,
        subjectName: row.subjectName ?? row.subjectCode ?? '未知科目',
        values: [] as number[],
        classMap: new Map<number, number[]>(),
      };
      if (row.totalScore !== null) {
        current.values.push(row.totalScore);
        const classValues = current.classMap.get(row.classId) ?? [];
        classValues.push(row.totalScore);
        current.classMap.set(row.classId, classValues);
      }
      map.set(key, current);
      return map;
    }, new Map<string, { subjectCode: string; subjectName: string; values: number[]; classMap: Map<number, number[]> }>());
    return Array.from(grouped.values())
      .map((item) => {
        const averageScore = item.values.length ? item.values.reduce((sum, value) => sum + value, 0) / item.values.length : 0;
        const classAverages = Array.from(item.classMap.values()).map((values) => values.reduce((sum, value) => sum + value, 0) / Math.max(1, values.length));
        const minAverage = Math.min(...classAverages, averageScore);
        const maxAverage = Math.max(...classAverages, averageScore);
        const pairs = subjectRows
          .filter((row) => (row.subjectCode ?? row.subjectName) === item.subjectCode && row.totalScore !== null && totalByStudent.has(row.studentId))
          .map((row) => ({ subject: row.totalScore ?? 0, total: totalByStudent.get(row.studentId) ?? 0 }));
        const relatedScore = correlation(pairs);
        return {
          subjectCode: item.subjectCode,
          subjectName: item.subjectName,
          averageScore: Math.round(averageScore * 10) / 10,
          minAverage: Math.round(minAverage * 10) / 10,
          maxAverage: Math.round(maxAverage * 10) / 10,
          classSpread: Math.round((maxAverage - minAverage) * 10) / 10,
          contributionRate: totalAverage > 0 ? Math.round((averageScore / totalAverage) * 1000) / 10 : 0,
          relatedScore: Math.round(relatedScore * 100) / 100,
          count: item.values.length,
        };
      })
      .sort((left, right) => right.averageScore - left.averageScore)
      .slice(0, 10);
  }, [academicGrowth.latestExam, academicScores]);
  const academicScatterNodes = useMemo(() => {
    const source = academicSubjectSummaries;
    const averageValues = source.map((item) => item.averageScore);
    const relatedValues = source.map((item) => item.relatedScore);
    const minAverage = Math.min(...averageValues, 0);
    const maxAverage = Math.max(...averageValues, 1);
    const minRelated = Math.min(...relatedValues, 0);
    const maxRelated = Math.max(...relatedValues, 1);
    const averageRange = Math.max(maxAverage - minAverage, 1);
    const relatedRange = Math.max(maxRelated - minRelated, 0.05);
    const maxContribution = Math.max(...source.map((item) => item.contributionRate), 1);
    return source.map((item, index) => ({
      ...item,
      x: 72 + Math.round(((item.averageScore - minAverage) / averageRange) * 388),
      y: 206 - Math.round(((item.relatedScore - minRelated) / relatedRange) * 152),
      radius: 5 + Math.round((item.contributionRate / maxContribution) * 9),
      color: item.relatedScore >= 0.75 ? '#95f5c2' : item.relatedScore >= 0.45 ? '#f7dc6f' : '#ff8a72',
      labelDx: index % 2 === 0 ? 12 : -54,
      labelDy: index % 3 === 0 ? -12 : index % 3 === 1 ? 4 : 18,
      delay: `${index * 0.08}s`,
    }));
  }, [academicSubjectSummaries]);
  const academicBoxRows = useMemo(() => {
    if (!academicGrowth.latestExam) return [];
    const classSummaryById = new Map(academicGrowth.classSummaries.map((item) => [item.classId, item]));
    const latestRows = academicScores.filter((row) => row.examId === academicGrowth.latestExam?.id && row.totalScore !== null);
    const grouped = latestRows.reduce((map, row) => {
      const current = map.get(row.classId) ?? { className: row.className, values: [] as number[] };
      if (row.totalScore !== null) current.values.push(row.totalScore);
      map.set(row.classId, current);
      return map;
    }, new Map<number, { className: string; values: number[] }>());
    const percentile = (values: number[], ratio: number) => {
      if (!values.length) return 0;
      const index = Math.min(values.length - 1, Math.max(0, Math.round((values.length - 1) * ratio)));
      return values[index] ?? 0;
    };
    return Array.from(grouped.entries())
      .map(([classId, item]) => {
        const values = [...item.values].sort((a, b) => a - b);
        const min = values[0] ?? 0;
        const max = values[values.length - 1] ?? 0;
        const q1 = percentile(values, 0.25);
        const median = percentile(values, 0.5);
        const q3 = percentile(values, 0.75);
        const summary = classSummaryById.get(classId);
        return {
          classId,
          className: item.className,
          min,
          q1,
          median,
          q3,
          max,
          participantCount: summary?.participantCount ?? values.length,
          growthIndex: summary?.growthIndex ?? 0,
          progressCount: summary?.progressCount ?? 0,
          declineCount: summary?.declineCount ?? 0,
        };
      })
      .sort((left, right) => right.median - left.median)
      .slice(0, 10);
  }, [academicGrowth.classSummaries, academicGrowth.latestExam, academicScores]);
  const academicScatterInsight = useMemo(() => {
    if (!academicSubjectSummaries.length) return null;
    const sorted = [...academicSubjectSummaries].sort((left, right) => right.relatedScore - left.relatedScore);
    const avgRelated = Math.round(
      (academicSubjectSummaries.reduce((sum, item) => sum + item.relatedScore, 0) / academicSubjectSummaries.length) * 100,
    ) / 100;
    return {
      strongest: sorted[0] ?? null,
      weakest: sorted[sorted.length - 1] ?? null,
      avgRelated,
      highImpactCount: academicSubjectSummaries.filter((item) => item.relatedScore >= 0.75).length,
    };
  }, [academicSubjectSummaries]);
  const academicQuadrantTotal = useMemo(
    () => academicGrowth.quadrants.reduce((sum, item) => sum + item.count, 0),
    [academicGrowth.quadrants],
  );
  const academicTrendMini = useMemo(() => academicGrowth.trend.slice(-4), [academicGrowth.trend]);

  const topClasses = useMemo(() => [...classes].sort((left, right) => right.classScore - left.classScore).slice(0, 6), [classes]);
  const topStudents = useMemo(() => [...students].sort((left, right) => right.currentScore - left.currentScore).slice(0, 8), [students]);
  const classMatrixNodes = useMemo(() => {
    const classSummaryById = new Map(academicGrowth.classSummaries.map((item) => [item.classId, item]));
    const candidates = [...classes].sort((left, right) => right.classScore - left.classScore).slice(0, 8);
    const maxScore = Math.max(...candidates.map((item) => item.classScore), 1);
    const minScore = Math.min(...candidates.map((item) => item.classScore), 0);
    const scoreRange = Math.max(maxScore - minScore, 1);
    const growthIndices = candidates.map((item) => {
      const summary = classSummaryById.get(item.id);
      return summary?.growthIndex ?? Math.round((item.classScore / maxScore) * 100);
    });
    const minGrowth = Math.min(...growthIndices);
    const maxGrowth = Math.max(...growthIndices);
    const growthSpread = Math.max(maxGrowth - minGrowth, 0);
    return candidates.map((item, index) => {
      const summary = classSummaryById.get(item.id);
      const growthIndex = growthIndices[index] ?? 0;
      const progressRate = summary?.participantCount
        ? Math.round((summary.progressCount / summary.participantCount) * 100)
        : growthIndex;
      const xPercent = 10 + ((item.classScore - minScore) / scoreRange) * 78;
      const yFromGrowth = 82 - ((growthIndex - minGrowth) / Math.max(growthSpread, 1)) * 66;
      const yFromRank = 16 + (index / Math.max(candidates.length - 1, 1)) * 62;
      const yPercent = growthSpread >= 8 ? yFromGrowth : yFromRank;
      const size = 40 + Math.round((item.classScore / maxScore) * 26);
      return {
        id: item.id,
        name: item.name,
        score: item.classScore,
        gradeName: item.gradeName,
        studentCount: item.studentCount,
        targetScore: item.targetScore ?? 0,
        growthIndex,
        progressRate,
        progressCount: summary?.progressCount ?? 0,
        declineCount: summary?.declineCount ?? 0,
        rank: index + 1,
        size,
        left: `${Math.min(90, Math.max(8, xPercent))}%`,
        top: `${Math.min(84, Math.max(12, yPercent))}%`,
        hue: 196 + index * 14,
        floatDuration: `${11 + (index % 4) * 1.8}s`,
        pulseDuration: `${4.8 + (index % 5) * 0.7}s`,
        floatDelay: `${(index % 6) * 0.45}s`,
      };
    });
  }, [academicGrowth.classSummaries, classes]);
  const classMatrixInsight = useMemo(() => {
    if (!classMatrixNodes.length) return null;
    const avgScore = Math.round(classMatrixNodes.reduce((sum, item) => sum + item.score, 0) / classMatrixNodes.length);
    const avgGrowth = Math.round(classMatrixNodes.reduce((sum, item) => sum + item.growthIndex, 0) / classMatrixNodes.length);
    const leader = classMatrixNodes[0];
    return { avgScore, avgGrowth, leader };
  }, [classMatrixNodes]);
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
  const honorShowcase = useMemo(() => {
    const totalGranted = honorRecords.length;
    const studentTargetCount = honorRecords.filter((item) => item.targetType === 'student').length;
    const classTargetCount = totalGranted - studentTargetCount;
    const categoryCounts = { personal: 0, collective: 0, phase: 0, longterm: 0 };
    for (const record of honorRecords) {
      const honor = honors.find((item) => item.id === record.honorId);
      if (honor) categoryCounts[honor.category] += 1;
    }
    const categoryStats = (
      [
        ['学生荣誉', categoryCounts.personal],
        ['集体荣誉', categoryCounts.collective],
        ['阶段荣誉', categoryCounts.phase],
        ['长期荣誉', categoryCounts.longterm],
      ] as Array<[string, number]>
    ).filter(([, count]) => count > 0);
    const grantBase = Math.max(totalHonorsGranted, 1);
    const maxGranted = Math.max(...topHonors.map((item) => item.grantedCount), 1);
    const topCards = topHonors.map((item) => ({
      ...item,
      sharePercent: Math.round((item.grantedCount / grantBase) * 100),
      barWidth: Math.max(10, Math.round((item.grantedCount / maxGranted) * 100)),
    }));
    const topHonorStudents = (() => {
      const grouped = new Map<
        number,
        { studentId: number; studentName: string; className: string; honorCount: number; lastGrantedAt: string }
      >();
      for (const item of honorRecords) {
        if (item.targetType !== 'student' || !item.studentId || !item.studentName) continue;
        const current = grouped.get(item.studentId);
        if (!current) {
          grouped.set(item.studentId, {
            studentId: item.studentId,
            studentName: item.studentName,
            className: item.className,
            honorCount: 1,
            lastGrantedAt: item.grantedAt,
          });
          continue;
        }
        current.honorCount += 1;
        if (new Date(item.grantedAt).getTime() > new Date(current.lastGrantedAt).getTime()) {
          current.lastGrantedAt = item.grantedAt;
        }
      }
      return Array.from(grouped.values())
        .sort(
          (left, right) =>
            right.honorCount - left.honorCount ||
            new Date(right.lastGrantedAt).getTime() - new Date(left.lastGrantedAt).getTime(),
        )
        .slice(0, 3);
    })();
    const donutParts: string[] = [];
    let cursor = 0;
    const donutSlices = [
      { label: '学生授予', value: studentTargetCount, color: 'rgba(0, 229, 255, 0.92)' },
      { label: '集体授予', value: classTargetCount, color: 'rgba(255, 179, 0, 0.9)' },
    ].filter((item) => item.value > 0);
    const donutTotal = Math.max(donutSlices.reduce((sum, item) => sum + item.value, 0), 1);
    for (const slice of donutSlices) {
      const next = cursor + (slice.value / donutTotal) * 100;
      donutParts.push(`${slice.color} ${cursor}% ${next}%`);
      cursor = next;
    }
    return {
      totalGranted,
      studentTargetCount,
      classTargetCount,
      categoryStats,
      topCards,
      recentHonors: honorRecords.slice(0, 5),
      topHonorStudents,
      donutGradient: donutParts.length ? `conic-gradient(${donutParts.join(', ')})` : 'conic-gradient(rgba(255,255,255,0.08) 0% 100%)',
      donutSlices,
      donutTotal,
    };
  }, [honorRecords, honors, topHonors, totalHonorsGranted]);
  const terminalSummary = useMemo(() => {
    const online = displayTerminals.filter((item) => item.onlineStatus === 'online').length;
    const offline = displayTerminals.length - online;
    return { online, offline, total: displayTerminals.length };
  }, [displayTerminals]);
  const radarBlips = useMemo(
    () =>
      displayTerminals.slice(0, 12).map((item, index) => {
        const angle = ((index * 360) / Math.max(displayTerminals.length, 1) - 90) * (Math.PI / 180);
        const radius = 24 + (index % 3) * 14;
        return {
          id: item.id,
          signal: item.onlineStatus === 'online' ? 'ON' : 'OFF',
          x: 50 + Math.cos(angle) * radius,
          y: 50 + Math.sin(angle) * radius,
          pulseDelay: `${index * 0.2}s`,
          state: item.onlineStatus,
        };
      }),
    [displayTerminals],
  );
  const radarSignals = useMemo(() => {
    return [
      { label: '在线大屏', value: `${terminalSummary.online}块`, state: 'ok' },
      { label: '离线大屏', value: `${terminalSummary.offline}块`, state: terminalSummary.offline > 0 ? 'warn' : 'ok' },
      { label: '终端总数', value: `${terminalSummary.total}块`, state: 'ok' },
    ] as const;
  }, [terminalSummary]);
  const recentPresentationEvents = useMemo(
    () =>
      scoreRecords.slice(0, 16).map((item) => {
        const classInfo = classes.find((row) => row.id === item.classId);
        const student = students.find((row) => row.id === item.studentId);
        return {
          id: item.id,
          className: item.className || (classInfo ? `${classInfo.gradeName}${classInfo.name}` : `班级#${item.classId}`),
          studentName: item.studentName || student?.name || `学生#${item.studentId}`,
          ruleName: item.ruleName || item.tag || item.dimension || '学生评价',
          scoreDelta: item.scoreDelta,
          createdAt: item.createdAt,
          dimension: item.dimension || item.tag || '综合',
        };
      }),
    [classes, scoreRecords, students],
  );

  const presentationTopClasses = useMemo(() => {
    const fallback = [...classes]
      .sort((left, right) => right.classScore - left.classScore)
      .slice(0, 10)
      .map((item) => ({
        id: item.id,
        label: `${item.gradeName}${item.name}`,
        score: item.classScore,
        studentCount: item.studentCount,
      }));
    if (!analytics?.topClasses?.length) return fallback;
    return analytics.topClasses.slice(0, 10).map((item) => {
      const classMeta = classes.find((row) => row.id === item.id);
      return {
        id: item.id,
        label: classMeta ? `${classMeta.gradeName}${classMeta.name}` : item.name,
        score: item.classScore ?? item.currentScoreTotal,
        studentCount: classMeta?.studentCount ?? 0,
      };
    });
  }, [analytics?.topClasses, classes]);

  const presentationHeatMap = useMemo(() => {
    const rows = analytics?.heatMap?.rows ?? ['早读', '上午', '下午', '课后'];
    const cols = analytics?.heatMap?.cols ?? ['一', '二', '三', '四', '五'];
    const source = analytics?.heatMap?.data ?? [];
    const rowAliases: Record<string, string[]> = {
      早读: ['早读'],
      上午: ['上午'],
      下午: ['下午', '午后'],
      课后: ['课后', '晚辅'],
      午后: ['午后', '下午'],
      晚辅: ['晚辅', '课后'],
    };
    const matrix = rows.map((rowLabel, rowIndex) => {
      const aliases = rowAliases[rowLabel] ?? [rowLabel];
      const found =
        source.find((item) => aliases.includes(item.row)) ??
        source[rowIndex];
      const values = cols.map((_, index) => {
        const raw = found?.values?.[index];
        return Number.isFinite(raw) ? Number(raw) : 0;
      });
      return { row: rowLabel, values };
    });
    const flatValues = matrix.flatMap((item) => item.values);
    const total = flatValues.reduce((sum, value) => sum + value, 0);
    const peak = flatValues.length ? Math.max(...flatValues) : 0;
    return { rows, cols, matrix, total, peak };
  }, [analytics?.heatMap]);

  const presentationTopBehaviors = useMemo(() => {
    const grouped = scoreRecords.reduce((map, item) => {
      const name = item.ruleName?.trim() || item.tag?.trim() || item.dimension?.trim() || item.sceneCode?.trim() || '未命名事件';
      const current = map.get(name) ?? { name, count: 0, positive: 0, negative: 0 };
      current.count += 1;
      if (item.scoreDelta >= 0) current.positive += 1;
      else current.negative += 1;
      map.set(name, current);
      return map;
    }, new Map<string, { name: string; count: number; positive: number; negative: number }>());
    return Array.from(grouped.values())
      .sort((left, right) => right.count - left.count)
      .slice(0, 8)
      .map((item, index) => ({
        ...item,
        color:
          item.negative > item.positive
            ? 'rgba(255, 99, 132, 0.82)'
            : index < 3
              ? 'rgba(0, 229, 255, 0.88)'
              : index < 6
                ? 'rgba(0, 229, 255, 0.58)'
                : 'rgba(0, 229, 255, 0.3)',
      }));
  }, [scoreRecords]);

  const classifyAnomalyRecord = (record: ScoreRecord) => {
    const text = `${record.ruleName ?? ''} ${record.tag ?? ''} ${record.dimension ?? ''} ${record.sceneCode ?? ''}`;
    if (/考勤|出勤|迟到|缺勤|早读/.test(text)) return 'attendance';
    if (/违纪|纪律|违规|讲话|打架|手机/.test(text)) return 'discipline';
    if (/作业|默写|背诵|练习|订正/.test(text)) return 'homework';
    return 'other';
  };
  const anomalyTrendSeries = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Array.from({ length: 14 }, (_, index) => {
      const date = new Date(today);
      date.setDate(today.getDate() - (13 - index));
      const dayKey = date.toDateString();
      const dayRecords = scoreRecords.filter(
        (item) => new Date(item.createdAt).toDateString() === dayKey && item.scoreDelta < 0,
      );
      const attendance = dayRecords.filter((item) => classifyAnomalyRecord(item) === 'attendance').length;
      const discipline = dayRecords.filter((item) => classifyAnomalyRecord(item) === 'discipline').length;
      const homework = dayRecords.filter((item) => classifyAnomalyRecord(item) === 'homework').length;
      return {
        day: `${date.getMonth() + 1}/${date.getDate()}`,
        shortDay: `D${index + 1}`,
        attendance,
        discipline,
        homework,
        total: dayRecords.length,
      };
    });
  }, [scoreRecords]);
  const anomalyTrendHasData = useMemo(
    () => anomalyTrendSeries.some((item) => item.total > 0),
    [anomalyTrendSeries],
  );
  const anomalyTrendInsight = useMemo(() => {
    const attendanceTotal = anomalyTrendSeries.reduce((sum, item) => sum + item.attendance, 0);
    const disciplineTotal = anomalyTrendSeries.reduce((sum, item) => sum + item.discipline, 0);
    const homeworkTotal = anomalyTrendSeries.reduce((sum, item) => sum + item.homework, 0);
    const peak = anomalyTrendSeries.reduce(
      (best, item) => (item.total > best.total ? item : best),
      anomalyTrendSeries[0] ?? { total: 0, day: '-', shortDay: '-' },
    );
    return { attendanceTotal, disciplineTotal, homeworkTotal, peak };
  }, [anomalyTrendSeries]);
  const buildAnomalyLine = (key: 'attendance' | 'discipline' | 'homework') => {
    const values = anomalyTrendSeries.map((item) => item[key]);
    const max = Math.max(...values, 1);
    return anomalyTrendSeries
      .map((item, index) => {
        const x = 8 + index * 29;
        const y = anomalyTrendHasData ? 158 - (item[key] / max) * 118 : 158;
        return `${x},${y}`;
      })
      .join(' ');
  };
  const buildAnomalyArea = (key: 'attendance' | 'discipline' | 'homework') => {
    const line = buildAnomalyLine(key);
    const lastX = 8 + (anomalyTrendSeries.length - 1) * 29;
    return `8,158 ${line} ${lastX},158`;
  };

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
  const warningSummary = useMemo(() => {
    const stats = analytics?.riskStudentStats;
    const highCount = stats?.high ?? (analytics?.riskStudents ?? []).filter((item) => item.riskLevel === 'high').length;
    const mediumCount = stats?.medium ?? (analytics?.riskStudents ?? []).filter((item) => item.riskLevel === 'medium').length;
    const lowCount = stats?.low ?? (analytics?.riskStudents ?? []).filter((item) => item.riskLevel === 'low').length;
    const negativeRecords = scoreRecords.filter((item) => item.scoreDelta < 0);
    const affectedClasses = new Set(negativeRecords.map((item) => item.classId)).size;
    const focusEvents = negativeRecords.slice(0, 4).map((item) => {
      const classInfo = classById.get(item.classId);
      const student = studentById.get(item.studentId);
      return {
        id: item.id,
        className: item.className || (classInfo ? `${classInfo.gradeName}${classInfo.name}` : `班级#${item.classId}`),
        studentName: item.studentName || student?.name || `学生#${item.studentId}`,
        label: item.ruleName || item.tag || item.dimension || item.sceneCode || '行为事件',
        scoreDelta: item.scoreDelta,
      };
    });
    return {
      highCount,
      mediumCount,
      lowCount,
      negativeEventCount: negativeRecords.length,
      affectedClasses,
      focusEvents,
    };
  }, [analytics?.riskStudentStats, analytics?.riskStudents, classById, scoreRecords, studentById]);
  const warningFunnelStages = useMemo(() => {
    const negativeRecords = scoreRecords.filter((item) => item.scoreDelta < 0);
    const matchedRecords = negativeRecords.filter((item) => item.ruleName || item.tag || item.dimension);
    const focusCount = Math.max(warningSummary.highCount + warningSummary.mediumCount, 0);
    const followUpCount = focusCount > 0
      ? Math.min(matchedRecords.length, focusCount + warningSummary.lowCount)
      : Math.round(matchedRecords.length * 0.68);
    const closedCount = Math.min(followUpCount, Math.max(0, followUpCount - Math.round(warningSummary.highCount * 0.35)));
    const stages = [
      { label: '预警触发', value: negativeRecords.length, color: 'rgba(0, 229, 255, 0.9)' },
      { label: '规则匹配', value: matchedRecords.length, color: 'rgba(0, 150, 255, 0.82)' },
      { label: '重点跟进', value: followUpCount, color: 'rgba(255, 179, 0, 0.82)' },
      { label: '闭环结案', value: closedCount, color: 'rgba(0, 230, 118, 0.82)' },
    ];
    const max = Math.max(...stages.map((item) => item.value), 1);
    return stages.map((stage, index) => {
      const previous = index > 0 ? stages[index - 1]?.value ?? stage.value : stage.value;
      return {
        ...stage,
        width: Math.max(stage.value > 0 ? 18 : 8, Math.round((stage.value / max) * 100)),
        convertRate: previous ? Math.round((stage.value / previous) * 100) : 100,
      };
    });
  }, [scoreRecords, warningSummary.affectedClasses, warningSummary.highCount, warningSummary.lowCount, warningSummary.mediumCount]);
  const warningFunnelInsight = useMemo(() => {
    const total = warningFunnelStages[0]?.value ?? 0;
    const closed = warningFunnelStages[warningFunnelStages.length - 1]?.value ?? 0;
    return {
      total,
      closed,
      closeRate: total ? Math.round((closed / total) * 100) : 0,
      affectedClasses: warningSummary.affectedClasses,
    };
  }, [warningFunnelStages, warningSummary.affectedClasses]);
  const riskShowcase = useMemo(() => {
    const positiveEvents = scoreRecords.filter((item) => item.scoreDelta > 0).length;
    const negativeEvents = scoreRecords.filter((item) => item.scoreDelta < 0).length;
    const activeDays = new Set(scoreRecords.map((item) => new Date(item.createdAt).toDateString())).size;
    const risks = (analytics?.riskStudents ?? []).slice(0, 5);
    const riskSegments = [
      { label: '高风险', value: warningSummary.highCount, tone: 'high', color: 'rgba(255, 23, 68, 0.92)' },
      { label: '中风险', value: warningSummary.mediumCount, tone: 'medium', color: 'rgba(255, 152, 0, 0.88)' },
      { label: '低风险', value: warningSummary.lowCount, tone: 'low', color: 'rgba(0, 230, 118, 0.82)' },
    ];
    const riskTotal = Math.max(riskSegments.reduce((sum, item) => sum + item.value, 0), 1);
    return {
      ...warningSummary,
      positiveEvents,
      negativeEvents,
      activeDays,
      risks,
      riskTotal,
      riskSegments: riskSegments.map((item) => ({
        ...item,
        width: Math.max(item.value > 0 ? 10 : 0, Math.round((item.value / riskTotal) * 100)),
      })),
    };
  }, [analytics?.riskStudents, scoreRecords, warningSummary]);
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
      ...academicGrowth.progressLeaders.slice(0, 6).map((item) => `${item.studentName} · 学业成长 ${item.rankDelta > 0 ? '+' : ''}${item.rankDelta}`),
      academicGrowth.latestExam ? `${academicGrowth.latestExam.name} · 学业成长指数 ${academicGrowth.growthIndex}` : '学业成长数据等待导入',
      ...topStudents.map((item) => `${item.name} · ${item.className} 当前积分达到 ${item.currentScore} 分`),
      ...topHonors.map((item) => `${item.name} 本周累计颁发 ${item.grantedCount} 人次`),
      ...topClasses.map((item) => `${item.name} 班级积分达到 ${item.classScore} 分`),
    ];
    return [...items, ...items];
  }, [academicGrowth.growthIndex, academicGrowth.latestExam, academicGrowth.progressLeaders, topClasses, topHonors, topStudents]);
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
  const ruleDistributionDetail = useMemo(() => {
    const grouped = new Map<string, number>();
    for (const rule of rules) {
      const key = rule.dimension ?? rule.sceneCode ?? '未分类';
      grouped.set(key, (grouped.get(key) ?? 0) + 1);
    }
    const total = Math.max(rules.length, 1);
    return Array.from(grouped.entries())
      .sort((left, right) => right[1] - left[1])
      .slice(0, 6)
      .map(([name, count]) => ({ name, count, percent: Math.round((count / total) * 100) }));
  }, [rules]);
  const ruleDonutStyle = useMemo(() => {
    if (!ruleDistributionDetail.length) return undefined;
    const colors = ['#42b6ff', '#46e0b0', '#f6da76', '#ff8a66', '#bb86fc', '#66e0a0'];
    let cursor = 0;
    const slices = ruleDistributionDetail.map((item, index) => {
      const next = cursor + Math.max(item.percent, 0);
      const slice = `${colors[index % colors.length]} ${cursor}% ${next}%`;
      cursor = next;
      return slice;
    });
    return {
      background: `radial-gradient(circle at center, #091b2c 38%, transparent 39%), conic-gradient(${slices.join(', ')})`,
    } as const;
  }, [ruleDistributionDetail]);
  const weeklyScoreTrend = useMemo(() => {
    const weekLabelsLocal = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(today);
      date.setDate(today.getDate() - (6 - index));
      const dayKey = date.toDateString();
      const dayRecords = scoreRecords.filter((item) => new Date(item.createdAt).toDateString() === dayKey);
      const eventCount = dayRecords.length;
      const scoreSum = dayRecords.reduce((sum, item) => sum + item.scoreDelta, 0);
      const positiveCount = dayRecords.filter((item) => item.scoreDelta > 0).length;
      return {
        label: weekLabelsLocal[date.getDay() === 0 ? 6 : date.getDay() - 1] ?? `D${index + 1}`,
        shortLabel: `${date.getMonth() + 1}/${date.getDate()}`,
        eventCount,
        scoreSum,
        positiveCount,
        negativeCount: eventCount - positiveCount,
      };
    });
  }, [scoreRecords]);
  const weeklyTrendInsight = useMemo(() => {
    const peak = weeklyScoreTrend.reduce((best, item) => (item.eventCount > best.eventCount ? item : best), weeklyScoreTrend[0] ?? { eventCount: 0, label: '-', scoreSum: 0 });
    const totalEvents = weeklyScoreTrend.reduce((sum, item) => sum + item.eventCount, 0);
    const totalScore = weeklyScoreTrend.reduce((sum, item) => sum + item.scoreSum, 0);
    const positiveTotal = weeklyScoreTrend.reduce((sum, item) => sum + item.positiveCount, 0);
    return {
      peak,
      totalEvents,
      totalScore,
      positiveRate: totalEvents ? Math.round((positiveTotal / totalEvents) * 100) : 0,
      dailyAverage: Math.round(totalEvents / 7),
    };
  }, [weeklyScoreTrend]);
  const cockpitFeedSummary = useMemo(() => {
    const todayKey = new Date().toDateString();
    const todayRecords = scoreRecords.filter((item) => new Date(item.createdAt).toDateString() === todayKey);
    const positive = scoreRecords.filter((item) => item.scoreDelta > 0).length;
    const negative = scoreRecords.filter((item) => item.scoreDelta < 0).length;
    const classSet = new Set(scoreRecords.map((item) => item.classId));
    return {
      todayCount: todayRecords.length,
      totalCount: scoreRecords.length,
      positiveRate: scoreRecords.length ? Math.round((positive / scoreRecords.length) * 100) : 0,
      negativeCount: negative,
      activeClasses: classSet.size,
    };
  }, [scoreRecords]);
  const weeklyTrendHasData = useMemo(
    () => weeklyScoreTrend.some((item) => item.eventCount > 0),
    [weeklyScoreTrend],
  );
  const trendPoints = useMemo(() => {
    const values = weeklyScoreTrend.map((item) => item.scoreSum);
    if (!weeklyTrendHasData) {
      return weeklyScoreTrend.map((item, index) => ({
        x: 36 + index * 58,
        y: 148,
        value: 0,
        ...item,
      }));
    }
    const max = Math.max(...values, 1);
    const min = Math.min(...values, 0);
    const range = Math.max(max - min, 1);
    return values.map((value, index) => ({
      x: 36 + index * 58,
      y: 148 - ((value - min) / range) * 96,
      value,
      ...weeklyScoreTrend[index],
    }));
  }, [weeklyScoreTrend, weeklyTrendHasData]);
  const trendPolyline = trendPoints.map((point) => `${point.x},${point.y}`).join(' ');
  const trendArea = `${trendPolyline} ${trendPoints[trendPoints.length - 1]?.x ?? 400},152 36,152`;
  const weekLabels = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
  const heatRows = ['早读', '上午', '下午', '课后'];
  const heatCols = ['一', '二', '三', '四', '五'];
  const operationBars = useMemo(() => {
    const base = weeklyScoreTrend.map((item) => ({
      label: item.shortLabel,
      fullLabel: item.label,
      eventCount: item.eventCount,
      disposeMinutes: item.eventCount > 0 ? Math.max(8, Math.round(42 - item.negativeCount * 1.2 + item.positiveCount * 0.4)) : 0,
      scoreSum: item.scoreSum,
      positiveCount: item.positiveCount,
    }));
    const maxEvent = Math.max(...base.map((item) => item.eventCount), 1);
    const maxMinute = Math.max(...base.map((item) => item.disposeMinutes), 1);
    return base.map((item) => ({
      ...item,
      barHeight: item.eventCount > 0 ? Math.max(12, Math.round((item.eventCount / maxEvent) * 100)) : 4,
      lineY: 112 - Math.round(((item.disposeMinutes || maxMinute) / maxMinute) * 94),
    }));
  }, [weeklyScoreTrend]);
  const operationInsight = useMemo(() => {
    const totalEvents = operationBars.reduce((sum, item) => sum + item.eventCount, 0);
    const avgMinutes = operationBars.length
      ? Math.round(operationBars.reduce((sum, item) => sum + item.disposeMinutes, 0) / operationBars.length)
      : 0;
    const peak = operationBars.reduce((best, item) => (item.eventCount > best.eventCount ? item : best), operationBars[0] ?? { eventCount: 0, fullLabel: '-' });
    const fastest = operationBars.reduce((best, item) => (item.disposeMinutes < best.disposeMinutes ? item : best), operationBars[0] ?? { disposeMinutes: 0, fullLabel: '-' });
    return { totalEvents, avgMinutes, peak, fastest };
  }, [operationBars]);
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
  const clockSegments = clockText.split(':');
  const clockMain = clockSegments.length === 3 ? `${clockSegments[0]}:${clockSegments[1]}` : clockText;
  const clockSecond = clockSegments.length === 3 ? clockSegments[2] : '00';
  const presentationStages = [
    { id: 'presentation-hero-stage', label: '开场', title: '总览' },
    { id: 'presentation-academic-heading', label: '第一幕', title: '学业' },
    { id: 'presentation-class-stage', label: '第二幕', title: '班级' },
    { id: 'presentation-insight-stage', label: '第三幕', title: '洞察' },
    { id: 'presentation-operation-stage', label: '第四幕', title: '运营' },
    { id: 'presentation-ecosystem-stage', label: '第五幕', title: '生态' },
  ];
  function scrollToPresentationStage(stageId: string) {
    document.getElementById(stageId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  return (
    <div className={`presentation-page scifi-theme${isActive ? ' is-active' : ''}`}>
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
      <nav className="presentation-stage-nav" aria-label="汇报章节切换">
        {presentationStages.map((stage) => (
          <button key={stage.id} type="button" onClick={() => scrollToPresentationStage(stage.id)}>
            <span>{stage.label}</span>
            <strong>{stage.title}</strong>
          </button>
        ))}
      </nav>
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
            <span>{currentSemesterName ?? '当前学期'}</span>
            <span>大理海东育英实验学校</span>
            <span>{user?.name ?? '管理员'}</span>
          </div>
          <div className="presentation-actions">
            <PresentationFullscreenButton className="presentation-fullscreen" />
            <div className="presentation-clock">
              <span>{clockMain}</span>
              <span className="presentation-clock-sec">:{clockSecond}</span>
            </div>
            <button
              className="presentation-exit"
              type="button"
              onClick={async () => {
                try {
                  await adminApi.setPresentationMode(token, 'daily');
                } finally {
                  navigate(returnTo || '/dashboard');
                }
              }}
            >
              ESC
            </button>
          </div>
        </header>

        <div className="presentation-cockpit-layout">
          {/* 左翼：基础指标 + 领跑榜 */}
          <div className="cockpit-left-wing">
            <div className="cockpit-metrics-col">
              {heroMetrics.slice(0, 4).map((item, index) => (
                <div key={item.label} className={`presentation-metric theme-${item.theme}`} style={{ animationDelay: `${1800 + index * 100}ms` }}>
                  <PresentationGlyph name={item.icon} className="presentation-metric-icon" />
                  <div className="presentation-metric-label">{item.label}</div>
                  <div className={`presentation-metric-value ${item.glow}`}>{item.value}</div>
                  <div className="presentation-metric-sub">{item.sub}</div>
                </div>
              ))}
            </div>
            <div className="presentation-panel fade-up-panel cockpit-panel">
              <div className="presentation-panel-title"><PresentationGlyph name="star" className="presentation-title-icon" />学生积分领跑榜 TOP8</div>
              <div className="presentation-cockpit-meta">
                <span>均分 <strong>{students.length ? Math.round(totalScore / students.length) : 0}</strong></span>
                <span>最高 <strong>{topStudents[0]?.currentScore ?? 0}</strong></span>
                <span>覆盖 <strong>{students.length}</strong> 人</span>
              </div>
              <div className="presentation-sprint-list">
                {topStudents.slice(0, 8).map((item, index) => {
                  const max = Math.max(...topStudents.map((s) => s.currentScore), 1);
                  const width = Math.max(20, Math.round((item.currentScore / max) * 100));
                  return (
                    <div key={item.id} className="presentation-sprint-row">
                      <span className={`presentation-rank-num top-${Math.min(index + 1, 3)}`}>{index + 1}</span>
                      <div className="presentation-sprint-track">
                        <div className="presentation-sprint-fill" style={{ width: barsExpanded ? `${width}%` : '0%' }}>
                          <span>{item.name}</span>
                          <strong>{item.currentScore} 分</strong>
                        </div>
                      </div>
                      <span className="presentation-sprint-delta">{item.className.replace('八年级', '')} · Lv.{item.currentPetLevel}</span>
                    </div>
                  );
                })}
                {topStudents.length === 0 ? <div className="presentation-summary-item">暂无学生数据。</div> : null}
              </div>
              <div className="presentation-cockpit-mini-row">
                {topClasses.slice(0, 3).map((item, index) => (
                  <div key={item.id} className="presentation-cockpit-mini-chip">
                    <span>班榜 {index + 1}</span>
                    <strong>{item.name.replace('八年级', '')}</strong>
                    <em>{item.classScore} 分</em>
                  </div>
                ))}
              </div>
            </div>
            <div className="presentation-panel fade-up-panel cockpit-panel">
              <div className="presentation-panel-title"><PresentationGlyph name="trend" className="presentation-title-icon" />近 7 天全校积分趋势</div>
              <div className="presentation-cockpit-meta">
                <span>7日事件 <strong>{weeklyTrendInsight.totalEvents}</strong></span>
                <span>积分变动 <strong>{weeklyTrendInsight.totalScore > 0 ? '+' : ''}{weeklyTrendInsight.totalScore}</strong></span>
                <span>正向率 <strong>{weeklyTrendInsight.positiveRate}%</strong></span>
                <span>峰值 <strong>{weeklyTrendInsight.peak?.label} {weeklyTrendInsight.peak?.eventCount}件</strong></span>
              </div>
              <svg className={`presentation-chart presentation-chart-compact${lineAnimated ? ' animated' : ''}`} viewBox="0 0 420 168" aria-hidden="true">
                <defs>
                  <linearGradient id="presentationTrendEnhanced" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="rgba(93,173,226,0.45)" />
                    <stop offset="100%" stopColor="rgba(93,173,226,0)" />
                  </linearGradient>
                </defs>
                {weeklyTrendHasData ? (
                  <>
                    <polyline className="chart-area" points={trendArea} fill="url(#presentationTrendEnhanced)" />
                    <polyline className="chart-line" points={trendPolyline} fill="none" stroke="#5DADE2" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                  </>
                ) : (
                  <line x1="36" y1="148" x2="384" y2="148" className="presentation-academic-axis" />
                )}
                {trendPoints.map((point, index) => (
                  <g key={`${point.x}-${point.y}`}>
                    {weeklyTrendHasData ? (
                      <circle className="chart-dot" cx={point.x} cy={point.y} r="4.5" fill={index === trendPoints.length - 1 ? '#F7DC6F' : '#5DADE2'} />
                    ) : null}
                    {weeklyTrendHasData ? (
                      <text x={point.x - 10} y={point.y - 10} className="presentation-axis-text presentation-chart-value">
                        {point.value > 0 ? '+' : ''}{point.value}
                      </text>
                    ) : null}
                    <text x={point.x - 14} y="162" className="presentation-axis-text">{point.shortLabel ?? weekLabels[index] ?? `D${index + 1}`}</text>
                  </g>
                ))}
              </svg>
              {!weeklyTrendHasData ? <div className="presentation-summary-item presentation-summary-item--compact">近 7 日暂无积分流水</div> : null}
              {weeklyTrendHasData ? (
                <div className="presentation-cockpit-trend-foot">
                  {weeklyScoreTrend.map((item) => (
                    <span key={item.shortLabel}>+{item.positiveCount}/-{item.negativeCount}</span>
                  ))}
                </div>
              ) : null}
            </div>
          </div>

          {/* 中央枢纽：大标题 + 3D 全息建筑 */}
          <div className="cockpit-center-hub">
            <section id="presentation-hero-stage" className="presentation-hero">
              <div className="presentation-hero-title">校级数据驾驶舱</div>
              <div className="presentation-hero-sub">SCHOOL DATA COCKPIT</div>
              <div className="presentation-hero-line" />
              <div className="presentation-hero-motto">为孩子一生奠基，对民族未来负责</div>
              <PresentationHero3D />
            </section>

            <div className="presentation-panel fade-up-panel cockpit-panel cockpit-panel-center">
              <div className="presentation-panel-title"><PresentationGlyph name="trend" className="presentation-title-icon" />事件量 & 处置时效（近7天双轴）</div>
              <div className="presentation-cockpit-meta">
                <span>事件总量 <strong>{operationInsight.totalEvents}</strong></span>
                <span>平均时效 <strong>{operationInsight.avgMinutes} 分钟</strong></span>
                <span>峰值日 <strong>{operationInsight.peak?.fullLabel} {operationInsight.peak?.eventCount}件</strong></span>
                <span>最快 <strong>{operationInsight.fastest?.fullLabel} {operationInsight.fastest?.disposeMinutes}分</strong></span>
              </div>
              <div className="presentation-dual-axis">
                <div className="presentation-dual-axis-bars">
                  {operationBars.map((item) => (
                    <div key={item.label} className="presentation-dual-bar-col">
                      <strong className="presentation-dual-bar-value">{item.eventCount}</strong>
                      <div className="presentation-dual-bar-track">
                        <div className="presentation-dual-bar-fill" style={{ height: barsExpanded ? `${item.barHeight}%` : '0%' }} title={`+${item.positiveCount} / 积分${item.scoreSum}`} />
                      </div>
                      <div className="presentation-dual-bar-label">{item.label}</div>
                      <small className="presentation-dual-bar-sub">{item.disposeMinutes}分</small>
                    </div>
                  ))}
                </div>
                <svg className="presentation-dual-line" viewBox="0 0 312 124" aria-hidden="true" style={{ width: '100%', height: '100%' }}>
                  <polyline
                    className="presentation-dual-line-path"
                    points={operationBars.map((item, index) => `${10 + index * 16.6}%,${item.lineY}`).join(' ')}
                  />
                  {operationBars.map((item, index) => (
                    <g key={`${item.label}-${item.disposeMinutes}`}>
                      <circle cx={`${10 + index * 16.6}%`} cy={item.lineY} r="4" className="presentation-dual-line-dot" />
                    </g>
                  ))}
                </svg>
              </div>
              <div className="presentation-panel-footnote">
                近7日积分变动 <strong>{weeklyTrendInsight.totalScore > 0 ? '+' : ''}{weeklyTrendInsight.totalScore}</strong>
                · 正向事件率 <span>{weeklyTrendInsight.positiveRate}%</span>
                · 日均 <strong>{weeklyTrendInsight.dailyAverage}</strong> 件
              </div>
            </div>
          </div>

          {/* 右翼：扩展指标 + 饼图 + 雷达图 + 实时流 */}
          <div className="cockpit-right-wing">
            <div className="cockpit-metrics-col">
              {heroMetrics.slice(4, 6).map((item, index) => (
                <div key={item.label} className={`presentation-metric theme-${item.theme}`} style={{ animationDelay: `${2220 + index * 100}ms` }}>
                  <PresentationGlyph name={item.icon} className="presentation-metric-icon" />
                  <div className="presentation-metric-label">{item.label}</div>
                  <div className={`presentation-metric-value ${item.glow}`}>{item.value}</div>
                  <div className="presentation-metric-sub">{item.sub}</div>
                </div>
              ))}
            </div>
            
            <div className="presentation-panel fade-up-panel cockpit-panel">
              <div className="presentation-panel-title"><PresentationGlyph name="shield" className="presentation-title-icon" />治理能力雷达图</div>
              <div className="presentation-radar-wrap">
                <svg viewBox="0 0 220 220" className="presentation-radar-chart presentation-radar-chart-compact" aria-hidden="true">
                  <circle cx="110" cy="110" r="82" className="presentation-radar-ring" />
                  <circle cx="110" cy="110" r="58" className="presentation-radar-ring" />
                  <circle cx="110" cy="110" r="34" className="presentation-radar-ring" />
                  {radarPoints.map((item) => (
                    <g key={`${item.name}-line`}>
                      <line x1="110" y1="110" x2={item.outerX} y2={item.outerY} className="presentation-radar-axis" />
                      <text x={item.outerX + (item.outerX > 110 ? 4 : -4)} y={item.outerY + 4} className="presentation-radar-axis-label" textAnchor={item.outerX > 110 ? 'start' : 'end'}>{item.name}</text>
                    </g>
                  ))}
                  <polygon points={radarPolygon} className="presentation-radar-polygon" />
                  {radarPoints.map((item) => (
                    <circle key={`${item.name}-dot`} cx={item.valueX} cy={item.valueY} r="4.2" className="presentation-radar-dot" />
                  ))}
                </svg>
                <div className="presentation-radar-side">
                  <div className="presentation-radar-score">
                    <span>综合治理指数</span>
                    <strong>{radarScore}</strong>
                    <small>6维加权均值</small>
                  </div>
                  <div className="presentation-radar-legend presentation-radar-legend-compact">
                    {radarAxes.map((item) => (
                      <div key={item.name} className="presentation-radar-legend-item">
                        <span>{item.name}</span>
                        <strong>{item.value}%</strong>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="presentation-panel fade-up-panel cockpit-panel">
              <div className="presentation-panel-title"><PresentationGlyph name="pie" className="presentation-title-icon" />评价维度分布</div>
              <div className="presentation-cockpit-meta">
                <span>规则总数 <strong>{rules.length}</strong></span>
                <span>维度 <strong>{ruleDistributionDetail.length}</strong></span>
                <span>正向规则 <strong>{rules.filter((item) => item.sentiment === 'positive').length}</strong></span>
              </div>
              <div className="presentation-donut-wrap presentation-donut-wrap-compact">
                <div className="presentation-donut-shell">
                  <div className="presentation-donut presentation-donut-compact" style={{ width: '96px', height: '96px', ...ruleDonutStyle }} />
                </div>
                <div className="presentation-legend-list presentation-legend-list-compact">
                  {ruleDistributionDetail.length > 0 ? ruleDistributionDetail.map((item, index) => (
                    <div key={item.name} className="presentation-legend-item">
                      <span className={`presentation-legend-dot dot-${(index % 6) + 1}`} />
                      <span>{item.name}</span>
                      <strong>{item.count}项 · {item.percent}%</strong>
                    </div>
                  )) : <div className="presentation-summary-item">暂无规则维度数据</div>}
                </div>
              </div>
            </div>

            <div className="presentation-panel fade-up-panel cockpit-panel">
              <div className="presentation-panel-title"><PresentationGlyph name="trend" className="presentation-title-icon" />数据实时流入 (Live Feed)</div>
              <div className="presentation-cockpit-meta">
                <span>今日 <strong>{cockpitFeedSummary.todayCount}</strong></span>
                <span>累计 <strong>{cockpitFeedSummary.totalCount}</strong></span>
                <span>正向率 <strong>{cockpitFeedSummary.positiveRate}%</strong></span>
                <span>活跃班 <strong>{cockpitFeedSummary.activeClasses}</strong></span>
              </div>
              <div className="presentation-live-feed">
                <div className="presentation-live-feed-inner">
                  {[...recentPresentationEvents, ...recentPresentationEvents].map((item, i) => (
                    <div key={`${item.id}-${i}`} className="live-feed-item">
                      <span className="live-feed-time">{new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                      <span className="live-feed-class">{item.className.replace('八年级', '')}</span>
                      <span className="live-feed-name">{item.studentName}</span>
                      <span className="live-feed-action">{item.ruleName}</span>
                      <span className="live-feed-dim">{item.dimension}</span>
                      <span className="live-feed-score" style={{ color: item.scoreDelta >= 0 ? '#ffb300' : '#ff1744' }}>
                        {item.scoreDelta > 0 ? '+' : ''}{item.scoreDelta}
                      </span>
                    </div>
                  ))}
                  {recentPresentationEvents.length === 0 ? <div className="live-feed-item">暂无最新数据流</div> : null}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="presentation-divider section-1" id="presentation-academic-heading">第一幕 · 学业成长成果</div>

        <section className="presentation-academic-stage">
          <div className="presentation-academic-title">
            <strong>学业成长成果</strong>
            <small>{academicGrowth.latestExam?.name ?? '暂无考试数据'}</small>
          </div>
          <div className="presentation-academic-grid">
            <div className="presentation-academic-index">
              <div className="presentation-academic-index-head">
                <span>学业成长指数</span>
                <strong>{academicGrowth.growthIndex}</strong>
              </div>
              <div className="presentation-academic-index-kpis">
                <div><span>覆盖率</span><strong>{academicGrowth.coverageRate}%</strong></div>
                <div><span>参考人数</span><strong>{academicGrowth.participantCount}</strong></div>
                <div><span>年级均分</span><strong>{academicGrowth.averageScore}</strong></div>
                <div><span>进步率</span><strong>{academicGrowth.participantCount ? Math.round((academicGrowth.progressCount / academicGrowth.participantCount) * 100) : 0}%</strong></div>
                <div><span>进步学生</span><strong>{academicGrowth.progressCount}</strong></div>
                <div><span>退步预警</span><strong>{academicGrowth.declineCount}</strong></div>
              </div>
              {academicTrendMini.length > 1 ? (
                <div className="presentation-academic-index-trend">
                  {academicTrendMini.map((item) => (
                    <div className="presentation-academic-index-trend-item" key={item.examId}>
                      <span title={item.examName}>{item.examName.replace(/^[\d\-学年上下学期\s]+/, '').slice(0, 8)}</span>
                      <div className="presentation-academic-index-trend-track">
                        <i style={{ width: `${Math.max(8, Math.min(100, item.progressRate))}%` }} />
                      </div>
                      <strong>{item.averageScore}</strong>
                    </div>
                  ))}
                </div>
              ) : null}
              <p>{academicGrowth.insight.headline}</p>
              <small>{academicGrowth.insight.suggestion}</small>
            </div>
            <div className="presentation-academic-orbit">
              <div className="presentation-academic-orbit-core">
                <strong>{academicQuadrantTotal}</strong>
                <span>画像样本</span>
              </div>
              {academicGrowth.quadrants.map((item, index) => {
                const percent = academicQuadrantTotal ? Math.round((item.count / academicQuadrantTotal) * 100) : 0;
                return (
                  <div
                    key={item.key}
                    className={`presentation-academic-planet ${item.tone}`}
                    style={{
                      left: `${16 + (index % 2) * 58}%`,
                      top: `${14 + Math.floor(index / 2) * 42}%`,
                      width: `${58 + Math.min(28, item.count * 1.6)}px`,
                      height: `${58 + Math.min(28, item.count * 1.6)}px`,
                      animationDelay: `${index * 0.35}s`,
                    }}
                  >
                    <strong>{item.count}</strong>
                    <b>{percent}%</b>
                    <span>{item.label}</span>
                  </div>
                );
              })}
              <div className="presentation-academic-orbit-legend">
                {academicGrowth.quadrants.map((item) => (
                  <div key={item.key} className={`presentation-academic-orbit-legend-item ${item.tone}`}>
                    <strong>{item.count}</strong>
                    <span>{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="presentation-academic-leaders">
              <div className="presentation-academic-leaders-grid">
                <div className="presentation-academic-leaders-col">
                  <div className="presentation-panel-title compact"><PresentationGlyph name="trend" className="presentation-title-icon" />进步样本 TOP6</div>
                  {academicGrowth.progressLeaders.slice(0, 6).map((item, index) => (
                    <div className="presentation-academic-leader" key={item.studentId}>
                      <span>{index + 1}</span>
                      <div className="presentation-academic-leader-main">
                        <strong>{item.studentName}</strong>
                        <small>{item.className.replace('八年级', '')} · 总分 {item.totalScore}</small>
                      </div>
                      <em>+{item.rankDelta || item.scoreDelta}</em>
                    </div>
                  ))}
                  {academicGrowth.progressLeaders.length === 0 ? <div className="presentation-summary-item">暂无进步样本</div> : null}
                </div>
                <div className="presentation-academic-leaders-col">
                  <div className="presentation-panel-title compact is-risk"><PresentationGlyph name="shield" className="presentation-title-icon" />退步预警 TOP4</div>
                  {academicGrowth.riskStudents.slice(0, 4).map((item, index) => (
                    <div className="presentation-academic-leader is-risk" key={item.studentId}>
                      <span>{index + 1}</span>
                      <div className="presentation-academic-leader-main">
                        <strong>{item.studentName}</strong>
                        <small>{item.className.replace('八年级', '')} · 总分 {item.totalScore}</small>
                      </div>
                      <em>{item.rankDelta || item.scoreDelta}</em>
                    </div>
                  ))}
                  {academicGrowth.riskStudents.length === 0 ? <div className="presentation-summary-item">暂无退步预警</div> : null}
                </div>
              </div>
            </div>

            <div className="presentation-academic-chart-card presentation-academic-chart-card-wide">
              <div className="presentation-panel-title compact"><PresentationGlyph name="chart" className="presentation-title-icon" />各科对总成绩影响散点图</div>
              {academicScatterInsight ? (
                <div className="presentation-academic-chart-meta">
                  <span>高相关科目 <strong>{academicScatterInsight.highImpactCount}</strong></span>
                  <span>平均相关度 <strong>r {academicScatterInsight.avgRelated}</strong></span>
                  <span>最强 <strong>{academicScatterInsight.strongest?.subjectName} r {academicScatterInsight.strongest?.relatedScore}</strong></span>
                  <span>最弱 <strong>{academicScatterInsight.weakest?.subjectName} r {academicScatterInsight.weakest?.relatedScore}</strong></span>
                </div>
              ) : null}
              <div className="presentation-academic-scatter-body">
                <svg className="presentation-academic-scatter" viewBox="0 0 540 260" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
                <line x1="60" y1="214" x2="484" y2="214" className="presentation-academic-axis" />
                <line x1="60" y1="34" x2="60" y2="214" className="presentation-academic-axis" />
                <line x1="272" y1="34" x2="272" y2="214" className="presentation-academic-grid-line is-dashed" />
                <line x1="60" y1="124" x2="484" y2="124" className="presentation-academic-grid-line is-dashed" />
                <line x1="60" y1="174" x2="484" y2="174" className="presentation-academic-grid-line" />
                <line x1="60" y1="74" x2="484" y2="74" className="presentation-academic-grid-line" />
                <text x="278" y="48" className="presentation-academic-quadrant-label">高相关</text>
                <text x="278" y="206" className="presentation-academic-quadrant-label">低相关</text>
                {academicScatterNodes.map((item) => (
                  <g key={item.subjectCode} style={{ animationDelay: item.delay }}>
                    <circle cx={item.x} cy={item.y} r={item.radius} fill={item.color} className="presentation-academic-scatter-dot" />
                    <text
                      x={item.x + item.labelDx}
                      y={item.y + item.labelDy}
                      className="presentation-academic-point-label"
                      textAnchor={item.labelDx < 0 ? 'end' : 'start'}
                    >
                      {item.subjectName} · r {item.relatedScore}
                    </text>
                    <text
                      x={item.x + item.labelDx}
                      y={item.y + item.labelDy + 12}
                      className="presentation-academic-point-sub"
                      textAnchor={item.labelDx < 0 ? 'end' : 'start'}
                    >
                      均分 {item.averageScore} · 贡献 {item.contributionRate}%
                    </text>
                  </g>
                ))}
                <text x="406" y="246" className="presentation-academic-axis-label">科目均分相对位置</text>
                <text x="8" y="28" className="presentation-academic-axis-label">总分相关度</text>
                <text x="66" y="238" className="presentation-academic-axis-label">低</text>
                <text x="464" y="238" className="presentation-academic-axis-label">高</text>
                </svg>
              </div>
              <div className="presentation-academic-scatter-legend">
                <span><i className="is-strong" />高相关 r≥0.75</span>
                <span><i className="is-mid" />中相关 r≥0.45</span>
                <span><i className="is-weak" />弱相关</span>
                <span>圆点大小 = 贡献占比</span>
              </div>
              {academicScatterNodes.length === 0 ? <div className="presentation-summary-item">暂无各科成绩数据。</div> : null}
            </div>

            <div className="presentation-academic-chart-card">
              <div className="presentation-panel-title compact"><PresentationGlyph name="trend" className="presentation-title-icon" />学科均衡条带图</div>
              <div className="presentation-academic-subject-legend">
                <span><i className="is-average" />年级均分</span>
                <span><i className="is-spread" />班际差</span>
              </div>
              <div className="presentation-academic-subject-bands">
                {academicSubjectSummaries.map((item) => {
                  const maxAverage = Math.max(...academicSubjectSummaries.map((row) => row.averageScore), 1);
                  const maxSpread = Math.max(...academicSubjectSummaries.map((row) => row.classSpread), 1);
                  return (
                    <div className="presentation-academic-subject-band" key={item.subjectCode}>
                      <div className="presentation-academic-subject-band-head">
                        <span>{item.subjectName}</span>
                        <strong>{item.averageScore}</strong>
                      </div>
                      <div className="presentation-academic-subject-track">
                        <i style={{ width: `${Math.max(8, Math.round((item.averageScore / maxAverage) * 100))}%` }} />
                        <b style={{ width: `${Math.max(6, Math.round((item.classSpread / maxSpread) * 100))}%` }} />
                      </div>
                      <div className="presentation-academic-subject-band-meta">
                        <em>班际 {item.minAverage}~{item.maxAverage}</em>
                        <em>差 {item.classSpread}</em>
                        <em>r {item.relatedScore}</em>
                        <em>{item.count}人</em>
                      </div>
                    </div>
                  );
                })}
                {academicSubjectSummaries.length === 0 ? <div className="presentation-summary-item">暂无学科均衡数据。</div> : null}
              </div>
            </div>

            <div className="presentation-academic-chart-card">
              <div className="presentation-panel-title compact"><PresentationGlyph name="summary" className="presentation-title-icon" />班级分布箱线图</div>
              <div className="presentation-academic-boxplot-legend">
                <span><i className="is-body" />四分位</span>
                <span><i className="is-median" />中位数</span>
                <span><i className="is-whisker" />极值</span>
              </div>
              <div className="presentation-academic-boxplot">
                {academicBoxRows.map((item) => {
                  const maxScore = Math.max(...academicBoxRows.map((row) => row.max), 1);
                  const left = Math.round((item.min / maxScore) * 100);
                  const q1 = Math.round((item.q1 / maxScore) * 100);
                  const median = Math.round((item.median / maxScore) * 100);
                  const q3 = Math.round((item.q3 / maxScore) * 100);
                  const right = Math.round((item.max / maxScore) * 100);
                  return (
                    <div className="presentation-academic-box-row" key={item.classId}>
                      <div className="presentation-academic-box-label">
                        <span>{item.className.replace('八年级', '')}</span>
                        <small>{item.participantCount}人 · 指数 {item.growthIndex}</small>
                      </div>
                      <div className="presentation-academic-box-track">
                        <i className="presentation-academic-box-whisker" style={{ left: `${left}%`, width: `${Math.max(2, right - left)}%` }} />
                        <i className="presentation-academic-box-body" style={{ left: `${q1}%`, width: `${Math.max(3, q3 - q1)}%` }} />
                        <b style={{ left: `${median}%` }} />
                      </div>
                      <div className="presentation-academic-box-stats">
                        <strong>{item.median}</strong>
                        <small>{item.min}~{item.max}</small>
                        <em>↑{item.progressCount} ↓{item.declineCount}</em>
                      </div>
                    </div>
                  );
                })}
                {academicBoxRows.length === 0 ? <div className="presentation-summary-item">暂无班级分布数据。</div> : null}
              </div>
            </div>
          </div>
        </section>

        <div className="presentation-divider section-2" id="presentation-class-stage">第二幕 · 班级成长势能</div>

        <section className="presentation-row presentation-row-mid">
          <div className="presentation-panel presentation-middle-panel">
            <div className="presentation-panel-title"><PresentationGlyph name="school" className="presentation-title-icon" />校园中心地图展示</div>
            <div className="presentation-campus-map">
              <div ref={mapContainerRef} className="presentation-amap-container" />
              <div className="presentation-campus-grid" />
              <div className="presentation-map-center-dot" />
            </div>
            <div className="presentation-map-meta">
              <span>{mapCenter.city}</span>
              <strong>{mapCenter.lat.toFixed(4)}, {mapCenter.lng.toFixed(4)}</strong>
            </div>
            <div className="presentation-map-weather">
              <span>天气信息</span>
              <strong>{weatherInfo?.temperatureText ?? '--°C'} · {weatherInfo?.conditionText ?? '天气暂不可用'}</strong>
            </div>
            <div className="presentation-panel-footnote">定位来源 <strong>{mapCenter.source}</strong> · 天气维度经纬度</div>
          </div>
          <div className="presentation-panel presentation-middle-panel">
            <div className="presentation-panel-title"><PresentationGlyph name="shield" className="presentation-title-icon" />雷达探测模块</div>
            <div className="presentation-radar-detector">
              <div className="presentation-detector-ring ring-1" />
              <div className="presentation-detector-ring ring-2" />
              <div className="presentation-detector-ring ring-3" />
              <div className={`presentation-detector-sweep${lineAnimated ? ' active' : ''}`} />
              <div className="presentation-detector-center-tag">RADAR</div>
              {radarBlips.map((item) => (
                <div
                  key={item.id}
                  className={`presentation-radar-blip ${item.state}`}
                  style={{ left: `${item.x}%`, top: `${item.y}%`, animationDelay: item.pulseDelay }}
                >
                  <span>{item.signal}</span>
                </div>
              ))}
            </div>
            <div className="presentation-radar-signal-list">
              {radarSignals.map((item) => (
                <div key={item.label} className={`presentation-radar-signal-item ${item.state}`}>
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="presentation-row presentation-row-main">
          <div className="presentation-panel first-row-panel presentation-panel-fill">
            <div className="presentation-panel-title"><PresentationGlyph name="chart" className="presentation-title-icon" />班级势能矩阵（TOP 8）</div>
            {classMatrixInsight ? (
              <div className="presentation-cockpit-meta">
                <span>均分 <strong>{classMatrixInsight.avgScore}</strong></span>
                <span>平均成长指数 <strong>{classMatrixInsight.avgGrowth}</strong></span>
                <span>榜首 <strong>{classMatrixInsight.leader?.name} {classMatrixInsight.leader?.score}</strong></span>
                <span>样本 <strong>{classMatrixNodes.length}</strong> 班</span>
              </div>
            ) : null}
            <div className="presentation-matrix-stack">
              <div className="presentation-matrix presentation-matrix-dense">
                <div className="presentation-matrix-grid" />
                <div className="presentation-matrix-quadrants" aria-hidden="true">
                  <span className="presentation-matrix-quadrant tl">高势能</span>
                  <span className="presentation-matrix-quadrant tr">领先区</span>
                  <span className="presentation-matrix-quadrant bl">待提升</span>
                  <span className="presentation-matrix-quadrant br">基础盘</span>
                </div>
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
                      boxShadow: `0 0 ${12 + item.size / 10}px hsla(${item.hue}, 100%, 60%, .36)`,
                    }}
                  >
                    <div className="presentation-node-core">
                      <span className="presentation-matrix-node-rank">#{item.rank}</span>
                      <span className="presentation-matrix-node-name">{item.name}</span>
                      <strong>{item.score}</strong>
                      <small>{item.gradeName} · {item.studentCount}人</small>
                      <em>势 {item.progressRate}% · 指 {item.growthIndex}</em>
                    </div>
                  </div>
                ))}
                <div className="presentation-matrix-axis x">班级综合评分 →</div>
                <div className="presentation-matrix-axis y">成长势能 ↑</div>
              </div>
              <div className="presentation-matrix-legend presentation-matrix-legend-full">
                {classMatrixNodes.map((item) => (
                  <div key={item.id} className="presentation-matrix-legend-item">
                    <span className="presentation-matrix-legend-rank">#{item.rank}</span>
                    <span>{item.name}</span>
                    <strong>{item.score}</strong>
                    <em>势 {item.progressRate}% · 指 {item.growthIndex}</em>
                    <em className="presentation-matrix-legend-delta">↑{item.progressCount} ↓{item.declineCount}</em>
                  </div>
                ))}
              </div>
            </div>
            <div className="presentation-panel-footnote presentation-panel-footnote--tight">
              横轴班级积分 · 纵轴成长指数 · 气泡大小随积分变化
            </div>
          </div>
          <div className="presentation-panel first-row-panel second presentation-panel-fill">
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

        <div className="presentation-divider section-3" id="presentation-insight-stage">第三幕 · 多维数据洞察</div>

        <section className="presentation-row presentation-row-3">
          <div className="presentation-panel fade-up-panel">
            <div className="presentation-panel-title"><PresentationGlyph name="trend" className="presentation-title-icon" />班级积分 Top 10</div>
            <div className="presentation-grade-3d-bars">
               {presentationTopClasses.map((item) => (
                 <div key={item.id} className="grade-3d-bar-col">
                   <div className="grade-3d-bar-track">
                     <div
                       className="grade-3d-bar-fill"
                       style={{
                         height: barsExpanded
                           ? `${(item.score / Math.max(...presentationTopClasses.map((row) => row.score), 1)) * 100}%`
                           : '0%',
                       }}
                     >
                       <div className="bar-top" />
                       <div className="bar-face" />
                       <div className="bar-right" />
                     </div>
                   </div>
                   <div className="grade-3d-bar-label">{item.label.replace(/年级/g, '').replace(/\s+/g, '')}</div>
                   <div className="grade-3d-bar-value">{Math.round(item.score)}</div>
                 </div>
               ))}
            </div>
            <div className="presentation-panel-footnote">上榜班级 <strong>{presentationTopClasses.length}</strong> 个 · 榜首积分 <span>{presentationTopClasses[0]?.score ?? 0}</span></div>
          </div>

          <div className="presentation-panel fade-up-panel">
            <div className="presentation-panel-title"><PresentationGlyph name="heat" className="presentation-title-icon" />教师评价时段热力</div>
            <div className="presentation-heatmap">
              <div className="presentation-heat-head" />
              {presentationHeatMap.cols.map((col) => (
                <div key={col} className="presentation-heat-head">{col}</div>
              ))}
              {presentationHeatMap.matrix.map(({ row, values }) => (
                <div key={row} className="presentation-heat-row">
                  <div className="presentation-heat-label">{row}</div>
                  {values.map((value, colIndex) => {
                    const ratio = presentationHeatMap.peak > 0 ? value / presentationHeatMap.peak : 0;
                    const intensity = ratio >= 0.75 ? 3 : ratio >= 0.45 ? 2 : ratio > 0 ? 1 : 0;
                    return (
                      <div key={`${row}-${colIndex}`} className={`presentation-heat-cell heat-${intensity}`}>
                        {value}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
            <div className="presentation-panel-footnote">统计总量 <strong>{presentationHeatMap.total}</strong> 次 · 峰值时段 <span>{presentationHeatMap.peak}</span> 次</div>
          </div>

          <div className="presentation-panel fade-up-panel">
             <div className="presentation-panel-title"><PresentationGlyph name="star" className="presentation-title-icon" />高频评价行为 TOP 8</div>
             <div className="presentation-top-behaviors">
                {presentationTopBehaviors.map((item, index) => (
                  <div key={item.name} className="behavior-row">
                    <span className="behavior-rank">{index + 1}</span>
                    <div className="behavior-track">
                      <div
                        className="behavior-fill"
                        style={{
                          width: barsExpanded
                            ? `${(item.count / Math.max(...presentationTopBehaviors.map((row) => row.count), 1)) * 100}%`
                            : '0%',
                          background: item.color,
                        }}
                      >
                         <span className="behavior-name">{item.name}</span>
                      </div>
                    </div>
                    <span className="behavior-count">{item.count}次</span>
                  </div>
                ))}
                {presentationTopBehaviors.length === 0 ? <div className="presentation-summary-item">暂无评价行为数据。</div> : null}
             </div>
             <div className="presentation-panel-footnote">事件来源 <strong>实时评价记录</strong> · 共统计 <span>{scoreRecords.length}</span> 条</div>
          </div>
        </section>

        <div className="presentation-divider section-4" id="presentation-operation-stage">第四幕 · 运营态势建模</div>

        <section className="presentation-row presentation-row-3">
          <div className="presentation-panel fade-up-panel">
            <div className="presentation-panel-title"><PresentationGlyph name="summary" className="presentation-title-icon" />实时事件摘要</div>
            <div className="presentation-summary-list">
              {recentPresentationEvents.slice(0, 5).map((item) => (
                <div className="presentation-summary-item" key={`${item.id}-${item.createdAt}`}>
                  {item.className} · {item.studentName} · {item.ruleName} · {item.scoreDelta > 0 ? '+' : ''}{item.scoreDelta} 分
                </div>
              ))}
              {recentPresentationEvents.length === 0 ? <div className="presentation-summary-item">暂无实时评价事件。</div> : null}
            </div>
            <div className="presentation-panel-footnote">
              最近事件 <strong>{recentPresentationEvents.length}</strong> 条 · 汇报页仅展示摘要，处置入口保留在后台实时运行监控
            </div>
          </div>

          <div className="presentation-panel fade-up-panel presentation-insight-panel presentation-panel-fill">
            <div className="presentation-panel-title"><PresentationGlyph name="trend" className="presentation-title-icon" />异常事件分布趋势</div>
            <div className="presentation-cockpit-meta">
              <span>考勤 <strong>{anomalyTrendInsight.attendanceTotal}</strong></span>
              <span>违纪 <strong>{anomalyTrendInsight.disciplineTotal}</strong></span>
              <span>作业 <strong>{anomalyTrendInsight.homeworkTotal}</strong></span>
              <span>峰值 <strong>{anomalyTrendInsight.peak.day} {anomalyTrendInsight.peak.total}件</strong></span>
            </div>
            <svg className={`presentation-chart presentation-chart-insight${lineAnimated ? ' animated' : ''}`} viewBox="0 0 420 168" aria-hidden="true">
               <defs>
                 <linearGradient id="area-attend" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="rgba(255, 179, 0, 0.4)"/><stop offset="100%" stopColor="rgba(255, 179, 0, 0)"/></linearGradient>
                 <linearGradient id="area-disc" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="rgba(255, 23, 68, 0.4)"/><stop offset="100%" stopColor="rgba(255, 23, 68, 0)"/></linearGradient>
                 <linearGradient id="area-hw" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="rgba(0, 229, 255, 0.4)"/><stop offset="100%" stopColor="rgba(0, 229, 255, 0)"/></linearGradient>
               </defs>
               {anomalyTrendHasData ? (
                 <>
                   <polyline className="chart-area" points={buildAnomalyArea('attendance')} fill="url(#area-attend)" />
                   <polyline className="chart-line" points={buildAnomalyLine('attendance')} fill="none" stroke="#ffb300" strokeWidth="2" />
                   <polyline className="chart-area" points={buildAnomalyArea('discipline')} fill="url(#area-disc)" />
                   <polyline className="chart-line" points={buildAnomalyLine('discipline')} fill="none" stroke="#ff1744" strokeWidth="2" />
                   <polyline className="chart-area" points={buildAnomalyArea('homework')} fill="url(#area-hw)" />
                   <polyline className="chart-line" points={buildAnomalyLine('homework')} fill="none" stroke="#00e5ff" strokeWidth="2" />
                 </>
               ) : (
                 <line x1="8" y1="158" x2="412" y2="158" className="presentation-academic-axis" />
               )}
               {anomalyTrendSeries.map((point, index) => (
                 index % 3 === 0 ? (
                   <text key={point.shortDay} x={8 + index * 29} y="165" className="presentation-axis-text">{point.day}</text>
                 ) : null
               ))}
               <text x="318" y="18" className="presentation-axis-text" fill="#ffb300">● 考勤</text>
               <text x="318" y="34" className="presentation-axis-text" fill="#ff1744">● 违纪</text>
               <text x="318" y="50" className="presentation-axis-text" fill="#00e5ff">● 作业</text>
            </svg>
            {!anomalyTrendHasData ? <div className="presentation-summary-item presentation-summary-item--compact">近 14 日暂无负向事件</div> : null}
            <div className="presentation-cockpit-trend-foot">
              {anomalyTrendSeries.map((item) => (
                <span key={item.shortDay}>{item.total}</span>
              ))}
            </div>
          </div>

          <div className="presentation-panel fade-up-panel presentation-insight-panel presentation-panel-fill">
            <div className="presentation-panel-title"><PresentationGlyph name="shield" className="presentation-title-icon" />预警处理时效转化漏斗</div>
            <div className="presentation-cockpit-meta">
              <span>触发 <strong>{warningFunnelInsight.total}</strong></span>
              <span>闭环 <strong>{warningFunnelInsight.closed}</strong></span>
              <span>闭环率 <strong>{warningFunnelInsight.closeRate}%</strong></span>
              <span>涉及班级 <strong>{warningFunnelInsight.affectedClasses}</strong></span>
            </div>
            <div className="presentation-funnel-wrap presentation-funnel-wrap-dense">
              {warningFunnelStages.map((stage) => (
                <div key={stage.label} className="funnel-stage">
                  <div className="funnel-bar" style={{ width: barsExpanded ? `${stage.width}%` : '0%', background: stage.color }}>
                    <span className="funnel-label">{stage.label}</span>
                    <strong className="funnel-value">{stage.value}</strong>
                  </div>
                  <small className="funnel-convert">转化 {stage.convertRate}%</small>
                </div>
              ))}
            </div>
            <div className="presentation-panel-footnote">
              负向事件 <strong>{warningSummary.negativeEventCount}</strong> 件 · 高风险 <span>{warningSummary.highCount}</span> · 中风险 <span>{warningSummary.mediumCount}</span>
            </div>
          </div>
        </section>

        <div className="presentation-divider section-5" id="presentation-ecosystem-stage">第五幕 · 荣誉 · 预警 · 萌宠生态</div>

        <section className="presentation-row presentation-row-3">
          <div className="presentation-panel fade-up-panel bottom-panel presentation-vitrine-panel">
            <div className="presentation-panel-title"><PresentationGlyph name="award" className="presentation-title-icon" />本周荣誉橱窗</div>
            <div className="presentation-eco-summary honor">
              <div className="presentation-eco-kpi highlight">
                <span>累计授予</span>
                <strong>{honorShowcase.totalGranted}</strong>
              </div>
              <div className="presentation-eco-kpi">
                <span>学生授予</span>
                <strong>{honorShowcase.studentTargetCount}</strong>
              </div>
              <div className="presentation-eco-kpi">
                <span>集体授予</span>
                <strong>{honorShowcase.classTargetCount}</strong>
              </div>
              {honorShowcase.categoryStats.slice(0, 1).map(([label, count]) => (
                <div key={label} className="presentation-eco-kpi">
                  <span>{label}</span>
                  <strong>{count}</strong>
                </div>
              ))}
            </div>
            <div className="presentation-vitrine-main">
              <div className="presentation-honor-bars">
                {honorShowcase.topCards.length > 0 ? (
                  honorShowcase.topCards.map((item, index) => (
                    <div key={item.id} className="presentation-honor-bar-row">
                      <span className={`presentation-rank-num top-${Math.min(index + 1, 3)}`}>{index + 1}</span>
                      <PresentationGlyph
                        name={item.category === 'collective' ? 'medal' : item.category === 'personal' ? 'star' : item.category === 'phase' ? 'award' : 'trend'}
                        className="presentation-honor-bar-icon"
                      />
                      <div className="presentation-honor-bar-body">
                        <div className="presentation-honor-bar-head">
                          <strong>{item.name}</strong>
                          <em>{item.grantedCount} 人次 · {item.sharePercent}%</em>
                        </div>
                        <div className="presentation-honor-bar-track">
                          <div
                            className="presentation-honor-bar-fill"
                            style={{ width: extendedBarsExpanded ? `${item.barWidth}%` : '0%' }}
                          />
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="presentation-eco-empty">
                    <PresentationGlyph name="award" className="presentation-eco-empty-icon" />
                    <p>本周暂无荣誉颁发数据</p>
                    <span>可在「学生评价」或「班级管理」中颁发荣誉</span>
                  </div>
                )}
              </div>
              <div className="presentation-vitrine-side">
                <div className="presentation-mini-donut" style={{ background: honorShowcase.donutGradient }}>
                  <div className="presentation-mini-donut-core">
                    <strong>{honorShowcase.donutTotal}</strong>
                    <span>授予</span>
                  </div>
                </div>
                <div className="presentation-mini-donut-legend">
                  {honorShowcase.donutSlices.map((item) => (
                    <div key={item.label}>
                      <i />
                      <span>{item.label}</span>
                      <b>{item.value}</b>
                    </div>
                  ))}
                  {honorShowcase.donutSlices.length === 0 ? (
                    <div className="presentation-eco-flow-item muted">暂无授予分布</div>
                  ) : null}
                </div>
              </div>
            </div>
            <div className="presentation-eco-subtitle">最新授予动态</div>
            <div className="presentation-eco-flow">
              {honorShowcase.recentHonors.length > 0 ? (
                honorShowcase.recentHonors.map((item) => (
                  <div key={`${item.id}-${item.grantedAt}`} className="presentation-eco-flow-item">
                    <div className="presentation-eco-flow-avatar">{(item.studentName ?? item.className).slice(0, 1)}</div>
                    <div className="presentation-eco-flow-body">
                      <strong>{item.studentName ?? item.className} · {item.honorName}</strong>
                      <span>{item.className}</span>
                    </div>
                    <time>{new Date(item.grantedAt).toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' })}</time>
                  </div>
                ))
              ) : (
                <div className="presentation-eco-flow-item muted">暂无荣誉授予记录，授予后将在此滚动展示</div>
              )}
            </div>
            <div className="presentation-eco-subtitle">荣誉之星 TOP3</div>
            <div className="presentation-eco-rank-list">
              {honorShowcase.topHonorStudents.length > 0 ? (
                honorShowcase.topHonorStudents.map((item, index) => (
                  <div key={item.studentId} className="presentation-eco-rank-row">
                    <span className={`presentation-rank-num top-${Math.min(index + 1, 3)}`}>{index + 1}</span>
                    <div className="presentation-eco-flow-avatar">{item.studentName.slice(0, 1)}</div>
                    <strong>{item.studentName}</strong>
                    <span>{item.className}</span>
                    <b>{item.honorCount} 枚</b>
                  </div>
                ))
              ) : (
                <div className="presentation-eco-flow-item muted">暂无学生荣誉统计</div>
              )}
            </div>
          </div>
          <div className="presentation-panel fade-up-panel bottom-panel presentation-risk-panel">
            <div className="presentation-panel-title"><PresentationGlyph name="warning" className="presentation-title-icon" />德育与行为预警摘要</div>
            <div className="presentation-eco-summary risk">
              <div className="presentation-eco-kpi highlight">
                <span>高风险</span>
                <strong>{riskShowcase.highCount}</strong>
              </div>
              <div className="presentation-eco-kpi">
                <span>中风险</span>
                <strong>{riskShowcase.mediumCount}</strong>
              </div>
              <div className="presentation-eco-kpi">
                <span>低风险</span>
                <strong>{riskShowcase.lowCount}</strong>
              </div>
              <div className="presentation-eco-kpi">
                <span>负向/正向</span>
                <strong>{riskShowcase.negativeEvents}/{riskShowcase.positiveEvents}</strong>
              </div>
            </div>
            <div className="presentation-risk-stack">
              {riskShowcase.riskSegments.map((item) => (
                <i
                  key={item.label}
                  className={`tone-${item.tone}`}
                  style={{ width: `${extendedBarsExpanded ? item.width : 0}%`, background: item.color }}
                  title={`${item.label} ${item.value} 人`}
                >
                  {item.value > 0 ? item.value : ''}
                </i>
              ))}
            </div>
            <div className="presentation-risk-stack-legend">
              {riskShowcase.riskSegments.map((item) => (
                <span key={item.label}>
                  <i className={`tone-${item.tone}`} />
                  {item.label} <b>{item.value}</b>
                </span>
              ))}
              <span className="risk-total">共 <b>{riskShowcase.riskTotal}</b> 人关注</span>
            </div>
            <div className="presentation-eco-subtitle">重点关注学生</div>
            <div className="presentation-risk-table">
              {riskShowcase.risks.length > 0 ? (
                riskShowcase.risks.map((item) => (
                  <div key={item.studentId} className="presentation-risk-row">
                    <span className={`presentation-risk-badge ${item.riskLevel}`}>
                      {formatPresentationRiskLevel(item.riskLevel)}
                    </span>
                    <div className="presentation-eco-flow-avatar">{item.studentName.slice(0, 1)}</div>
                    <div className="presentation-risk-body">
                      <strong>{item.studentName}</strong>
                      <span>
                        {item.className} · 负向 {item.negativeCount} / 正向 {item.positiveCount}
                      </span>
                    </div>
                    <span className="presentation-risk-reason" title={item.reason}>
                      {item.reason}
                    </span>
                  </div>
                ))
              ) : (
                <div className="presentation-eco-empty compact">
                  <PresentationGlyph name="check" className="presentation-eco-empty-icon ok" />
                  <p>当前无明显风险学生</p>
                  <span>校园德育运行整体平稳</span>
                </div>
              )}
            </div>
            <div className="presentation-eco-subtitle">近期负向事件</div>
            <div className="presentation-risk-events">
              {riskShowcase.focusEvents.length > 0 ? (
                riskShowcase.focusEvents.map((item) => (
                  <div key={item.id} className="presentation-risk-event-chip">
                    <strong>{item.studentName}</strong>
                    <span>{item.className}</span>
                    <em>{item.label}</em>
                    <b>{item.scoreDelta}</b>
                  </div>
                ))
              ) : (
                <div className="presentation-eco-flow-item muted">暂无重点负向事件记录</div>
              )}
            </div>
            <div className="presentation-alert-list compact">
              {presentationAlerts.slice(0, 2).map((item) => (
                <div key={item.text} className={`presentation-alert-item ${item.type}`}>
                  <PresentationGlyph name={item.type === 'warn' ? 'warning' : 'check'} className="presentation-alert-icon" />
                  {item.text}
                </div>
              ))}
            </div>
            <div className="presentation-panel-footnote">
              活跃评价日 <strong>{riskShowcase.activeDays}</strong> 天 · 涉及班级 <strong>{riskShowcase.affectedClasses}</strong> 个 · 家校共育已读率 <strong>{rewards.length > 0 ? '94.2%' : '92.0%'}</strong>
            </div>
          </div>
          <div className="presentation-panel fade-up-panel bottom-panel">
            <div className="presentation-panel-title"><PresentationGlyph name="star" className="presentation-title-icon" />AI 汇报摘要</div>
            <div ref={aiSummaryListRef} className="presentation-summary-list presentation-summary-list--ai">
              {presentationSummaryItems.map((item) => (
                <div key={item} className="presentation-summary-item presentation-summary-item--ai">{item}</div>
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

function formatPresentationRiskLevel(level: 'high' | 'medium' | 'low') {
  if (level === 'high') return '高';
  if (level === 'medium') return '中';
  return '低';
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

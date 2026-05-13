import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PresentationGlyph } from '../components/PresentationGlyph';
import { Shell } from '../components/Shell';
import { metricThemes } from '../constants/admin';
import { canManageAdminConfig } from '../utils/adminPermissions';
import type { 
  AdminClass,
  AdminStudent,
  AnalyticsData,
  DisplayTerminal,
  HonorRecord,
  PermissionUser,
  RewardOrder,
  ScoreRecord,
  ScoreRule
} from '../lib/api';
import { ruleSubjectLabelMap } from '../constants/admin';
import { adminApi } from '../lib/api';
import type {
  AdminState
} from '../types/admin';

type DashboardPageProps = Omit<AdminState, 'token'> & {
  token: string;
};

function compareGradeName(a: string, b: string) {
  const chineseDigitMap: Record<string, number> = {
    一: 1,
    二: 2,
    三: 3,
    四: 4,
    五: 5,
    六: 6,
    七: 7,
    八: 8,
    九: 9,
    十: 10,
  };
  const parseGradeNumber = (value: string) => {
    const arabic = value.match(/\d+/)?.[0];
    if (arabic) return Number(arabic);
    const chinese = value.match(/[一二三四五六七八九十]/)?.[0];
    if (chinese) return chineseDigitMap[chinese] ?? NaN;
    return NaN;
  };
  const aNum = parseGradeNumber(a);
  const bNum = parseGradeNumber(b);
  const aHasNum = Number.isFinite(aNum);
  const bHasNum = Number.isFinite(bNum);
  if (aHasNum && bHasNum && aNum !== bNum) return aNum - bNum;
  if (aHasNum !== bHasNum) return aHasNum ? -1 : 1;
  return a.localeCompare(b, 'zh-CN');
}

export function DashboardPage({
  token,
  user,
  scopes,
  classes,
  students,
  rules,
  honors,
  loading,
  error,
}: DashboardPageProps) {
  const navigate = useNavigate();
  const isHomeroomTeacher = user?.roleCode === 'homeroom_teacher';
  const isSubjectTeacher = user?.roleCode === 'subject_teacher';
  const isTeacherDashboard = isHomeroomTeacher || isSubjectTeacher;
  const canViewGovernance = canManageAdminConfig(user?.roleCode);
  const [rankTab, setRankTab] = useState<'class' | 'student' | 'honor'>('class');
  const [rankGradeName, setRankGradeName] = useState<string>('');
  const [presentSubmitting, setPresentSubmitting] = useState(false);
  const [presentMessage, setPresentMessage] = useState<string | null>(null);
  const [permissionUsers, setPermissionUsers] = useState<PermissionUser[]>([]);
  const [honorRecords, setHonorRecords] = useState<HonorRecord[]>([]);
  const [teacherRecentRecords, setTeacherRecentRecords] = useState<ScoreRecord[]>([]);
  const [teacherRewardOrders, setTeacherRewardOrders] = useState<RewardOrder[]>([]);
  const [activeTeacherSubject, setActiveTeacherSubject] = useState<string>('');
  const [activeTeacherClassId, setActiveTeacherClassId] = useState<number | null>(null);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [recentScoreRecords, setRecentScoreRecords] = useState<ScoreRecord[]>([]);
  const [displayTerminals, setDisplayTerminals] = useState<DisplayTerminal[]>([]);
  /** 驾驶舱「班级积分对比」：当前选中年级的展示范围 */
  const [cockpitCompareGradeName, setCockpitCompareGradeName] = useState<string>('');

  useEffect(() => {
    if (!user || !canViewGovernance) {
      setPermissionUsers([]);
      return;
    }
    let active = true;
    adminApi
      .permissionUsers(token)
      .then((response) => {
        if (!active) return;
        setPermissionUsers(response.data);
      })
      .catch(() => {
        if (!active) return;
        setPermissionUsers([]);
      });

    return () => {
      active = false;
    };
  }, [canViewGovernance, token, user]);

  useEffect(() => {
    if (isTeacherDashboard) {
      setHonorRecords([]);
      return;
    }
    let active = true;
    adminApi
      .honorRecords(token, { targetType: 'student' })
      .then((response) => {
        if (!active) return;
        setHonorRecords(response.data);
      })
      .catch(() => {
        if (!active) return;
        setHonorRecords([]);
      });

    return () => {
      active = false;
    };
  }, [isTeacherDashboard, token]);

  useEffect(() => {
    if (isTeacherDashboard) {
      setAnalyticsData(null);
      setRecentScoreRecords([]);
      setDisplayTerminals([]);
      return;
    }
    let active = true;
    Promise.all([
      adminApi.analytics(token),
      adminApi.scoreRecords(token),
      adminApi.displayTerminals(token),
    ])
      .then(([analyticsResp, recordsResp, terminalsResp]) => {
        if (!active) return;
        setAnalyticsData(analyticsResp.data);
        setRecentScoreRecords(
          recordsResp.data
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 20),
        );
        setDisplayTerminals(terminalsResp.data);
      })
      .catch(() => {
        if (!active) return;
      });
    return () => {
      active = false;
    };
  }, [isTeacherDashboard, token]);

  const metrics = useMemo(() => {
    const totalScore = classes.reduce((sum, item) => sum + item.classScore, 0);
    const displayReadyClasses = classes.filter((item) => item.displayStatus === 'enabled').length;
    const activeStudents = students.filter((item) => item.currentScore > 0 || item.currentPetLevel > 0).length;
    const positiveRules = rules.filter((item) => item.sentiment === 'positive').length;
    const classParticipation = classes.length > 0 ? ((displayReadyClasses / classes.length) * 100).toFixed(1) : '0.0';
    const studentParticipation = students.length > 0 ? ((activeStudents / students.length) * 100).toFixed(1) : '0.0';
    const averageLevel =
      students.length > 0
        ? (students.reduce((sum, item) => sum + item.currentPetLevel, 0) / students.length).toFixed(1)
        : '0.0';
    const honorsGranted = honors.reduce((sum, item) => sum + item.grantedCount, 0);

    return [
      {
        label: '全校总积分',
        icon: 'chart' as const,
        value: totalScore.toLocaleString('zh-CN'),
        note: '↑ 12.5%',
        noteHint: '较上周',
      },
      {
        label: '活跃班级数',
        icon: 'school' as const,
        value: `${displayReadyClasses}`,
        valueSuffix: classes.length > 0 ? `/${classes.length}` : undefined,
        sub: `${classParticipation}% 参与率`,
      },
      {
        label: '活跃学生数',
        icon: 'student' as const,
        value: `${activeStudents}`,
        valueSuffix: students.length > 0 ? `/${students.length}` : undefined,
        sub: `${studentParticipation}% 参与率`,
      },
      {
        label: '正向规则数',
        icon: 'fire' as const,
        value: `${positiveRules}`,
        note: '↑ 8.3%',
        noteHint: '较上周',
      },
      {
        label: '勋章发放数',
        icon: 'medal' as const,
        value: `${honorsGranted}`,
        sub: '本月累计',
      },
      {
        label: '平均成长等级',
        icon: 'paw' as const,
        value: `Lv.${averageLevel}`,
        note: '↑ +0.3',
        noteHint: '较上月',
      },
    ];
  }, [classes, honors, rules, students]);

  const rankGradeOptions = useMemo(
    () => Array.from(new Set(classes.map((item) => item.gradeName))).sort(compareGradeName),
    [classes],
  );

  useEffect(() => {
    if (!rankGradeOptions.includes(rankGradeName)) {
      setRankGradeName(rankGradeOptions[0] ?? '');
    }
  }, [rankGradeName, rankGradeOptions]);

  useEffect(() => {
    if (!rankGradeOptions.includes(cockpitCompareGradeName)) {
      setCockpitCompareGradeName(rankGradeOptions[0] ?? '');
    }
  }, [cockpitCompareGradeName, rankGradeOptions]);

  const gradeTopClasses = useMemo(() => {
    const rows = classes
      .filter((item) => item.gradeName === rankGradeName)
      .sort((left, right) => right.classScore - left.classScore || left.name.localeCompare(right.name, 'zh-CN'))
      .slice(0, 3);
    let prevScore: number | null = null;
    let prevRank = 0;
    return rows.map((item, index) => {
      const rank = prevScore === item.classScore ? prevRank : index + 1;
      prevScore = item.classScore;
      prevRank = rank;
      return { ...item, rank };
    });
  }, [classes, rankGradeName]);

  const topClasses = useMemo(
    () =>
      [...classes]
        .sort((left, right) => right.classScore - left.classScore)
        .slice(0, 3),
    [classes],
  );

  const topStudents = useMemo(
    () =>
      [...students]
        .sort((left, right) => right.currentScore - left.currentScore)
        .slice(0, 3),
    [students],
  );

  const topHonorStudents = useMemo(() => {
    const grouped = new Map<number, {
      studentId: number;
      studentName: string;
      className: string;
      honorCount: number;
      lastGrantedAt: string;
    }>();

    honorRecords.forEach((item) => {
      if (item.targetType !== 'student' || !item.studentId || !item.studentName) return;
      const current = grouped.get(item.studentId);
      if (!current) {
        grouped.set(item.studentId, {
          studentId: item.studentId,
          studentName: item.studentName,
          className: item.className,
          honorCount: 1,
          lastGrantedAt: item.grantedAt,
        });
        return;
      }
      current.honorCount += 1;
      if (new Date(item.grantedAt).getTime() > new Date(current.lastGrantedAt).getTime()) {
        current.lastGrantedAt = item.grantedAt;
      }
    });

    return Array.from(grouped.values())
      .sort(
        (left, right) =>
          right.honorCount - left.honorCount ||
          new Date(right.lastGrantedAt).getTime() - new Date(left.lastGrantedAt).getTime(),
      )
      .slice(0, 3);
  }, [honorRecords]);

  const rankRows = useMemo(() => {
    if (rankTab === 'class') {
      return gradeTopClasses.map((item) => ({
        id: `class-${item.id}`,
        rank: item.rank,
        name: `${item.gradeName} ${item.name}`,
        score: `${item.classScore} 分`,
      }));
    }
    if (rankTab === 'student') {
      return topStudents.map((item) => ({
        id: `student-${item.id}`,
        name: `${item.name} · ${item.className}`,
        score: `${item.currentScore} 分`,
      }));
    }
    return topHonorStudents.map((item) => ({
      id: `honor-${item.studentId}`,
      name: `${item.studentName} · ${item.className}`,
      score: `${item.honorCount} 枚`,
    }));
  }, [gradeTopClasses, rankTab, topHonorStudents, topStudents]);

  const recentHighlights = useMemo(
    () =>
      topStudents.map((student, index) => ({
        time: `${9 + index}:3${index}`,
        text: `${student.name} · ${student.className} 当前积分达到 ${student.currentScore} 分`,
      })),
    [topStudents],
  );

  const alerts = useMemo(() => {
    const lowClasses = [...classes]
      .sort((left, right) => left.classScore - right.classScore)
      .slice(0, 2)
      .map((item) => `${item.name} 当前积分偏低，建议关注班级激励频率`);
    const noPetStudents = students.filter((item) => !item.pet).length;

    return [
      ...lowClasses,
      noPetStudents > 0 ? `仍有 ${noPetStudents} 名学生未绑定萌宠成长档案` : '系统正常运行中，数据同步状态稳定',
    ];
  }, [classes, students]);

  const governanceMetrics = useMemo(() => {
    const teacherUsers = permissionUsers.filter((item) => ['homeroom_teacher', 'subject_teacher'].includes(item.roleCode));
    const disabledUsers = permissionUsers.filter((item) => item.status === 'disabled').length;
    const highPrivilegeUsers = permissionUsers.filter((item) => ['super_admin', 'school_admin'].includes(item.roleCode)).length;
    const uncoveredClasses = classes.filter((item) => !item.homeroomTeacher?.id).length;
    const multiClassTeachers = teacherUsers.filter((item) => item.classIds.length > 1).length;

    return {
      teacherUsers,
      disabledUsers,
      highPrivilegeUsers,
      uncoveredClasses,
      multiClassTeachers,
    };
  }, [classes, permissionUsers]);

  const governanceHighlights = useMemo(() => {
    const gradeTeacherMap = new Map<string, Set<number>>();
    classes.forEach((item) => {
      const matchedTeachers = governanceMetrics.teacherUsers.filter((teacher) => teacher.classIds.includes(item.id));
      if (!gradeTeacherMap.has(item.gradeName)) gradeTeacherMap.set(item.gradeName, new Set<number>());
      matchedTeachers.forEach((teacher) => gradeTeacherMap.get(item.gradeName)?.add(teacher.id));
    });

    const gradeCoverage = Array.from(gradeTeacherMap.entries())
      .map(([gradeName, teachers]) => ({ gradeName, teacherCount: teachers.size }))
      .sort((left, right) => right.teacherCount - left.teacherCount || left.gradeName.localeCompare(right.gradeName, 'zh-CN'))
      .slice(0, 3);

    const riskyAccounts = permissionUsers
      .filter((item) => item.status === 'disabled' || !item.lastLoginAt)
      .slice(0, 3);

    return {
      gradeCoverage,
      riskyAccounts,
    };
  }, [classes, governanceMetrics.teacherUsers, permissionUsers]);

  /*
   * ===================== 校级驾驶舱聚合层 =====================
   *
   * 当前实现策略：前端聚合
   * - 数据来源：adminApi.analytics / scoreRecords / displayTerminals / honorRecords
   * - 聚合位置：以下一组 useMemo 在浏览器端完成指标计算
   * - 刷新周期：页面加载时一次性拉取，无自动轮询
   *
   * 第三阶段演进方向（后端聚合）：
   * - 新增 GET /admin/cockpit 聚合接口，一次返回全部指标
   * - 后端按缓存策略（15min TTL）减少重复计算
   * - 前端仅做展示，不再零散拼装多个 useMemo
   * ============================================================
   */

  const cockpitKpi = useMemo(() => {
    const totalScore = analyticsData?.totalScore ?? classes.reduce((s, c) => s + c.classScore, 0);
    const displayReadyClasses = classes.filter((c) => c.displayStatus === 'enabled').length;
    const activeStudents = students.filter((s) => s.currentScore > 0 || s.currentPetLevel > 0).length;
    const positiveEvents = analyticsData?.positiveRuleCount ?? 0;
    const negativeEvents = analyticsData?.negativeRuleCount ?? 0;
    const honorsGranted = honors.reduce((s, h) => s + h.grantedCount, 0);
    const riskCount = analyticsData?.riskStudents?.length ?? 0;
    const avgScore = analyticsData?.averageScore ?? (students.length ? Math.round(students.reduce((s, st) => s + st.currentScore, 0) / students.length) : 0);
    const activeDays = analyticsData?.activeDays ?? 0;
    const onlineTerminals = displayTerminals.filter((t) => t.onlineStatus === 'online').length;
    return {
      totalScore,
      displayReadyClasses,
      classCount: classes.length,
      activeStudents,
      studentCount: students.length,
      positiveEvents,
      negativeEvents,
      honorsGranted,
      riskCount,
      avgScore,
      activeDays,
      onlineTerminals,
      terminalCount: displayTerminals.length,
    };
  }, [analyticsData, classes, displayTerminals, honors, students]);

  const cockpitRuleDistribution = useMemo(
    () => analyticsData?.ruleDistribution ?? [],
    [analyticsData],
  );

  const cockpitSubjectDistribution = useMemo(
    () => analyticsData?.subjectDistribution ?? [],
    [analyticsData],
  );

  const cockpitTopClasses = useMemo(
    () => analyticsData?.topClasses ?? [...classes].sort((a, b) => b.classScore - a.classScore).slice(0, 8).map((c) => ({ id: c.id, name: `${c.gradeName} ${c.name}`, currentScoreTotal: c.classScore })),
    [analyticsData, classes],
  );

  const cockpitTopStudents = useMemo(
    () => analyticsData?.topStudents ?? [...students].sort((a, b) => b.currentScore - a.currentScore).slice(0, 8).map((s) => ({ studentId: s.id, studentName: s.name, classId: s.classId, className: s.className, currentScore: s.currentScore })),
    [analyticsData, students],
  );

  const cockpitRiskStudents = useMemo(
    () => analyticsData?.riskStudents ?? [],
    [analyticsData],
  );

  const cockpitAiInsight = useMemo(
    () => analyticsData?.aiInsight ?? null,
    [analyticsData],
  );

  const cockpitHeatMap = useMemo(
    () => analyticsData?.heatMap ?? { rows: [], cols: [], data: [] },
    [analyticsData],
  );

  const cockpitRecentHonors = useMemo(
    () =>
      [...honorRecords]
        .sort((a, b) => new Date(b.grantedAt).getTime() - new Date(a.grantedAt).getTime())
        .slice(0, 8),
    [honorRecords],
  );

  const cockpitStudentLayers = useMemo(() => {
    const highGrowth = students.filter((s) => s.currentPetLevel >= 5).length;
    const stable = students.filter((s) => s.currentPetLevel >= 2 && s.currentPetLevel < 5).length;
    const low = students.filter((s) => s.currentPetLevel < 2).length;
    const withPet = students.filter((s) => s.pet).length;
    const over100 = students.filter((s) => s.currentScore >= 100).length;
    return { highGrowth, stable, low, withPet, noPet: students.length - withPet, over100 };
  }, [students]);

  /** 数据结构：当前年级内各班级积分，用于柱状对比 */
  const cockpitClassCompareBars = useMemo(() => {
    const inGrade = classes.filter((c) => c.gradeName === cockpitCompareGradeName);
    // 同年级的班级仅展示积分前 6 名
    const sorted = [...inGrade]
      .sort((a, b) => b.classScore - a.classScore || a.name.localeCompare(b.name, 'zh-CN'))
      .slice(0, 6);
    const maxScore = Math.max(...sorted.map((c) => c.classScore), 1);
    return sorted.map((c, index) => ({
      id: c.id,
      name: c.name,
      value: c.classScore,
      maxScore,
      colorIndex: index,
    }));
  }, [classes, cockpitCompareGradeName]);

  /** 主图：全校班级积分排名前 8，与面板标题「班级积分Top8」口径一致 */
  const cockpitTrendSvg = useMemo(() => {
    const source = [...classes]
      .sort((a, b) => b.classScore - a.classScore)
      .slice(0, 8)
      .map((c) => ({
        label: `${c.gradeName} ${c.name}`.trim(),
        value: c.classScore,
      }));
    if (source.length === 0) return { points: [], line: '', area: '', labels: [] };
    const max = Math.max(...source.map((s) => s.value), 1);
    const min = Math.min(...source.map((s) => s.value), 0);
    const range = Math.max(max - min, 1);
    const points = source.map((s, i) => {
      const x = 50 + i * (400 / Math.max(source.length - 1, 1));
      const y = 140 - ((s.value - min) / range) * 110;
      return { x, y, value: s.value, label: s.label };
    });
    const line = points.map((p) => `${p.x},${p.y}`).join(' ');
    const area = `${line} ${points[points.length - 1]?.x ?? 450},150 50,150`;
    return { points, line, area, labels: source.map((s) => s.label) };
  }, [classes]);

  const trendPoints = useMemo(() => {
    const source = [...classes]
      .sort((left, right) => right.classScore - left.classScore)
      .slice(0, 7)
      .map((item) => item.classScore);
    const values = source.length > 0 ? source.reverse() : [120, 180, 150, 210, 260, 240, 300];
    const dateLabels = values.map((_, index) => {
      const offset = values.length - 1 - index;
      const date = new Date();
      date.setDate(date.getDate() - offset);
      const month = `${date.getMonth() + 1}`.padStart(2, '0');
      const day = `${date.getDate()}`.padStart(2, '0');
      return `${month}/${day}`;
    });
    const max = Math.max(...values, 1);
    const min = Math.min(...values, 0);
    const range = Math.max(max - min, 1);

    return values.map((value, index) => {
      const x = 40 + index * 60;
      const y = 150 - ((value - min) / range) * 100;
      return { x, y, value, label: dateLabels[index] };
    });
  }, [classes]);

  const trendLine = trendPoints.map((point) => `${point.x},${point.y}`).join(' ');
  const trendArea = `${trendLine} ${trendPoints[trendPoints.length - 1]?.x ?? 400},150 40,150`;

  async function handleEnterPresentMode() {
    setPresentSubmitting(true);
    setPresentMessage(null);
    try {
      await adminApi.updateDisplaySettings(token, {
        defaultMode: 'report',
      });
      navigate('/presentation');
    } catch (err) {
      setPresentMessage(err instanceof Error ? err.message : '切换汇报展示模式失败');
    } finally {
      setPresentSubmitting(false);
    }
  }

  function handleEnterLiveInsight() {
    navigate('/live-insight');
  }

  function navigateWithQuery(path: string, query: Record<string, string | number | null | undefined>) {
    const params = new URLSearchParams();
    Object.entries(query).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') return;
      params.set(key, String(value));
    });
    params.set('returnTo', '/dashboard');
    params.set('returnLabel', isTeacherDashboard ? '返回工作台' : '返回校级驾驶舱');
    navigate(params.size > 0 ? `${path}?${params.toString()}` : path);
  }

  function navigateToEvaluation(query: Record<string, string | number | null | undefined> = {}) {
    const params = new URLSearchParams();
    Object.entries(query).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') return;
      params.set(key, String(value));
    });
    navigate(params.size > 0 ? `/evaluation?${params.toString()}` : '/evaluation');
  }

  const teacherSubjectCodes = useMemo(
    () =>
      Array.from(
        new Set(
          scopes
            .map((item) => item.subjectCode)
            .filter((item): item is string => Boolean(item)),
        ),
      ),
    [scopes],
  );

  const teacherSubjectGroups = useMemo(() => {
    const map = new Map<string, { subjectCode: string; classIds: Set<number>; classNames: string[]; studentCount: number }>();
    scopes.forEach((item) => {
      if (!item.subjectCode || typeof item.classId !== 'number') return;
      const classInfo = classes.find((row) => row.id === item.classId);
      const current = map.get(item.subjectCode) ?? {
        subjectCode: item.subjectCode,
        classIds: new Set<number>(),
        classNames: [],
        studentCount: 0,
      };
      if (!current.classIds.has(item.classId)) {
        current.classIds.add(item.classId);
        if (classInfo) {
          current.classNames.push(`${classInfo.gradeName}${classInfo.name}`);
          current.studentCount += classInfo.studentCount;
        }
      }
      map.set(item.subjectCode, current);
    });

    return Array.from(map.values()).sort((left, right) => right.classIds.size - left.classIds.size);
  }, [classes, scopes]);

  useEffect(() => {
    if (!isSubjectTeacher) {
      setActiveTeacherSubject('');
      return;
    }

    if (!teacherSubjectGroups.some((item) => item.subjectCode === activeTeacherSubject)) {
      setActiveTeacherSubject(teacherSubjectGroups[0]?.subjectCode ?? '');
    }
  }, [activeTeacherSubject, isSubjectTeacher, teacherSubjectGroups]);

  useEffect(() => {
    if (!isSubjectTeacher) {
      setActiveTeacherClassId(null);
      return;
    }

    if (!classes.some((item) => item.id === activeTeacherClassId)) {
      setActiveTeacherClassId(classes[0]?.id ?? null);
    }
  }, [activeTeacherClassId, classes, isSubjectTeacher]);

  const primaryHomeroomClass = useMemo(() => {
    if (!isHomeroomTeacher) return null;
    return (
      [...classes].sort(
        (left, right) => right.studentCount - left.studentCount || right.classScore - left.classScore,
      )[0] ?? null
    );
  }, [classes, isHomeroomTeacher]);

  const primaryHomeroomStudents = useMemo(() => {
    if (!primaryHomeroomClass) return [];
    return students
      .filter((item) => item.classId === primaryHomeroomClass.id)
      .sort((left, right) => right.currentScore - left.currentScore || right.currentPetLevel - left.currentPetLevel);
  }, [primaryHomeroomClass, students]);

  useEffect(() => {
    if (!isTeacherDashboard) {
      setTeacherRecentRecords([]);
      setTeacherRewardOrders([]);
      return;
    }

    const targetClassId =
      user?.roleCode === 'homeroom_teacher'
        ? primaryHomeroomClass?.id
        : undefined;

    let active = true;
    Promise.all([
      adminApi.scoreRecords(token, targetClassId ? { classId: targetClassId } : undefined),
      user?.roleCode === 'homeroom_teacher' && targetClassId
        ? adminApi.rewardOrders(token, { classId: targetClassId })
        : Promise.resolve({ code: 0, message: 'ok', data: [] as RewardOrder[] }),
    ])
      .then(([recordsResponse, rewardOrdersResponse]) => {
        if (!active) return;
        setTeacherRecentRecords(recordsResponse.data.slice(0, 8));
        setTeacherRewardOrders(rewardOrdersResponse.data.slice(0, 6));
      })
      .catch(() => {
        if (!active) return;
        setTeacherRecentRecords([]);
        setTeacherRewardOrders([]);
      });

    return () => {
      active = false;
    };
  }, [isTeacherDashboard, primaryHomeroomClass?.id, token, user?.roleCode]);

  const teacherMetrics = useMemo(() => {
    const classCount = classes.length;
    const studentCount = students.length;
    const noPetStudents = students.filter((item) => !item.pet).length;
    const averageScore = studentCount
      ? Math.round(students.reduce((sum, item) => sum + item.currentScore, 0) / studentCount)
      : 0;
    const highFrequencyRuleCount = rules.filter((item) => {
      if (!item.isHighFrequency || !item.adminEnabled) return false;
      if (item.moduleType === 'general') return true;
      if (isSubjectTeacher) {
        return item.subjectCode ? teacherSubjectCodes.includes(item.subjectCode) : false;
      }
      return true;
    }).length;
    const targetPendingClasses = classes.filter((item) => item.targetScore === null || item.targetScore === undefined).length;

    return {
      classCount,
      studentCount,
      noPetStudents,
      averageScore,
      highFrequencyRuleCount,
      targetPendingClasses,
    };
  }, [classes, isSubjectTeacher, rules, students, teacherSubjectCodes]);

  const teacherTopStudents = useMemo(
    () =>
      [...students]
        .sort((left, right) => right.currentScore - left.currentScore || right.currentPetLevel - left.currentPetLevel)
        .slice(0, 5),
    [students],
  );

  const teacherClassCards = useMemo(
    () =>
      [...classes]
        .sort((left, right) => right.classScore - left.classScore || right.studentCount - left.studentCount)
        .slice(0, 4),
    [classes],
  );

  const teacherRules = useMemo(
    () =>
      rules
        .filter((item) => {
          if (!item.adminEnabled) return false;
          if (item.moduleType === 'general') return true;
          if (isSubjectTeacher) {
            return item.subjectCode ? teacherSubjectCodes.includes(item.subjectCode) : false;
          }
          return true;
        })
        .sort((left, right) => Number(right.isHighFrequency) - Number(left.isHighFrequency) || Math.abs(right.scoreValue) - Math.abs(left.scoreValue))
        .slice(0, 6),
    [isSubjectTeacher, rules, teacherSubjectCodes],
  );

  const homeroomBehaviorStats = useMemo(() => {
    const relatedStudentIds = new Set(primaryHomeroomStudents.map((item) => item.id));
    const records = teacherRecentRecords.filter((item) => relatedStudentIds.has(item.studentId));
    const positiveCount = records.filter((item) => item.scoreDelta > 0).length;
    const negativeCount = records.filter((item) => item.scoreDelta < 0).length;
    const dimensionMap = new Map<string, number>();
    records.forEach((item) => {
      const key = item.dimension || item.tag || item.sceneCode || '其他';
      dimensionMap.set(key, (dimensionMap.get(key) ?? 0) + 1);
    });

    const dimensions = Array.from(dimensionMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((left, right) => right.count - left.count)
      .slice(0, 5);

    const trendMap = new Map<string, { positive: number; negative: number }>();
    records.forEach((item) => {
      const dateKey = new Date(item.createdAt).toISOString().slice(5, 10);
      const current = trendMap.get(dateKey) ?? { positive: 0, negative: 0 };
      if (item.scoreDelta > 0) current.positive += 1;
      if (item.scoreDelta < 0) current.negative += 1;
      trendMap.set(dateKey, current);
    });

    const trend = Array.from(trendMap.entries())
      .map(([date, value]) => ({ date, ...value }))
      .sort((left, right) => left.date.localeCompare(right.date))
      .slice(-7);

    return { positiveCount, negativeCount, dimensions, trend };
  }, [primaryHomeroomStudents, teacherRecentRecords]);

  const filteredTeacherRules = useMemo(() => {
    if (!isSubjectTeacher || !activeTeacherSubject) return teacherRules;
    return teacherRules.filter((item) => item.moduleType === 'general' || item.subjectCode === activeTeacherSubject);
  }, [activeTeacherSubject, isSubjectTeacher, teacherRules]);

  const filteredTeacherRecentRecords = useMemo(() => {
    if (!isSubjectTeacher || !activeTeacherSubject) return teacherRecentRecords;
    return teacherRecentRecords.filter(
      (item) => item.subjectCode === activeTeacherSubject || (!item.subjectCode && item.sourceRole === 'subject_teacher'),
    );
  }, [activeTeacherSubject, isSubjectTeacher, teacherRecentRecords]);

  const homeroomWatchStudents = useMemo(() => {
    const relatedRecords = teacherRecentRecords.filter((item) =>
      primaryHomeroomStudents.some((student) => student.id === item.studentId),
    );
    const negativeCountByStudent = new Map<number, number>();
    relatedRecords.forEach((item) => {
      if (item.scoreDelta >= 0) return;
      negativeCountByStudent.set(item.studentId, (negativeCountByStudent.get(item.studentId) ?? 0) + 1);
    });

    return [...primaryHomeroomStudents]
      .map((student) => ({
        ...student,
        negativeCount: negativeCountByStudent.get(student.id) ?? 0,
        noPet: !student.pet,
      }))
      .filter((student) => student.negativeCount > 0 || student.currentScore < 20 || student.noPet)
      .sort((left, right) => {
        if (right.negativeCount !== left.negativeCount) return right.negativeCount - left.negativeCount;
        if (left.currentScore !== right.currentScore) return left.currentScore - right.currentScore;
        return Number(right.noPet) - Number(left.noPet);
      })
      .slice(0, 6);
  }, [primaryHomeroomStudents, teacherRecentRecords]);

  const activeTeacherClass = useMemo(
    () => classes.find((item) => item.id === activeTeacherClassId) ?? null,
    [activeTeacherClassId, classes],
  );

  const activeTeacherClassStudents = useMemo(
    () =>
      students
        .filter((item) => item.classId === activeTeacherClassId)
        .sort((left, right) => right.currentScore - left.currentScore || right.currentPetLevel - left.currentPetLevel),
    [activeTeacherClassId, students],
  );

  const activeTeacherClassSummary = useMemo(() => {
    const studentCount = activeTeacherClassStudents.length;
    const averageScore = studentCount
      ? Math.round(activeTeacherClassStudents.reduce((sum, item) => sum + item.currentScore, 0) / studentCount)
      : 0;
    const highLevelCount = activeTeacherClassStudents.filter((item) => item.currentPetLevel >= 5).length;
    const noPetCount = activeTeacherClassStudents.filter((item) => !item.pet).length;
    const topStudent = activeTeacherClassStudents[0] ?? null;

    return {
      studentCount,
      averageScore,
      highLevelCount,
      noPetCount,
      topStudent,
    };
  }, [activeTeacherClassStudents]);

  const subjectLeaderboard = useMemo(() => {
    if (!isSubjectTeacher || !activeTeacherSubject) return [];

    return classes
      .map((item) => {
        const classStudents = students.filter((student) => student.classId === item.id);
        const averageScore = classStudents.length
          ? Math.round(classStudents.reduce((sum, student) => sum + student.currentScore, 0) / classStudents.length)
          : 0;
        const topStudent =
          [...classStudents].sort(
            (left, right) => right.currentScore - left.currentScore || right.currentPetLevel - left.currentPetLevel,
          )[0] ?? null;
        const recentCount = filteredTeacherRecentRecords.filter((record) => record.classId === item.id).length;

        return {
          classId: item.id,
          classLabel: `${item.gradeName} ${item.name}`,
          averageScore,
          recentCount,
          topStudent,
        };
      })
      .sort((left, right) => right.averageScore - left.averageScore || right.recentCount - left.recentCount)
      .slice(0, 6);
  }, [activeTeacherSubject, classes, filteredTeacherRecentRecords, isSubjectTeacher, students]);

  const homeroomTaskList = useMemo(() => {
    const tasks: Array<{ id: string; title: string; detail: string; actionLabel: string; onClickPath: string }> = [];

    if (primaryHomeroomClass && (primaryHomeroomClass.targetScore === null || primaryHomeroomClass.targetScore === undefined)) {
      tasks.push({
        id: 'target-score',
        title: '补充班级目标积分',
        detail: '当前本班还没有设置目标积分，建议尽快补齐，便于展示端形成成长目标。',
        actionLabel: '去设置',
        onClickPath: '/classes',
      });
    }

    const noPetStudents = primaryHomeroomStudents.filter((item) => !item.pet);
    if (noPetStudents.length > 0) {
      tasks.push({
        id: 'pet-profile',
        title: '补齐萌宠档案',
        detail: `还有 ${noPetStudents.length} 名学生未领养萌宠，建议班主任尽快引导完成成长档案。`,
        actionLabel: '看学生',
        onClickPath: '/students',
      });
    }

    const highNegativeStudents = homeroomWatchStudents.filter((item) => item.negativeCount >= 2);
    if (highNegativeStudents.length > 0) {
      tasks.push({
        id: 'negative-watch',
        title: '关注近期负向偏多学生',
        detail: `${highNegativeStudents.length} 名学生近期被提醒次数偏多，建议班主任尽快跟进沟通。`,
        actionLabel: '去查看',
        onClickPath: '/students',
      });
    }

    if (teacherRewardOrders.length > 0) {
      tasks.push({
        id: 'reward-orders',
        title: '跟进最近兑换',
        detail: `最近有 ${teacherRewardOrders.length} 条兑换记录，建议确认学生领取与班级反馈。`,
        actionLabel: '看兑换',
        onClickPath: '/rewards',
      });
    }

    return tasks.slice(0, 4);
  }, [homeroomWatchStudents, primaryHomeroomClass, primaryHomeroomStudents, teacherRewardOrders.length]);

  const teacherHeatZones = useMemo(() => {
    if (!isSubjectTeacher) return [];

    return classes
      .map((item) => {
        const classRecords = teacherRecentRecords.filter((record) => record.classId === item.id);
        const negativeCount = classRecords.filter((record) => record.scoreDelta < 0).length;
        const totalCount = classRecords.length;
        const latestRecord = classRecords[0] ?? null;

        return {
          classId: item.id,
          classLabel: `${item.gradeName} ${item.name}`,
          totalCount,
          negativeCount,
          latestAt: latestRecord?.createdAt ?? null,
        };
      })
      .sort((left, right) => {
        if (right.totalCount !== left.totalCount) return right.totalCount - left.totalCount;
        if (right.negativeCount !== left.negativeCount) return right.negativeCount - left.negativeCount;
        return left.classLabel.localeCompare(right.classLabel, 'zh-CN');
      })
      .slice(0, 5);
  }, [classes, isSubjectTeacher, teacherRecentRecords]);

  if (isTeacherDashboard) {
    return (
      <Shell
        title={isHomeroomTeacher ? '班级工作台' : '教学工作台'}
        subtitle={
          isHomeroomTeacher
            ? '面向班主任的本班运营首页，聚合班级管理、学生管理和学生评价。'
            : '面向任课教师的授课工作台，聚合授课班级、学生查看和学科评价。'
        }
        user={user}
        status={
          <>
            {loading ? <div className="status-card">正在读取工作台数据...</div> : null}
            {error ? <div className="status-card error">{error}</div> : null}
          </>
        }
      >
        <div className="dashboard-head">
          <div className="dashboard-title-block">
            <div className="dashboard-page-title">{isHomeroomTeacher ? '班主任工作台' : '任课教师工作台'}</div>
            <div className="dashboard-page-sub">{isHomeroomTeacher ? 'HOMEROOM DESK' : 'TEACHING DESK'}</div>
          </div>
          <div className="page-actions">
            <button className="ghost-button" type="button" onClick={() => navigate('/classes')}>
              {isHomeroomTeacher ? '进入我的班级' : '查看授课班级'}
            </button>
            <button
              className="present-trigger"
              type="button"
              onClick={() =>
                navigateToEvaluation(
                  isHomeroomTeacher
                    ? { classId: primaryHomeroomClass?.id, mode: 'single' }
                    : { classId: activeTeacherClassId, subjectCode: activeTeacherSubject, mode: 'single' },
                )
              }
            >
              <PresentationGlyph name="summary" className="present-trigger-icon" />
              {isHomeroomTeacher ? '进入学生评价' : '进入学科评价'}
            </button>
          </div>
        </div>

        {isHomeroomTeacher ? (
          <>
            <div className="teacher-hero-card">
              <div className="teacher-hero-main">
                <span className="teacher-hero-kicker">本班首页</span>
                <h3>
                  {primaryHomeroomClass ? `${primaryHomeroomClass.gradeName} ${primaryHomeroomClass.name}` : '当前未绑定班级'}
                </h3>
                <p>
                  {primaryHomeroomClass?.slogan ||
                    '这里聚合本班运营、学生管理和学生评价，班主任进入后台后先看这一页。'}
                </p>
                <div className="teacher-hero-actions">
                  <button
                    type="button"
                    className="toolbar-button"
                    onClick={() =>
                      navigateToEvaluation({ classId: primaryHomeroomClass?.id, mode: 'single' })
                    }
                  >
                    立即评价
                  </button>
                  <button type="button" className="ghost-button" onClick={() => navigate('/classes')}>
                    维护班级设置
                  </button>
                  <button type="button" className="ghost-button" onClick={() => navigate('/students')}>
                    进入学生管理
                  </button>
                </div>
              </div>
              <div className="teacher-hero-aside">
                <div className="teacher-hero-stat">
                  <span>班级人数</span>
                  <strong>{primaryHomeroomClass?.studentCount ?? 0}</strong>
                </div>
                <div className="teacher-hero-stat">
                  <span>当前总积分</span>
                  <strong>{primaryHomeroomClass?.classScore ?? 0}</strong>
                </div>
                <div className="teacher-hero-stat">
                  <span>目标积分</span>
                  <strong>{primaryHomeroomClass?.targetScore ?? '未设定'}</strong>
                </div>
              </div>
            </div>

            <div className="metric-row">
              <div className={`metric-card ${metricThemes[0]}`}>
                <div className="metric-card-head">
                  <div className="label">本班学生</div>
                  <PresentationGlyph name="student" className="metric-card-icon" />
                </div>
                <div className="metric-value-line">
                  <div className="value">{primaryHomeroomStudents.length}</div>
                </div>
                <div className="metric-sub">班主任日常管理的核心对象</div>
              </div>
              <div className={`metric-card ${metricThemes[1]}`}>
                <div className="metric-card-head">
                  <div className="label">班级均分</div>
                  <PresentationGlyph name="chart" className="metric-card-icon" />
                </div>
                <div className="metric-value-line">
                  <div className="value">
                    {primaryHomeroomStudents.length
                      ? Math.round(
                          primaryHomeroomStudents.reduce((sum, item) => sum + item.currentScore, 0) /
                            primaryHomeroomStudents.length,
                        )
                      : 0}
                  </div>
                </div>
                <div className="metric-sub">用于判断本班近期整体表现</div>
              </div>
              <div className={`metric-card ${metricThemes[2]}`}>
                <div className="metric-card-head">
                  <div className="label">待补萌宠档案</div>
                  <PresentationGlyph name="paw" className="metric-card-icon" />
                </div>
                <div className="metric-value-line">
                  <div className="value">{primaryHomeroomStudents.filter((item) => !item.pet).length}</div>
                </div>
                <div className="metric-sub">可提示学生完成萌宠领养</div>
              </div>
              <div className={`metric-card ${metricThemes[3]}`}>
                <div className="metric-card-head">
                  <div className="label">高频规则</div>
                  <PresentationGlyph name="fire" className="metric-card-icon" />
                </div>
                <div className="metric-value-line">
                  <div className="value">{teacherRules.length}</div>
                </div>
                <div className="metric-sub">适合课堂快速使用</div>
              </div>
            </div>

            <div className="teacher-quick-actions">
              <button
                type="button"
                className="teacher-quick-action-card"
                onClick={() => navigateToEvaluation({ classId: primaryHomeroomClass?.id, mode: 'single' })}
              >
                <strong>快速评价</strong>
                <span>直接进入本班单人、批量或按组评价。</span>
              </button>
              <button type="button" className="teacher-quick-action-card" onClick={() => navigate('/students')}>
                <strong>导入学生</strong>
                <span>进入学生管理，继续补录或导入本班学生。</span>
              </button>
              <button type="button" className="teacher-quick-action-card" onClick={() => navigate('/classes')}>
                <strong>修改口号</strong>
                <span>维护班级口号、目标积分和展示状态。</span>
              </button>
            </div>

            <div className="row-2 c50">
              <div className="panel">
                <div className="panel-title">班级运营入口</div>
                <div className="mini-list">
                  <button type="button" className="mini-list-item mini-list-item-button" onClick={() => navigate('/classes')}>
                    <div>
                      <strong>班级设置</strong>
                      <span>修改班级口号、目标积分和展示状态。</span>
                    </div>
                    <b>进入</b>
                  </button>
                  <button type="button" className="mini-list-item mini-list-item-button" onClick={() => navigate('/students')}>
                    <div>
                      <strong>学生管理</strong>
                      <span>导入学生、查看成长档案和宠物状态。</span>
                    </div>
                    <b>进入</b>
                  </button>
                  <button
                    type="button"
                    className="mini-list-item mini-list-item-button"
                    onClick={() => navigateToEvaluation({ classId: primaryHomeroomClass?.id, mode: 'single' })}
                  >
                    <div>
                      <strong>学生评价</strong>
                      <span>支持单人、批量和按组评价。</span>
                    </div>
                    <b>进入</b>
                  </button>
                  <button type="button" className="mini-list-item mini-list-item-button" onClick={() => navigate('/rewards')}>
                    <div>
                      <strong>兑换处理</strong>
                      <span>查看本班学生兑换记录，确认领取与后续反馈。</span>
                    </div>
                    <b>进入</b>
                  </button>
                </div>
              </div>
              <div className="panel">
                <div className="panel-title">班级提醒</div>
                <div className="alert-list">
                  <div className={`alert-item ${primaryHomeroomClass ? 'ok' : 'warn'}`}>
                    {primaryHomeroomClass ? '班级已绑定到工作台。' : '当前尚未绑定班级，请联系管理员。'}
                  </div>
                  <div className={`alert-item ${teacherMetrics.targetPendingClasses > 0 ? 'warn' : 'ok'}`}>
                    {teacherMetrics.targetPendingClasses > 0
                      ? `仍有 ${teacherMetrics.targetPendingClasses} 个班级未设置目标积分。`
                      : '班级目标积分已配置完整。'}
                  </div>
                  <div className={`alert-item ${teacherMetrics.noPetStudents > 0 ? 'warn' : 'ok'}`}>
                    {teacherMetrics.noPetStudents > 0
                      ? `还有 ${teacherMetrics.noPetStudents} 名学生未绑定萌宠档案。`
                      : '学生萌宠档案已基本完善。'}
                  </div>
                </div>
              </div>
            </div>

            <div className="row-2 c50">
              <div className="panel">
                <div className="panel-title">本班重点学生</div>
                <div className="rank-list">
                  {teacherTopStudents.map((item, index) => (
                    <div className="rank-item" key={item.id}>
                      <span className={`rank-num r${Math.min(index + 1, 3)}`}>{index + 1}</span>
                      <span className="name">{item.name}</span>
                      <span className="score">{item.currentScore} 分 / Lv.{item.currentPetLevel}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="panel">
                <div className="panel-title">本班推荐规则</div>
                <div className="insight-grid">
                  {teacherRules.map((item) => (
                    <div className="insight-chip" key={item.id}>
                      <strong>{item.scoreType === 'deduct' ? '-' : '+'}{item.scoreValue}</strong>
                      <span>{item.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="row-2 c50">
              <div className="panel">
                <div className="panel-title">最近评价记录</div>
                <div className="mini-list">
                  {teacherRecentRecords.map((item) => {
                    const matchedStudent = students.find((row) => row.id === item.studentId);
                    return (
                      <div className="mini-list-item" key={`${item.id}-${item.createdAt}`}>
                        <div>
                          <strong>
                            {matchedStudent?.name ?? `学生#${item.studentId}`} · {item.scoreDelta > 0 ? '+' : ''}
                            {item.scoreDelta} 分
                          </strong>
                          <span>{item.ruleName || item.tag || item.dimension || item.sceneCode || '学生评价'} · {new Date(item.createdAt).toLocaleString('zh-CN')}</span>
                        </div>
                        <b>{item.operatorName || item.sourceRole}</b>
                      </div>
                    );
                  })}
                  {teacherRecentRecords.length === 0 ? (
                    <div className="mini-list-item">
                      <div>
                        <strong>暂无评价记录</strong>
                        <span>提交一次学生评价后，这里会展示最近动态。</span>
                      </div>
                      <b>待更新</b>
                    </div>
                  ) : null}
                </div>
              </div>
              <div className="panel">
                <div className="panel-title">待处理兑换</div>
                <div className="mini-list">
                  {teacherRewardOrders.map((item) => (
                    <div className="mini-list-item" key={item.id}>
                      <div>
                        <strong>{item.student.name} · {item.reward.name}</strong>
                        <span>消耗 {item.scoreCost} 分 · {new Date(item.createdAt).toLocaleString('zh-CN')}</span>
                      </div>
                      <b>{item.status}</b>
                    </div>
                  ))}
                  {teacherRewardOrders.length === 0 ? (
                    <div className="mini-list-item">
                      <div>
                        <strong>暂无兑换记录</strong>
                        <span>本班学生发生兑换后，这里会显示最近处理情况。</span>
                      </div>
                      <b>正常</b>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="row-2 c50">
              <div className="panel">
                <div className="panel-title">本周行为分布</div>
                <div className="insight-grid">
                  <div className="insight-chip">
                    <strong>{homeroomBehaviorStats.positiveCount}</strong>
                    <span>正向评价</span>
                  </div>
                  <div className="insight-chip">
                    <strong>{homeroomBehaviorStats.negativeCount}</strong>
                    <span>负向评价</span>
                  </div>
                  {homeroomBehaviorStats.dimensions.map((item) => (
                    <div className="insight-chip" key={item.name}>
                      <strong>{item.count}</strong>
                      <span>{item.name}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="panel">
                <div className="panel-title">正负向趋势</div>
                <div className="mini-list">
                  {homeroomBehaviorStats.trend.map((item) => (
                    <div className="mini-list-item" key={item.date}>
                      <div>
                        <strong>{item.date}</strong>
                        <span>正向 {item.positive} 次 · 负向 {item.negative} 次</span>
                      </div>
                      <b>{item.positive - item.negative >= 0 ? `+${item.positive - item.negative}` : item.positive - item.negative}</b>
                    </div>
                  ))}
                  {homeroomBehaviorStats.trend.length === 0 ? (
                    <div className="mini-list-item">
                      <div>
                        <strong>暂无趋势数据</strong>
                        <span>产生更多评价记录后，这里会显示本周正负向变化。</span>
                      </div>
                      <b>待更新</b>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="panel">
              <div className="panel-title">待关注学生</div>
              <div className="mini-list">
                {homeroomWatchStudents.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className="mini-list-item mini-list-item-button"
                    onClick={() => navigateWithQuery('/students', { classId: item.classId, studentId: item.id, statsView: 'student' })}
                  >
                    <div>
                      <strong>{item.name}</strong>
                      <span>
                        当前 {item.currentScore} 分 · Lv.{item.currentPetLevel}
                        {item.negativeCount > 0 ? ` · 近期待提醒 ${item.negativeCount} 次` : ''}
                        {item.noPet ? ' · 未领养萌宠' : ''}
                      </span>
                    </div>
                    <b>{item.negativeCount > 0 ? '关注' : item.noPet ? '补档' : '低分'}</b>
                  </button>
                ))}
                {homeroomWatchStudents.length === 0 ? (
                  <div className="mini-list-item">
                    <div>
                      <strong>暂无重点关注对象</strong>
                      <span>当前本班学生状态较平稳，这里会自动聚合近期需关注学生。</span>
                    </div>
                    <b>稳定</b>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="panel">
              <div className="panel-title">本班任务清单</div>
              <div className="mini-list">
                {homeroomTaskList.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className="mini-list-item mini-list-item-button"
                    onClick={() => navigate(item.onClickPath)}
                  >
                    <div>
                      <strong>{item.title}</strong>
                      <span>{item.detail}</span>
                    </div>
                    <b>{item.actionLabel}</b>
                  </button>
                ))}
                {homeroomTaskList.length === 0 ? (
                  <div className="mini-list-item">
                    <div>
                      <strong>当前任务清空</strong>
                      <span>本班目标积分、萌宠档案和近期关注项都较完整。</span>
                    </div>
                    <b>完成</b>
                  </div>
                ) : null}
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="teacher-hero-card">
              <div className="teacher-hero-main">
                <span className="teacher-hero-kicker">授课首页</span>
                <h3>{teacherSubjectGroups.length > 0 ? `${teacherSubjectGroups.length} 个学科视角` : '当前未配置授课学科'}</h3>
                <p>
                  任课老师进入后台后，先看自己教哪些学科、覆盖哪些班，再进入学科评价和学生查看。
                </p>
                <div className="teacher-hero-actions">
                  <button
                    type="button"
                    className="toolbar-button"
                    onClick={() => navigateToEvaluation({ classId: activeTeacherClassId, subjectCode: activeTeacherSubject, mode: 'single' })}
                  >
                    进入学科评价
                  </button>
                  <button type="button" className="ghost-button" onClick={() => navigate('/classes')}>
                    查看授课班级
                  </button>
                  <button type="button" className="ghost-button" onClick={() => navigate('/rules')}>
                    查看规则
                  </button>
                </div>
              </div>
              <div className="teacher-hero-aside">
                <div className="teacher-hero-stat">
                  <span>授课班级</span>
                  <strong>{teacherMetrics.classCount}</strong>
                </div>
                <div className="teacher-hero-stat">
                  <span>覆盖学生</span>
                  <strong>{teacherMetrics.studentCount}</strong>
                </div>
                <div className="teacher-hero-stat">
                  <span>学科数</span>
                  <strong>{teacherSubjectGroups.length}</strong>
                </div>
              </div>
            </div>

            <div className="metric-row">
              <div className={`metric-card ${metricThemes[0]}`}>
                <div className="metric-card-head">
                  <div className="label">授课班级</div>
                  <PresentationGlyph name="school" className="metric-card-icon" />
                </div>
                <div className="metric-value-line">
                  <div className="value">{teacherMetrics.classCount}</div>
                </div>
                <div className="metric-sub">当前有权限的授课范围</div>
              </div>
              <div className={`metric-card ${metricThemes[1]}`}>
                <div className="metric-card-head">
                  <div className="label">学生人数</div>
                  <PresentationGlyph name="student" className="metric-card-icon" />
                </div>
                <div className="metric-value-line">
                  <div className="value">{teacherMetrics.studentCount}</div>
                </div>
                <div className="metric-sub">当前工作台可见学生总数</div>
              </div>
              <div className={`metric-card ${metricThemes[2]}`}>
                <div className="metric-card-head">
                  <div className="label">平均积分</div>
                  <PresentationGlyph name="chart" className="metric-card-icon" />
                </div>
                <div className="metric-value-line">
                  <div className="value">{teacherMetrics.averageScore}</div>
                </div>
                <div className="metric-sub">用于感知授课班级整体状态</div>
              </div>
              <div className={`metric-card ${metricThemes[3]}`}>
                <div className="metric-card-head">
                  <div className="label">高频可用规则</div>
                  <PresentationGlyph name="fire" className="metric-card-icon" />
                </div>
                <div className="metric-value-line">
                  <div className="value">{teacherMetrics.highFrequencyRuleCount}</div>
                </div>
                <div className="metric-sub">已按你的学科和权限过滤</div>
              </div>
            </div>

            <div className="row-2 c50">
              <div className="panel">
                <div className="panel-title">学科入口</div>
                <div className="mini-list">
                  {teacherSubjectGroups.map((item) => (
                    <button
                      type="button"
                      className="mini-list-item mini-list-item-button"
                      key={item.subjectCode}
                      onClick={() => navigateToEvaluation({ subjectCode: item.subjectCode, classId: activeTeacherClassId, mode: 'single' })}
                    >
                      <div>
                        <strong>{item.subjectCode}</strong>
                        <span>{item.classNames.join('、')} · 覆盖 {item.studentCount} 名学生</span>
                      </div>
                      <b>{item.classIds.size} 班</b>
                    </button>
                  ))}
                  {teacherSubjectGroups.length === 0 ? (
                    <div className="mini-list-item">
                      <div>
                        <strong>暂未配置学科</strong>
                        <span>请管理员补齐任课教师的班级-学科范围。</span>
                      </div>
                      <b>待处理</b>
                    </div>
                  ) : null}
                </div>
              </div>
              <div className="panel">
                <div className="panel-title">教学提醒</div>
                <div className="alert-list">
                  <div className={`alert-item ${teacherMetrics.classCount > 0 ? 'ok' : 'warn'}`}>
                    当前已纳入工作台的班级 {teacherMetrics.classCount} 个。
                  </div>
                  <div className={`alert-item ${teacherSubjectCodes.length > 0 ? 'ok' : 'warn'}`}>
                    {teacherSubjectCodes.length > 0
                      ? `当前已绑定 ${teacherSubjectCodes.join('、')} 学科规则范围。`
                      : '当前尚未配置授课学科，请联系管理员补齐权限。'}
                  </div>
                  <div className={`alert-item ${teacherMetrics.noPetStudents > 0 ? 'warn' : 'ok'}`}>
                    {teacherMetrics.noPetStudents > 0
                      ? `有 ${teacherMetrics.noPetStudents} 名学生未绑定萌宠档案。`
                      : '学生萌宠档案已基本完善。'}
                  </div>
                </div>
              </div>
            </div>

            <div className="row-2 c50">
              <div className="panel">
                <div className="panel-title">高分学生</div>
                <div className="rank-list">
                  {teacherTopStudents.map((item, index) => (
                    <div className="rank-item" key={item.id}>
                      <span className={`rank-num r${Math.min(index + 1, 3)}`}>{index + 1}</span>
                      <span className="name">{item.name} · {item.className}</span>
                      <span className="score">{item.currentScore} 分 / Lv.{item.currentPetLevel}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="panel">
                <div className="panel-title">授课班级概览</div>
                <div className="mini-list">
                  {teacherClassCards.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      className="mini-list-item mini-list-item-button"
                      onClick={() => navigateWithQuery('/students', { classId: item.id, statsView: 'class' })}
                    >
                      <div>
                        <strong>{item.gradeName} {item.name}</strong>
                        <span>{item.studentCount} 人 · 当前总积分 {item.classScore}</span>
                      </div>
                      <b>{item.displayStatus === 'enabled' ? '展示中' : '未展示'}</b>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="row-2 c50">
              <div className="panel">
                <div className="panel-title">学科快捷规则</div>
                <div className="tabs">
                  {teacherSubjectGroups.map((item) => (
                    <button
                      key={item.subjectCode}
                      className={`tab${activeTeacherSubject === item.subjectCode ? ' active' : ''}`}
                      type="button"
                      onClick={() => setActiveTeacherSubject(item.subjectCode)}
                    >
                      {item.subjectCode}
                    </button>
                  ))}
                </div>
                <div className="insight-grid">
                  {filteredTeacherRules.map((item) => (
                    <div className="insight-chip" key={item.id}>
                      <strong>{item.subjectCode || '通用'}</strong>
                      <span>{item.name}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="panel">
                <div className="panel-title">最近授课评价</div>
                <div className="mini-list">
                  {filteredTeacherRecentRecords.map((item) => {
                    const matchedStudent = students.find((row) => row.id === item.studentId);
                    return (
                      <div className="mini-list-item" key={`${item.id}-${item.createdAt}`}>
                        <div>
                          <strong>
                            {matchedStudent?.name ?? `学生#${item.studentId}`} · {item.subjectCode || '通用'}
                          </strong>
                          <span>{item.ruleName || item.tag || item.dimension || item.sceneCode || '学科评价'} · {new Date(item.createdAt).toLocaleString('zh-CN')}</span>
                        </div>
                        <b>{item.scoreDelta > 0 ? '+' : ''}{item.scoreDelta} 分</b>
                      </div>
                    );
                  })}
                  {filteredTeacherRecentRecords.length === 0 ? (
                    <div className="mini-list-item">
                      <div>
                        <strong>暂无授课评价</strong>
                        <span>{activeTeacherSubject ? `${activeTeacherSubject} 学科暂无最近记录。` : '提交一次学科评价后，这里会显示最近教学记录。'}</span>
                      </div>
                      <b>待更新</b>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="panel">
              <div className="panel-title">学科榜单</div>
              <div className="mini-list">
                {subjectLeaderboard.map((item, index) => (
                  <button
                    key={`${item.classId}-${item.classLabel}`}
                    type="button"
                    className="mini-list-item mini-list-item-button"
                    onClick={() => {
                      setActiveTeacherClassId(item.classId);
                      navigateWithQuery('/students', { classId: item.classId, statsView: 'class' });
                    }}
                  >
                    <div>
                      <strong>{index + 1}. {item.classLabel}</strong>
                      <span>
                        班均 {item.averageScore} 分 · 最近评价 {item.recentCount} 条
                        {item.topStudent ? ` · 尖子生 ${item.topStudent.name}` : ''}
                      </span>
                    </div>
                    <b>{item.topStudent ? `${item.topStudent.currentScore} 分` : '查看'}</b>
                  </button>
                ))}
                {subjectLeaderboard.length === 0 ? (
                  <div className="mini-list-item">
                    <div>
                      <strong>暂无学科榜单</strong>
                      <span>切换到有学科和学生数据的账号后，这里会显示各班表现排名。</span>
                    </div>
                    <b>待更新</b>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="panel">
              <div className="panel-title">班级表现摘要</div>
              <div className="tabs">
                {classes.map((item) => (
                  <button
                    key={item.id}
                    className={`tab${activeTeacherClassId === item.id ? ' active' : ''}`}
                    type="button"
                    onClick={() => setActiveTeacherClassId(item.id)}
                  >
                    {item.name}
                  </button>
                ))}
              </div>
              <div className="detail-grid">
                <div className="detail-card">
                  <h4>{activeTeacherClass ? `${activeTeacherClass.gradeName} ${activeTeacherClass.name}` : '当前班级'}</h4>
                  <div className="detail-list">
                    <div><span>学生人数</span><strong>{activeTeacherClassSummary.studentCount} 人</strong></div>
                    <div><span>平均积分</span><strong>{activeTeacherClassSummary.averageScore} 分</strong></div>
                    <div><span>Lv.5+ 学生</span><strong>{activeTeacherClassSummary.highLevelCount} 人</strong></div>
                    <div><span>未领养萌宠</span><strong>{activeTeacherClassSummary.noPetCount} 人</strong></div>
                  </div>
                </div>
                <div className="detail-card">
                  <h4>班级尖子生</h4>
                  {activeTeacherClassSummary.topStudent ? (
                    <div className="detail-list">
                      <div><span>姓名</span><strong>{activeTeacherClassSummary.topStudent.name}</strong></div>
                      <div><span>当前积分</span><strong>{activeTeacherClassSummary.topStudent.currentScore} 分</strong></div>
                      <div><span>成长等级</span><strong>Lv.{activeTeacherClassSummary.topStudent.currentPetLevel}</strong></div>
                      <div><span>萌宠状态</span><strong>{activeTeacherClassSummary.topStudent.pet?.name ?? '未领养'}</strong></div>
                    </div>
                  ) : (
                    <div className="table-empty">当前班级暂无学生数据。</div>
                  )}
                </div>
              </div>
              <div className="mini-list">
                {activeTeacherClassStudents.slice(0, 5).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className="mini-list-item mini-list-item-button"
                    onClick={() => navigateWithQuery('/students', { classId: item.classId, studentId: item.id, statsView: 'student' })}
                  >
                    <div>
                      <strong>{item.name}</strong>
                      <span>{item.currentScore} 分 · Lv.{item.currentPetLevel} · {item.pet?.name ?? '未领养萌宠'}</span>
                    </div>
                    <b>查看</b>
                  </button>
                ))}
                {activeTeacherClassStudents.length === 0 ? (
                  <div className="mini-list-item">
                    <div>
                      <strong>暂无学生数据</strong>
                      <span>切换到有学生的班级后，这里会展示学生表现摘要。</span>
                    </div>
                    <b>待更新</b>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="panel">
              <div className="panel-title">最近教学热区</div>
              <div className="mini-list">
                {teacherHeatZones.map((item) => (
                  <button
                    key={item.classId}
                    type="button"
                    className="mini-list-item mini-list-item-button"
                    onClick={() => {
                      setActiveTeacherClassId(item.classId);
                      navigateWithQuery('/students', { classId: item.classId, statsView: 'class' });
                    }}
                  >
                    <div>
                      <strong>{item.classLabel}</strong>
                      <span>
                        最近评价 {item.totalCount} 条 · 负向 {item.negativeCount} 条
                        {item.latestAt ? ` · 最近一次 ${new Date(item.latestAt).toLocaleString('zh-CN')}` : ''}
                      </span>
                    </div>
                    <b>{item.totalCount > 0 ? '关注' : '查看'}</b>
                  </button>
                ))}
                {teacherHeatZones.length === 0 ? (
                  <div className="mini-list-item">
                    <div>
                      <strong>暂无教学热区</strong>
                      <span>产生更多授课评价后，这里会聚合评价最频繁或需要关注的班级。</span>
                    </div>
                    <b>待更新</b>
                  </div>
                ) : null}
              </div>
            </div>
          </>
        )}
      </Shell>
    );
  }

  const cockpitAlerts = useMemo(() => {
    const items: Array<{ level: 'ok' | 'warn' | 'critical'; text: string }> = [];
    const lowClasses = [...classes].sort((a, b) => a.classScore - b.classScore).slice(0, 2);
    lowClasses.forEach((c) => {
      items.push({ level: 'warn', text: `${c.gradeName} ${c.name} 积分偏低（${c.classScore} 分），建议关注班级激励频率` });
    });
    const noPetStudents = students.filter((s) => !s.pet).length;
    if (noPetStudents > 0) {
      items.push({ level: 'warn', text: `仍有 ${noPetStudents} 名学生未绑定萌宠成长档案` });
    }
    const uncoveredClasses = classes.filter((c) => !c.homeroomTeacher?.id).length;
    if (uncoveredClasses > 0) {
      items.push({ level: 'warn', text: `${uncoveredClasses} 个班级尚未配置班主任` });
    }
    const offlineTerminals = displayTerminals.filter((t) => t.onlineStatus === 'offline').length;
    if (offlineTerminals > 0) {
      items.push({ level: 'warn', text: `${offlineTerminals} 台展示终端当前离线` });
    }
    if (items.length === 0) {
      items.push({ level: 'ok', text: '系统运行稳定，各项指标正常' });
    }
    return items;
  }, [classes, displayTerminals, students]);

  const cockpitHeatRows = cockpitHeatMap.rows;
  const cockpitHeatCols = cockpitHeatMap.cols;
  const cockpitHeatData = cockpitHeatMap.data;

  return (
    <Shell
      title="校级驾驶舱"
      subtitle="用于校级成果展示、活跃度追踪与领导视察汇报"
      user={user}
      status={
        <>
          {loading ? <div className="status-card">正在读取后台实时数据...</div> : null}
          {error ? <div className="status-card error">{error}</div> : null}
          {presentMessage ? <div className={`status-card ${presentMessage.includes('失败') ? 'error' : 'success'}`}>{presentMessage}</div> : null}
        </>
      }
    >
      {/* 顶部标题与操作 */}
      <div className="ck-header">
        <div className="ck-header-left">
          <div className="ck-title">校级数据驾驶舱</div>
          <div className="ck-subtitle">SCHOOL DATA COCKPIT</div>
        </div>
        <div className="ck-header-actions">
          <button className="ck-action-btn ck-action-secondary" type="button" onClick={handleEnterLiveInsight}>
            <PresentationGlyph name="chart" className="present-trigger-icon" />
            实时数据透视
          </button>
          <button className="ck-action-btn ck-action-primary" type="button" onClick={() => void handleEnterPresentMode()} disabled={presentSubmitting}>
            <PresentationGlyph name="display" className="present-trigger-icon" />
            {presentSubmitting ? '切换中...' : '汇报展示模式'}
          </button>
        </div>
      </div>

      {/* 第一层：核心 KPI */}
      <div className="ck-kpi-row">
        <div className="ck-kpi mc-blue">
          <div className="ck-kpi-icon"><PresentationGlyph name="chart" /></div>
          <div className="ck-kpi-body">
            <div className="ck-kpi-label">全校总积分</div>
            <div className="ck-kpi-value">{cockpitKpi.totalScore.toLocaleString('zh-CN')}</div>
            <div className="ck-kpi-sub">人均 {cockpitKpi.avgScore} 分</div>
          </div>
        </div>
        <div className="ck-kpi mc-green">
          <div className="ck-kpi-icon"><PresentationGlyph name="school" /></div>
          <div className="ck-kpi-body">
            <div className="ck-kpi-label">活跃班级</div>
            <div className="ck-kpi-value">{cockpitKpi.displayReadyClasses}<span className="ck-kpi-frac">/{cockpitKpi.classCount}</span></div>
            <div className="ck-kpi-sub">{cockpitKpi.classCount > 0 ? `${((cockpitKpi.displayReadyClasses / cockpitKpi.classCount) * 100).toFixed(0)}% 覆盖率` : '暂无数据'}</div>
          </div>
        </div>
        <div className="ck-kpi mc-purple">
          <div className="ck-kpi-icon"><PresentationGlyph name="student" /></div>
          <div className="ck-kpi-body">
            <div className="ck-kpi-label">活跃学生</div>
            <div className="ck-kpi-value">{cockpitKpi.activeStudents}<span className="ck-kpi-frac">/{cockpitKpi.studentCount}</span></div>
            <div className="ck-kpi-sub">{cockpitKpi.studentCount > 0 ? `${((cockpitKpi.activeStudents / cockpitKpi.studentCount) * 100).toFixed(0)}% 参与率` : '暂无数据'}</div>
          </div>
        </div>
        <div className="ck-kpi mc-teal">
          <div className="ck-kpi-icon"><PresentationGlyph name="fire" /></div>
          <div className="ck-kpi-body">
            <div className="ck-kpi-label">正向行为</div>
            <div className="ck-kpi-value">{cockpitKpi.positiveEvents.toLocaleString('zh-CN')}</div>
            <div className="ck-kpi-sub">负向 {cockpitKpi.negativeEvents} 次</div>
          </div>
        </div>
        <div className="ck-kpi mc-gold">
          <div className="ck-kpi-icon"><PresentationGlyph name="medal" /></div>
          <div className="ck-kpi-body">
            <div className="ck-kpi-label">勋章发放</div>
            <div className="ck-kpi-value">{cockpitKpi.honorsGranted}</div>
            <div className="ck-kpi-sub">累计授予</div>
          </div>
        </div>
        <div className="ck-kpi mc-red">
          <div className="ck-kpi-icon"><PresentationGlyph name="paw" /></div>
          <div className="ck-kpi-body">
            <div className="ck-kpi-label">风险学生</div>
            <div className="ck-kpi-value">{cockpitKpi.riskCount}</div>
            <div className="ck-kpi-sub">需关注</div>
          </div>
        </div>
      </div>

      {/* 第二层：主视觉中心 —— 趋势图 + AI 洞察 */}
      <div className="ck-hero-row">
        <div className="ck-hero-chart panel">
          <div className="panel-title">班级积分Top8</div>
          <div className="line-chart-wrap">
            <svg viewBox="0 0 500 180" className="dashboard-line-chart" aria-hidden="true">
              <defs>
                <linearGradient id="ckTrendArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2980b9" stopOpacity="0.32" />
                  <stop offset="100%" stopColor="#2980b9" stopOpacity="0" />
                </linearGradient>
              </defs>
              <line x1="50" y1="10" x2="50" y2="150" className="chart-axis" />
              <line x1="50" y1="150" x2="460" y2="150" className="chart-axis" />
              {cockpitTrendSvg.points.length > 0 ? (
                <>
                  <polyline points={cockpitTrendSvg.area} className="chart-area" style={{ fill: 'url(#ckTrendArea)' }} />
                  <polyline points={cockpitTrendSvg.line} className="chart-line" />
                  {cockpitTrendSvg.points.map((p, i) => (
                    <g key={`${p.x}-${p.y}-${i}`}>
                      <circle cx={p.x} cy={p.y} r={i === cockpitTrendSvg.points.length - 1 ? 5 : 3.5} className="chart-dot" />
                      <text x={p.x} y={p.y - 10} textAnchor="middle" className="chart-value">{p.value}</text>
                      <text x={p.x} y="168" textAnchor="middle" className="chart-label">{p.label}</text>
                    </g>
                  ))}
                </>
              ) : (
                <text x="250" y="85" textAnchor="middle" fill="#999" fontSize="13">暂无班级积分数据</text>
              )}
            </svg>
          </div>
        </div>
        <div className="ck-hero-insight panel">
          <div className="panel-title">AI 全局洞察</div>
          {cockpitAiInsight ? (
            <div className="ck-ai-content">
              <div className="ck-ai-summary">{cockpitAiInsight.summary}</div>
              <div className="ck-ai-divider" />
              <div className="ck-ai-section">
                <div className="ck-ai-section-label">建议动作</div>
                <div className="ck-ai-text">{cockpitAiInsight.suggestion}</div>
              </div>
              {cockpitAiInsight.generatedAt ? (
                <div className="ck-ai-meta">
                  {cockpitAiInsight.source === 'ark' ? 'AI 生成' : '规则推导'} · {new Date(cockpitAiInsight.generatedAt).toLocaleDateString('zh-CN')}
                </div>
              ) : null}
            </div>
          ) : (
            <div className="ck-ai-content">
              <div className="ck-ai-summary">正在加载 AI 洞察数据...</div>
            </div>
          )}
        </div>
      </div>

      {/* 第三层：数据结构分析 */}
      <div className="ck-section-label"><span>数据结构分析</span></div>
      <div className="ck-grid-3">
        <div className="panel ck-class-compare-panel">
          <div className="panel-title">
            <span>班级积分对比</span>
            <select
              className="filter-select ck-class-compare-grade"
              value={cockpitCompareGradeName}
              onChange={(e) => setCockpitCompareGradeName(e.target.value)}
              aria-label="切换年级查看班级积分"
            >
              {rankGradeOptions.map((grade) => (
                <option key={grade} value={grade}>
                  {grade}
                </option>
              ))}
            </select>
          </div>
          <div className="bar-chart ck-class-compare-chart">
            {cockpitClassCompareBars.map((item) => (
              <button
                type="button"
                key={item.id}
                className="bar-row ck-class-compare-row"
                onClick={() => navigateWithQuery('/classes', { classId: item.id })}
              >
                <span className="bar-label">{item.name}</span>
                <div className="bar-track">
                  <div
                    className={`bar-fill ${item.colorIndex % 3 === 0 ? 'bar-blue' : item.colorIndex % 3 === 1 ? 'bar-green' : 'bar-red'}`}
                    style={{ width: `${Math.max(28, Math.round((item.value / item.maxScore) * 100))}%` }}
                  >
                    {item.value}
                  </div>
                </div>
                <span className="bar-val">{item.value}</span>
              </button>
            ))}
            {cockpitClassCompareBars.length === 0 ? (
              <div className="ck-empty">该年级暂无班级数据</div>
            ) : null}
          </div>
        </div>
        <div className="panel">
          <div className="panel-title">行为维度分布</div>
          <div className="bar-chart">
            {(cockpitRuleDistribution.length > 0 ? cockpitRuleDistribution : Array.from(rules.reduce((m, r) => { const k = r.dimension || '未分类'; m.set(k, (m.get(k) ?? 0) + 1); return m; }, new Map<string, number>())).map(([name, value]) => ({ name, value }))).slice(0, 6).map((item, index) => {
              const maxVal = Math.max(...(cockpitRuleDistribution.length > 0 ? cockpitRuleDistribution : [{ name: '', value: 1 }]).map((x) => x.value), 1);
              return (
                <div className="bar-row" key={item.name}>
                  <span className="bar-label">{item.name}</span>
                  <div className="bar-track">
                    <div className={`bar-fill ${index % 3 === 0 ? 'bar-blue' : index % 3 === 1 ? 'bar-green' : 'bar-red'}`} style={{ width: `${Math.max(28, Math.round((item.value / maxVal) * 100))}%` }}>
                      {item.value}
                    </div>
                  </div>
                  <span className="bar-val">{item.value}</span>
                </div>
              );
            })}
          </div>
        </div>
        <div className="panel">
          <div className="panel-title">学科事件分布</div>
          <div className="bar-chart">
            {cockpitSubjectDistribution.slice(0, 6).map((item, index) => {
              const maxVal = Math.max(...cockpitSubjectDistribution.map((x) => x.value), 1);
              return (
                <div className="bar-row" key={item.name}>
                  <span className="bar-label">{ruleSubjectLabelMap[item.name] ?? item.name}</span>
                  <div className="bar-track">
                    <div className={`bar-fill ${index % 3 === 0 ? 'bar-blue' : index % 3 === 1 ? 'bar-green' : 'bar-red'}`} style={{ width: `${Math.max(28, Math.round((item.value / maxVal) * 100))}%` }}>
                      {item.value}
                    </div>
                  </div>
                  <span className="bar-val">{item.value}</span>
                </div>
              );
            })}
            {cockpitSubjectDistribution.length === 0 ? <div className="ck-empty">暂无学科事件数据</div> : null}
          </div>
        </div>
      </div>

      {/* 第四层：评价热力图 */}
      {cockpitHeatRows.length > 0 ? (
        <>
          <div className="ck-section-label"><span>评价时段分布</span></div>
          <div className="panel ck-heatmap-panel">
            <div className="ck-heatmap-grid" style={{ gridTemplateColumns: `80px repeat(${cockpitHeatCols.length}, 1fr)` }}>
              <div className="ck-heatmap-cell ck-heatmap-corner" />
              {cockpitHeatCols.map((col) => (
                <div key={col} className="ck-heatmap-cell ck-heatmap-col-header">{col}</div>
              ))}
              {cockpitHeatRows.map((row, ri) => (
                <div className="ck-heatmap-row-group" key={row} style={{ display: 'contents' }}>
                  <div className="ck-heatmap-cell ck-heatmap-row-header">{row}</div>
                  {cockpitHeatCols.map((col, ci) => {
                    const count = cockpitHeatData[ri]?.values[ci] ?? 0;
                    const intensity = count >= 8 ? 4 : count >= 5 ? 3 : count >= 2 ? 2 : count >= 1 ? 1 : 0;
                    return (
                      <div key={`${row}-${col}`} className={`ck-heatmap-cell ck-heat-${intensity}`}>{count}</div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </>
      ) : null}

      {/* 第五层：榜单与亮点 */}
      <div className="ck-section-label"><span>榜单与亮点</span></div>
      <div className="ck-grid-3">
        <div className="panel">
          <div className="panel-title">明星班级</div>
          <div className="ck-rank-table">
            {cockpitTopClasses.slice(0, 6).map((item, index) => (
              <button
                key={item.id}
                type="button"
                className="ck-rank-row"
                onClick={() => navigateWithQuery('/classes', { classId: item.id })}
              >
                <span className={`rank-num r${Math.min(index + 1, 3)}`}>{index + 1}</span>
                <span className="ck-rank-name">{item.name}</span>
                <span className="ck-rank-score">{item.currentScoreTotal} 分</span>
              </button>
            ))}
          </div>
        </div>
        <div className="panel">
          <div className="panel-title">明星学生</div>
          <div className="ck-rank-table">
            {cockpitTopStudents.slice(0, 6).map((item, index) => (
              <button
                key={item.studentId}
                type="button"
                className="ck-rank-row"
                onClick={() => navigateWithQuery('/students', { studentId: item.studentId, classId: item.classId, statsView: 'student' })}
              >
                <span className={`rank-num r${Math.min(index + 1, 3)}`}>{index + 1}</span>
                <span className="ck-rank-name">{item.studentName}<span className="ck-rank-class">{item.className}</span></span>
                <span className="ck-rank-score">{item.currentScore} 分</span>
              </button>
            ))}
          </div>
        </div>
        <div className="panel">
          <div className="panel-title">最新荣誉</div>
          <div className="ck-honor-flow">
            {cockpitRecentHonors.map((item) => (
              <div className="ck-honor-item" key={item.id}>
                <div className="ck-honor-dot" />
                <div className="ck-honor-body">
                  <strong>{item.studentName ?? item.className} · {item.honorName}</strong>
                  <span>{item.grantedByName ? `由 ${item.grantedByName} 授予` : '系统授予'} · {new Date(item.grantedAt).toLocaleDateString('zh-CN')}</span>
                </div>
              </div>
            ))}
            {cockpitRecentHonors.length === 0 ? <div className="ck-empty">暂无荣誉记录</div> : null}
          </div>
        </div>
      </div>

      {/* 第六层：学生成长分层 + 最新动态 */}
      <div className="ck-section-label"><span>学生成长与最近动态</span></div>
      <div className="row-2 c50">
        <div className="panel">
          <div className="panel-title">学生成长分层</div>
          <div className="ck-layer-grid">
            <div className="ck-layer-card ck-layer-high">
              <strong>{cockpitStudentLayers.highGrowth}</strong>
              <span>高成长 (Lv.5+)</span>
            </div>
            <div className="ck-layer-card ck-layer-mid">
              <strong>{cockpitStudentLayers.stable}</strong>
              <span>稳定层 (Lv.2-4)</span>
            </div>
            <div className="ck-layer-card ck-layer-low">
              <strong>{cockpitStudentLayers.low}</strong>
              <span>待提升 (Lv.0-1)</span>
            </div>
            <div className="ck-layer-card ck-layer-info">
              <strong>{cockpitStudentLayers.withPet}</strong>
              <span>已领养萌宠</span>
            </div>
            <div className="ck-layer-card ck-layer-info">
              <strong>{cockpitStudentLayers.over100}</strong>
              <span>积分过百</span>
            </div>
            <div className="ck-layer-card ck-layer-warn">
              <strong>{cockpitStudentLayers.noPet}</strong>
              <span>未绑定萌宠</span>
            </div>
          </div>
        </div>
        <div className="panel">
          <div className="panel-title">最新评价动态</div>
          <div className="ck-activity-list">
            {recentScoreRecords.slice(0, 8).map((item) => (
              <div className="ck-activity-item" key={`${item.id}-${item.createdAt}`}>
                <span className={`ck-activity-delta ${item.scoreDelta >= 0 ? 'up' : 'down'}`}>{item.scoreDelta > 0 ? '+' : ''}{item.scoreDelta}</span>
                <div className="ck-activity-body">
                  <strong>{item.operatorName ?? item.sourceRole} → {item.ruleName || item.tag || item.dimension || '评价'}</strong>
                  <span>{new Date(item.createdAt).toLocaleString('zh-CN', { hour12: false, month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            ))}
            {recentScoreRecords.length === 0 ? <div className="ck-empty">暂无最近评价动态</div> : null}
          </div>
        </div>
      </div>

      {/* 第七层：风险预警 */}
      <div className="ck-section-label"><span>风险预警</span></div>
      <div className="row-2 c50">
        <div className="panel">
          <div className="panel-title">风险学生</div>
          <div className="ck-risk-table">
            {cockpitRiskStudents.slice(0, 6).map((item) => (
              <button
                key={item.studentId}
                type="button"
                className="ck-risk-row"
                onClick={() => navigateWithQuery('/students', { studentId: item.studentId, statsView: 'student' })}
              >
                <span className={`ck-risk-badge ${item.riskLevel}`}>{item.riskLevel === 'high' ? '高' : item.riskLevel === 'medium' ? '中' : '低'}</span>
                <div className="ck-risk-body">
                  <strong>{item.studentName}</strong>
                  <span>{item.className} · 负向 {item.negativeCount} 次 · 净变化 {item.scoreDelta}</span>
                </div>
                <span className="ck-risk-reason">{item.reason}</span>
              </button>
            ))}
            {cockpitRiskStudents.length === 0 ? <div className="ck-empty">暂无明显风险学生</div> : null}
          </div>
        </div>
        <div className="panel">
          <div className="panel-title">系统预警</div>
          <div className="alert-list">
            {cockpitAlerts.map((item, index) => (
              <div className={`alert-item ${item.level === 'ok' ? 'ok' : 'warn'}`} key={`${item.level}-${index}`}>
                {item.text}
              </div>
            ))}
          </div>
          <div className="ck-terminal-strip">
            <div className="ck-terminal-stat">
              <span>展示终端</span>
              <strong>{cockpitKpi.onlineTerminals}<span className="ck-kpi-frac">/{cockpitKpi.terminalCount}</span></strong>
            </div>
            <div className="ck-terminal-stat">
              <span>活跃天数</span>
              <strong>{cockpitKpi.activeDays}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* 第八层：组织治理（仅管理员可见） */}
      {canViewGovernance ? (
        <>
          <div className="ck-section-label"><span>组织治理概览</span></div>
          <div className="ck-gov-strip">
            <div className="ck-gov-card" role="button" tabIndex={0} onClick={() => navigateWithQuery('/teachers', { teacherView: 'all' })} onKeyDown={(e) => { if (e.key === 'Enter') navigateWithQuery('/teachers', { teacherView: 'all' }); }}>
              <span>教师账号</span>
              <strong>{governanceMetrics.teacherUsers.length}</strong>
            </div>
            <div className="ck-gov-card" role="button" tabIndex={0} onClick={() => navigateWithQuery('/classes', { teacherStatus: 'unassigned' })} onKeyDown={(e) => { if (e.key === 'Enter') navigateWithQuery('/classes', { teacherStatus: 'unassigned' }); }}>
              <span>待补班主任</span>
              <strong>{governanceMetrics.uncoveredClasses}</strong>
            </div>
            <div className="ck-gov-card" role="button" tabIndex={0} onClick={() => navigateWithQuery('/organization', { activeTab: 'accounts', quickFilter: 'disabled' })} onKeyDown={(e) => { if (e.key === 'Enter') navigateWithQuery('/organization', { activeTab: 'accounts', quickFilter: 'disabled' }); }}>
              <span>停用账号</span>
              <strong>{governanceMetrics.disabledUsers}</strong>
            </div>
            <div className="ck-gov-card" role="button" tabIndex={0} onClick={() => navigateWithQuery('/organization', { activeTab: 'accounts', quickFilter: 'high_privilege' })} onKeyDown={(e) => { if (e.key === 'Enter') navigateWithQuery('/organization', { activeTab: 'accounts', quickFilter: 'high_privilege' }); }}>
              <span>高权限账号</span>
              <strong>{governanceMetrics.highPrivilegeUsers}</strong>
            </div>
            <div className="ck-gov-card">
              <span>跨班教师</span>
              <strong>{governanceMetrics.multiClassTeachers}</strong>
            </div>
          </div>
          <div className="row-2 c50">
            <div className="panel">
              <div className="panel-title">教师覆盖观察</div>
              <div className="mini-list">
                {governanceHighlights.gradeCoverage.map((item) => (
                  <button
                    type="button"
                    className="mini-list-item mini-list-item-button"
                    key={item.gradeName}
                    onClick={() => navigateWithQuery('/teachers', { teacherView: 'all', statsView: 'grade', gradeName: item.gradeName })}
                  >
                    <div>
                      <strong>{item.gradeName}</strong>
                      <span>当前年级已建立教师覆盖关系</span>
                    </div>
                    <b>{item.teacherCount} 人</b>
                  </button>
                ))}
              </div>
            </div>
            <div className="panel">
              <div className="panel-title">账号治理提醒</div>
              <div className="mini-list">
                {governanceHighlights.riskyAccounts.map((item) => (
                  <button
                    type="button"
                    className="mini-list-item mini-list-item-button"
                    key={item.id}
                    onClick={() => navigateWithQuery('/organization', { activeTab: 'accounts', userId: item.id })}
                  >
                    <div>
                      <strong>{item.name}</strong>
                      <span>
                        {item.roleName} · {item.lastLoginAt ? '已停用' : '从未登录'}
                      </span>
                    </div>
                    <b>{item.status === 'enabled' ? '未登录' : '已停用'}</b>
                  </button>
                ))}
                {governanceHighlights.riskyAccounts.length === 0 ? (
                  <div className="mini-list-item">
                    <div>
                      <strong>治理状态良好</strong>
                      <span>当前无明显风险信号</span>
                    </div>
                    <b>正常</b>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </>
      ) : null}
    </Shell>
  );
}

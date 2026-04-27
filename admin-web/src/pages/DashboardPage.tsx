import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PresentationGlyph } from '../components/PresentationGlyph';
import { Shell } from '../components/Shell';
import { metricThemes } from '../constants/admin';
import type { 
  AdminClass,
  AdminStudent,
  HonorRecord,
  PermissionUser,
  RewardOrder,
  ScoreRecord,
  ScoreRule
} from '../lib/api';
import { adminApi } from '../lib/api';
import type {
  AdminState
} from '../types/admin';

type DashboardPageProps = Omit<AdminState, 'token'> & {
  token: string;
};

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
  const [rankTab, setRankTab] = useState<'class' | 'student' | 'honor'>('class');
  const [presentSubmitting, setPresentSubmitting] = useState(false);
  const [presentMessage, setPresentMessage] = useState<string | null>(null);
  const [permissionUsers, setPermissionUsers] = useState<PermissionUser[]>([]);
  const [honorRecords, setHonorRecords] = useState<HonorRecord[]>([]);
  const [teacherRecentRecords, setTeacherRecentRecords] = useState<ScoreRecord[]>([]);
  const [teacherRewardOrders, setTeacherRewardOrders] = useState<RewardOrder[]>([]);
  const [activeTeacherSubject, setActiveTeacherSubject] = useState<string>('');
  const [activeTeacherClassId, setActiveTeacherClassId] = useState<number | null>(null);

  useEffect(() => {
    if (isTeacherDashboard) {
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
  }, [isTeacherDashboard, token]);

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

  const metrics = useMemo(() => {
    const totalScore = classes.reduce((sum, item) => sum + item.currentScoreTotal, 0);
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

  const gradeStats = useMemo(() => {
    const grouped = new Map<string, { score: number; count: number }>();
    for (const item of classes) {
      const current = grouped.get(item.gradeName) ?? { score: 0, count: 0 };
      current.score += item.currentScoreTotal;
      current.count += 1;
      grouped.set(item.gradeName, current);
    }

    const rows = Array.from(grouped.entries()).map(([gradeName, value]) => ({
      gradeName,
      score: value.score,
      width: 0,
    }));
    const maxScore = Math.max(...rows.map((item) => item.score), 1);

    return rows.map((item, index) => ({
      ...item,
      width: `${Math.max(28, Math.round((item.score / maxScore) * 100))}%`,
      theme: index % 3 === 0 ? 'bar-blue' : index % 3 === 1 ? 'bar-green' : 'bar-red',
    }));
  }, [classes]);

  const topClasses = useMemo(
    () =>
      [...classes]
        .sort((left, right) => right.currentScoreTotal - left.currentScoreTotal)
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
      return topClasses.map((item) => ({
        id: `class-${item.id}`,
        name: item.name,
        score: `${item.currentScoreTotal} 分`,
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
  }, [rankTab, topClasses, topHonorStudents, topStudents]);

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
      .sort((left, right) => left.currentScoreTotal - right.currentScoreTotal)
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

  const trendPoints = useMemo(() => {
    const source = [...classes]
      .sort((left, right) => right.currentScoreTotal - left.currentScoreTotal)
      .slice(0, 7)
      .map((item) => item.currentScoreTotal);
    const values = source.length > 0 ? source.reverse() : [120, 180, 150, 210, 260, 240, 300];
    const max = Math.max(...values, 1);
    const min = Math.min(...values, 0);
    const range = Math.max(max - min, 1);

    return values.map((value, index) => {
      const x = 40 + index * 60;
      const y = 150 - ((value - min) / range) * 100;
      return { x, y, value };
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
        (left, right) => right.studentCount - left.studentCount || right.currentScoreTotal - left.currentScoreTotal,
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
        .sort((left, right) => right.currentScoreTotal - left.currentScoreTotal || right.studentCount - left.studentCount)
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
            ? '面向班主任的本班运营首页，聚合班级管理、学生管理和班级评价。'
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
              {isHomeroomTeacher ? '进入班级评价' : '进入学科评价'}
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
                    '这里聚合本班运营、学生管理和班级评价，班主任进入后台后先看这一页。'}
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
                  <strong>{primaryHomeroomClass?.currentScoreTotal ?? 0}</strong>
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
                      <strong>班级评价</strong>
                      <span>支持单人、批量和按组评价。</span>
                    </div>
                    <b>进入</b>
                  </button>
                  <button type="button" className="mini-list-item mini-list-item-button" onClick={() => navigate('/rewards')}>
                    <div>
                      <strong>兑换处理</strong>
                      <span>查看奖励中心并跟进本班兑换。</span>
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
                          <span>{item.ruleName || item.tag || item.dimension || item.sceneCode || '班级评价'} · {new Date(item.createdAt).toLocaleString('zh-CN')}</span>
                        </div>
                        <b>{item.operatorName || item.sourceRole}</b>
                      </div>
                    );
                  })}
                  {teacherRecentRecords.length === 0 ? (
                    <div className="mini-list-item">
                      <div>
                        <strong>暂无评价记录</strong>
                        <span>提交一次班级评价后，这里会展示最近动态。</span>
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
                        <span>{item.studentCount} 人 · 当前总积分 {item.currentScoreTotal}</span>
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
      <div className="dashboard-head">
        <div className="dashboard-title-block">
          <div className="dashboard-page-title">校级数据驾驶舱</div>
          <div className="dashboard-page-sub">SCHOOL DATA COCKPIT</div>
        </div>
        <button className="present-trigger" type="button" onClick={() => void handleEnterPresentMode()} disabled={presentSubmitting}>
          <PresentationGlyph name="display" className="present-trigger-icon" />
          {presentSubmitting ? '切换中...' : '汇报展示模式'}
        </button>
      </div>
      <div className="metric-row">
        {metrics.map((item, index) => (
          <div key={item.label} className={`metric-card ${metricThemes[index % metricThemes.length]}`}>
            <div className="metric-card-head">
              <div className="label">{item.label}</div>
              <PresentationGlyph name={item.icon} className="metric-card-icon" />
            </div>
            <div className="metric-value-line">
              <div className="value">{item.value}</div>
              {item.valueSuffix ? <div className="metric-value-suffix">{item.valueSuffix}</div> : null}
            </div>
            <div className="metric-footer">
              {item.note ? (
                <div className="metric-note up">
                  <span>{item.note}</span>
                  {item.noteHint ? <span className="metric-note-hint">{item.noteHint}</span> : null}
                </div>
              ) : null}
              {item.sub ? <div className="metric-sub">{item.sub}</div> : null}
            </div>
          </div>
        ))}
      </div>
      <div className="row-2 c64">
        <div className="panel">
          <div className="panel-title">年级参与度对比</div>
          <div className="bar-chart">
            {gradeStats.map((item) => (
              <div className="bar-row" key={item.gradeName}>
                <span className="bar-label">{item.gradeName}</span>
                <div className="bar-track">
                  <div className={`bar-fill ${item.theme}`} style={{ width: item.width }}>
                    {item.score}
                  </div>
                </div>
                <span className="bar-val">{item.score}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="panel">
          <div className="panel-title">近 7 天成长趋势</div>
          <div className="line-chart-wrap">
            <svg viewBox="0 0 460 190" className="dashboard-line-chart" aria-hidden="true">
              <defs>
                <linearGradient id="trendArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#5dade2" stopOpacity="0.45" />
                  <stop offset="100%" stopColor="#5dade2" stopOpacity="0" />
                </linearGradient>
              </defs>
              <line x1="40" y1="20" x2="40" y2="150" className="chart-axis" />
              <line x1="40" y1="150" x2="420" y2="150" className="chart-axis" />
              <polyline points={trendArea} className="chart-area" />
              <polyline points={trendLine} className="chart-line" />
              {trendPoints.map((point, index) => (
                <g key={`${point.x}-${point.y}`}>
                  <circle cx={point.x} cy={point.y} r={index === trendPoints.length - 1 ? 5 : 4} className="chart-dot" />
                  <text x={point.x} y={point.y - 10} textAnchor="middle" className="chart-value">
                    {point.value}
                  </text>
                  <text x={point.x} y="172" textAnchor="middle" className="chart-label">
                    {`节点${index + 1}`}
                  </text>
                </g>
              ))}
            </svg>
          </div>
        </div>
      </div>
      <div className="row-2 c50">
        <div className="panel">
          <div className="panel-title">
            <span>高光榜单</span>
            <div className="tabs">
              <button className={`tab${rankTab === 'class' ? ' active' : ''}`} type="button" onClick={() => setRankTab('class')}>
                明星班级
              </button>
              <button className={`tab${rankTab === 'student' ? ' active' : ''}`} type="button" onClick={() => setRankTab('student')}>
                明星学生
              </button>
              <button className={`tab${rankTab === 'honor' ? ' active' : ''}`} type="button" onClick={() => setRankTab('honor')}>
                荣誉榜
              </button>
            </div>
          </div>
          <div className="rank-list">
            {rankRows.map((item, index) => (
              <div className="rank-item" key={item.id}>
                <span className={`rank-num r${Math.min(index + 1, 3)}`}>{index + 1}</span>
                <span className="name">{item.name}</span>
                <span className="score">{item.score}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="panel">
          <div className="panel-title">最新荣誉</div>
          <div className="msg-list">
            {recentHighlights.map((item) => (
              <div className="msg-item" key={`${item.time}-${item.text}`}>
                <span className="time">{item.time}</span>
                <span className="badge">✦</span>
                {item.text}
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="row-2 c50">
        <div className="panel">
          <div className="panel-title">重点预警</div>
          <div className="alert-list">
            {alerts.map((item, index) => (
              <div className={`alert-item ${index === alerts.length - 1 && item.includes('系统正常') ? 'ok' : 'warn'}`} key={item}>
                {item}
              </div>
            ))}
          </div>
        </div>
        <div className="panel">
          <div className="panel-title">班级积分分布</div>
          <div className="distribution-card">
            <div className="distribution-ring" />
            <div className="distribution-legend">
              <div className="legend-item"><span className="legend-dot blue" />高活跃班级 {topClasses.length}</div>
              <div className="legend-item"><span className="legend-dot gold" />已接入展示大屏 {classes.filter((item) => item.displayStatus === 'enabled').length}</div>
              <div className="legend-item"><span className="legend-dot gray" />待提升班级 {Math.max(classes.length - topClasses.length, 0)}</div>
            </div>
          </div>
        </div>
      </div>
      <div className="section-divider">
        <span>多维数据洞察</span>
      </div>
      <div className="row-2 c50">
        <div className="panel">
          <div className="panel-title">规则维度分布</div>
          <div className="insight-grid">
            {Array.from(
              rules.reduce((map, rule) => {
                const key = rule.dimension || '未分类';
                map.set(key, (map.get(key) ?? 0) + 1);
                return map;
              }, new Map<string, number>()),
            )
              .slice(0, 4)
              .map(([name, count]) => (
                <div className="insight-chip" key={name}>
                  <strong>{count}</strong>
                  <span>{name}</span>
                </div>
              ))}
          </div>
        </div>
        <div className="panel">
          <div className="panel-title">学生成长概览</div>
          <div className="insight-grid">
            <div className="insight-chip">
              <strong>{students.filter((item) => item.currentPetLevel >= 3).length}</strong>
              <span>Lv.3+ 学生</span>
            </div>
            <div className="insight-chip">
              <strong>{students.filter((item) => item.pet).length}</strong>
              <span>已领养萌宠</span>
            </div>
            <div className="insight-chip">
              <strong>{students.filter((item) => item.currentScore >= 100).length}</strong>
              <span>积分过百</span>
            </div>
            <div className="insight-chip">
              <strong>{classes.filter((item) => item.studentCount > 0).length}</strong>
              <span>已开班级</span>
            </div>
          </div>
        </div>
      </div>
      <div className="section-divider">
        <span>组织治理概览</span>
      </div>
      <div className="metric-strip">
        <div className="metric-card">
          <span>教师账号</span>
          <strong>{governanceMetrics.teacherUsers.length}</strong>
          <p>当前已纳入教学岗位体系的账号数量。</p>
          <button className="ghost-button" type="button" onClick={() => navigateWithQuery('/teachers', { teacherView: 'all' })}>
            查看教师管理
          </button>
        </div>
        <div className="metric-card">
          <span>待补班主任</span>
          <strong>{governanceMetrics.uncoveredClasses}</strong>
          <p>仍未完成班主任绑定的班级数量。</p>
          <button className="ghost-button" type="button" onClick={() => navigateWithQuery('/classes', { teacherStatus: 'unassigned' })}>
            查看待补班级
          </button>
        </div>
        <div className="metric-card">
          <span>停用账号</span>
          <strong>{governanceMetrics.disabledUsers}</strong>
          <p>建议校级定期巡检的停用账号数量。</p>
          <button className="ghost-button" type="button" onClick={() => navigateWithQuery('/organization', { activeTab: 'accounts', quickFilter: 'disabled' })}>
            查看停用账号
          </button>
        </div>
        <div className="metric-card">
          <span>高权限账号</span>
          <strong>{governanceMetrics.highPrivilegeUsers}</strong>
          <p>超管与学校管理员等高权限身份数量。</p>
          <button className="ghost-button" type="button" onClick={() => navigateWithQuery('/organization', { activeTab: 'accounts', quickFilter: 'high_privilege' })}>
            查看高权限账号
          </button>
        </div>
      </div>
      <div className="row-2 c50">
        <div className="panel">
          <div className="panel-title">教师覆盖观察</div>
          <div className="mini-list">
            <div className="mini-list-item">
              <div>
                <strong>跨班教师</strong>
                <span>同时负责多个班级的教师账号，适合作为排课与负载观察重点。</span>
              </div>
              <b>{governanceMetrics.multiClassTeachers} 人</b>
            </div>
            {governanceHighlights.gradeCoverage.map((item) => (
              <button
                type="button"
                className="mini-list-item mini-list-item-button"
                key={item.gradeName}
                onClick={() => navigateWithQuery('/teachers', { teacherView: 'all', statsView: 'grade', gradeName: item.gradeName })}
              >
                <div>
                  <strong>{item.gradeName}</strong>
                  <span>当前年级已建立教师覆盖关系。</span>
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
                    {item.roleName} · {item.lastLoginAt ? '已停用，建议确认是否仍需保留' : '从未登录，建议核查是否完成交付'}
                  </span>
                </div>
                <b>{item.status === 'enabled' ? '未登录' : '已停用'}</b>
              </button>
            ))}
            {governanceHighlights.riskyAccounts.length === 0 ? (
              <div className="mini-list-item">
                <div>
                  <strong>治理状态良好</strong>
                  <span>当前没有明显的停用/未登录账号风险信号。</span>
                </div>
                <b>正常</b>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </Shell>
  );
}

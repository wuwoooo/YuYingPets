import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { DatePickerField } from '../components/DatePickerField';
import { Modal } from '../components/Modal';
import { useAdminView } from '../context/AdminViewContext';
import { useConfirmDialog } from '../context/ConfirmDialogContext';
import { ScoreConfirmModal } from '../components/evaluation/ScoreConfirmModal';
import { EvaluationStudentGrid } from '../components/evaluation/EvaluationStudentGrid';
import { EvaluationToolbar } from '../components/evaluation/EvaluationToolbar';
import { StudentScoreModal } from '../components/evaluation/StudentScoreModal';
import type { ScoreModalTab, ScoreTarget, StudentSortKey } from '../components/evaluation/evaluationUtils';
import { expandRuleSubjectCodes } from '../components/evaluation/evaluationUtils';
import { ScoreRecordListItem, ScoreRecordReverseModal } from '../components/ScoreRecordReverseModal';
import { Shell } from '../components/Shell';
import { useEvaluationRules } from '../hooks/useEvaluationRules';
import type {
  AdminClass,
  AdminStudent,
  AnalyticsData,
  ClassScoreRecord,
  ClassScoreRankingRow,
  ClassGroupSummary,
  GroupScoreRankingRow,
  GroupScoreRecordRow,
  Honor,
  HonorRecord,
  ScoreRecord,
  ScoreRule,
  SessionScope,
  SessionUser,
  TeacherReviewContext,
} from '../lib/api';
import { adminApi } from '../lib/api';
import { canGrantStudentHonors } from '../utils/adminPermissions';
import { canShowClassScoreRecordReverse, canShowScoreRecordReverse, formatScoreDelta, formatScoreRecordLabel } from '../utils/scoreRecordReverse';

type EvaluationPageProps = {
  token: string;
  user: SessionUser | null;
  scopes: SessionScope[];
  classes: AdminClass[];
  students: AdminStudent[];
  rules: ScoreRule[];
  honors: Honor[];
  loading: boolean;
  error: string | null;
  onSaved: () => Promise<void>;
};

type EvaluationMode = 'single' | 'batch' | 'group';
type ClassEvaluationMode = 'single' | 'batch';

type RecentSubmitRecord = {
  scoreRecordId: number;
  studentId: number;
  studentName: string;
  ruleName: string;
  scoreDelta: number;
  currentScore: number;
};

type ReverseTarget = {
  record: ScoreRecord;
  studentName: string;
  currentScore: number | null;
};

type ClassReverseTarget = {
  record: ClassScoreRecord;
  className: string;
  currentScore: number | null;
};

const roleTitleMap: Record<string, { title: string; subtitle: string }> = {
  homeroom_teacher: {
    title: '学生评价',
    subtitle: '面向本班学生进行课堂、作业、纪律等规则化评价。',
  },
  subject_teacher: {
    title: '学科评价',
    subtitle: '班级与学科请在页面右上角切换；本页不再重复班级、年级下拉筛选。',
  },
};

function getClassRuleMetricLabel(name: string) {
  return name.replace(/(优秀|待改进)$/u, '').trim();
}

function formatClassRuleGroupScore(group: { add?: ScoreRule; deduct?: ScoreRule }) {
  const parts: string[] = [];
  if (group.add) parts.push(`+${group.add.scoreValue}`);
  if (group.deduct) parts.push(`-${group.deduct.scoreValue}`);
  return parts.join(' / ');
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(value));
}

function normalizeDateValue(value?: string | null) {
  if (!value) return '';
  const direct = value.slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(direct)) return direct;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '';
  return parsed.toISOString().slice(0, 10);
}

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

export function EvaluationPage({
  token,
  user,
  scopes,
  classes,
  students,
  rules,
  honors,
  loading,
  error,
  onSaved,
}: EvaluationPageProps) {
  const location = useLocation();
  const isClassEvaluationPage = location.pathname === '/class-evaluation';
  const [searchParams] = useSearchParams();
  const { activeSubjectView } = useAdminView();
  const isSubjectTeacher = user?.roleCode === 'subject_teacher';
  const rolePresentation = roleTitleMap[user?.roleCode ?? ''] ?? {
    title: '学生评价',
    subtitle: '统一查看学生评价规则、提交评价并回看最近记录。',
  };
  const canManageClassScore = ['super_admin', 'school_admin', 'academic_admin', 'moral_admin', 'grade_admin'].includes(user?.roleCode ?? '');
  const allowGrantStudentHonors = canGrantStudentHonors(user?.roleCode);
  const [studentHonorRecords, setStudentHonorRecords] = useState<HonorRecord[]>([]);
  const [studentHonorsLoading, setStudentHonorsLoading] = useState(false);

  const classIdsInScope = useMemo(() => {
    const rawIds = scopes.map((item) => item.classId).filter((item): item is number => typeof item === 'number');
    return Array.from(new Set(rawIds));
  }, [scopes]);

  const subjectCodesByClass = useMemo(() => {
    const map = new Map<number, string[]>();
    scopes.forEach((item) => {
      if (typeof item.classId !== 'number' || !item.subjectCode) return;
      const current = map.get(item.classId) ?? [];
      if (!current.includes(item.subjectCode)) current.push(item.subjectCode);
      map.set(item.classId, current);
    });
    return map;
  }, [scopes]);

  const availableClasses = useMemo(() => {
    if (['super_admin', 'school_admin', 'academic_admin', 'moral_admin', 'grade_admin'].includes(user?.roleCode ?? '')) {
      return classes;
    }
    return classes.filter((item) => classIdsInScope.includes(item.id));
  }, [classIdsInScope, classes, user?.roleCode]);

  const [selectedClassId, setSelectedClassId] = useState<number | null>(availableClasses[0]?.id ?? null);
  const [mode, setMode] = useState<EvaluationMode>('single');
  const [classMode, setClassMode] = useState<ClassEvaluationMode>('single');
  const [rankGradeName, setRankGradeName] = useState<string>('');
  const [studentEvalGradeName, setStudentEvalGradeName] = useState<string>('');
  const [classSingleGradeName, setClassSingleGradeName] = useState<string>('');
  const [classBatchGradeName, setClassBatchGradeName] = useState<string>('');
  const [selectedClassScoreIds, setSelectedClassScoreIds] = useState<number[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
  const [selectedStudentIds, setSelectedStudentIds] = useState<number[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [subjectFilter, setSubjectFilter] = useState<string>('all');
  const [studentKeyword, setStudentKeyword] = useState('');
  const [studentSort, setStudentSort] = useState<StudentSortKey>('name-asc');
  const [groupFilter, setGroupFilter] = useState<number | 'all'>('all');
  const [scoreModalTarget, setScoreModalTarget] = useState<ScoreTarget | null>(null);
  const [scoreModalTab, setScoreModalTab] = useState<ScoreModalTab>('score');
  const [modalScoreRecords, setModalScoreRecords] = useState<ScoreRecord[]>([]);
  const [studentScoreOverrides, setStudentScoreOverrides] = useState<Record<number, number>>({});
  const [confirmRule, setConfirmRule] = useState<ScoreRule | null>(null);
  const [confirmRemark, setConfirmRemark] = useState('');
  const [records, setRecords] = useState<ScoreRecord[]>([]);
  const [classScoreRecords, setClassScoreRecords] = useState<ClassScoreRecord[]>([]);
  const [groups, setGroups] = useState<ClassGroupSummary[]>([]);
  const [pageLoading, setPageLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [recordStudentFilter, setRecordStudentFilter] = useState<number | 'all'>('all');
  const [recordKeyword, setRecordKeyword] = useState('');
  const [recentSubmitRecords, setRecentSubmitRecords] = useState<RecentSubmitRecord[]>([]);
  const [reverseTarget, setReverseTarget] = useState<ReverseTarget | null>(null);
  const [classReverseTarget, setClassReverseTarget] = useState<ClassReverseTarget | null>(null);
  const [reverseLoading, setReverseLoading] = useState(false);
  const today = new Date().toISOString().slice(0, 10);
  const summaryDefaultStartDate = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const [summaryStartDate, setSummaryStartDate] = useState(summaryDefaultStartDate);
  const [summaryEndDate, setSummaryEndDate] = useState(today);
  const [recordStartDate, setRecordStartDate] = useState(summaryDefaultStartDate);
  const [recordEndDate, setRecordEndDate] = useState(today);
  const [semesterStartDate, setSemesterStartDate] = useState('');
  const [semesterEndDate, setSemesterEndDate] = useState('');
  const [classScoreStartDate, setClassScoreStartDate] = useState('');
  const [classScoreEndDate, setClassScoreEndDate] = useState('');
  const [classScoreDateInitialized, setClassScoreDateInitialized] = useState(false);
  const [classRankingRows, setClassRankingRows] = useState<ClassScoreRankingRow[]>([]);
  const [classRankingLoading, setClassRankingLoading] = useState(false);
  const [classRankingError, setClassRankingError] = useState<string | null>(null);
  const [summaryStudentKeyword, setSummaryStudentKeyword] = useState('');
  const [scoreSummaryLoading, setScoreSummaryLoading] = useState(false);
  const [scoreSummaryError, setScoreSummaryError] = useState<string | null>(null);
  const [scoreSummaryRows, setScoreSummaryRows] = useState<NonNullable<AnalyticsData['scoreDetailSummary']>>([]);
  const [groupScoreManageOpen, setGroupScoreManageOpen] = useState(false);
  const [groupScoreManageTargetId, setGroupScoreManageTargetId] = useState<number | null>(null);
  const [groupScoreRankingRows, setGroupScoreRankingRows] = useState<GroupScoreRankingRow[]>([]);
  const [groupScoreRecords, setGroupScoreRecords] = useState<GroupScoreRecordRow[]>([]);
  const [groupScoreRecordsLoading, setGroupScoreRecordsLoading] = useState(false);
  const [groupScoreRecordsError, setGroupScoreRecordsError] = useState<string | null>(null);
  const [groupScoreDeltaInput, setGroupScoreDeltaInput] = useState('');
  const [groupScoreRemarkInput, setGroupScoreRemarkInput] = useState('');
  const [groupScoreSubmitLoading, setGroupScoreSubmitLoading] = useState(false);
  const [groupScoreResetLoading, setGroupScoreResetLoading] = useState(false);
  const [groupScoreRecordFilter, setGroupScoreRecordFilter] = useState<'current' | 'all'>('current');
  const { confirm } = useConfirmDialog();

  const homeroomClassIds = useMemo(
    () => availableClasses.filter((item) => item.homeroomTeacher?.id === user?.id).map((item) => item.id),
    [availableClasses, user?.id],
  );

  const displayedRecords = useMemo(() => {
    let rows = records;
    if (recordKeyword.trim()) {
      const keyword = recordKeyword.trim().toLowerCase();
      rows = rows.filter((item) => {
        const student = students.find((studentRow) => studentRow.id === item.studentId);
        const studentName = student?.name ?? '';
        const haystack = [studentName, item.ruleName, item.tag, item.dimension, item.remark]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return haystack.includes(keyword);
      });
    }
    return rows.slice(0, 30);
  }, [recordKeyword, records, students]);

  const selectedClass = availableClasses.find((item) => item.id === selectedClassId) ?? null;
  const classStudents = useMemo(
    () => students.filter((item) => item.classId === selectedClassId),
    [selectedClassId, students],
  );

  const displayClassStudents = useMemo(
    () =>
      classStudents.map((item) => ({
        ...item,
        currentScore: studentScoreOverrides[item.id] ?? item.currentScore,
      })),
    [classStudents, studentScoreOverrides],
  );
  const groupRankMap = useMemo(() => {
    const sorted = [...groups].sort(
      (left, right) =>
        (right.groupScore ?? 0) - (left.groupScore ?? 0) ||
        right.studentCount - left.studentCount ||
        left.groupNo - right.groupNo,
    );
    const rankMap = new Map<number, number>();
    let lastScore: number | null = null;
    let currentRank = 0;
    sorted.forEach((item, index) => {
      if (lastScore === null || (item.groupScore ?? 0) !== lastScore) {
        currentRank = index + 1;
        lastScore = item.groupScore ?? 0;
      }
      rankMap.set(item.id, currentRank);
    });
    return rankMap;
  }, [groups]);
  const sortedOverviewGroups = useMemo(
    () =>
      [...groups].sort(
        (left, right) =>
          (groupRankMap.get(left.id) ?? Number.MAX_SAFE_INTEGER) - (groupRankMap.get(right.id) ?? Number.MAX_SAFE_INTEGER) ||
          (right.groupScore ?? 0) - (left.groupScore ?? 0) ||
          right.studentCount - left.studentCount ||
          left.groupNo - right.groupNo,
      ),
    [groupRankMap, groups],
  );
  const scoreSummaryTitle = isSubjectTeacher ? '评分明细汇总' : '积分明细汇总';
  const scoreSummaryDescription = isSubjectTeacher
    ? '按时间查看当前学科、当前班级里，你给学生打出的评价积分汇总。'
    : '按时间查看当前班级学生获得的积分汇总。';
  const normalizedScoreSummaryRows = useMemo(() => {
    const summaryMap = new Map(scoreSummaryRows.map((item) => [item.studentId, item]));
    return [...classStudents]
      .map((student) => {
        const matched = summaryMap.get(student.id);
        if (matched) return matched;
        return {
          studentId: student.id,
          studentName: student.name,
          classId: student.classId,
          className: selectedClass?.name ?? '',
          totalScoreDelta: 0,
          positiveCount: 0,
          negativeCount: 0,
          recordCount: 0,
          records: [],
        };
      })
      .sort(
        (left, right) =>
          right.totalScoreDelta - left.totalScoreDelta ||
          right.recordCount - left.recordCount ||
          left.studentName.localeCompare(right.studentName, 'zh-CN'),
      );
  }, [classStudents, scoreSummaryRows, selectedClass?.name]);
  const filteredScoreSummaryRows = useMemo(() => {
    const keyword = summaryStudentKeyword.trim().toLowerCase();
    if (!keyword) return normalizedScoreSummaryRows;
    return normalizedScoreSummaryRows.filter((item) => item.studentName.toLowerCase().includes(keyword));
  }, [normalizedScoreSummaryRows, summaryStudentKeyword]);
  const scoreSummaryPeriodStats = useMemo(() => {
    let recordCount = 0;
    let totalAddScore = 0;
    let totalDeductScore = 0;
    scoreSummaryRows.forEach((student) => {
      student.records.forEach((record) => {
        recordCount += 1;
        if (record.scoreDelta >= 0) {
          totalAddScore += record.scoreDelta;
        } else {
          totalDeductScore += Math.abs(record.scoreDelta);
        }
      });
    });
    return { recordCount, totalAddScore, totalDeductScore };
  }, [scoreSummaryRows]);
  const scoreRecordQuery = useMemo(
    () => ({
      classId: selectedClassId ?? undefined,
      ...(recordStudentFilter !== 'all' ? { studentId: recordStudentFilter } : {}),
      ...(isSubjectTeacher && activeSubjectView?.subjectCode ? { subjectCode: activeSubjectView.subjectCode } : {}),
      startDate: recordStartDate,
      endDate: recordEndDate,
    }),
    [activeSubjectView?.subjectCode, isSubjectTeacher, recordEndDate, recordStartDate, recordStudentFilter, selectedClassId],
  );
  const classScoreRecordQuery = useMemo(
    () => ({
      classId: selectedClassId ?? undefined,
      ...(classScoreStartDate ? { startDate: classScoreStartDate } : {}),
      ...(classScoreEndDate ? { endDate: classScoreEndDate } : {}),
    }),
    [classScoreEndDate, classScoreStartDate, selectedClassId],
  );
  const classScoreDateMax = semesterEndDate && semesterEndDate > today ? semesterEndDate : today;
  const canManageGroupScore = ['super_admin', 'school_admin', 'academic_admin', 'homeroom_teacher'].includes(user?.roleCode ?? '');
  const summaryQuickRange = useMemo(() => {
    const monthStart = `${today.slice(0, 8)}01`;
    const quick7dStart = shiftDate(today, -6);
    const quick30dStart = shiftDate(today, -29);
    if (summaryEndDate === today) {
      if (summaryStartDate === quick7dStart) return '7d';
      if (summaryStartDate === quick30dStart) return '30d';
      if (summaryStartDate === monthStart) return 'month';
    }
    return null;
  }, [summaryEndDate, summaryStartDate, today]);
  const activeGroupScoreRow = useMemo(
    () => groupScoreRankingRows.find((item) => item.id === groupScoreManageTargetId) ?? null,
    [groupScoreManageTargetId, groupScoreRankingRows],
  );

  useEffect(() => {
    setStudentScoreOverrides({});
  }, [selectedClassId]);

  const evaluationRules = useEvaluationRules({
    rules,
    selectedClassId,
    subjectCodesByClass,
    subjectFilter,
    roleCode: user?.roleCode,
  });

  const {
    scoreTypeFilter,
    setScoreTypeFilter,
    sceneFilter,
    setSceneFilter,
    ruleKeyword,
    setRuleKeyword,
    recentRuleIds,
    selectedRuleId,
    setSelectedRuleId,
    showMoreRules,
    setShowMoreRules,
    showAllQuickAdd,
    setShowAllQuickAdd,
    showAllQuickDeduct,
    setShowAllQuickDeduct,
    availableRules,
    highFrequencyRules,
    recentRules,
    sceneOptions,
    sortedQuickRules,
    quickAddRules,
    quickDeductRules,
    moreRules,
    selectedRule,
    handleRuleSelect,
  } = evaluationRules;

  const reloadStudentHonorRecords = useCallback(async (studentId: number, classId: number) => {
    setStudentHonorsLoading(true);
    try {
      const response = await adminApi.honorRecords(token, {
        targetType: 'student',
        studentId,
        classId,
      });
      setStudentHonorRecords(
        [...response.data].sort(
          (left, right) => new Date(right.grantedAt).getTime() - new Date(left.grantedAt).getTime(),
        ),
      );
    } catch {
      setStudentHonorRecords([]);
    } finally {
      setStudentHonorsLoading(false);
    }
  }, [token]);

  function applyScoreOverridesFromItems(
    items: Array<{ studentProfile: { studentId: number | null; currentScore: number } }>,
  ) {
    setStudentScoreOverrides((prev) => {
      const next = { ...prev };
      items.forEach((item) => {
        if (item.studentProfile.studentId != null) {
          next[item.studentProfile.studentId] = item.studentProfile.currentScore;
        }
      });
      return next;
    });
  }

  async function refreshScoreModalAfterSubmit(options: {
    mode: EvaluationMode;
    selectedStudentId: number | null;
    batchItems?: Array<{ studentProfile: { studentId: number | null; currentScore: number } }>;
  }) {
    await reloadCurrentClassData();
    void onSaved();
    if (options.batchItems?.length) {
      applyScoreOverridesFromItems(options.batchItems);
    }
    if (options.mode === 'single' && options.selectedStudentId) {
      void loadModalScoreRecords(options.selectedStudentId);
    }
  }

  const loadModalScoreRecords = useCallback(
    async (studentId: number) => {
      if (!selectedClassId) {
        setModalScoreRecords([]);
        return;
      }
      try {
        const response = await adminApi.scoreRecords(token, {
          classId: selectedClassId,
          studentId,
          ...(isSubjectTeacher && activeSubjectView?.subjectCode ? { subjectCode: activeSubjectView.subjectCode } : {}),
        });
        setModalScoreRecords(response.data);
      } catch {
        setModalScoreRecords([]);
      }
    },
    [activeSubjectView?.subjectCode, isSubjectTeacher, selectedClassId, token],
  );

  function syncScoreSelection(target: ScoreTarget) {
    if (target.type === 'single') {
      setMode('single');
      setSelectedStudentId(target.studentId);
      setRecordStudentFilter(target.studentId);
    } else if (target.type === 'batch') {
      setMode('batch');
      setSelectedStudentIds(target.studentIds);
      setRecordStudentFilter('all');
    } else {
      setMode('group');
      setSelectedGroupId(target.groupId);
      setRecordStudentFilter('all');
    }
  }

  function openScoreModal(target: ScoreTarget, tab: ScoreModalTab = 'score') {
    syncScoreSelection(target);
    setScoreModalTarget(target);
    setScoreModalTab(tab);
    if (target.type === 'single' && selectedClassId) {
      void reloadStudentHonorRecords(target.studentId, selectedClassId);
      void loadModalScoreRecords(target.studentId);
    } else {
      setStudentHonorRecords([]);
      setModalScoreRecords([]);
    }
  }

  function closeScoreModal() {
    setScoreModalTarget(null);
    setModalScoreRecords([]);
  }

  function openStudentHonorGrant(studentId: number, _studentName: string) {
    if (!selectedClassId) return;
    openScoreModal({ type: 'single', studentId }, 'honor');
  }

  function handleStudentCardClick(studentId: number) {
    if (mode !== 'single') return;
    openScoreModal({ type: 'single', studentId });
  }

  function handleOpenBatchScore() {
    if (selectedStudentIds.length === 0) {
      setSubmitError('请至少选择一名学生');
      return;
    }
    openScoreModal({ type: 'batch', studentIds: [...selectedStudentIds] });
  }

  function handleOpenGroupScore() {
    if (!selectedGroupId) {
      setSubmitError('请先选择小组');
      return;
    }
    openScoreModal({ type: 'group', groupId: selectedGroupId });
  }

  function handleGroupOverviewClick(groupId: number) {
    setSelectedGroupId(groupId);
    openGroupScoreManage(groupId);
  }

  useEffect(() => {
    if (isClassEvaluationPage || !scoreModalTarget || scoreModalTarget.type !== 'single' || !selectedClassId) {
      if (!scoreModalTarget) {
        setStudentHonorRecords([]);
      }
      return;
    }
    void reloadStudentHonorRecords(scoreModalTarget.studentId, selectedClassId);
  }, [isClassEvaluationPage, reloadStudentHonorRecords, scoreModalTarget, selectedClassId]);

  const availableSubjectFilters = useMemo(() => {
    const currentSubjectCodes = selectedClassId ? subjectCodesByClass.get(selectedClassId) ?? [] : [];
    return ['all', ...expandRuleSubjectCodes(currentSubjectCodes)];
  }, [selectedClassId, subjectCodesByClass]);

  const availableClassRules = useMemo(() => {
    const classRules = rules.filter((item) => {
      if (!item.adminEnabled || item.scoreTarget !== 'class') return false;
      if (item.moduleType !== 'general') return false;
      if (scoreTypeFilter !== 'all' && item.scoreType !== scoreTypeFilter) return false;
      if (ruleKeyword.trim()) {
        const keyword = ruleKeyword.trim().toLowerCase();
        const haystack = [item.name, item.subjectCode, item.tag, item.dimension, item.description]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(keyword)) return false;
      }
      return true;
    });
    const deduped = new Map<string, ScoreRule>();
    classRules.forEach((item) => {
      const key = `${item.name}|${item.scoreType}|${item.scoreValue}`;
      if (!deduped.has(key)) deduped.set(key, item);
    });
    return Array.from(deduped.values());
  }, [ruleKeyword, rules, sceneFilter, scoreTypeFilter]);

  const activeRules = isClassEvaluationPage ? availableClassRules : availableRules;
  const positiveCount = records.filter((item) => item.scoreDelta > 0).length;
  const negativeCount = records.filter((item) => item.scoreDelta < 0).length;
  const averageScore = classStudents.length
    ? Math.round(classStudents.reduce((sum, item) => sum + item.currentScore, 0) / classStudents.length)
    : 0;

  useEffect(() => {
    if (!isClassEvaluationPage || classScoreDateInitialized) return;
    let active = true;
    adminApi.settings(token)
      .then((response) => {
        if (!active) return;
        const startDate = normalizeDateValue(response.data.semester?.startDate);
        const endDate = normalizeDateValue(response.data.semester?.endDate);
        setSemesterStartDate(startDate);
        setSemesterEndDate(endDate);
        if (startDate) setClassScoreStartDate((prev) => prev || startDate);
        if (endDate) setClassScoreEndDate((prev) => prev || endDate);
      })
      .catch(() => {
        // 学期设置读取失败时保留手动日期筛选能力。
      })
      .finally(() => {
        if (active) setClassScoreDateInitialized(true);
      });
    return () => {
      active = false;
    };
  }, [classScoreDateInitialized, isClassEvaluationPage, token]);

  function resetClassScoreDateToSemester() {
    if (semesterStartDate) setClassScoreStartDate(semesterStartDate);
    if (semesterEndDate) setClassScoreEndDate(semesterEndDate);
  }

  useEffect(() => {
    if (isSubjectTeacher && activeSubjectView) {
      setSelectedClassId(activeSubjectView.classId);
      setSubjectFilter(activeSubjectView.subjectCode);
      return;
    }
    if (!selectedClassId && availableClasses[0]?.id) {
      setSelectedClassId(availableClasses[0].id);
    }
  }, [activeSubjectView, availableClasses, isSubjectTeacher, selectedClassId]);

  useEffect(() => {
    const queryClassId = searchParams.get('classId');
    const queryMode = searchParams.get('mode');
    const querySubjectCode = searchParams.get('subjectCode');

    if (queryClassId && !isSubjectTeacher) {
      const parsedClassId = Number(queryClassId);
      if (availableClasses.some((item) => item.id === parsedClassId)) {
        setSelectedClassId(parsedClassId);
      }
    }

    if (queryMode === 'single' || queryMode === 'batch' || queryMode === 'group') {
      setMode(queryMode);
    }

    if (querySubjectCode && availableSubjectFilters.includes(querySubjectCode)) {
      if (!isSubjectTeacher) setSubjectFilter(querySubjectCode);
    } else if (!querySubjectCode && subjectFilter !== 'all' && !availableSubjectFilters.includes(subjectFilter)) {
      setSubjectFilter('all');
    }
  }, [availableClasses, availableSubjectFilters, isSubjectTeacher, searchParams, subjectFilter]);

  useEffect(() => {
    if (!selectedClassId || isClassEvaluationPage) return;
    const queryStudentId = searchParams.get('studentId');
    const parsedStudentId = queryStudentId ? Number(queryStudentId) : null;

    if (parsedStudentId && classStudents.some((item) => item.id === parsedStudentId)) {
      setSelectedStudentId(parsedStudentId);
      if (mode === 'batch') {
        setSelectedStudentIds([parsedStudentId]);
        return;
      }
      if (mode === 'single') {
        syncScoreSelection({ type: 'single', studentId: parsedStudentId });
        setScoreModalTarget({ type: 'single', studentId: parsedStudentId });
        setScoreModalTab('score');
        void reloadStudentHonorRecords(parsedStudentId, selectedClassId);
        void loadModalScoreRecords(parsedStudentId);
      }
      return;
    }

    setSelectedStudentIds((prev) => prev.filter((item) => classStudents.some((student) => student.id === item)));
  }, [
    classStudents,
    isClassEvaluationPage,
    loadModalScoreRecords,
    mode,
    reloadStudentHonorRecords,
    searchParams,
    selectedClassId,
  ]);

  useEffect(() => {
    if (isClassEvaluationPage) return;
    setRecordStudentFilter(mode === 'single' && selectedStudentId ? selectedStudentId : 'all');
  }, [isClassEvaluationPage, mode, selectedStudentId]);

  useEffect(() => {
    if (!selectedClassId) return;
    const queryRuleId = searchParams.get('ruleId');
    const parsedRuleId = queryRuleId ? Number(queryRuleId) : null;

    if (parsedRuleId && activeRules.some((item) => item.id === parsedRuleId)) {
      setSelectedRuleId(parsedRuleId);
      return;
    }

    if (!activeRules.some((item) => item.id === selectedRuleId)) {
      setSelectedRuleId(
        isClassEvaluationPage
          ? availableClassRules[0]?.id ?? null
          : highFrequencyRules[0]?.id ?? availableRules[0]?.id ?? null,
      );
    }
  }, [activeRules, availableClassRules, availableRules, highFrequencyRules, isClassEvaluationPage, searchParams, selectedRuleId, selectedClassId]);

  useEffect(() => {
    if (!selectedClassId) return;
    if (isClassEvaluationPage && !classScoreDateInitialized) return;
    let active = true;
    setPageLoading(true);
    setSubmitError(null);

    Promise.all([
      adminApi.scoreRecords(token, scoreRecordQuery),
      adminApi.classGroups(token, selectedClassId),
      canManageClassScore ? adminApi.classScoreRecords(token, classScoreRecordQuery) : Promise.resolve({ data: [] as ClassScoreRecord[] }),
    ])
      .then(([recordResponse, groupResponse, classRecordResponse]) => {
        if (!active) return;
        setRecords(recordResponse.data);
        setClassScoreRecords(classRecordResponse.data);
        setGroups(groupResponse.data);
        if (!groupResponse.data.some((item) => item.id === selectedGroupId)) {
          setSelectedGroupId(groupResponse.data[0]?.id ?? null);
        }
      })
      .catch((err) => {
        if (!active) return;
        setSubmitError(err instanceof Error ? err.message : '评价数据加载失败');
      })
      .finally(() => {
        if (active) setPageLoading(false);
      });

    return () => {
      active = false;
    };
  }, [canManageClassScore, classScoreDateInitialized, classScoreRecordQuery, isClassEvaluationPage, scoreRecordQuery, selectedClassId, selectedGroupId, token]);

  useEffect(() => {
    if (!selectedClassId || isClassEvaluationPage) {
      setScoreSummaryRows([]);
      setScoreSummaryError(null);
      setScoreSummaryLoading(false);
      return;
    }
    let active = true;
    setScoreSummaryLoading(true);
    setScoreSummaryError(null);

    const request = isSubjectTeacher && activeSubjectView
      ? adminApi.teacherReviewContext(token, {
          classId: activeSubjectView.classId,
          subjectCode: activeSubjectView.subjectCode,
          startDate: summaryStartDate,
          endDate: summaryEndDate,
        }).then((response) => response.data.scoreDetailSummary as TeacherReviewContext['scoreDetailSummary'])
      : adminApi.analyticsSummary(token, {
          classId: selectedClassId,
          startDate: summaryStartDate,
          endDate: summaryEndDate,
        }).then((response) => response.data.scoreDetailSummary ?? []);

    request
      .then((rows) => {
        if (!active) return;
        setScoreSummaryRows(rows);
      })
      .catch((err) => {
        if (!active) return;
        setScoreSummaryRows([]);
        setScoreSummaryError(err instanceof Error ? err.message : '评分明细汇总加载失败');
      })
      .finally(() => {
        if (active) setScoreSummaryLoading(false);
      });

    return () => {
      active = false;
    };
  }, [
    activeSubjectView,
    isClassEvaluationPage,
    isSubjectTeacher,
    selectedClassId,
    summaryEndDate,
    summaryStartDate,
    token,
  ]);

  useEffect(() => {
    if (!groupScoreManageOpen || !selectedClassId) return;
    void refreshGroupScoreArtifacts(groupScoreManageTargetId);
  }, [groupScoreManageOpen, groupScoreManageTargetId, groupScoreRecordFilter, selectedClassId]);

  function shiftDate(date: string, offsetDays: number) {
    const d = new Date(`${date}T00:00:00`);
    d.setDate(d.getDate() + offsetDays);
    return d.toISOString().slice(0, 10);
  }

  function applySummaryQuickRange(key: '7d' | '30d' | 'month') {
    if (key === '7d') {
      setSummaryStartDate(shiftDate(today, -6));
      setSummaryEndDate(today);
      return;
    }
    if (key === '30d') {
      setSummaryStartDate(shiftDate(today, -29));
      setSummaryEndDate(today);
      return;
    }
    setSummaryStartDate(`${today.slice(0, 8)}01`);
    setSummaryEndDate(today);
  }

  function formatSignedScore(value: number) {
    return `${value > 0 ? '+' : ''}${value}`;
  }

  function formatGroupScoreRecordTime(value: string | null) {
    if (!value) return '';
    return new Intl.DateTimeFormat('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(new Date(value));
  }

  function openGroupScoreManage(groupId: number) {
    setGroupScoreManageTargetId(groupId);
    setGroupScoreRecordFilter('current');
    setGroupScoreDeltaInput('');
    setGroupScoreRemarkInput('');
    setGroupScoreRecordsError(null);
    setGroupScoreManageOpen(true);
  }

  function closeGroupScoreManage() {
    setGroupScoreManageOpen(false);
    setGroupScoreRecordFilter('current');
    setGroupScoreDeltaInput('');
    setGroupScoreRemarkInput('');
    setGroupScoreRecordsError(null);
  }

  async function handleGroupScoreAdjustSubmit() {
    if (!selectedClassId || !groupScoreManageTargetId || groupScoreSubmitLoading) return;
    const scoreDelta = Number.parseInt(groupScoreDeltaInput.trim(), 10);
    const remark = groupScoreRemarkInput.trim();
    if (!Number.isInteger(scoreDelta) || scoreDelta === 0) {
      setGroupScoreRecordsError('分值须为非 0 整数');
      return;
    }
    if (!remark) {
      setGroupScoreRecordsError('请填写事由');
      return;
    }
    setGroupScoreSubmitLoading(true);
    setGroupScoreRecordsError(null);
    try {
      await adminApi.adjustGroupScore(token, selectedClassId, {
        classGroupId: groupScoreManageTargetId,
        scoreDelta,
        remark,
        sourceTerminal: 'admin',
      });
      setGroupScoreDeltaInput('');
      setGroupScoreRemarkInput('');
      await refreshGroupScoreArtifacts(groupScoreManageTargetId);
      setSubmitSuccess('小组积分已更新');
    } catch (err) {
      setGroupScoreRecordsError(err instanceof Error ? err.message : '调整小组积分失败');
    } finally {
      setGroupScoreSubmitLoading(false);
    }
  }

  async function handleResetAllGroupScores() {
    if (!selectedClassId || groupScoreResetLoading) return;
    const hasNonZero = groupScoreRankingRows.some((item) => item.groupScore !== 0);
    if (!hasNonZero) {
      setGroupScoreRecordsError('当前各小组积分均为 0');
      return;
    }
    const confirmed = await confirm({
      title: '一键清零小组积分',
      message: `确认将${selectedClass ? `${selectedClass.gradeName}${selectedClass.name}` : '当前班级'}的全部小组当前积分清零吗？\n此操作会保留积分记录，并为每个已清零小组写入一条清零记录。`,
      confirmLabel: '确认清零',
      cancelLabel: '取消',
      tone: 'danger',
    });
    if (!confirmed) return;
    setGroupScoreResetLoading(true);
    setGroupScoreRecordsError(null);
    try {
      await adminApi.resetGroupScores(token, selectedClassId, { sourceTerminal: 'admin' });
      await refreshGroupScoreArtifacts(groupScoreManageTargetId);
      setSubmitSuccess('全部小组积分已清零');
    } catch (err) {
      setGroupScoreRecordsError(err instanceof Error ? err.message : '小组积分清零失败');
    } finally {
      setGroupScoreResetLoading(false);
    }
  }

  function toggleBatchStudent(studentId: number) {
    setSelectedStudentIds((prev) =>
      prev.includes(studentId) ? prev.filter((item) => item !== studentId) : [...prev, studentId],
    );
  }

  function toggleClassScoreClass(classId: number) {
    setSelectedClassScoreIds((prev) =>
      prev.includes(classId) ? prev.filter((item) => item !== classId) : [...prev, classId],
    );
  }

  function getSelectionError() {
    if (!selectedClassId) return '请先选择班级';
    if (isClassEvaluationPage) {
      if (!canManageClassScore) return '当前角色无权操作班级积分';
      if (classMode === 'batch' && selectedClassScoreIds.length === 0) return '请至少选择一个班级';
      return null;
    }
    if (mode === 'single' && !selectedStudentId) return '请先选择学生';
    if (mode === 'batch' && selectedStudentIds.length === 0) return '请至少选择一名学生';
    if (mode === 'group' && !selectedGroupId) return '当前班级暂无可评价小组';
    return null;
  }

  function openRuleConfirm(rule: ScoreRule) {
    handleRuleSelect(rule.id);
    const selectionError = getSelectionError();
    if (selectionError) {
      setSubmitError(selectionError);
      setSubmitSuccess(null);
      return;
    }
    setSubmitError(null);
    setSubmitSuccess(null);
    setConfirmRule(rule);
    setConfirmRemark('');
  }

  async function reloadCurrentClassData() {
    if (!selectedClassId) return;
    const [recordResponse, groupResponse, classRecordResponse] = await Promise.all([
      adminApi.scoreRecords(token, scoreRecordQuery),
      adminApi.classGroups(token, selectedClassId),
      canManageClassScore ? adminApi.classScoreRecords(token, classScoreRecordQuery) : Promise.resolve({ data: [] as ClassScoreRecord[] }),
    ]);
    setRecords(recordResponse.data);
    setGroups(groupResponse.data);
    setClassScoreRecords(classRecordResponse.data);
  }

  function applySummaryStudentToRecords(studentId: number) {
    setRecordStudentFilter(studentId);
    setRecordStartDate(summaryStartDate);
    setRecordEndDate(summaryEndDate);
    setRecordKeyword('');
  }

  async function loadGroupScoreArtifacts(classId: number, focusGroupId?: number | null) {
    const [rankingResponse, recordsResponse] = await Promise.all([
      adminApi.groupScoreRanking(token, classId),
      adminApi.groupScoreRecords(token, classId, focusGroupId ?? undefined),
    ]);
    setGroupScoreRankingRows(rankingResponse.data);
    setGroupScoreRecords(recordsResponse.data);
  }

  async function refreshGroupScoreArtifacts(focusGroupId?: number | null) {
    if (!selectedClassId) return;
    setGroupScoreRecordsLoading(true);
    setGroupScoreRecordsError(null);
    try {
      const targetGroupId = groupScoreRecordFilter === 'all' ? null : (focusGroupId ?? groupScoreManageTargetId);
      await loadGroupScoreArtifacts(selectedClassId, targetGroupId);
      await reloadCurrentClassData();
    } catch (err) {
      setGroupScoreRecordsError(err instanceof Error ? err.message : '小组积分数据加载失败');
    } finally {
      setGroupScoreRecordsLoading(false);
    }
  }

  function openReverseModal(record: ScoreRecord) {
    const student = students.find((item) => item.id === record.studentId);
    setReverseTarget({
      record,
      studentName: student?.name ?? `学生#${record.studentId}`,
      currentScore: student?.currentScore ?? null,
    });
  }

  async function handleReverseConfirm(remark: string) {
    if (!reverseTarget || reverseLoading) return;
    setReverseLoading(true);
    setSubmitError(null);
    try {
      const response = await adminApi.reverseScoreRecord(token, reverseTarget.record.id, { remark });
      await Promise.all([onSaved(), reloadCurrentClassData()]);
      setRecentSubmitRecords((prev) => prev.filter((item) => item.scoreRecordId !== reverseTarget.record.id));
      setReverseTarget(null);
      setSubmitSuccess(
        `评价已撤销，${reverseTarget.studentName} 当前积分 ${response.data.studentProfile.currentScore} 分`,
      );
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : '撤销评价失败');
      throw err;
    } finally {
      setReverseLoading(false);
    }
  }

  function openClassReverseModal(record: ClassScoreRecord) {
    const targetClass = availableClasses.find((item) => item.id === record.classId);
    setClassReverseTarget({
      record,
      className: `${record.gradeName} ${record.className}`,
      currentScore: targetClass?.classScore ?? selectedClass?.classScore ?? null,
    });
  }

  async function handleClassReverseConfirm(remark: string) {
    if (!classReverseTarget || reverseLoading) return;
    setReverseLoading(true);
    setSubmitError(null);
    try {
      const response = await adminApi.reverseClassScoreRecord(token, classReverseTarget.record.id, { remark });
      await Promise.all([onSaved(), reloadCurrentClassData()]);
      if (rankGradeCode) {
        adminApi
          .classScoreRankings(token, {
            gradeCode: rankGradeCode,
            ...(classScoreStartDate ? { startDate: classScoreStartDate } : {}),
            ...(classScoreEndDate ? { endDate: classScoreEndDate } : {}),
          })
          .then((rankResponse) => setClassRankingRows(rankResponse.data.rows))
          .catch(() => undefined);
      }
      setClassReverseTarget(null);
      setSubmitSuccess(
        `班级评价已撤销，${classReverseTarget.className} 当前班级积分 ${response.data.classScoreProfile.currentScore} 分`,
      );
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : '撤销班级评价失败');
      throw err;
    } finally {
      setReverseLoading(false);
    }
  }

  function buildRecentSubmitRecordsFromBatch(
    items: Array<{
      scoreRecordId: number;
      scoreDelta: number;
      studentProfile: { studentId: number | null; currentScore: number };
    }>,
    rule: ScoreRule,
    studentIds: number[],
  ): RecentSubmitRecord[] {
    return items
      .filter((item) => item.studentProfile.studentId != null)
      .map((item) => {
        const studentId = Number(item.studentProfile.studentId);
        const student = classStudents.find((row) => row.id === studentId) ?? students.find((row) => row.id === studentId);
        return {
          scoreRecordId: item.scoreRecordId,
          studentId,
          studentName: student?.name ?? `学生#${studentId}`,
          ruleName: rule.name,
          scoreDelta: item.scoreDelta,
          currentScore: item.studentProfile.currentScore,
        };
      })
      .filter((item) => studentIds.length === 0 || studentIds.includes(item.studentId));
  }

  async function submitEvaluation(rule: ScoreRule, remark: string) {
    if (!selectedClassId || submitLoading) return;
    setSubmitLoading(true);
    setSubmitError(null);
    setSubmitSuccess(null);

    try {
      let submitBatchItems:
        | Array<{ studentProfile: { studentId: number | null; currentScore: number } }>
        | undefined;

      if (mode === 'single') {
        if (!selectedStudentId) throw new Error('请先选择学生');
        const response = await adminApi.createScoreRecord(token, {
          classId: selectedClassId,
          studentId: selectedStudentId,
          ruleId: rule.id,
          remark: remark.trim() || undefined,
          sourceTerminal: 'admin',
        });
        const student = classStudents.find((item) => item.id === selectedStudentId);
        setRecentSubmitRecords([
          {
            scoreRecordId: response.data.scoreRecordId,
            studentId: selectedStudentId,
            studentName: student?.name ?? `学生#${selectedStudentId}`,
            ruleName: rule.name,
            scoreDelta: response.data.scoreDelta,
            currentScore: response.data.studentProfile.currentScore,
          },
        ]);
        submitBatchItems = [{ studentProfile: response.data.studentProfile }];
      }

      if (mode === 'batch') {
        if (selectedStudentIds.length === 0) throw new Error('请至少选择一名学生');
        const response = await adminApi.createScoreRecordBatch(token, {
          classId: selectedClassId,
          studentIds: selectedStudentIds,
          ruleId: rule.id,
          remark: remark.trim() || undefined,
          sourceTerminal: 'admin',
        });
        setRecentSubmitRecords(buildRecentSubmitRecordsFromBatch(response.data.items, rule, selectedStudentIds));
        submitBatchItems = response.data.items;
      }

      if (mode === 'group') {
        if (!selectedGroupId) throw new Error('当前班级暂无可评价小组');
        const response = await adminApi.createScoreRecordGroup(token, {
          classId: selectedClassId,
          classGroupId: selectedGroupId,
          ruleId: rule.id,
          remark: remark.trim() || undefined,
          sourceTerminal: 'admin',
        });
        setRecentSubmitRecords(buildRecentSubmitRecordsFromBatch(response.data.items, rule, []));
        submitBatchItems = response.data.items;
      }

      await refreshScoreModalAfterSubmit({
        mode,
        selectedStudentId: mode === 'single' ? selectedStudentId : null,
        batchItems: submitBatchItems,
      });
      if (mode === 'batch') setSelectedStudentIds([]);
      setConfirmRule(null);
      setConfirmRemark('');
      setSubmitSuccess(
        mode === 'single'
          ? `${rule.scoreType === 'deduct' ? '扣分' : '加分'}已提交`
          : mode === 'batch'
            ? '批量评价已提交'
            : '小组评价已提交',
      );
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : '提交评价失败');
    } finally {
      setSubmitLoading(false);
    }
  }

  async function submitClassEvaluation(rule: ScoreRule, remark: string) {
    if (!selectedClassId || submitLoading) return;
    setSubmitLoading(true);
    setSubmitError(null);
    setSubmitSuccess(null);

    try {
      if (!canManageClassScore) throw new Error('当前角色无权操作班级积分');
      if (classMode === 'single') {
        await adminApi.createClassScoreRecord(token, {
          classId: selectedClassId,
          ruleId: rule.id,
          remark: remark.trim() || undefined,
          sourceTerminal: 'admin',
        });
      } else {
        if (selectedClassScoreIds.length === 0) throw new Error('请至少选择一个班级');
        await adminApi.createClassScoreRecordBatch(token, {
          classIds: selectedClassScoreIds,
          ruleId: rule.id,
          remark: remark.trim() || undefined,
          sourceTerminal: 'admin',
        });
      }

      await Promise.all([onSaved(), reloadCurrentClassData()]);
      if (rankGradeCode) {
        adminApi
          .classScoreRankings(token, {
            gradeCode: rankGradeCode,
            ...(classScoreStartDate ? { startDate: classScoreStartDate } : {}),
            ...(classScoreEndDate ? { endDate: classScoreEndDate } : {}),
          })
          .then((rankResponse) => setClassRankingRows(rankResponse.data.rows))
          .catch(() => undefined);
      }
      if (classMode === 'batch') setSelectedClassScoreIds([]);
      setConfirmRule(null);
      setConfirmRemark('');
      setSubmitSuccess(classMode === 'batch' ? '批量班级评价已提交' : '班级评价已提交');
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : '提交班级评价失败');
    } finally {
      setSubmitLoading(false);
    }
  }

  const classRuleCards = useMemo(() => availableClassRules.slice(0, 36), [availableClassRules]);
  const groupedClassRuleCards = useMemo(() => {
    const groups = new Map<string, { metric: string; add?: ScoreRule; deduct?: ScoreRule }>();
    classRuleCards.forEach((item) => {
      const metric = getClassRuleMetricLabel(item.name);
      const current = groups.get(metric) ?? { metric };
      if (item.scoreType === 'add') current.add = item;
      if (item.scoreType === 'deduct') current.deduct = item;
      groups.set(metric, current);
    });
    return Array.from(groups.values());
  }, [classRuleCards]);
  const classRecentRules = useMemo(
    () =>
      recentRuleIds
        .map((id) => availableClassRules.find((item) => item.id === id))
        .filter((item): item is ScoreRule => Boolean(item))
        .slice(0, 8),
    [availableClassRules, recentRuleIds],
  );

  const gradeOptions = useMemo(
    () => Array.from(new Set(availableClasses.map((item) => item.gradeName))).sort(compareGradeName),
    [availableClasses],
  );

  const classesSorted = useMemo(
    () =>
      [...availableClasses].sort(
        (left, right) =>
          compareGradeName(left.gradeName, right.gradeName) || left.name.localeCompare(right.name, 'zh-CN'),
      ),
    [availableClasses],
  );

  useEffect(() => {
    if (!gradeOptions.includes(rankGradeName)) {
      setRankGradeName(gradeOptions[0] ?? '');
    }
  }, [gradeOptions, rankGradeName]);

  useEffect(() => {
    if (!gradeOptions.includes(classSingleGradeName)) {
      setClassSingleGradeName(selectedClass?.gradeName ?? gradeOptions[0] ?? '');
    }
  }, [classSingleGradeName, gradeOptions, selectedClass?.gradeName]);

  useEffect(() => {
    if (!gradeOptions.includes(classBatchGradeName)) {
      setClassBatchGradeName(gradeOptions[0] ?? '');
    }
  }, [classBatchGradeName, gradeOptions]);

  useEffect(() => {
    if (isClassEvaluationPage || isSubjectTeacher) return;
    if (!gradeOptions.includes(studentEvalGradeName)) {
      setStudentEvalGradeName(selectedClass?.gradeName ?? gradeOptions[0] ?? '');
    }
  }, [gradeOptions, isClassEvaluationPage, isSubjectTeacher, selectedClass?.gradeName, studentEvalGradeName]);

  useEffect(() => {
    if (isClassEvaluationPage || isSubjectTeacher) return;
    const gradeName = selectedClass?.gradeName;
    if (gradeName && gradeName !== studentEvalGradeName) {
      setStudentEvalGradeName(gradeName);
    }
  }, [isClassEvaluationPage, isSubjectTeacher, selectedClass?.gradeName, studentEvalGradeName]);

  const studentGradeClasses = useMemo(
    () => classesSorted.filter((item) => item.gradeName === studentEvalGradeName),
    [classesSorted, studentEvalGradeName],
  );

  useEffect(() => {
    if (isClassEvaluationPage || isSubjectTeacher) return;
    if (!studentGradeClasses.some((item) => item.id === selectedClassId)) {
      setSelectedClassId(studentGradeClasses[0]?.id ?? null);
    }
  }, [isClassEvaluationPage, isSubjectTeacher, selectedClassId, studentGradeClasses]);

  const singleGradeClasses = useMemo(
    () => classesSorted.filter((item) => item.gradeName === classSingleGradeName),
    [classSingleGradeName, classesSorted],
  );

  const batchGradeClasses = useMemo(
    () => classesSorted.filter((item) => item.gradeName === classBatchGradeName),
    [classBatchGradeName, classesSorted],
  );

  useEffect(() => {
    if (!isClassEvaluationPage || classMode !== 'single') return;
    if (!singleGradeClasses.some((item) => item.id === selectedClassId)) {
      setSelectedClassId(singleGradeClasses[0]?.id ?? null);
    }
  }, [classMode, isClassEvaluationPage, selectedClassId, singleGradeClasses]);

  useEffect(() => {
    if (classMode !== 'batch') return;
    const allowed = new Set(batchGradeClasses.map((item) => item.id));
    setSelectedClassScoreIds((prev) => prev.filter((item) => allowed.has(item)));
  }, [batchGradeClasses, classMode]);

  const rankGradeCode = classesSorted.find((item) => item.gradeName === rankGradeName)?.gradeCode ?? '';

  useEffect(() => {
    if (!isClassEvaluationPage || !rankGradeCode) {
      setClassRankingRows([]);
      setClassRankingError(null);
      return;
    }
    if (!classScoreDateInitialized) return;
    let active = true;
    setClassRankingLoading(true);
    setClassRankingError(null);
    adminApi
      .classScoreRankings(token, {
        gradeCode: rankGradeCode,
        ...(classScoreStartDate ? { startDate: classScoreStartDate } : {}),
        ...(classScoreEndDate ? { endDate: classScoreEndDate } : {}),
      })
      .then((response) => {
        if (!active) return;
        setClassRankingRows(response.data.rows);
      })
      .catch((err) => {
        if (!active) return;
        setClassRankingRows([]);
        setClassRankingError(err instanceof Error ? err.message : '班级积分排名加载失败');
      })
      .finally(() => {
        if (active) setClassRankingLoading(false);
      });
    return () => {
      active = false;
    };
  }, [
    classScoreDateInitialized,
    classScoreEndDate,
    classScoreStartDate,
    isClassEvaluationPage,
    rankGradeCode,
    token,
  ]);

  const classRankRows = useMemo(
    () =>
      classRankingRows.map((item) => ({
        id: item.classId,
        rank: item.rank,
        gradeName: item.gradeName,
        className: item.className,
        classScore: item.currentScore,
      })),
    [classRankingRows],
  );

  const selectionSummary = useMemo(() => {
    if (mode === 'single') {
      const student = classStudents.find((item) => item.id === selectedStudentId);
      return {
        title: student ? `单人评价 · ${student.name}` : '单人评价',
        subtitle: student ? `当前积分 ${student.currentScore} 分` : '请先选择学生',
      };
    }
    if (mode === 'batch') {
      return {
        title: `批量评价 · ${selectedStudentIds.length} 名学生`,
        subtitle:
          selectedStudentIds.length > 0
            ? classStudents
                .filter((item) => selectedStudentIds.includes(item.id))
                .slice(0, 4)
                .map((item) => item.name)
                .join('、')
            : '请先勾选需要统一评价的学生',
      };
    }
    const group = groups.find((item) => item.id === selectedGroupId);
    return {
      title: group ? `小组评价 · 第${group.groupNo}组 ${group.name}` : '小组评价',
      subtitle: group ? `${group.studentCount} 人 · 当前 ${group.currentScoreTotal} 分` : '请先选择评价小组',
    };
  }, [classStudents, groups, mode, selectedGroupId, selectedStudentId, selectedStudentIds]);

  return (
    <Shell
      title={rolePresentation.title}
      subtitle={rolePresentation.subtitle}
      loading={loading || pageLoading}
      user={user}
      status={
        <>
          {(loading || pageLoading) ? <div className="status-card">评价数据加载中...</div> : null}
          {error ? <div className="status-card error">{error}</div> : null}
          {submitError ? <div className="status-card error">{submitError}</div> : null}
          {submitSuccess ? <div className="status-card success">{submitSuccess}</div> : null}
          {!isClassEvaluationPage && recentSubmitRecords.length > 0 ? (
            <div className="status-card evaluation-recent-reverse-card">
              <div className="evaluation-recent-reverse-head">
                <strong>{recentSubmitRecords.length === 1 ? '本次评价已提交' : `本次已为 ${recentSubmitRecords.length} 名学生评价`}</strong>
                <button type="button" className="score-record-link-button" onClick={() => setRecentSubmitRecords([])}>
                  关闭
                </button>
              </div>
              <div className="evaluation-recent-reverse-list">
                {recentSubmitRecords.map((item) => (
                  <div className="evaluation-recent-reverse-item" key={item.scoreRecordId}>
                    <span>
                      {item.studentName} · {formatScoreRecordLabel({ ruleName: item.ruleName } as ScoreRecord)} · {formatScoreDelta(item.scoreDelta)}
                    </span>
                    <div className="evaluation-recent-reverse-actions">
                      {allowGrantStudentHonors && !isClassEvaluationPage ? (
                        <button
                          type="button"
                          className="score-record-reverse-button"
                          onClick={() => openStudentHonorGrant(item.studentId, item.studentName)}
                        >
                          颁发荣誉
                        </button>
                      ) : null}
                      <button
                        type="button"
                        className="score-record-reverse-button"
                        onClick={() => {
                          const matched = records.find((row) => row.id === item.scoreRecordId);
                          if (matched) openReverseModal(matched);
                        }}
                      >
                        撤销本次
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </>
      }
    >
      <div className="admin-list-desk evaluation-desk">
      <div className="page-header admin-list-page-header">
        <div>
          <h2>{isClassEvaluationPage ? '班级评价' : rolePresentation.title}</h2>
          <p className="page-desc">
            {isClassEvaluationPage ? '对班级积分进行独立加扣分，不影响学生个人积分。' : rolePresentation.subtitle}
          </p>
        </div>
        <div className="page-actions">
          {!isClassEvaluationPage && !isSubjectTeacher ? (
            <>
              <select
                className="filter-select"
                value={studentEvalGradeName}
                onChange={(event) => {
                  const nextGrade = event.target.value;
                  setStudentEvalGradeName(nextGrade);
                  const nextClass = classesSorted.find((item) => item.gradeName === nextGrade);
                  setSelectedClassId(nextClass?.id ?? null);
                }}
              >
                {gradeOptions.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
              <select
                className="filter-select"
                value={selectedClassId ?? ''}
                onChange={(event) => setSelectedClassId(Number(event.target.value))}
              >
                {studentGradeClasses.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </>
          ) : null}
        </div>
      </div>

      {!(isSubjectTeacher && !isClassEvaluationPage) ? (
        <div className={`std-metric-grid${isClassEvaluationPage ? ' std-metric-grid--4' : ' std-metric-grid--3'}`}>
          <div className="std-metric-card std-metric-card--blue">
            <div className="std-metric-card__top">
              <div className="std-metric-card__icon"><span className="sec-metric-glyph">班</span></div>
              <span className="std-metric-card__label">当前班级</span>
            </div>
            <div className="std-metric-card__value std-metric-card__value--text">
              {selectedClass ? `${selectedClass.gradeName} ${selectedClass.name}` : '暂无可用班级'}
            </div>
            <div className="std-metric-card__hint">
              {selectedClass?.slogan ?? '班级口号待补充，可由班主任在「我的班级」中维护。'}
            </div>
          </div>
          <div className="std-metric-card std-metric-card--green">
            <div className="std-metric-card__top">
              <div className="std-metric-card__icon"><span className="sec-metric-glyph">生</span></div>
              <span className="std-metric-card__label">本班学生</span>
            </div>
            <div className="std-metric-card__value">{classStudents.length}</div>
            <div className="std-metric-card__hint">平均个人积分 {averageScore} 分</div>
          </div>
          {isClassEvaluationPage ? (
            <div className="std-metric-card std-metric-card--purple">
              <div className="std-metric-card__top">
                <div className="std-metric-card__icon"><span className="sec-metric-glyph">分</span></div>
                <span className="std-metric-card__label">班级积分</span>
              </div>
              <div className="std-metric-card__value">{selectedClass?.classScore ?? 0}</div>
              <div className="std-metric-card__hint">独立于学生个人积分，由班级评价调整</div>
            </div>
          ) : null}
          <div className={`std-metric-card std-metric-card--amber${!isClassEvaluationPage ? '' : ''}`}>
            <div className="std-metric-card__top">
              <div className="std-metric-card__icon"><span className="sec-metric-glyph">记</span></div>
              <span className="std-metric-card__label">{isClassEvaluationPage ? '最近班级评价' : '评价记录'}</span>
            </div>
            <div className="std-metric-card__value">
              {isClassEvaluationPage ? classScoreRecords.length : records.length}
            </div>
            <div className="std-metric-card__hint">
              {isClassEvaluationPage
                ? '班级积分加扣分流水记录'
                : `正向 ${positiveCount} 条 · 负向 ${negativeCount} 条`}
            </div>
          </div>
        </div>
      ) : null}

      <div className="evaluation-layout">
        <div className="panel evaluation-form-panel admin-list-panel">
          <div className="panel-title">{isClassEvaluationPage ? '发起班级评价' : '发起学生评价'}</div>

          {isClassEvaluationPage ? (
            <>
              <div className="evaluation-mode-grid">
                <button
                  type="button"
                  className={`evaluation-mode-card${classMode === 'single' ? ' active' : ''}`}
                  onClick={() => setClassMode('single')}
                >
                  <strong>单班评价</strong>
                  <span>对当前选中班级加扣班级积分。</span>
                </button>
                <button
                  type="button"
                  className={`evaluation-mode-card${classMode === 'batch' ? ' active' : ''}`}
                  onClick={() => setClassMode('batch')}
                >
                  <strong>批量评价</strong>
                  <span>对多个班级一次应用同一条班级规则。</span>
                </button>
              </div>

              <div className="detail-grid">
                <div className="detail-card">
                  <h4>评价对象</h4>
                  {classMode === 'single' ? (
                    <div className="class-eval-selector-stack">
                      <label className="class-eval-selector-row">
                        <span>年级</span>
                        <select
                          value={classSingleGradeName}
                          onChange={(event) => setClassSingleGradeName(event.target.value)}
                        >
                          {gradeOptions.map((item) => (
                            <option key={item} value={item}>
                              {item}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="class-eval-selector-row">
                        <span>班级</span>
                        <select
                          value={selectedClassId ?? ''}
                          onChange={(event) => setSelectedClassId(Number(event.target.value))}
                        >
                          {singleGradeClasses.map((item) => (
                            <option key={item.id} value={item.id}>
                              {item.name}
                            </option>
                          ))}
                        </select>
                      </label>
                      <p>{selectedClass ? `${selectedClass.gradeName} ${selectedClass.name} · 当前 ${selectedClass.classScore} 分` : '请先选择班级'}</p>
                    </div>
                  ) : (
                    <>
                      <select
                        value={classBatchGradeName}
                        onChange={(event) => setClassBatchGradeName(event.target.value)}
                        style={{ marginBottom: 10 }}
                      >
                        {gradeOptions.map((item) => (
                          <option key={item} value={item}>
                            {item}
                          </option>
                        ))}
                      </select>
                      <div className="evaluation-student-grid">
                        {batchGradeClasses.map((item) => (
                        <label key={item.id} className={`evaluation-student-card${selectedClassScoreIds.includes(item.id) ? ' active' : ''}`}>
                          <input
                            type="checkbox"
                            checked={selectedClassScoreIds.includes(item.id)}
                            onChange={() => toggleClassScoreClass(item.id)}
                          />
                          <span>{item.gradeName} {item.name}</span>
                          <b>{item.classScore} 分</b>
                        </label>
                      ))}
                      </div>
                    </>
                  )}
                </div>

                <div className="detail-card">
                  <h4>班级积分规则</h4>
                  <div className="evaluation-more-panel class-evaluation-rule-panel">
                    <div className="evaluation-rule-toolbar">
                      <div className="security-chip-row">
                        <button
                          type="button"
                          className={`security-chip${scoreTypeFilter === 'add' ? ' active' : ''}`}
                          onClick={() => setScoreTypeFilter('add')}
                        >
                          只看加分
                        </button>
                        <button
                          type="button"
                          className={`security-chip${scoreTypeFilter === 'deduct' ? ' active' : ''}`}
                          onClick={() => setScoreTypeFilter('deduct')}
                        >
                          只看扣分
                        </button>
                        <button
                          type="button"
                          className={`security-chip${scoreTypeFilter === 'all' ? ' active' : ''}`}
                          onClick={() => setScoreTypeFilter('all')}
                        >
                          全部规则
                        </button>
                      </div>
                      <input
                        className="evaluation-rule-search"
                        value={ruleKeyword}
                        onChange={(event) => setRuleKeyword(event.target.value)}
                        placeholder="搜索班级评价规则，例如：卫生、纪律、升旗"
                      />

                      {classRecentRules.length > 0 ? (
                        <div className="evaluation-rule-section">
                          <div className="evaluation-rule-section-title">最近使用</div>
                          <div className="security-chip-row">
                            {classRecentRules.map((item) => (
                              <button
                                key={item.id}
                                type="button"
                                className={`security-chip${selectedRuleId === item.id ? ' active' : ''}`}
                                onClick={() => openRuleConfirm(item)}
                              >
                                {item.name}
                              </button>
                            ))}
                          </div>
                        </div>
                      ) : null}
                      <div className="evaluation-rule-section-title">
                        当前共 {groupedClassRuleCards.length} 个评价指标
                      </div>
                    </div>
                  <div className="rule-card-list compact">
                    {groupedClassRuleCards.map((group) => (
                      <div key={group.metric} className="class-rule-pair-card">
                        <div className="class-rule-pair-head">
                          <div className="class-rule-pair-title">{group.metric}</div>
                          <span className="class-rule-pair-score">{formatClassRuleGroupScore(group)}</span>
                        </div>
                        <div className="class-rule-pair-actions">
                          {group.add ? (
                            <button
                              type="button"
                              className={`rule-select-card${selectedRuleId === group.add.id ? ' active' : ''}`}
                              onClick={() => openRuleConfirm(group.add!)}
                            >
                              <span className="rule-select-name">{group.add.name}</span>
                              <span className="rule-select-score add">{`+${group.add.scoreValue}`}</span>
                            </button>
                          ) : null}
                          {group.deduct ? (
                            <button
                              type="button"
                              className={`rule-select-card${selectedRuleId === group.deduct.id ? ' active' : ''}`}
                              onClick={() => openRuleConfirm(group.deduct!)}
                            >
                              <span className="rule-select-name">{group.deduct.name}</span>
                              <span className="rule-select-score deduct">{`-${group.deduct.scoreValue}`}</span>
                            </button>
                          ) : null}
                        </div>
                      </div>
                    ))}
                    {groupedClassRuleCards.length === 0 ? <p className="muted-text">暂无可用班级评价规则</p> : null}
                  </div>
                  </div>
                </div>
              </div>

              <div className="detail-card class-evaluation-record-card">
                <div className="class-evaluation-record-head">
                  <div>
                    <h4>班级评价记录</h4>
                    <p>
                      {classMode === 'single'
                        ? selectedClass
                          ? `${selectedClass.gradeName} ${selectedClass.name} ${classScoreStartDate && classScoreEndDate ? `${classScoreStartDate} 至 ${classScoreEndDate}` : '最近'} ${classScoreRecords.length} 条`
                          : '当前班级暂无记录'
                        : '班级评价提交后会同步出现在这里，便于核对本次打分结果。'}
                    </p>
                  </div>
                </div>
                <div className="class-evaluation-record-list">
                  {classScoreRecords.slice(0, 20).map((item) => (
                    <div className="class-evaluation-record-item" key={`${item.id}-${item.createdAt}`}>
                      <div className="class-evaluation-record-main">
                        <div className="class-evaluation-record-title">
                          <strong>{item.ruleName || item.tag || item.dimension || '班级评价'}</strong>
                          <span className={`rule-select-score ${item.scoreDelta < 0 ? 'deduct' : 'add'}`}>
                            {item.scoreDelta > 0 ? '+' : ''}
                            {item.scoreDelta}
                          </span>
                        </div>
                        <p>
                          {item.gradeName} {item.className}
                          {item.remark ? ` · 备注：${item.remark}` : ''}
                        </p>
                        {item.reversedAt ? (
                          <div className="class-evaluation-record-reversed">
                            已撤销：{item.reverseRemark || '无撤销原因'} · {item.reversedByName || '管理员'} · {formatDateTime(item.reversedAt)}
                          </div>
                        ) : null}
                      </div>
                      <div className="class-evaluation-record-meta">
                        <span>{item.operatorName || item.sourceRole || '系统'}</span>
                        <span>{formatDateTime(item.createdAt)}</span>
                        {!item.reversedAt && canShowClassScoreRecordReverse(item, user) ? (
                          <button type="button" className="score-record-reverse-button" onClick={() => openClassReverseModal(item)}>
                            撤销
                          </button>
                        ) : null}
                        {item.reversedAt ? <span className="score-record-reversed-tag">已撤销</span> : null}
                      </div>
                    </div>
                  ))}
                  {classScoreRecords.length === 0 ? <div className="table-empty">当前班级还没有班级评价记录。</div> : null}
                </div>
              </div>
            </>
          ) : (
            <div className="evaluation-classroom">
              <EvaluationToolbar
                keyword={studentKeyword}
                onKeywordChange={setStudentKeyword}
                sort={studentSort}
                onSortChange={setStudentSort}
                groupFilter={groupFilter}
                onGroupFilterChange={setGroupFilter}
                groups={groups}
                mode={mode}
                onModeChange={(nextMode) => {
                  setMode(nextMode);
                  if (nextMode !== 'batch') {
                    setSelectedStudentIds([]);
                  }
                }}
                selectedGroupId={selectedGroupId}
                onGroupIdChange={setSelectedGroupId}
                selectedCount={selectedStudentIds.length}
                onOpenBatchScore={handleOpenBatchScore}
                onOpenGroupScore={handleOpenGroupScore}
                studentCount={classStudents.length}
              />
              <div className="evaluation-student-grid-wrap">
                <EvaluationStudentGrid
                  students={displayClassStudents}
                  groups={groups}
                  mode={mode}
                  keyword={studentKeyword}
                  groupFilter={groupFilter}
                  sort={studentSort}
                  selectedStudentIds={selectedStudentIds}
                  onStudentClick={handleStudentCardClick}
                  onToggleSelect={toggleBatchStudent}
                  loading={pageLoading}
                />
              </div>
              <div className="detail-card evaluation-score-summary-panel evaluation-score-summary-panel--main">
                <div className="evaluation-score-summary-head">
                  <div>
                    <div className="panel-title">{scoreSummaryTitle}</div>
                    <div className="evaluation-score-summary-subtitle">{scoreSummaryDescription}</div>
                  </div>
                </div>
                <div className="evaluation-score-summary-toolbar">
                  <DatePickerField
                    wrapperClassName="picker-input-inline"
                    className="filter-select filter-select--compact"
                    aria-label="评分汇总开始日期"
                    value={summaryStartDate}
                    max={summaryEndDate}
                    onChange={setSummaryStartDate}
                  />
                  <DatePickerField
                    wrapperClassName="picker-input-inline"
                    className="filter-select filter-select--compact"
                    aria-label="评分汇总结束日期"
                    value={summaryEndDate}
                    min={summaryStartDate}
                    max={today}
                    onChange={setSummaryEndDate}
                  />
                  <input
                    className="evaluation-rule-search evaluation-score-summary-search"
                    value={summaryStudentKeyword}
                    onChange={(event) => setSummaryStudentKeyword(event.target.value)}
                    placeholder="按学生姓名筛选"
                  />
                </div>
                <div className="security-chip-row evaluation-score-summary-chips">
                  <button
                    type="button"
                    className={`security-chip${summaryQuickRange === '7d' ? ' active' : ''}`}
                    onClick={() => applySummaryQuickRange('7d')}
                  >
                    近7天
                  </button>
                  <button
                    type="button"
                    className={`security-chip${summaryQuickRange === '30d' ? ' active' : ''}`}
                    onClick={() => applySummaryQuickRange('30d')}
                  >
                    近30天
                  </button>
                  <button
                    type="button"
                    className={`security-chip${summaryQuickRange === 'month' ? ' active' : ''}`}
                    onClick={() => applySummaryQuickRange('month')}
                  >
                    本月
                  </button>
                </div>
                <div className="evaluation-score-summary-period-stats">
                  <span>本周期 {scoreSummaryPeriodStats.recordCount} 条评价</span>
                  <span>共加 {scoreSummaryPeriodStats.totalAddScore} 分</span>
                  <span>共扣 {scoreSummaryPeriodStats.totalDeductScore} 分</span>
                </div>
                {scoreSummaryError ? <div className="table-empty">{scoreSummaryError}</div> : null}
                <div className="evaluation-score-summary-list">
                  {scoreSummaryLoading ? (
                    <div className="evaluation-score-summary-empty">评分明细汇总加载中...</div>
                  ) : null}
                  {!scoreSummaryLoading && filteredScoreSummaryRows.map((item) => (
                    <button
                      type="button"
                      className={`evaluation-score-summary-card evaluation-score-summary-card--button${recordStudentFilter === item.studentId ? ' active' : ''}`}
                      key={`score-summary-${item.studentId}`}
                      onClick={() => applySummaryStudentToRecords(item.studentId)}
                    >
                      <div className="evaluation-score-summary-card-head">
                        <div className="evaluation-score-summary-card-copy">
                          <strong>{item.studentName}</strong>
                          <span>{item.recordCount} 条（正向 {item.positiveCount} / 负向 {item.negativeCount}）</span>
                        </div>
                        <div className={`evaluation-score-summary-total ${item.totalScoreDelta < 0 ? 'deduct' : 'add'}`}>
                          {formatSignedScore(item.totalScoreDelta)} 分
                        </div>
                      </div>
                    </button>
                  ))}
                  {!scoreSummaryLoading && !scoreSummaryError && filteredScoreSummaryRows.length === 0 ? (
                    <div className="evaluation-score-summary-empty">
                      {normalizedScoreSummaryRows.length === 0 ? '当前班级暂无可展示的学生。' : '没有匹配的学生。'}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="evaluation-side-column">
          {!isClassEvaluationPage && !isSubjectTeacher ? (
          <div className="panel admin-list-panel">
            <div className="panel-title">小组概览</div>
            <div className="mini-list">
              {sortedOverviewGroups.length > 0 ? (
                sortedOverviewGroups.map((item) => (
                  <div
                    className="mini-list-item clickable"
                    key={item.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => handleGroupOverviewClick(item.id)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        handleGroupOverviewClick(item.id);
                      }
                    }}
                  >
                    <div className="evaluation-group-overview-item">
                      <strong className="evaluation-group-overview-name">第 {groupRankMap.get(item.id) ?? '-'} 名 · {item.name}</strong>
                      <span className="evaluation-group-overview-metric">积分 {(item.groupScore ?? 0)} 分</span>
                      <span className="evaluation-group-overview-metric">人数 {item.studentCount} 人</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="table-empty">当前班级还没有配置小组。</div>
              )}
            </div>
          </div>
          ) : null}

          {isClassEvaluationPage ? (
            <div className="panel admin-list-panel">
              <div className="panel-title">各年级班级积分排名</div>
              <div className="class-score-date-toolbar">
                <DatePickerField
                  wrapperClassName="picker-input-inline"
                  className="filter-select filter-select--compact"
                  aria-label="班级积分排名开始日期"
                  value={classScoreStartDate}
                  max={classScoreEndDate || classScoreDateMax}
                  onChange={setClassScoreStartDate}
                />
                <DatePickerField
                  wrapperClassName="picker-input-inline"
                  className="filter-select filter-select--compact"
                  aria-label="班级积分排名结束日期"
                  value={classScoreEndDate}
                  min={classScoreStartDate}
                  max={classScoreDateMax}
                  onChange={setClassScoreEndDate}
                />
                <button
                  type="button"
                  className="score-record-link-button class-score-semester-button"
                  onClick={resetClassScoreDateToSemester}
                  disabled={!semesterStartDate && !semesterEndDate}
                >
                  本学期
                </button>
              </div>
              <div className="security-chip-row">
                {gradeOptions.map((item) => (
                  <button
                    key={item}
                    type="button"
                    className={`security-chip${rankGradeName === item ? ' active' : ''}`}
                    onClick={() => setRankGradeName(item)}
                  >
                    {item}
                  </button>
                ))}
              </div>
              {classRankingError ? <div className="table-empty">{classRankingError}</div> : null}
              <div className="mini-list">
                {classRankingLoading ? <div className="table-empty">班级积分排名加载中...</div> : null}
                {!classRankingLoading && classRankRows.map((item) => (
                  <div className="mini-list-item" key={`class-rank-${item.id}`}>
                    <div>
                      <strong>第 {item.rank} 名 · {item.gradeName} {item.className}</strong>
                      <span>班级积分 {item.classScore} 分</span>
                    </div>
                    <b>{item.rank <= 3 ? '领先组' : '追赶组'}</b>
                  </div>
                ))}
                {!classRankingLoading && classRankRows.length === 0 ? <div className="table-empty">当前筛选条件下暂无班级。</div> : null}
              </div>
            </div>
          ) : null}

          {!isClassEvaluationPage ? (
          <div className="panel admin-list-panel">
            <div className="panel-title">评价记录</div>
            <div className="evaluation-record-toolbar">
              <select
                className="filter-select filter-select--compact"
                value={recordStudentFilter === 'all' ? 'all' : String(recordStudentFilter)}
                onChange={(event) => {
                  const value = event.target.value;
                  setRecordStudentFilter(value === 'all' ? 'all' : Number(value));
                }}
              >
                <option value="all">全班</option>
                {classStudents.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
              <DatePickerField
                wrapperClassName="picker-input-inline"
                className="filter-select filter-select--compact"
                aria-label="评价记录开始日期"
                value={recordStartDate}
                max={recordEndDate}
                onChange={setRecordStartDate}
              />
              <DatePickerField
                wrapperClassName="picker-input-inline"
                className="filter-select filter-select--compact"
                aria-label="评价记录结束日期"
                value={recordEndDate}
                min={recordStartDate}
                max={today}
                onChange={setRecordEndDate}
              />
              <div className="search-box evaluation-record-search">
                <span className="s-icon">⌕</span>
                <input
                  placeholder="搜索学生或规则"
                  value={recordKeyword}
                  onChange={(event) => setRecordKeyword(event.target.value)}
                />
              </div>
            </div>
            <div className="mini-list">
              {displayedRecords.map((item) => {
                const student = students.find((studentRow) => studentRow.id === item.studentId);
                return (
                  <ScoreRecordListItem
                    key={`${item.id}-${item.createdAt}`}
                    record={item}
                    studentName={student?.name ?? `学生#${item.studentId}`}
                    showStudentName={recordStudentFilter === 'all'}
                    canReverse={canShowScoreRecordReverse(item, user, { homeroomClassIds })}
                    onReverse={() => openReverseModal(item)}
                  />
                );
              })}
              {displayedRecords.length === 0 ? <div className="table-empty">当前筛选条件下还没有评价记录。</div> : null}
            </div>
          </div>
          ) : null}
        </div>
      </div>
      {!isClassEvaluationPage ? (
        <StudentScoreModal
          open={scoreModalTarget !== null}
          target={scoreModalTarget}
          initialTab={scoreModalTab}
          students={displayClassStudents}
          groups={groups}
          classId={selectedClassId ?? 0}
          className={selectedClass ? `${selectedClass.gradeName}${selectedClass.name}` : ''}
          token={token}
          honors={honors}
          allowGrantHonors={allowGrantStudentHonors}
          isSubjectTeacher={isSubjectTeacher}
          honorRecords={studentHonorRecords}
          honorsLoading={studentHonorsLoading}
          recentScoreRecords={modalScoreRecords}
          rulesPanelProps={{
            selectedRuleId,
            showMoreRules,
            setShowMoreRules,
            sortedQuickRules,
            quickAddRules,
            quickDeductRules,
            showAllQuickAdd,
            setShowAllQuickAdd,
            showAllQuickDeduct,
            setShowAllQuickDeduct,
            scoreTypeFilter,
            setScoreTypeFilter,
            sceneFilter,
            setSceneFilter,
            ruleKeyword,
            setRuleKeyword,
            sceneOptions,
            recentRules,
            moreRules,
            selectedRule,
            onRuleClick: openRuleConfirm,
          }}
          onClose={closeScoreModal}
          onHonorGranted={async () => {
            await onSaved();
            if (scoreModalTarget?.type === 'single' && selectedClassId) {
              await reloadStudentHonorRecords(scoreModalTarget.studentId, selectedClassId);
            }
          }}
        />
      ) : null}
      {groupScoreManageOpen && !isClassEvaluationPage && selectedClassId ? (
        <Modal
          title="小组积分管理"
          subtitle=""
          onClose={closeGroupScoreManage}
        >
          <div className="group-score-manage-modal">
            <div className="group-score-manage-layout">
              <section className="group-score-manage-sidebar">
                <div className="group-score-manage-section-head">
                  <span>小组积分排行</span>
                  <em>{selectedClass ? `${selectedClass.gradeName}${selectedClass.name} · ${groupScoreRankingRows.length} 组` : `${groupScoreRankingRows.length} 组`}</em>
                </div>
                <div className="group-score-manage-toolbar">
                  <button
                    type="button"
                    className="group-score-reset-btn"
                    onClick={() => void handleResetAllGroupScores()}
                    disabled={!canManageGroupScore || groupScoreResetLoading}
                  >
                    {groupScoreResetLoading ? '清零中...' : '一键清零'}
                  </button>
                </div>
                <div className="group-score-ranking-list">
                  {groupScoreRankingRows.length > 0 ? (
                    groupScoreRankingRows.map((row) => (
                      <button
                        type="button"
                        key={`group-score-rank-${row.id}`}
                        className={`group-score-ranking-item${groupScoreManageTargetId === row.id ? ' active' : ''}`}
                        onClick={() => {
                          setGroupScoreManageTargetId(row.id);
                          if (groupScoreRecordFilter !== 'all') {
                            setGroupScoreRecordFilter('current');
                          }
                        }}
                      >
                        <span className="group-score-ranking-rank">{row.rank}</span>
                        <span className="group-score-ranking-name">{row.name}</span>
                        <span className="group-score-ranking-score">{formatSignedScore(row.groupScore)}</span>
                      </button>
                    ))
                  ) : (
                    <div className="group-score-ranking-empty">当前班级暂无小组。</div>
                  )}
                </div>
              </section>
              <section className="group-score-manage-main">
                <div className="group-score-manage-current">
                  <div className="group-score-manage-current-copy">
                    <span className="group-score-manage-current-label">当前选中</span>
                    <strong>{activeGroupScoreRow?.name ?? '请选择小组'}</strong>
                    <p>
                      {activeGroupScoreRow ? `第${activeGroupScoreRow.rank}名 · 当前 ${activeGroupScoreRow.groupScore} 分 · 累计 ${activeGroupScoreRow.groupTotalScore} 分` : '点击左侧小组后可调整积分并查看记录'}
                    </p>
                  </div>
                  {activeGroupScoreRow ? (
                    <div className={`group-score-manage-current-score ${activeGroupScoreRow.groupScore < 0 ? 'down' : 'up'}`}>
                      <span>实时积分</span>
                      <b>{formatSignedScore(activeGroupScoreRow.groupScore)} 分</b>
                    </div>
                  ) : null}
                </div>

                <div className="group-score-adjust-panel">
                  <div className="group-score-manage-section-head">
                    <span>积分调整</span>
                    <em>正数加分，负数扣分，0 不允许提交</em>
                  </div>
                  <div className="group-score-adjust-form">
                    <label className="group-score-adjust-field compact">
                      <span>分值</span>
                      <input
                        type="number"
                        step="1"
                        placeholder="例如 +3 / -2"
                        value={groupScoreDeltaInput}
                        onChange={(event) => setGroupScoreDeltaInput(event.target.value)}
                        disabled={!canManageGroupScore || !activeGroupScoreRow}
                      />
                    </label>
                    <label className="group-score-adjust-field grow">
                      <span>事由</span>
                      <textarea
                        rows={3}
                        maxLength={255}
                        placeholder="请填写本次小组积分调整事由，例如：合作展示优秀、值日未完成"
                        value={groupScoreRemarkInput}
                        onChange={(event) => setGroupScoreRemarkInput(event.target.value)}
                        disabled={!canManageGroupScore || !activeGroupScoreRow}
                      />
                    </label>
                  </div>
                  <div className="group-score-adjust-actions">
                    <button
                      type="button"
                      className="btn btn-outline"
                      onClick={closeGroupScoreManage}
                    >
                      关闭
                    </button>
                    <button
                      type="button"
                      className="btn"
                      onClick={() => void handleGroupScoreAdjustSubmit()}
                      disabled={!canManageGroupScore || !activeGroupScoreRow || groupScoreSubmitLoading}
                    >
                      {groupScoreSubmitLoading ? '提交中...' : '确认调整'}
                    </button>
                  </div>
                </div>

                {groupScoreRecordsError ? <div className="group-score-adjust-error">{groupScoreRecordsError}</div> : null}

                <div className="group-score-records-block">
                  <div className="group-score-manage-section-head">
                    <span>小组积分记录</span>
                    <em>
                      {groupScoreRecordFilter === 'all'
                        ? `全部小组最近 ${groupScoreRecords.length} 条`
                        : activeGroupScoreRow
                          ? `${activeGroupScoreRow.name} 最近 ${groupScoreRecords.length} 条`
                          : '最近记录'}
                    </em>
                  </div>
                  <div className="group-score-records-filter">
                    <div className="security-chip-row">
                      <button
                        type="button"
                        className={`security-chip${groupScoreRecordFilter === 'current' ? ' active' : ''}`}
                        onClick={() => setGroupScoreRecordFilter('current')}
                        disabled={!activeGroupScoreRow}
                      >
                        当前小组
                      </button>
                      <button
                        type="button"
                        className={`security-chip${groupScoreRecordFilter === 'all' ? ' active' : ''}`}
                        onClick={() => setGroupScoreRecordFilter('all')}
                      >
                        全部小组
                      </button>
                    </div>
                  </div>
                  <div className="group-score-records-list">
                    {groupScoreRecordsLoading ? (
                      <div className="group-score-records-empty">加载中...</div>
                    ) : groupScoreRecords.length > 0 ? (
                      groupScoreRecords.map((record) => (
                        <div className="group-score-record-item" key={`group-score-record-${record.id}`}>
                          <div className="group-score-record-item-hd">
                            <span className="group-score-record-group">{record.groupName || `第${record.groupNo}组`}</span>
                            <span className={`group-score-record-delta ${record.scoreDelta >= 0 ? 'up' : 'down'}`}>
                              {formatSignedScore(record.scoreDelta)}
                            </span>
                          </div>
                          <div className="group-score-record-remark">{record.remark || '—'}</div>
                          <div className="group-score-record-meta">
                            {(record.operatorName || '班主任')} · {formatGroupScoreRecordTime(record.occurredAt || record.createdAt)}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="group-score-records-empty">暂无积分记录</div>
                    )}
                  </div>
                </div>
              </section>
            </div>
          </div>
        </Modal>
      ) : null}
      {confirmRule ? (
        <ScoreConfirmModal
          rule={confirmRule}
          variant={isClassEvaluationPage ? 'class' : 'student'}
          targetTitle={
            isClassEvaluationPage
              ? classMode === 'batch'
                ? `批量班级评价 · ${selectedClassScoreIds.length} 个班级`
                : selectedClass
                  ? `班级评价 · ${selectedClass.gradeName} ${selectedClass.name}`
                  : '班级评价'
              : selectionSummary.title
          }
          targetSubtitle={
            isClassEvaluationPage
              ? classMode === 'batch'
                ? availableClasses
                    .filter((item) => selectedClassScoreIds.includes(item.id))
                    .slice(0, 4)
                    .map((item) => `${item.gradeName}${item.name}`)
                    .join('、') || '请先选择班级'
                : `当前班级积分 ${selectedClass?.classScore ?? 0} 分`
              : selectionSummary.subtitle
          }
          confirmRemark={confirmRemark}
          onRemarkChange={setConfirmRemark}
          submitLoading={submitLoading}
          onClose={() => {
            if (submitLoading) return;
            setConfirmRule(null);
            setConfirmRemark('');
          }}
          onConfirm={() =>
            isClassEvaluationPage
              ? void submitClassEvaluation(confirmRule, confirmRemark)
              : void submitEvaluation(confirmRule, confirmRemark)
          }
        />
      ) : null}
      {reverseTarget ? (
        <ScoreRecordReverseModal
          record={reverseTarget.record}
          studentName={reverseTarget.studentName}
          currentScore={reverseTarget.currentScore}
          onClose={() => {
            if (reverseLoading) return;
            setReverseTarget(null);
          }}
          onConfirm={handleReverseConfirm}
        />
      ) : null}
      {classReverseTarget ? (
        <ScoreRecordReverseModal
          record={classReverseTarget.record}
          studentName={classReverseTarget.className}
          currentScore={classReverseTarget.currentScore}
          targetLabel="评价班级"
          currentScoreLabel="当前班级积分"
          subtitle="撤销后该条班级评价作废，班级积分将按原分值反向调整。"
          remarkPlaceholder="例如：选错班级、误触规则"
          negativeWarning="撤销后班级积分将为负数，请确认后再操作。"
          onClose={() => {
            if (reverseLoading) return;
            setClassReverseTarget(null);
          }}
          onConfirm={handleClassReverseConfirm}
        />
      ) : null}
      </div>
    </Shell>
  );
}

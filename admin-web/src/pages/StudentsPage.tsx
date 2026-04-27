import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Modal } from '../components/Modal';
import { Shell } from '../components/Shell';
import { TablePagination } from '../components/TablePagination';
import { usePagination } from '../hooks/usePagination';
import type { 
  AdminClass,
  AdminStudent,
  AiStudentSummary,
  ScoreRecord,
  SessionUser,
  StudentDetail,
  StudentImportPayload
} from '../lib/api';
import { adminApi } from '../lib/api';
import {
  normalizeKeyword
} from '../utils/adminForms';
import { canImportStudents } from '../utils/adminPermissions';
import { parseStudentImportRows,parseStudentImportText } from '../utils/studentImport';

type StudentsPageProps = {
  token: string;
  user: SessionUser | null;
  classes: AdminClass[];
  students: AdminStudent[];
  loading: boolean;
  error: string | null;
  onSaved: () => Promise<void>;
};

type StudentSortKey = 'name' | 'className' | 'studentNo' | 'petName' | 'currentScore' | 'currentPetLevel';
type SortDirection = 'asc' | 'desc';
type StudentEntryMode = 'single' | 'batch';

function trimText(text: string | null | undefined, maxLength: number) {
  const normalized = (text || '').trim();
  if (!normalized) return '';
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength).trim()}…`;
}

function splitTextToLines(text: string | null | undefined) {
  return (text || '')
    .split(/[。！？；\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeStudentNo(value: string) {
  return value.trim().toLowerCase();
}

export function StudentsPage({
  token,
  user,
  classes,
  students,
  loading,
  error,
  onSaved,
}: StudentsPageProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [statsView, setStatsView] = useState<'grade' | 'class' | 'student'>('grade');
  const [showOverview, setShowOverview] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [entryMode, setEntryMode] = useState<StudentEntryMode>('batch');
  const [selectedStudent, setSelectedStudent] = useState<AdminStudent | null>(null);
  const [selectedStudentDetail, setSelectedStudentDetail] = useState<StudentDetail | null>(null);
  const [selectedStudentAiSummary, setSelectedStudentAiSummary] = useState<AiStudentSummary | null>(null);
  const [aiPeriodType, setAiPeriodType] = useState<'weekly' | 'monthly'>('weekly');
  const [studentDetailLoading, setStudentDetailLoading] = useState(false);
  const [studentDetailError, setStudentDetailError] = useState<string | null>(null);
  const [studentAiLoading, setStudentAiLoading] = useState(false);
  const [studentAiGenerating, setStudentAiGenerating] = useState(false);
  const [studentAiError, setStudentAiError] = useState<string | null>(null);
  const [studentScoreRecords, setStudentScoreRecords] = useState<ScoreRecord[]>([]);
  const [studentScoreRecordsLoading, setStudentScoreRecordsLoading] = useState(false);
  const [studentScoreRecordsError, setStudentScoreRecordsError] = useState<string | null>(null);
  const [showStudentScoreRecordsModal, setShowStudentScoreRecordsModal] = useState(false);
  const [observationType, setObservationType] = useState('课堂表现');
  const [observationContent, setObservationContent] = useState('');
  const [observationSubmitting, setObservationSubmitting] = useState(false);
  const [observationPolishing, setObservationPolishing] = useState(false);
  const [classId, setClassId] = useState(classes[0]?.id ? String(classes[0].id) : '');
  const [textarea, setTextarea] = useState('');
  const [importStudentsData, setImportStudentsData] = useState<StudentImportPayload['students']>([]);
  const [singleStudentDraft, setSingleStudentDraft] = useState<{ studentNo: string; name: string; gender: string }>({
    studentNo: '',
    name: '',
    gender: '',
  });
  const [importFileName, setImportFileName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [gradeFilter, setGradeFilter] = useState('all');
  const [classFilter, setClassFilter] = useState('all');
  const [focusFilter, setFocusFilter] = useState<'all' | 'pet_bound' | 'high_level'>('all');
  const [sortConfig, setSortConfig] = useState<{ key: StudentSortKey; direction: SortDirection } | null>(null);
  const allowImport = canImportStudents(user?.roleCode);
  const returnTo = searchParams.get('returnTo');
  const returnLabel = searchParams.get('returnLabel') || '返回来源页面';
  const gradeOptions = useMemo(
    () => Array.from(new Set(classes.map((item) => item.gradeName).filter(Boolean))),
    [classes],
  );
  const classMap = useMemo(() => new Map(classes.map((item) => [item.id, item])), [classes]);
  const filteredStudents = useMemo(() => {
    const keyword = normalizeKeyword(searchKeyword);
    return students.filter((row) => {
      const classInfo = classMap.get(row.classId);
      const matchesKeyword =
        !keyword ||
        normalizeKeyword(row.name).includes(keyword) ||
        normalizeKeyword(row.studentNo).includes(keyword) ||
        normalizeKeyword(row.className).includes(keyword);
      const matchesGrade = gradeFilter === 'all' || classInfo?.gradeName === gradeFilter;
      const matchesClass = classFilter === 'all' || String(row.classId) === classFilter;
      const matchesFocus =
        focusFilter === 'all' ||
        (focusFilter === 'pet_bound' && Boolean(row.pet)) ||
        (focusFilter === 'high_level' && row.currentPetLevel >= 5);
      return matchesKeyword && matchesGrade && matchesClass && matchesFocus;
    });
  }, [classFilter, classMap, focusFilter, gradeFilter, searchKeyword, students]);
  const sortedStudents = useMemo(() => {
    if (!sortConfig) return filteredStudents;

    const directionFactor = sortConfig.direction === 'asc' ? 1 : -1;
    const compareText = (left: string, right: string) =>
      left.localeCompare(right, 'zh-CN', { numeric: true }) * directionFactor;
    const compareNumber = (left: number, right: number) => (left - right) * directionFactor;

    return [...filteredStudents].sort((left, right) => {
      switch (sortConfig.key) {
        case 'name':
          return compareText(left.name, right.name) || compareText(left.className, right.className);
        case 'className':
          return compareText(left.className, right.className) || compareText(left.name, right.name);
        case 'studentNo':
          return compareText(left.studentNo, right.studentNo) || compareText(left.name, right.name);
        case 'petName':
          return compareText(left.pet?.name ?? '未领养', right.pet?.name ?? '未领养') || compareText(left.name, right.name);
        case 'currentScore':
          return compareNumber(left.currentScore, right.currentScore) || compareText(left.name, right.name);
        case 'currentPetLevel':
          return compareNumber(left.currentPetLevel, right.currentPetLevel) || compareText(left.name, right.name);
        default:
          return 0;
      }
    });
  }, [filteredStudents, sortConfig]);
  const studentPagination = usePagination(
    sortedStudents,
    `${searchKeyword}|${gradeFilter}|${classFilter}|${focusFilter}|${sortConfig?.key ?? 'default'}|${sortConfig?.direction ?? 'default'}|${students.length}`,
  );
  const studentsWithPetCount = students.filter((row) => row.pet).length;
  const averageCurrentScore = students.length
    ? Math.round(students.reduce((sum, row) => sum + row.currentScore, 0) / students.length)
    : 0;
  const highLevelPetCount = students.filter((row) => row.currentPetLevel >= 5).length;
  const coveredClassCount = new Set(students.map((row) => row.classId)).size;
  const gradeOverview = Array.from(
    students.reduce((map, row) => {
      const classInfo = classMap.get(row.classId);
      const gradeName = classInfo?.gradeName ?? '未分配年级';
      const current = map.get(gradeName) ?? {
        gradeName,
        studentCount: 0,
        petBoundCount: 0,
        totalScore: 0,
      };
      current.studentCount += 1;
      current.totalScore += row.currentScore;
      if (row.pet) current.petBoundCount += 1;
      map.set(gradeName, current);
      return map;
    }, new Map<string, { gradeName: string; studentCount: number; petBoundCount: number; totalScore: number }>()),
  )
    .map(([, item]) => ({
      ...item,
      averageScore: item.studentCount ? Math.round(item.totalScore / item.studentCount) : 0,
    }))
    .sort((a, b) => b.studentCount - a.studentCount || a.gradeName.localeCompare(b.gradeName, 'zh-CN'));
  const topStudents = [...students]
    .sort((a, b) => b.currentScore - a.currentScore || b.currentPetLevel - a.currentPetLevel || a.name.localeCompare(b.name, 'zh-CN'))
    .slice(0, 4);
  const studentsWithoutPet = students.filter((row) => !row.pet).length;
  const genderSummary = {
    male: students.filter((row) => row.gender === '男').length,
    female: students.filter((row) => row.gender === '女').length,
  };
  const scopedStudents = filteredStudents;
  const scopedGradeStats = Array.from(
    scopedStudents.reduce((map, row) => {
      const classInfo = classMap.get(row.classId);
      const gradeName = classInfo?.gradeName ?? '未分配年级';
      const current = map.get(gradeName) ?? {
        gradeName,
        studentCount: 0,
        petBoundCount: 0,
        totalScore: 0,
        highLevelPetCount: 0,
      };
      current.studentCount += 1;
      current.totalScore += row.currentScore;
      if (row.pet) current.petBoundCount += 1;
      if (row.currentPetLevel >= 5) current.highLevelPetCount += 1;
      map.set(gradeName, current);
      return map;
    }, new Map<string, { gradeName: string; studentCount: number; petBoundCount: number; totalScore: number; highLevelPetCount: number }>()),
  )
    .map(([, item]) => ({
      ...item,
      averageScore: item.studentCount ? Math.round(item.totalScore / item.studentCount) : 0,
    }))
    .sort((a, b) => b.studentCount - a.studentCount || b.averageScore - a.averageScore);
  const scopedClassStats = Array.from(
    scopedStudents.reduce((map, row) => {
      const classInfo = classMap.get(row.classId);
      const className = row.className || classInfo?.name || '未分配班级';
      const gradeName = classInfo?.gradeName ?? '未分配年级';
      const current = map.get(row.classId) ?? {
        classId: row.classId,
        className,
        gradeName,
        studentCount: 0,
        petBoundCount: 0,
        totalScore: 0,
        topPetLevel: 0,
      };
      current.studentCount += 1;
      current.totalScore += row.currentScore;
      if (row.pet) current.petBoundCount += 1;
      current.topPetLevel = Math.max(current.topPetLevel, row.currentPetLevel);
      map.set(row.classId, current);
      return map;
    }, new Map<number, { classId: number; className: string; gradeName: string; studentCount: number; petBoundCount: number; totalScore: number; topPetLevel: number }>()),
  )
    .map(([, item]) => ({
      ...item,
      averageScore: item.studentCount ? Math.round(item.totalScore / item.studentCount) : 0,
    }))
    .sort((a, b) => b.studentCount - a.studentCount || b.averageScore - a.averageScore);
  const scopedStudentStats = [...scopedStudents]
    .map((row) => ({
      id: row.id,
      name: row.name,
      className: row.className,
      studentNo: row.studentNo,
      currentScore: row.currentScore,
      petName: row.pet?.name ?? '未领养',
      currentPetLevel: row.currentPetLevel,
    }))
    .sort((a, b) => b.currentScore - a.currentScore || b.currentPetLevel - a.currentPetLevel || a.name.localeCompare(b.name, 'zh-CN'));
  const aiViewData = useMemo(() => {
    if (!selectedStudentAiSummary) return null;

    const positiveCount = selectedStudentAiSummary.positiveSummary?.count ?? 0;
    const positiveDelta = selectedStudentAiSummary.positiveSummary?.scoreDelta ?? 0;
    const negativeCount = selectedStudentAiSummary.negativeSummary?.count ?? 0;
    const negativeDelta = selectedStudentAiSummary.negativeSummary?.scoreDelta ?? 0;
    const trend = selectedStudentAiSummary.trendSummary;
    const dimensions = selectedStudentAiSummary.dimensionSummary ?? [];
    const topPositiveDimension = [...dimensions]
      .sort((a, b) => (b.positiveCount ?? 0) - (a.positiveCount ?? 0))
      .find((item) => (item.positiveCount ?? 0) > 0);
    const topNegativeDimension = [...dimensions]
      .sort((a, b) => (b.negativeCount ?? 0) - (a.negativeCount ?? 0))
      .find((item) => (item.negativeCount ?? 0) > 0);

    const highlights: string[] = [];
    const risks: string[] = [];
    const actions: string[] = [];
    const suggestionLines = splitTextToLines(selectedStudentAiSummary.aiSuggestion);
    const periodLabel = selectedStudentAiSummary.periodType === 'monthly' ? '本月' : '本周';
    const positiveRatio = Math.round((trend?.positiveRatio ?? 0) * 100);

    if (positiveCount > 0) {
      highlights.push(`${periodLabel}累计正向 ${positiveCount} 次，贡献积分 ${positiveDelta >= 0 ? '+' : ''}${positiveDelta}。`);
    }
    if (topPositiveDimension) {
      highlights.push(`优势集中在「${topPositiveDimension.dimension}」，正向表现 ${topPositiveDimension.positiveCount ?? 0} 次。`);
    }
    if (trend?.recentTrend === 'up') {
      highlights.push('近期趋势向上，学习状态在持续改善。');
    }

    if (negativeCount > 0) {
      risks.push(`${periodLabel}负向 ${negativeCount} 次，影响积分 ${negativeDelta >= 0 ? '+' : ''}${negativeDelta}。`);
    }
    if (topNegativeDimension) {
      risks.push(`需重点关注「${topNegativeDimension.dimension}」，负向表现 ${topNegativeDimension.negativeCount ?? 0} 次。`);
    }
    if (trend?.recentTrend === 'down') {
      risks.push('最近趋势下行，建议尽快做小节奏纠偏。');
    }

    suggestionLines.slice(0, 2).forEach((line) => actions.push(line));
    if (actions.length === 0) {
      if (negativeCount > positiveCount) {
        actions.push('建议老师每日做一次课后复盘，优先跟进纪律与作业完成。');
      } else {
        actions.push('建议保持当前正向维度，每周设定 1 个可量化的小目标。');
      }
      actions.push('建议学生每两天自检一次课堂与作业执行情况，形成稳定节奏。');
    }

    const trendLine = `${periodLabel}净积分 ${trend?.totalScoreDelta && trend.totalScoreDelta > 0 ? `+${trend.totalScoreDelta}` : trend?.totalScoreDelta ?? 0} · 活跃天数 ${trend?.activeDays ?? 0} · 正向占比 ${positiveRatio}%`;

    return {
      summary: trimText(selectedStudentAiSummary.aiSummary, 160),
      suggestion: trimText(selectedStudentAiSummary.aiSuggestion, 110),
      highlights: highlights.slice(0, 2),
      risks: risks.slice(0, 2),
      actions: actions.slice(0, 2),
      trendLine,
      evidence: (trend?.evidence ?? []).slice(0, 3),
    };
  }, [selectedStudentAiSummary]);

  useEffect(() => {
    if (!classId && classes[0]?.id) {
      setClassId(String(classes[0].id));
    }
  }, [classId, classes]);

  useEffect(() => {
    const keyword = searchParams.get('keyword');
    const nextGrade = searchParams.get('gradeName');
    const nextClassId = searchParams.get('classId');
    const nextFocusFilter = searchParams.get('focusFilter');
    const nextStatsView = searchParams.get('statsView');
    const studentId = searchParams.get('studentId');

    if (keyword) setSearchKeyword(keyword);
    if (nextGrade) setGradeFilter(nextGrade);
    if (nextClassId) setClassFilter(nextClassId);
    if (nextFocusFilter === 'pet_bound' || nextFocusFilter === 'high_level') {
      setFocusFilter(nextFocusFilter);
    }
    if (nextStatsView === 'grade' || nextStatsView === 'class' || nextStatsView === 'student') {
      setStatsView(nextStatsView);
    }
    if (studentId) {
      const matched = students.find((item) => item.id === Number(studentId));
      if (matched) {
        setSelectedStudent(matched);
        setShowStudentScoreRecordsModal(false);
      }
    }
  }, [searchParams, students]);

  useEffect(() => {
    if (!selectedStudent) {
      setSelectedStudentDetail(null);
      setSelectedStudentAiSummary(null);
      setStudentDetailError(null);
      setStudentAiError(null);
      setStudentScoreRecords([]);
      setStudentScoreRecordsLoading(false);
      setStudentScoreRecordsError(null);
      setShowStudentScoreRecordsModal(false);
      setAiPeriodType('weekly');
      setObservationType('课堂表现');
      setObservationContent('');
      return;
    }

    let active = true;
    setStudentDetailLoading(true);
    setStudentDetailError(null);

    adminApi
      .studentDetail(token, selectedStudent.id)
      .then((response) => {
        if (!active) return;
        setSelectedStudentDetail(response.data);
      })
      .catch((err) => {
        if (!active) return;
        setStudentDetailError(err instanceof Error ? err.message : '学生详情加载失败');
      })
      .finally(() => {
        if (active) setStudentDetailLoading(false);
      });

    return () => {
      active = false;
    };
  }, [selectedStudent, token]);

  useEffect(() => {
    if (!selectedStudent) return;

    let active = true;
    setStudentAiLoading(true);
    setStudentAiError(null);

    adminApi
      .studentAiSummary(token, selectedStudent.id, aiPeriodType)
      .then((response) => {
        if (!active) return;
        setSelectedStudentAiSummary(response.data);
      })
      .catch((err) => {
        if (!active) return;
        setStudentAiError(err instanceof Error ? err.message : 'AI 学情摘要加载失败');
      })
      .finally(() => {
        if (active) setStudentAiLoading(false);
      });

    return () => {
      active = false;
    };
  }, [aiPeriodType, selectedStudent, token]);

  useEffect(() => {
    if (!selectedStudent) return;

    let active = true;
    setStudentScoreRecordsLoading(true);
    setStudentScoreRecordsError(null);

    adminApi
      .scoreRecords(token, {
        classId: selectedStudent.classId,
        studentId: selectedStudent.id,
      })
      .then((response) => {
        if (!active) return;
        setStudentScoreRecords(response.data.slice(0, 100));
      })
      .catch((err) => {
        if (!active) return;
        setStudentScoreRecordsError(err instanceof Error ? err.message : '积分记录加载失败');
      })
      .finally(() => {
        if (active) setStudentScoreRecordsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [selectedStudent, token]);

  function focusClass(classIdValue: number, nextGradeName?: string) {
    setClassFilter(String(classIdValue));
    if (nextGradeName) setGradeFilter(nextGradeName);
    setSearchKeyword('');
    setStatsView('class');
  }

  function openStudentDetail(studentId: number) {
    const matched = students.find((item) => item.id === studentId);
    if (!matched) return;
    setSelectedStudent(matched);
    setShowStudentScoreRecordsModal(false);
  }

  async function handleGenerateAiSummary() {
    if (!selectedStudent || studentAiGenerating) return;

    setStudentAiGenerating(true);
    setStudentAiError(null);

    try {
      const response = await adminApi.generateStudentAiSummary(token, selectedStudent.id, aiPeriodType);
      setSelectedStudentAiSummary(response.data);
    } catch (err) {
      setStudentAiError(err instanceof Error ? err.message : 'AI 学情生成失败');
    } finally {
      setStudentAiGenerating(false);
    }
  }

  function closeStudentDetail() {
    setSelectedStudent(null);
    setSelectedStudentDetail(null);
    setSelectedStudentAiSummary(null);
    setStudentDetailError(null);
    setStudentAiError(null);
    setStudentScoreRecords([]);
    setStudentScoreRecordsLoading(false);
    setStudentScoreRecordsError(null);
    setShowStudentScoreRecordsModal(false);
    setAiPeriodType('weekly');
    setObservationType('课堂表现');
    setObservationContent('');
  }

  async function reloadSelectedStudentDetail() {
    if (!selectedStudent) return;
    const response = await adminApi.studentDetail(token, selectedStudent.id);
    setSelectedStudentDetail(response.data);
  }

  async function handlePolishObservation() {
    if (!selectedStudent || !observationContent.trim() || observationPolishing) return;
    setObservationPolishing(true);
    setSubmitError(null);
    try {
      const response = await adminApi.polishTeacherObservation(token, {
        studentName: selectedStudent.name,
        className: selectedStudent.className,
        observationType: observationType.trim() || undefined,
        content: observationContent.trim(),
      });
      setObservationContent(response.data.content);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : '观察润色失败');
    } finally {
      setObservationPolishing(false);
    }
  }

  async function handleCreateObservation() {
    if (!selectedStudent || !selectedStudentDetail || observationSubmitting) return;
    setObservationSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(null);
    try {
      if (!observationContent.trim()) {
        throw new Error('请先填写观察内容');
      }
      await adminApi.createTeacherObservation(token, {
        studentId: selectedStudent.id,
        classId: selectedStudent.classId,
        observationType: observationType.trim() || undefined,
        content: observationContent.trim(),
      });
      await reloadSelectedStudentDetail();
      setObservationContent('');
      setSubmitSuccess('教师观察已保存');
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : '保存观察失败');
    } finally {
      setObservationSubmitting(false);
    }
  }

  function buildStudentsLocation(selectedStudentId?: number) {
    const params = new URLSearchParams();
    if (searchKeyword.trim()) params.set('keyword', searchKeyword.trim());
    if (gradeFilter !== 'all') params.set('gradeName', gradeFilter);
    if (classFilter !== 'all') params.set('classId', classFilter);
    if (focusFilter !== 'all') params.set('focusFilter', focusFilter);
    if (statsView !== 'grade') params.set('statsView', statsView);
    if (selectedStudentId) params.set('studentId', String(selectedStudentId));
    return params.size > 0 ? `/students?${params.toString()}` : '/students';
  }

  function navigateWithQuery(path: string, query: Record<string, string | number | null | undefined>) {
    const params = new URLSearchParams();
    Object.entries(query).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') return;
      params.set(key, String(value));
    });
    navigate(params.size > 0 ? `${path}?${params.toString()}` : path);
  }

  function goToClassManagement(classIdValue: number, gradeNameValue: string, label: string) {
    navigateWithQuery('/classes', {
      classId: classIdValue,
      keyword: classes.find((item) => item.id === classIdValue)?.name,
      statsView: 'class',
      returnTo: buildStudentsLocation(),
      returnLabel: label,
      gradeName: gradeNameValue,
    });
  }

  function resetListFilters() {
    setSearchKeyword('');
    setGradeFilter('all');
    setClassFilter('all');
    setFocusFilter('all');
  }

  function toggleSort(key: StudentSortKey) {
    setSortConfig((prev) => {
      if (!prev || prev.key !== key) {
        return { key, direction: 'asc' };
      }
      return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
    });
  }

  function renderSortHeader(label: string, key: StudentSortKey) {
    const active = sortConfig?.key === key;
    const indicator = active ? (sortConfig.direction === 'asc' ? '↑' : '↓') : '↕';
    return (
      <button className={`table-sort-button${active ? ' active' : ''}`} type="button" onClick={() => toggleSort(key)}>
        <span>{label}</span>
        <b>{indicator}</b>
      </button>
    );
  }

  function openImportModal(mode: StudentEntryMode) {
    setEntryMode(mode);
    setShowImport(true);
    setTextarea('');
    setImportStudentsData([]);
    setSingleStudentDraft({ studentNo: '', name: '', gender: '' });
    setImportFileName('');
    setSubmitError(null);
  }

  function closeImportModal(force = false) {
    if (submitting && !force) return;
    setShowImport(false);
    setTextarea('');
    setImportStudentsData([]);
    setSingleStudentDraft({ studentNo: '', name: '', gender: '' });
    setImportFileName('');
    setSubmitError(null);
  }

  async function handleExcelImport(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setSubmitError(null);
    setSubmitSuccess(null);

  try {
      const { read, utils } = await import('xlsx');
      const workbook = read(await file.arrayBuffer(), { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      if (!firstSheetName) {
        throw new Error('Excel 文件中没有可读取的工作表');
      }

      const sheet = workbook.Sheets[firstSheetName];
      const rows = utils.sheet_to_json(sheet, { header: 1, raw: false, defval: '' }) as unknown[][];
      const parsedStudents = parseStudentImportRows(rows);

      if (!parsedStudents.length) {
        throw new Error('Excel 中没有有效的学生数据');
      }

      setImportStudentsData(parsedStudents);
      setImportFileName(file.name);
      setTextarea(
        parsedStudents
          .map((item) => [item.studentNo, item.name, item.gender].filter(Boolean).join(' '))
          .join('\n'),
      );
      setSubmitSuccess(`已读取 ${parsedStudents.length} 条学生数据：${file.name}`);
    } catch (err) {
      setImportStudentsData([]);
      setImportFileName('');
      setTextarea('');
      setSubmitError(err instanceof Error ? err.message : 'Excel 解析失败');
    }
  }

  async function handleImport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(null);

    try {
      if (!classId) {
        throw new Error(entryMode === 'single' ? '请先选择学生所在班级' : '请先选择导入班级');
      }

      if (!/^\d+$/.test(classId)) {
        throw new Error('导入班级无效，请重新选择');
      }

      const payloadStudents =
        entryMode === 'single'
          ? [
              {
                studentNo: singleStudentDraft.studentNo.trim(),
                name: singleStudentDraft.name.trim(),
                ...(singleStudentDraft.gender.trim() ? { gender: singleStudentDraft.gender.trim() } : {}),
              },
            ]
          : importStudentsData.length > 0
            ? importStudentsData
            : parseStudentImportText(textarea);

      if (entryMode === 'single' && (!payloadStudents[0]?.studentNo || !payloadStudents[0]?.name)) {
        throw new Error('请填写完整的学号和姓名');
      }

      const duplicatedStudentNoInPayload = Array.from(
        payloadStudents.reduce((map, item) => {
          const key = normalizeStudentNo(item.studentNo);
          map.set(key, (map.get(key) ?? 0) + 1);
          return map;
        }, new Map<string, number>()),
      ).find(([, count]) => count > 1)?.[0];
      if (duplicatedStudentNoInPayload) {
        throw new Error(`学号重复：本次提交中存在重复学号 ${duplicatedStudentNoInPayload}`);
      }

      const existingStudentNos = new Set(students.map((item) => normalizeStudentNo(item.studentNo)));
      const duplicatedExistingStudent = payloadStudents.find((item) =>
        existingStudentNos.has(normalizeStudentNo(item.studentNo)),
      );
      if (duplicatedExistingStudent) {
        throw new Error(`学号重复：${duplicatedExistingStudent.studentNo} 已存在`);
      }

      const payload: StudentImportPayload = {
        classId: Number(classId),
        students: payloadStudents,
      };

      if (!payload.students.length) {
        throw new Error(entryMode === 'single' ? '请先填写学生信息' : '请先录入学生数据');
      }

      const response = await adminApi.importStudents(token, payload);
      await onSaved();
      setSubmitSuccess(entryMode === 'single' ? '学生已新增' : `已导入 ${response.data.createdCount} 名学生`);
      closeImportModal(true);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : '导入失败');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Shell
      title="学生管理"
      subtitle="学生档案、积分成长、萌宠等级与观察记录"
      user={user}
      status={
        <>
          {loading ? <div className="status-card">学生数据加载中...</div> : null}
          {error ? <div className="status-card error">{error}</div> : null}
          {submitSuccess ? <div className="status-card success">{submitSuccess}</div> : null}
        </>
      }
    >
      <div className="page-header">
        <div>
          <h2>学生管理</h2>
          <p className="page-desc">从校级视角查看学生规模、成长状态和萌宠绑定覆盖情况。</p>
        </div>
        <div className="page-actions">
          {returnTo ? (
            <button className="ghost-button" type="button" onClick={() => navigate(returnTo)}>
              {returnLabel}
            </button>
          ) : null}
          <div className="search-box">
            <span className="s-icon">⌕</span>
            <input
              placeholder="搜索学生姓名/学号..."
              value={searchKeyword}
              onChange={(event) => setSearchKeyword(event.target.value)}
            />
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
            {classes.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
          {allowImport ? (
            <>
              <button className="btn btn-outline" type="button" onClick={() => openImportModal('batch')}>
                批量导入
              </button>
              <button className="btn btn-primary" type="button" onClick={() => openImportModal('single')}>
                + 新增学生
              </button>
            </>
          ) : null}
        </div>
      </div>

      <div className="metric-strip">
        <div className="metric-card">
          <span>学生总数</span>
          <button className="metric-value-button" type="button" onClick={resetListFilters}>
            {students.length}
          </button>
          <p>当前已建立学生档案、可参与成长统计的学生总量。</p>
        </div>
        <div className="metric-card">
          <span>萌宠绑定率</span>
          <button className="metric-value-button" type="button" onClick={() => setFocusFilter('pet_bound')}>
            {students.length ? `${Math.round((studentsWithPetCount / students.length) * 100)}%` : '0%'}
          </button>
          <p>已完成萌宠绑定的学生覆盖比例，便于观察成长体系接入情况。</p>
        </div>
        <div className="metric-card">
          <span>高等级萌宠</span>
          <button className="metric-value-button" type="button" onClick={() => setFocusFilter('high_level')}>
            {highLevelPetCount}
          </button>
          <p>萌宠等级达到 5 级及以上的学生人数，适合作为阶段成果观察点。</p>
        </div>
        <button
          className={`metric-card metric-card-action${showOverview ? " active" : ""}`}
          type="button"
          onClick={() => setShowOverview((prev) => !prev)}
        >
          <span>{showOverview ? "收起更多分析" : "更多分析"}</span>
          <strong>{showOverview ? "收起剩余分析卡片" : "展开剩余分析卡片"}</strong>
          <p>
            {studentsWithPetCount} 人已绑定萌宠，
            {coveredClassCount} 个班已接入，展开后可查看年级、班级、学生等更多分析。
          </p>
        </button>
      </div>

      {showOverview ? (
        <div className="panel summary-panel">
          {gradeFilter !== 'all' || classFilter !== 'all' || focusFilter !== 'all' || searchKeyword.trim() ? (
            <div className="summary-panel-actions">
              <button className="ghost-button" type="button" onClick={resetListFilters}>
                查看全部学生
              </button>
            </div>
          ) : null}
          <div className="detail-grid">
            <div className="detail-card">
              <h4>学生规模</h4>
              <div className="detail-list">
                <div><span>学生总数</span><strong>{students.length} 人</strong></div>
                <div><span>平均当前积分</span><strong>{averageCurrentScore} 分</strong></div>
                <div><span>男生人数</span><strong>{genderSummary.male} 人</strong></div>
                <div><span>女生人数</span><strong>{genderSummary.female} 人</strong></div>
              </div>
            </div>
            <div className="detail-card">
              <h4>成长覆盖</h4>
              <div className="detail-list">
                <div><span>已绑定萌宠</span><strong>{studentsWithPetCount} 人</strong></div>
                <div><span>待领养萌宠</span><strong>{studentsWithoutPet} 人</strong></div>
                <div><span>高等级萌宠</span><strong>{highLevelPetCount} 人</strong></div>
                <div><span>数据覆盖班级</span><strong>{coveredClassCount} 个</strong></div>
              </div>
            </div>
            <div className="detail-card">
              <h4>年级概览</h4>
              <div className="mini-list">
                {gradeOverview.slice(0, 4).map((item) => (
                  <div className="mini-list-item" key={item.gradeName}>
                    <div>
                      <strong>{item.gradeName}</strong>
                      <span>{item.studentCount} 名学生，{item.petBoundCount} 人已绑定萌宠</span>
                    </div>
                    <b>{item.averageScore} 分</b>
                  </div>
                ))}
                {gradeOverview.length === 0 ? (
                  <div className="mini-list-item">
                    <div>
                      <strong>暂无学生数据</strong>
                      <span>导入学生后，这里会展示年级层面的整体成长概况。</span>
                    </div>
                    <b>待建立</b>
                  </div>
                ) : null}
              </div>
            </div>
            <div className="detail-card">
              <h4>成长关注</h4>
              <div className="mini-list">
                {topStudents.map((item) => (
                  <div className="mini-list-item" key={item.id}>
                    <div>
                      <strong>{item.name}</strong>
                      <span>{item.className} · {item.pet?.name ?? '未领养萌宠'}</span>
                    </div>
                    <b>{item.currentScore} 分</b>
                  </div>
                ))}
                {topStudents.length === 0 ? (
                  <div className="mini-list-item">
                    <div>
                      <strong>暂无成长重点对象</strong>
                      <span>学生数据接入后，这里会显示当前积分领先的学生。</span>
                    </div>
                    <b>待建立</b>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <div className="panel">
        <div className="page-header">
          <div>
            <div className="panel-title">学生列表</div>
            <p className="page-desc">查看学生档案、积分与萌宠绑定情况。</p>
          </div>
        </div>
        <div className="data-table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>{renderSortHeader('姓名', 'name')}</th>
              <th>{renderSortHeader('班级', 'className')}</th>
              <th>{renderSortHeader('学号', 'studentNo')}</th>
              <th>{renderSortHeader('萌宠', 'petName')}</th>
              <th>状态</th>
              <th>{renderSortHeader('当前积分', 'currentScore')}</th>
              <th>{renderSortHeader('萌宠等级', 'currentPetLevel')}</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {studentPagination.pagedItems.map((row) => (
              <tr key={row.id}>
                <td>{row.name}</td>
                <td>{row.className}</td>
                <td>{row.studentNo}</td>
                <td>{row.pet?.name ?? '未领养'}</td>
                <td><span className="status-on">正常</span></td>
                <td>{row.currentScore}</td>
                <td>{row.currentPetLevel}</td>
                <td>
                  <button className="op-btn" type="button" onClick={() => openStudentDetail(row.id)}>
                    详情
                  </button>
                </td>
              </tr>
            ))}
            {filteredStudents.length === 0 ? (
              <tr>
                <td colSpan={8} className="table-empty">
                  当前筛选条件下没有学生数据
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
        </div>
        <TablePagination
          currentPage={studentPagination.currentPage}
          pageSize={studentPagination.pageSize}
          totalItems={studentPagination.totalItems}
          totalPages={studentPagination.totalPages}
          onPageChange={studentPagination.setCurrentPage}
          onPageSizeChange={studentPagination.setPageSize}
        />
      </div>

      {allowImport && showImport ? (
        <Modal
          title={entryMode === 'single' ? '新增学生' : '导入学生'}
          subtitle={entryMode === 'single' ? '支持逐个新增学生档案' : '支持逐行粘贴或上传 Excel 批量导入学生档案'}
          onClose={closeImportModal}
        >
          <form className="form-grid" onSubmit={handleImport}>
            <label className="span-2">
              <span>{entryMode === 'single' ? '所在班级' : '目标班级'}</span>
              <select value={classId} onChange={(event) => setClassId(event.target.value)}>
                <option value="">请选择班级</option>
                {classes.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.gradeName} {item.name}
                  </option>
                ))}
              </select>
            </label>
            {entryMode === 'single' ? (
              <>
                <label>
                  <span>学号</span>
                  <input
                    type="text"
                    value={singleStudentDraft.studentNo}
                    onChange={(event) =>
                      setSingleStudentDraft((prev) => ({
                        ...prev,
                        studentNo: event.target.value,
                      }))
                    }
                  />
                </label>
                <label>
                  <span>姓名</span>
                  <input
                    type="text"
                    value={singleStudentDraft.name}
                    onChange={(event) =>
                      setSingleStudentDraft((prev) => ({
                        ...prev,
                        name: event.target.value,
                      }))
                    }
                  />
                </label>
                <label className="span-2">
                  <span>性别（选填）</span>
                  <select
                    value={singleStudentDraft.gender}
                    onChange={(event) =>
                      setSingleStudentDraft((prev) => ({
                        ...prev,
                        gender: event.target.value,
                      }))
                    }
                  >
                    <option value="">未填写</option>
                    <option value="男">男</option>
                    <option value="女">女</option>
                  </select>
                </label>
              </>
            ) : (
              <>
                <label className="span-2">
                  <span>Excel 导入</span>
                  <input type="file" accept=".xlsx,.xls,.csv" onChange={(event) => void handleExcelImport(event)} />
                  <div className="settings-note">
                    支持 `.xlsx/.xls/.csv`，可使用表头：学号、姓名、性别、头像地址。
                    {importFileName ? ` 当前文件：${importFileName}` : ''}
                  </div>
                </label>
                <label className="span-2">
                  <span>学生清单</span>
                  <textarea
                    value={textarea}
                    onChange={(event) => {
                      setTextarea(event.target.value);
                      setImportStudentsData([]);
                      setImportFileName('');
                    }}
                    placeholder={'示例：\n1001 张小明 男\n1002 李小雨 女'}
                    rows={8}
                  />
                </label>
              </>
            )}
            {submitError ? <div className="status-card error span-2">{submitError}</div> : null}
            <div className="form-actions span-2">
              <button type="button" className="ghost-button" onClick={() => closeImportModal()} disabled={submitting}>
                取消
              </button>
              <button type="submit" className="toolbar-button" disabled={submitting}>
                {submitting ? (entryMode === 'single' ? '提交中...' : '导入中...') : entryMode === 'single' ? '确认新增' : '开始导入'}
              </button>
            </div>
          </form>
        </Modal>
      ) : null}

      {selectedStudent ? (
        <Modal
          title={`${selectedStudent.name} · 学生成长档案`}
          subtitle="展示学生基础档案、教师观察与 AI 学情总结"
          onClose={closeStudentDetail}
        >
          <div className="detail-grid">
            <div className="detail-card">
              <h4>基本资料</h4>
              <div className="detail-list">
                <div><span>姓名</span><strong>{selectedStudent.name}</strong></div>
                <div><span>班级</span><strong>{selectedStudent.className}</strong></div>
                <div><span>学号</span><strong>{selectedStudent.studentNo}</strong></div>
                <div><span>分组</span><strong>{selectedStudentDetail?.group?.name ?? '-'}</strong></div>
                <div><span>状态</span><strong>正常</strong></div>
              </div>
            </div>
            <div className="detail-card">
              <div className="student-score-summary-header">
                <h4>积分数据</h4>
                <button
                  type="button"
                  className="ghost-button student-score-records-button"
                  onClick={() => setShowStudentScoreRecordsModal(true)}
                >
                  积分记录
                </button>
              </div>
              <div className="detail-list">
                <div><span>当前积分</span><strong>{selectedStudentDetail?.profile?.currentScore ?? selectedStudent.currentScore}</strong></div>
                <div><span>累计积分</span><strong>{selectedStudentDetail?.profile?.totalScore ?? selectedStudent.totalScore}</strong></div>
                <div><span>萌宠等级</span><strong>Lv.{selectedStudentDetail?.profile?.currentPetLevel ?? selectedStudent.currentPetLevel}</strong></div>
                <div><span>近 7 天正向</span><strong>{selectedStudentDetail?.profile?.positiveCount7d ?? 0} 次</strong></div>
                <div><span>近 7 天负向</span><strong>{selectedStudentDetail?.profile?.negativeCount7d ?? 0} 次</strong></div>
              </div>
            </div>
            <div className="detail-card span-2">
              <div className="student-ai-header">
                <div>
                  <h4>AI 学情分析</h4>
                  <p>基于课堂、作业、学科和测评相关积分事件生成阶段性总结。</p>
                </div>
                <div className="student-ai-actions">
                  <select value={aiPeriodType} onChange={(event) => setAiPeriodType(event.target.value as 'weekly' | 'monthly')}>
                    <option value="weekly">本周</option>
                    <option value="monthly">本月</option>
                  </select>
                  <button
                    className="btn btn-primary"
                    type="button"
                    onClick={() => void handleGenerateAiSummary()}
                    disabled={studentAiGenerating}
                  >
                    {studentAiGenerating ? '生成中...' : selectedStudentAiSummary ? '重新生成' : '生成分析'}
                  </button>
                </div>
              </div>
              {studentAiLoading ? <div className="student-ai-placeholder">AI 学情摘要加载中...</div> : null}
              {studentAiError ? <div className="status-card error">{studentAiError}</div> : null}
              {selectedStudentAiSummary ? (
                <div className="student-ai-panel">
                  <div className="student-ai-summary">
                    <strong>阶段总结</strong>
                    <p>{aiViewData?.summary || '暂无总结'}</p>
                  </div>
                  <div className="student-ai-summary soft">
                    <strong>教师建议</strong>
                    <p>{aiViewData?.suggestion || '暂无建议'}</p>
                  </div>
                  <div className="student-ai-trend">{aiViewData?.trendLine || '本期趋势：暂无数据'}</div>
                  <div className="student-ai-quick-grid">
                    <div className="student-ai-quick-card">
                      <strong>本期亮点</strong>
                      {(aiViewData?.highlights ?? []).length > 0 ? (
                        <div className="student-ai-quick-list">
                          {(aiViewData?.highlights ?? []).map((item) => (
                            <span key={item}>{item}</span>
                          ))}
                        </div>
                      ) : (
                        <p>暂无明显亮点，建议继续积累正向表现。</p>
                      )}
                    </div>
                    <div className="student-ai-quick-card">
                      <strong>风险提醒</strong>
                      {(aiViewData?.risks ?? []).length > 0 ? (
                        <div className="student-ai-quick-list">
                          {(aiViewData?.risks ?? []).map((item) => (
                            <span key={item}>{item}</span>
                          ))}
                        </div>
                      ) : (
                        <p>暂无高风险信号，当前状态整体平稳。</p>
                      )}
                    </div>
                    <div className="student-ai-quick-card">
                      <strong>下阶段建议</strong>
                      {(aiViewData?.actions ?? []).length > 0 ? (
                        <div className="student-ai-quick-list">
                          {(aiViewData?.actions ?? []).map((item) => (
                            <span key={item}>{item}</span>
                          ))}
                        </div>
                      ) : (
                        <p>暂无建议，可点击“重新生成”刷新分析。</p>
                      )}
                    </div>
                  </div>
                  <div className="student-ai-metrics">
                    <div>
                      <span>正向次数</span>
                      <strong>{selectedStudentAiSummary.positiveSummary?.count ?? 0}</strong>
                    </div>
                    <div>
                      <span>负向次数</span>
                      <strong>{selectedStudentAiSummary.negativeSummary?.count ?? 0}</strong>
                    </div>
                    <div>
                      <span>积分净变化</span>
                      <strong>{selectedStudentAiSummary.trendSummary?.totalScoreDelta ?? 0}</strong>
                    </div>
                    <div>
                      <span>活跃天数</span>
                      <strong>{selectedStudentAiSummary.trendSummary?.activeDays ?? 0}</strong>
                    </div>
                  </div>
                  <div className="detail-grid student-ai-grid">
                    <div className="detail-card">
                      <h4>高频维度</h4>
                      <div className="mini-list">
                        {(selectedStudentAiSummary.dimensionSummary ?? []).slice(0, 4).map((item, index) => (
                          <div className="mini-list-item" key={`${item.dimension}-${item.count}-${index}`}>
                            <div>
                              <strong>{item.dimension}</strong>
                              <span>正向 {item.positiveCount ?? 0} 次，负向 {item.negativeCount ?? 0} 次</span>
                            </div>
                            <b>{item.count} 次</b>
                          </div>
                        ))}
                        {(selectedStudentAiSummary.dimensionSummary ?? []).length === 0 ? (
                          <div className="mini-list-item">
                            <div>
                              <strong>暂无维度统计</strong>
                              <span>生成后会展示学习维度和风险关注点。</span>
                            </div>
                            <b>待生成</b>
                          </div>
                        ) : null}
                      </div>
                    </div>
                    <div className="detail-card">
                      <h4>最近证据</h4>
                      <div className="mini-list">
                        {(aiViewData?.evidence ?? []).map((item, index) => (
                          <div className="mini-list-item" key={`${item.date}-${item.ruleName}-${item.signal}-${item.scoreDelta}-${index}`}>
                            <div>
                              <strong>{item.ruleName}</strong>
                              <span>{item.date} · {item.subject} · {item.scene}{item.remark ? ` · ${item.remark}` : ''}</span>
                            </div>
                            <b>{item.scoreDelta > 0 ? `+${item.scoreDelta}` : item.scoreDelta}</b>
                          </div>
                        ))}
                        {(aiViewData?.evidence ?? []).length === 0 ? (
                          <div className="mini-list-item">
                            <div>
                              <strong>暂无关键证据</strong>
                              <span>生成后会展示最近的课堂、作业和学科事件。</span>
                            </div>
                            <b>待生成</b>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>
              ) : !studentAiLoading ? (
                <div className="student-ai-placeholder">当前周期还没有学情快照，点击“生成分析”即可落库并展示。</div>
              ) : null}
            </div>
            <div className="detail-card span-2">
              <h4>萌宠档案</h4>
              <div className="detail-pet-panel">
                <div className="detail-pet-cover">{selectedStudentDetail?.pet?.name?.slice(0, 1) ?? selectedStudent.pet?.name?.slice(0, 1) ?? '未'}</div>
                <div className="detail-list">
                  <div><span>萌宠名称</span><strong>{selectedStudentDetail?.pet?.name ?? selectedStudent.pet?.name ?? '未领养'}</strong></div>
                  <div><span>当前等级</span><strong>{selectedStudentDetail?.pet ? `Lv.${selectedStudentDetail.pet.currentLevel}` : selectedStudent.pet ? `Lv.${selectedStudent.pet.currentLevel}` : '-'}</strong></div>
                  <div><span>当前阶段</span><strong>{selectedStudentDetail?.pet ? `第 ${selectedStudentDetail.pet.currentStageNo} 阶段` : '-'}</strong></div>
                  <div><span>累计积分</span><strong>{selectedStudentDetail?.pet?.totalScore ?? selectedStudent.pet?.totalScore ?? 0}</strong></div>
                  <div><span>成长状态</span><strong>{selectedStudentDetail?.pet || selectedStudent.pet ? '已绑定成长轨迹' : '待领养'}</strong></div>
                </div>
              </div>
            </div>
            <div className="detail-card span-2">
              <h4>教师观察</h4>
              <div className="observation-form">
                <div className="observation-form-head">
                  <select value={observationType} onChange={(event) => setObservationType(event.target.value)}>
                    <option value="课堂表现">课堂表现</option>
                    <option value="作业情况">作业情况</option>
                    <option value="测评反馈">测评反馈</option>
                    <option value="学习习惯">学习习惯</option>
                    <option value="阶段跟进">阶段跟进</option>
                  </select>
                  <div className="observation-form-actions">
                    <button className="btn btn-outline" type="button" onClick={() => void handlePolishObservation()} disabled={observationPolishing}>
                      {observationPolishing ? 'AI 润色中...' : 'AI 润色'}
                    </button>
                    <button className="btn btn-primary" type="button" onClick={() => void handleCreateObservation()} disabled={observationSubmitting}>
                      {observationSubmitting ? '保存中...' : '保存观察'}
                    </button>
                  </div>
                </div>
                <textarea
                  value={observationContent}
                  onChange={(event) => setObservationContent(event.target.value)}
                  rows={4}
                  placeholder="例如：本周课堂专注度明显提升，但数学作业仍有拖延，建议继续跟进提交及时性。"
                />
              </div>
              <div className="mini-list">
                {(selectedStudentDetail?.teacherObservations ?? []).slice(0, 5).map((item) => (
                  <div className="mini-list-item" key={item.id}>
                    <div>
                      <strong>{item.observationType || '教师观察'}</strong>
                      <span>{new Date(item.createdAt).toLocaleString('zh-CN')}</span>
                    </div>
                    <b>{item.content}</b>
                  </div>
                ))}
                {(selectedStudentDetail?.teacherObservations?.length ?? 0) === 0 ? (
                  <div className="mini-list-item">
                    <div>
                      <strong>暂无教师观察</strong>
                      <span>后续接入观察记录后，这里会作为 AI 学情画像的重要补充依据。</span>
                    </div>
                    <b>待补充</b>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
          {studentDetailLoading ? <div className="student-ai-placeholder">学生详情加载中...</div> : null}
          {studentDetailError ? <div className="status-card error">{studentDetailError}</div> : null}
        </Modal>
      ) : null}

      {selectedStudent && showStudentScoreRecordsModal ? (
        <Modal
          title={`${selectedStudent.name} · 积分记录`}
          subtitle="展示该学生最近 100 条积分流水"
          onClose={() => setShowStudentScoreRecordsModal(false)}
        >
          <div className="student-score-records-modal-body">
            {studentScoreRecordsLoading ? <div className="student-ai-placeholder">积分记录加载中...</div> : null}
            {studentScoreRecordsError ? <div className="status-card error">{studentScoreRecordsError}</div> : null}
            {!studentScoreRecordsLoading && !studentScoreRecordsError ? (
              <div className="mini-list student-score-records-modal-list">
                {studentScoreRecords.map((item) => (
                  <div className="mini-list-item" key={`${item.id}-${item.createdAt}`}>
                    <div>
                      <strong>
                        {item.ruleName || item.tag || item.dimension || item.sceneCode || '评价记录'} · {item.scoreDelta > 0 ? '+' : ''}
                        {item.scoreDelta} 分
                      </strong>
                      <span>
                        {new Date(item.createdAt).toLocaleString('zh-CN')} · {item.remark || '无备注'}
                      </span>
                    </div>
                    <b>{item.operatorName || item.sourceRole || '教师'}</b>
                  </div>
                ))}
                {studentScoreRecords.length === 0 ? (
                  <div className="mini-list-item">
                    <div>
                      <strong>暂无积分记录</strong>
                      <span>该学生暂未产生可展示的积分流水。</span>
                    </div>
                    <b>待产生</b>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        </Modal>
      ) : null}
    </Shell>
  );
}

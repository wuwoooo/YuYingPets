import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Modal } from '../components/Modal';
import { ScoreRecordListItem, ScoreRecordReverseModal } from '../components/ScoreRecordReverseModal';
import { PickerInput } from '../components/PickerInput';
import { PresentationGlyph } from '../components/PresentationGlyph';
import { Shell } from '../components/Shell';
import { TablePagination } from '../components/TablePagination';
import { usePagination } from '../hooks/usePagination';
import { useAdminView } from '../context/AdminViewContext';
import { useConfirmDialog } from '../context/ConfirmDialogContext';
import type { 
  AdminClass,
  AdminStudent,
  AcademicExamListItem,
  AcademicScoreImportPayload,
  AcademicExamUpdatePayload,
  AcademicScoreListRow,
  AiStudentSummary,
  HonorRecord,
  ScoreRecord,
  SessionUser,
  StudentAcademicExam,
  StudentDetail,
  StudentImportPayload,
  StudentUpdatePayload,
  SystemSettings,
} from '../lib/api';
import { adminApi } from '../lib/api';
import { resolveAssetUrl } from '../lib/assets';
import {
  formatEnabledStatus,
  normalizeKeyword
} from '../utils/adminForms';
import { canDeleteAcademicExams, canEditStudents, canImportStudents } from '../utils/adminPermissions';
import { canShowScoreRecordReverse } from '../utils/scoreRecordReverse';
import { parseAcademicScoreWorkbook, inferAcademicPeriodLabel, resolveAcademicImportDraft, parseLegacyXlsRows } from '../utils/academicImport';
import { parseCsvRows, readXlsxWorkbookRows } from '../utils/workbookRows';
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

type StudentSortKey = 'name' | 'className' | 'studentNo' | 'petName' | 'currentScore' | 'currentPetLevel' | 'totalScore' | 'schoolRank' | 'classRank';
type SortDirection = 'asc' | 'desc';
type StudentEntryMode = 'single' | 'batch';
type StudentDraft = { studentNo: string; name: string; gender: string };
type StudentListTab = 'students' | 'scores';

function todayDateInputValue() {
  return new Date().toISOString().slice(0, 10);
}

function dateInputValue(value: string | null | undefined) {
  if (!value) return '';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return String(value).slice(0, 10);
  return parsed.toISOString().slice(0, 10);
}

function buildAcademicImportSourceText(
  examName: string,
  sourceFile?: string,
  fileName?: string,
) {
  return `${examName} ${sourceFile ?? fileName ?? ''}`.trim();
}

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

function normalizeDimensionSummary(value: AiStudentSummary['dimensionSummary']) {
  if (!Array.isArray(value)) return [];
  return value;
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
  const { activeSubjectView } = useAdminView();
  const { confirm } = useConfirmDialog();
  const isSubjectTeacher = user?.roleCode === 'subject_teacher';



  const pagePresentation =
    isSubjectTeacher
      ? {
          title: '学生查看',
          shellSubtitle: '名单默认对应您在顶部选的班级；切换班级请用右上角下拉。',
          heading: '学生查看',
          description: '查看当前所选班级的学生档案与成绩；无需在本页再选班级。',
        }
      : {
          title: '学生管理',
          shellSubtitle: '学生档案、积分成长、萌宠等级与观察记录',
          heading: '学生管理',
          description: '从校级视角查看学生规模、成长状态和萌宠绑定覆盖情况。',
        };
  const [statsView, setStatsView] = useState<'grade' | 'class' | 'student'>('grade');
  const [showOverview, setShowOverview] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [showAcademicImport, setShowAcademicImport] = useState(false);
  const [showAcademicExamEdit, setShowAcademicExamEdit] = useState(false);
  const [listTab, setListTab] = useState<StudentListTab>('students');
  const [entryMode, setEntryMode] = useState<StudentEntryMode>('batch');
  const [editingStudent, setEditingStudent] = useState<AdminStudent | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<AdminStudent | null>(null);
  const [selectedStudentDetail, setSelectedStudentDetail] = useState<StudentDetail | null>(null);
  const [selectedStudentAiSummary, setSelectedStudentAiSummary] = useState<AiStudentSummary | null>(null);
  const [aiPeriodType, setAiPeriodType] = useState<'weekly' | 'monthly'>('weekly');
  const autoAiSummaryRequestsRef = useRef(new Map<string, ReturnType<typeof adminApi.generateStudentAiSummary>>());
  const [studentDetailLoading, setStudentDetailLoading] = useState(false);
  const [studentDetailError, setStudentDetailError] = useState<string | null>(null);
  const [studentAiLoading, setStudentAiLoading] = useState(false);
  const [studentAiGenerating, setStudentAiGenerating] = useState(false);
  const [studentAiError, setStudentAiError] = useState<string | null>(null);
  const [studentScoreRecords, setStudentScoreRecords] = useState<ScoreRecord[]>([]);
  const [studentAcademicRecords, setStudentAcademicRecords] = useState<StudentAcademicExam[]>([]);
  const [studentAcademicLoading, setStudentAcademicLoading] = useState(false);
  const [studentAcademicError, setStudentAcademicError] = useState<string | null>(null);
  const [studentScoreRecordsLoading, setStudentScoreRecordsLoading] = useState(false);
  const [studentScoreRecordsError, setStudentScoreRecordsError] = useState<string | null>(null);
  const [studentHonorRecords, setStudentHonorRecords] = useState<HonorRecord[]>([]);
  const [studentHonorsLoading, setStudentHonorsLoading] = useState(false);
  const [studentHonorsError, setStudentHonorsError] = useState<string | null>(null);
  const [showStudentScoreRecordsModal, setShowStudentScoreRecordsModal] = useState(false);
  const [scoreRecordReverseTarget, setScoreRecordReverseTarget] = useState<ScoreRecord | null>(null);
  const [scoreRecordReverseLoading, setScoreRecordReverseLoading] = useState(false);
  const [observationType, setObservationType] = useState('课堂表现');
  const [observationContent, setObservationContent] = useState('');
  const [observationSubmitting, setObservationSubmitting] = useState(false);
  const [observationPolishing, setObservationPolishing] = useState(false);
  const [classId, setClassId] = useState(classes[0]?.id ? String(classes[0].id) : '');
  const [textarea, setTextarea] = useState('');
  const [importStudentsData, setImportStudentsData] = useState<StudentImportPayload['students']>([]);
  const [singleStudentDraft, setSingleStudentDraft] = useState<StudentDraft>({
    studentNo: '',
    name: '',
    gender: '',
  });
  const [importFileName, setImportFileName] = useState('');
  const [academicImportFileName, setAcademicImportFileName] = useState('');
  const [academicImportData, setAcademicImportData] = useState<AcademicScoreImportPayload | null>(null);
  const [academicImportExamName, setAcademicImportExamName] = useState('');
  const [academicImportGradeName, setAcademicImportGradeName] = useState('');
  const [academicImportExamDate, setAcademicImportExamDate] = useState(todayDateInputValue());
  const [academicImportPeriodLabel, setAcademicImportPeriodLabel] = useState('');
  const [academicImportPeriodLabelEdited, setAcademicImportPeriodLabelEdited] = useState(false);
  const [academicImportExamDateEdited, setAcademicImportExamDateEdited] = useState(false);
  const [editingAcademicExam, setEditingAcademicExam] = useState<AcademicExamListItem | null>(null);
  const [academicExamDraft, setAcademicExamDraft] = useState<AcademicExamUpdatePayload>({
    examName: '',
    examDate: todayDateInputValue(),
    periodLabel: '',
  });
  const [currentSemester, setCurrentSemester] = useState<SystemSettings['semester'] | null>(null);
  const [academicImportSubmitting, setAcademicImportSubmitting] = useState(false);
  const [academicExamEditSubmitting, setAcademicExamEditSubmitting] = useState(false);
  const [academicExamDeleteSubmitting, setAcademicExamDeleteSubmitting] = useState(false);
  const [academicExams, setAcademicExams] = useState<AcademicExamListItem[]>([]);
  const [academicScores, setAcademicScores] = useState<AcademicScoreListRow[]>([]);
  const [academicScoresLoading, setAcademicScoresLoading] = useState(false);
  const [academicScoresError, setAcademicScoresError] = useState<string | null>(null);
  const [examFilter, setExamFilter] = useState('all');
  const [academicReloadKey, setAcademicReloadKey] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [resetPetSubmitting, setResetPetSubmitting] = useState(false);
  const [resetPetNicknameSubmitting, setResetPetNicknameSubmitting] = useState(false);
  const [statusSubmitting, setStatusSubmitting] = useState(false);
  const [managementStudents, setManagementStudents] = useState<AdminStudent[]>([]);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [gradeFilter, setGradeFilter] = useState('all');
  const [classFilter, setClassFilter] = useState('all');
  const [focusFilter, setFocusFilter] = useState<'all' | 'pet_bound' | 'high_level'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'enabled' | 'disabled'>('enabled');
  const [sortConfig, setSortConfig] = useState<{ key: StudentSortKey; direction: SortDirection } | null>(null);
  const allowImport = canImportStudents(user?.roleCode);
  const allowEdit = canEditStudents(user?.roleCode);
  const petAdminBusy = resetPetSubmitting || resetPetNicknameSubmitting;
  const allowDeleteAcademicExam = canDeleteAcademicExams(user?.roleCode);
  const selectedAcademicExam = examFilter === 'all'
    ? null
    : academicExams.find((item) => String(item.id) === examFilter) ?? null;
  const returnTo = searchParams.get('returnTo');
  const returnLabel = searchParams.get('returnLabel') || '返回来源页面';
  const gradeOptions = useMemo(
    () => Array.from(new Set(classes.map((item) => item.gradeName).filter(Boolean))),
    [classes],
  );
  const classMap = useMemo(() => new Map(classes.map((item) => [item.id, item])), [classes]);
  const homeroomClassIds = useMemo(
    () => classes.filter((item) => item.homeroomTeacher?.id === user?.id).map((item) => item.id),
    [classes, user?.id],
  );
  const classFilterOptions = useMemo(
    () => classes.filter((item) => gradeFilter === 'all' || item.gradeName === gradeFilter),
    [classes, gradeFilter],
  );
  const listStudents = allowEdit && managementStudents.length > 0 ? managementStudents : students;

  useEffect(() => {
    if (!token || !allowEdit) {
      setManagementStudents([]);
      return;
    }
    let active = true;
    adminApi
      .students(token, { includeDisabled: true })
      .then((response) => {
        if (!active) return;
        setManagementStudents(response.data);
      })
      .catch(() => {
        if (!active) return;
        setManagementStudents(students);
      });
    return () => {
      active = false;
    };
  }, [token, allowEdit, students]);

  const metricStudents = useMemo(() => {
    const keyword = normalizeKeyword(searchKeyword);
    return listStudents.filter((row) => {
      const classInfo = classMap.get(row.classId);
      const matchesKeyword =
        !keyword ||
        normalizeKeyword(row.name).includes(keyword) ||
        normalizeKeyword(row.studentNo).includes(keyword) ||
        normalizeKeyword(row.className).includes(keyword);
      const matchesGrade = gradeFilter === 'all' || classInfo?.gradeName === gradeFilter;
      const matchesClass = classFilter === 'all' || String(row.classId) === classFilter;
      const matchesStatus = statusFilter === 'all' || (row.status ?? 'enabled') === statusFilter;
      return matchesKeyword && matchesGrade && matchesClass && matchesStatus;
    });
  }, [classFilter, classMap, gradeFilter, listStudents, searchKeyword, statusFilter]);
  const filteredStudents = useMemo(() => {
    if (focusFilter === 'all') return metricStudents;
    return metricStudents.filter(
      (row) =>
        (focusFilter === 'pet_bound' && Boolean(row.pet)) ||
        (focusFilter === 'high_level' && row.currentPetLevel >= 5),
    );
  }, [metricStudents, focusFilter]);
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
        case 'totalScore':
          return compareNumber(left.latestAcademic?.totalScore ?? -1, right.latestAcademic?.totalScore ?? -1) || compareText(left.name, right.name);
        case 'schoolRank':
          return compareNumber(left.latestAcademic?.schoolRank ?? Number.MAX_SAFE_INTEGER, right.latestAcademic?.schoolRank ?? Number.MAX_SAFE_INTEGER) || compareText(left.name, right.name);
        case 'classRank':
          return compareNumber(left.latestAcademic?.classRank ?? Number.MAX_SAFE_INTEGER, right.latestAcademic?.classRank ?? Number.MAX_SAFE_INTEGER) || compareText(left.name, right.name);
        default:
          return 0;
      }
    });
  }, [filteredStudents, sortConfig]);
  const studentPagination = usePagination(
    sortedStudents,
    `${searchKeyword}|${gradeFilter}|${classFilter}|${focusFilter}|${statusFilter}|${sortConfig?.key ?? 'default'}|${sortConfig?.direction ?? 'default'}|${listStudents.length}`,
  );
  const academicScorePagination = usePagination(
    academicScores,
    `${examFilter}|${searchKeyword}|${gradeFilter}|${classFilter}|${academicScores.length}`,
  );
  const currentExamScoreStats = useMemo(() => {
    if (!academicScores.length) return null;
    const withTotal = academicScores.filter((row) => row.totalScore !== null && row.totalScore !== undefined);
    const averageTotalScore = withTotal.length
      ? Math.round((withTotal.reduce((sum, row) => sum + (row.totalScore ?? 0), 0) / withTotal.length) * 10) / 10
      : null;
    const progressCount = academicScores.filter((row) => (row.schoolRankDelta ?? 0) > 0).length;
    const declineCount = academicScores.filter((row) => (row.schoolRankDelta ?? 0) < 0).length;
    return {
      studentCount: academicScores.length,
      averageTotalScore,
      progressCount,
      declineCount,
    };
  }, [academicScores]);
  const studentsWithPetCount = metricStudents.filter((row) => row.pet).length;
  const averageCurrentScore = metricStudents.length
    ? Math.round(metricStudents.reduce((sum, row) => sum + row.currentScore, 0) / metricStudents.length)
    : 0;
  const highLevelPetCount = metricStudents.filter((row) => row.currentPetLevel >= 5).length;
  const coveredClassCount = new Set(metricStudents.map((row) => row.classId)).size;
  const studentsWithAcademicCount = metricStudents.filter((row) => row.latestAcademic).length;
  const latestAcademicRows = metricStudents.filter((row) => row.latestAcademic);
  const latestAcademicExamName = latestAcademicRows
    .map((row) => row.latestAcademic)
    .sort((left, right) => new Date(right?.examDate ?? right?.importedAt ?? 0).getTime() - new Date(left?.examDate ?? left?.importedAt ?? 0).getTime())[0]?.examName;
  const academicAverageTotalScore = latestAcademicRows.length
    ? Math.round(
        latestAcademicRows.reduce((sum, row) => sum + (row.latestAcademic?.totalScore ?? 0), 0) /
          latestAcademicRows.length,
      )
    : 0;
  const academicCoveredClassCount = new Set(latestAcademicRows.map((row) => row.classId)).size;
  const gradeOverview = Array.from(
    metricStudents.reduce((map, row) => {
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
  const studentsWithoutPet = metricStudents.filter((row) => !row.pet).length;
  const genderSummary = {
    male: metricStudents.filter((row) => row.gender === '男').length,
    female: metricStudents.filter((row) => row.gender === '女').length,
  };
  const scopedStudents = metricStudents;
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
  const academicClassStats = Array.from(
    latestAcademicRows.reduce((map, row) => {
      const current = map.get(row.classId) ?? {
        classId: row.classId,
        className: row.className,
        studentCount: 0,
        totalScore: 0,
      };
      current.studentCount += 1;
      current.totalScore += row.latestAcademic?.totalScore ?? 0;
      map.set(row.classId, current);
      return map;
    }, new Map<number, { classId: number; className: string; studentCount: number; totalScore: number }>()),
  )
    .map(([, item]) => ({
      ...item,
      averageTotalScore: item.studentCount ? Math.round(item.totalScore / item.studentCount) : 0,
    }))
    .sort((a, b) => b.studentCount - a.studentCount || b.averageTotalScore - a.averageTotalScore);
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
    const dimensions = normalizeDimensionSummary(selectedStudentAiSummary.dimensionSummary);
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
    if (isSubjectTeacher) return;
    if (classFilter === 'all') return;
    const exists = classFilterOptions.some((item) => String(item.id) === classFilter);
    if (!exists) {
      setClassFilter('all');
    }
  }, [classFilter, classFilterOptions, isSubjectTeacher]);

  useEffect(() => {
    if (!isSubjectTeacher || !activeSubjectView) return;
    setShowOverview(false);
    setExamFilter('all');
    setClassFilter(String(activeSubjectView.classId));
    const meta = classes.find((item) => item.id === activeSubjectView.classId);
    if (meta?.gradeName) setGradeFilter(meta.gradeName);
  }, [activeSubjectView, classes, isSubjectTeacher]);

  useEffect(() => {
    const keyword = searchParams.get('keyword');
    const nextGrade = searchParams.get('gradeName');
    const nextClassId = searchParams.get('classId');
    const nextFocusFilter = searchParams.get('focusFilter');
    const nextStatsView = searchParams.get('statsView');
    const studentId = searchParams.get('studentId');

    if (keyword) setSearchKeyword(keyword);
    if (!isSubjectTeacher) {
      if (nextGrade) setGradeFilter(nextGrade);
      if (nextClassId) setClassFilter(nextClassId);
    }
    const urlTab = searchParams.get('tab');
    if (urlTab === 'scores') {
      setListTab('scores');
    } else if (urlTab === 'students') {
      setListTab('students');
    }
    const examIdParam = searchParams.get('examId');
    if (examIdParam && !Number.isNaN(Number(examIdParam))) {
      setExamFilter(examIdParam);
    }
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
  }, [isSubjectTeacher, searchParams, students]);

  useEffect(() => {
    let active = true;

    adminApi
      .academicExams(token)
      .then((examsResponse) => {
        if (!active) return;
        setAcademicExams(examsResponse.data);
      })
      .catch(() => {
        if (!active) return;
        setAcademicExams([]);
      });

    adminApi
      .settings(token)
      .then((settingsResponse) => {
        if (!active) return;
        setCurrentSemester(settingsResponse.data.semester);
      })
      .catch(() => {
        if (!active) return;
        setCurrentSemester(null);
      });

    return () => {
      active = false;
    };
  }, [academicReloadKey, token]);

  useEffect(() => {
    if (listTab !== 'scores') return;
    if (examFilter === 'all') {
      setAcademicScores([]);
      setAcademicScoresLoading(false);
      setAcademicScoresError(null);
      return;
    }

    let active = true;
    setAcademicScoresLoading(true);
    setAcademicScoresError(null);

    adminApi
      .academicScores(token, {
        examId: Number(examFilter),
        classId: classFilter === 'all' ? undefined : Number(classFilter),
        gradeName: gradeFilter === 'all' ? undefined : gradeFilter,
        keyword: searchKeyword.trim() || undefined,
      })
      .then((response) => {
        if (!active) return;
        setAcademicScores(response.data);
      })
      .catch((err) => {
        if (!active) return;
        setAcademicScores([]);
        setAcademicScoresError(err instanceof Error ? err.message : '成绩列表加载失败');
      })
      .finally(() => {
        if (active) setAcademicScoresLoading(false);
      });

    return () => {
      active = false;
    };
  }, [academicReloadKey, classFilter, examFilter, gradeFilter, listTab, searchKeyword, token]);

  useEffect(() => {
    if (!selectedStudent) {
      setSelectedStudentDetail(null);
      setSelectedStudentAiSummary(null);
      setStudentDetailError(null);
      setStudentAiError(null);
      setStudentScoreRecords([]);
      setStudentAcademicRecords([]);
      setStudentHonorRecords([]);
      setStudentScoreRecordsLoading(false);
      setStudentAcademicLoading(false);
      setStudentHonorsLoading(false);
      setStudentHonorsError(null);
      setStudentAiGenerating(false);
      setStudentScoreRecordsError(null);
      setStudentAcademicError(null);
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
    setStudentAcademicLoading(true);
    setStudentAcademicError(null);

    adminApi
      .studentAcademicRecords(token, selectedStudent.id)
      .then((response) => {
        if (!active) return;
        setStudentAcademicRecords(response.data);
      })
      .catch((err) => {
        if (!active) return;
        setStudentAcademicError(err instanceof Error ? err.message : '学业成长数据加载失败');
      })
      .finally(() => {
        if (active) setStudentAcademicLoading(false);
      });

    return () => {
      active = false;
    };
  }, [selectedStudent, token]);

  useEffect(() => {
    if (!selectedStudent) return;

    let active = true;
    setStudentHonorsLoading(true);
    setStudentHonorsError(null);

    adminApi
      .honorRecords(token, {
        classId: selectedStudent.classId,
        studentId: selectedStudent.id,
        targetType: 'student',
      })
      .then((response) => {
        if (!active) return;
        setStudentHonorRecords(response.data);
      })
      .catch((err) => {
        if (!active) return;
        setStudentHonorRecords([]);
        setStudentHonorsError(err instanceof Error ? err.message : '荣誉记录加载失败');
      })
      .finally(() => {
        if (active) setStudentHonorsLoading(false);
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
    setSelectedStudentAiSummary(null);

    adminApi
      .studentAiSummary(token, selectedStudent.id, aiPeriodType)
      .then(async (response) => {
        if (!active) return;
        if (response.data) {
          setSelectedStudentAiSummary(response.data);
          return;
        }

        if (aiPeriodType !== 'weekly') {
          setSelectedStudentAiSummary(null);
          return;
        }

        const requestKey = `${selectedStudent.id}:weekly`;
        let request = autoAiSummaryRequestsRef.current.get(requestKey);
        if (!request) {
          request = adminApi.generateStudentAiSummary(token, selectedStudent.id, 'weekly');
          autoAiSummaryRequestsRef.current.set(requestKey, request);
          void request.then(() => {
            autoAiSummaryRequestsRef.current.delete(requestKey);
          }).catch(() => {
            autoAiSummaryRequestsRef.current.delete(requestKey);
          });
        }

        setStudentAiGenerating(true);
        const generatedResponse = await request;
        if (!active) return;
        setSelectedStudentAiSummary(generatedResponse.data);
      })
      .catch((err) => {
        if (!active) return;
        setStudentAiError(err instanceof Error ? err.message : 'AI 学情摘要加载失败');
      })
      .finally(() => {
        if (active) {
          setStudentAiLoading(false);
          setStudentAiGenerating(false);
        }
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

  async function reloadStudentScoreRecords() {
    if (!selectedStudent) return;
    setStudentScoreRecordsLoading(true);
    setStudentScoreRecordsError(null);
    try {
      const response = await adminApi.scoreRecords(token, {
        classId: selectedStudent.classId,
        studentId: selectedStudent.id,
      });
      setStudentScoreRecords(response.data.slice(0, 100));
    } catch (err) {
      setStudentScoreRecordsError(err instanceof Error ? err.message : '积分记录加载失败');
    } finally {
      setStudentScoreRecordsLoading(false);
    }
  }

  async function reloadStudentDetailSnapshot() {
    if (!selectedStudent) return;
    const response = await adminApi.studentDetail(token, selectedStudent.id);
    setSelectedStudentDetail(response.data);
    const profile = response.data.profile;
    if (!profile) return;
    setSelectedStudent((prev) =>
      prev?.id === selectedStudent.id
        ? {
            ...prev,
            currentScore: profile.currentScore,
            totalScore: profile.totalScore,
            currentPetLevel: profile.currentPetLevel,
          }
        : prev,
    );
  }

  async function handleStudentScoreRecordReverse(remark: string) {
    if (!scoreRecordReverseTarget || !selectedStudent || scoreRecordReverseLoading) return;
    setScoreRecordReverseLoading(true);
    try {
      const response = await adminApi.reverseScoreRecord(token, scoreRecordReverseTarget.id, { remark });
      const profile = response.data.studentProfile;
      setSelectedStudentDetail((prev) =>
        prev?.profile
          ? {
              ...prev,
              profile: {
                ...prev.profile,
                currentScore: profile.currentScore,
                currentPetLevel: profile.currentPetLevel,
              },
            }
          : prev,
      );
      setSelectedStudent((prev) =>
        prev?.id === selectedStudent.id
          ? {
              ...prev,
              currentScore: profile.currentScore,
              currentPetLevel: profile.currentPetLevel,
            }
          : prev,
      );
      await Promise.all([onSaved(), reloadStudentScoreRecords(), reloadStudentDetailSnapshot()]);
      setScoreRecordReverseTarget(null);
    } catch (err) {
      throw err instanceof Error ? err : new Error('撤销评价失败');
    } finally {
      setScoreRecordReverseLoading(false);
    }
  }

  function focusClass(classIdValue: number, nextGradeName?: string) {
    setClassFilter(String(classIdValue));
    if (nextGradeName) setGradeFilter(nextGradeName);
    setSearchKeyword('');
    setStatsView('class');
  }

  function openStudentDetail(studentId: number) {
    const matched = students.find((item) => item.id === studentId);
    if (!matched) return;
    setAiPeriodType('weekly');
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
    setStudentAcademicRecords([]);
    setStudentScoreRecordsLoading(false);
    setStudentAcademicLoading(false);
    setStudentAiGenerating(false);
    setStudentScoreRecordsError(null);
    setStudentAcademicError(null);
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
    if (!isSubjectTeacher) {
      setGradeFilter('all');
      setClassFilter('all');
    }
    setFocusFilter('all');
    setStatusFilter('enabled');
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

  function formatRankDelta(value: number | null) {
    if (value === null) return '较上次 -';
    if (value === 0) return '较上次 0';
    return `较上次 ${value > 0 ? '+' : ''}${value}`;
  }

  function renderRankDeltaChip(value: number | null) {
    if (value === null) {
      return <span className="rank-delta-chip rank-delta-chip--neutral">—</span>;
    }
    if (value === 0) {
      return <span className="rank-delta-chip rank-delta-chip--neutral">持平</span>;
    }
    const isUp = value > 0;
    return (
      <span className={`rank-delta-chip rank-delta-chip--${isUp ? 'up' : 'down'}`}>
        {isUp ? '↑' : '↓'} {Math.abs(value)}
      </span>
    );
  }

  function formatDateTime(value: string) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '-';
    return date.toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  function formatDate(value: string | null | undefined) {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '-';
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  }

  function getDefaultStudentEntryClassId() {
    const validClassIds = new Set(classes.map((item) => String(item.id)));
    if (classFilter !== 'all' && validClassIds.has(classFilter)) return classFilter;
    if (classId && validClassIds.has(classId)) return classId;
    return classes[0]?.id ? String(classes[0].id) : '';
  }

  function openImportModal(mode: StudentEntryMode) {
    setEntryMode(mode);
    setEditingStudent(null);
    setClassId(getDefaultStudentEntryClassId());
    setShowImport(true);
    setTextarea('');
    setImportStudentsData([]);
    setSingleStudentDraft({ studentNo: '', name: '', gender: '' });
    setImportFileName('');
    setSubmitError(null);
  }

  function openEditStudentModal(student: AdminStudent) {
    setEntryMode('single');
    setEditingStudent(student);
    setClassId(String(student.classId));
    setShowImport(true);
    setTextarea('');
    setImportStudentsData([]);
    setSingleStudentDraft({
      studentNo: student.studentNo,
      name: student.name,
      gender: student.gender ?? '',
    });
    setImportFileName('');
    setSubmitError(null);
    setSubmitSuccess(null);
  }

  function closeImportModal(force = false) {
    if ((submitting || petAdminBusy || statusSubmitting) && !force) return;
    setShowImport(false);
    setEditingStudent(null);
    setTextarea('');
    setImportStudentsData([]);
    setSingleStudentDraft({ studentNo: '', name: '', gender: '' });
    setImportFileName('');
    setSubmitError(null);
  }

  function openAcademicImportModal() {
    setShowAcademicImport(true);
    setAcademicImportFileName('');
    setAcademicImportData(null);
    setAcademicImportExamName('');
    setAcademicImportGradeName('');
    setAcademicImportExamDate(todayDateInputValue());
    setAcademicImportPeriodLabel(inferAcademicPeriodLabel('', todayDateInputValue(), currentSemester?.name));
    setAcademicImportPeriodLabelEdited(false);
    setAcademicImportExamDateEdited(false);
    setSubmitError(null);
    setSubmitSuccess(null);
  }

  function closeAcademicImportModal(force = false) {
    if (academicImportSubmitting && !force) return;
    setShowAcademicImport(false);
    setAcademicImportFileName('');
    setAcademicImportData(null);
    setAcademicImportExamName('');
    setAcademicImportGradeName('');
    setAcademicImportExamDate(todayDateInputValue());
    setAcademicImportPeriodLabel('');
    setAcademicImportPeriodLabelEdited(false);
    setAcademicImportExamDateEdited(false);
    setSubmitError(null);
  }

  function openAcademicExamEditModal(exam: AcademicExamListItem | AcademicScoreListRow) {
    const examInfo: AcademicExamListItem = 'recordCount' in exam
      ? exam
      : {
          id: exam.examId,
          semesterId: academicExams.find((item) => item.id === exam.examId)?.semesterId ?? 0,
          name: exam.examName,
          gradeName: exam.examGradeName,
          sourceFile: exam.sourceFile,
          examDate: exam.examDate,
          periodLabel: exam.periodLabel,
          importedAt: exam.importedAt,
          recordCount: 0,
        };
    setEditingAcademicExam(examInfo);
    setAcademicExamDraft({
      examName: examInfo.name,
      examDate: dateInputValue(examInfo.examDate) || todayDateInputValue(),
      periodLabel: examInfo.periodLabel ?? '',
    });
    setShowAcademicExamEdit(true);
    setSubmitError(null);
    setSubmitSuccess(null);
  }

  function closeAcademicExamEditModal(force = false) {
    if (academicExamEditSubmitting && !force) return;
    setShowAcademicExamEdit(false);
    setEditingAcademicExam(null);
    setAcademicExamDraft({
      examName: '',
      examDate: todayDateInputValue(),
      periodLabel: '',
    });
    setSubmitError(null);
  }

  async function handleAcademicExamUpdate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingAcademicExam || academicExamEditSubmitting) return;
    setAcademicExamEditSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(null);

    try {
      if (!academicExamDraft.examName.trim()) {
        throw new Error('请填写考试标题');
      }
      if (!academicExamDraft.examDate) {
        throw new Error('请填写考试日期');
      }
      const response = await adminApi.updateAcademicExam(token, editingAcademicExam.id, {
        examName: academicExamDraft.examName.trim(),
        examDate: academicExamDraft.examDate,
        periodLabel: academicExamDraft.periodLabel?.trim() || null,
      });
      setAcademicExams((prev) =>
        prev
          .map((item) => (item.id === response.data.id ? { ...item, ...response.data } : item))
          .sort((left, right) => new Date(right.examDate).getTime() - new Date(left.examDate).getTime() || right.id - left.id),
      );
      setAcademicScores((prev) =>
        prev.map((item) =>
          item.examId === response.data.id
            ? {
                ...item,
                examName: response.data.name,
                examDate: response.data.examDate,
                periodLabel: response.data.periodLabel,
                importedAt: response.data.importedAt,
              }
            : item,
        ),
      );
      setAcademicReloadKey((prev) => prev + 1);
      setSubmitSuccess('考试信息已更新');
      closeAcademicExamEditModal(true);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : '考试信息保存失败');
    } finally {
      setAcademicExamEditSubmitting(false);
    }
  }

  async function handleAcademicExamDelete(exam: AcademicExamListItem) {
    if (!allowDeleteAcademicExam || academicExamDeleteSubmitting) return;

    const confirmed = await confirm({
      title: '删除考试批次',
      message:
        `确认删除考试「${exam.name}」吗？\n` +
        `将永久删除该批次下的 ${exam.recordCount} 条成绩记录，且不可恢复。`,
      confirmLabel: '确认删除',
      tone: 'danger',
    });
    if (!confirmed) return;

    setAcademicExamDeleteSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(null);

    try {
      const response = await adminApi.deleteAcademicExam(token, exam.id);
      setAcademicExams((prev) => prev.filter((item) => item.id !== exam.id));
      if (examFilter === String(exam.id)) {
        setExamFilter('all');
      }
      setAcademicScores((prev) => prev.filter((item) => item.examId !== exam.id));
      setAcademicReloadKey((prev) => prev + 1);
      await onSaved();
      setSubmitSuccess(
        `已删除考试「${exam.name}」，共移除 ${response.data.deletedRecordCount} 条成绩记录`,
      );
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : '考试批次删除失败');
    } finally {
      setAcademicExamDeleteSubmitting(false);
    }
  }

  async function handleAcademicExcelImport(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setSubmitError(null);
    setSubmitSuccess(null);

    try {
      const parsed = await parseAcademicScoreWorkbook(file);
      if (!parsed.students.length) {
        throw new Error('成绩表中没有有效的学生成绩数据');
      }
      setAcademicImportData(parsed);
      setAcademicImportFileName(file.name);
      const draft = resolveAcademicImportDraft(parsed, file.name, {
        currentSemesterName: currentSemester?.name,
        currentSemesterStartDate: currentSemester?.startDate,
        currentSemesterEndDate: currentSemester?.endDate,
        fallbackExamDate: todayDateInputValue(),
      });
      setAcademicImportExamName(draft.examName);
      setAcademicImportGradeName(draft.gradeName);
      setAcademicImportExamDate(draft.examDate);
      setAcademicImportPeriodLabel(draft.periodLabel);
      setAcademicImportPeriodLabelEdited(false);
      setAcademicImportExamDateEdited(false);
      setSubmitSuccess(`已读取 ${parsed.students.length} 名学生、${parsed.students.reduce((sum, item) => sum + item.subjects.length, 0)} 条科目成绩`);
    } catch (err) {
      setAcademicImportData(null);
      setAcademicImportFileName('');
      setSubmitError(err instanceof Error ? err.message : '成绩表解析失败');
    }
  }

  async function handleAcademicImport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (academicImportSubmitting) return;
    setAcademicImportSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(null);

    try {
      if (!academicImportData) {
        throw new Error('请先上传成绩汇总表');
      }
      if (!academicImportExamName.trim()) {
        throw new Error('请填写考试名称');
      }
      if (!academicImportExamDate) {
        throw new Error('请填写考试日期，历史成绩必须按实际考试日期归档');
      }

      const response = await adminApi.importAcademicScores(token, {
        ...academicImportData,
        examName: academicImportExamName.trim(),
        gradeName: academicImportGradeName.trim() || undefined,
        examDate: academicImportExamDate,
        periodLabel: academicImportPeriodLabel.trim() || currentSemester?.name || undefined,
        semesterId: currentSemester?.id,
      });
      await onSaved();
      setAcademicReloadKey((prev) => prev + 1);
      setListTab('scores');
      setExamFilter(String(response.data.examId));
      setSubmitSuccess(
        `已导入 ${response.data.importedStudentCount} 名学生、${response.data.importedRecordCount} 条成绩记录` +
          (response.data.createdClassCount ? `，新建 ${response.data.createdClassCount} 个班级` : '') +
          (response.data.createdStudentCount ? `，新建 ${response.data.createdStudentCount} 名学生` : '') +
          (response.data.unmatchedCount ? `，${response.data.unmatchedCount} 条未匹配` : ''),
      );
      closeAcademicImportModal(true);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : '成绩导入失败');
    } finally {
      setAcademicImportSubmitting(false);
    }
  }

  async function handleExcelImport(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setSubmitError(null);
    setSubmitSuccess(null);

    try {
      const lowerName = file.name.toLowerCase();
      let workbookRows;
      if (lowerName.endsWith('.csv')) {
        workbookRows = [parseCsvRows(await file.text())];
      } else if (lowerName.endsWith('.xls')) {
        workbookRows = [await parseLegacyXlsRows(await file.arrayBuffer())];
      } else {
        workbookRows = await readXlsxWorkbookRows(file);
      }
      if (!workbookRows.length) {
        throw new Error('Excel 文件中没有可读取的工作表');
      }

      const parsedStudents = workbookRows.flatMap((rows) => parseStudentImportRows(rows));

      if (!parsedStudents.length) {
        throw new Error('Excel 中没有有效的学生数据');
      }

      setImportStudentsData(parsedStudents);
      setImportFileName(file.name);
      setTextarea(
        parsedStudents
          .map((item) => [item.studentNo, item.name, item.className, item.gender].filter(Boolean).join(' '))
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

  async function handleResetPetNickname() {
    if (!editingStudent?.pet || petAdminBusy || submitting) return;

    const confirmed = await confirm({
      title: '重置萌宠昵称',
      message:
        `确定将「${editingStudent.name}」的萌宠昵称重置为默认名称「${editingStudent.pet.name}」吗？\n重置后将清除 7 天改名冷却，学生可在展示端立即重新修改昵称。`,
      confirmLabel: '确认重置',
      tone: 'warning',
    });
    if (!confirmed) return;

    setResetPetNicknameSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(null);

    try {
      await adminApi.resetStudentPetNickname(token, editingStudent.id);
      await onSaved();
      setEditingStudent((prev) =>
        prev?.pet
          ? {
              ...prev,
              pet: {
                ...prev.pet,
                nickname: null,
                lastRenameAt: null,
              },
            }
          : prev,
      );
      setSubmitSuccess(`萌宠昵称已重置为「${editingStudent.pet.name}」`);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : '重置萌宠昵称失败');
    } finally {
      setResetPetNicknameSubmitting(false);
    }
  }

  async function handleResetPet() {
    if (!editingStudent?.pet || petAdminBusy || submitting) return;
    if (editingStudent.pet.currentLevel !== 1) return;

    const confirmed = await confirm({
      title: '重置萌宠',
      message:
        `确定将「${editingStudent.name}」的萌宠「${editingStudent.pet.name}」重置为未领取状态吗？\n重置后学生可在展示端重新选择萌宠，积分不受影响。`,
      confirmLabel: '确认重置',
      tone: 'warning',
    });
    if (!confirmed) return;

    setResetPetSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(null);

    try {
      await adminApi.resetStudentPet(token, editingStudent.id);
      await onSaved();
      setEditingStudent((prev) =>
        prev
          ? {
              ...prev,
              pet: null,
              currentPetLevel: 1,
            }
          : null,
      );
      setSubmitSuccess('萌宠已重置为未领取');
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : '重置萌宠失败');
    } finally {
      setResetPetSubmitting(false);
    }
  }

  async function handleToggleStudentStatus() {
    if (!editingStudent || statusSubmitting || submitting || petAdminBusy) return;

    const nextStatus = (editingStudent.status ?? 'enabled') === 'enabled' ? 'disabled' : 'enabled';
    const confirmed = await confirm({
      title: nextStatus === 'disabled' ? '停用学生' : '启用学生',
      message:
        nextStatus === 'disabled'
          ? `确定停用「${editingStudent.name}」吗？\n停用后该学生将不再出现在大屏端、班主任/任课老师管理窗口，也不会参与 AI 班级/科目分析。历史数据保留。`
          : `确定重新启用「${editingStudent.name}」吗？\n启用后该学生将恢复在各端的正常展示与使用。`,
      confirmLabel: nextStatus === 'disabled' ? '确认停用' : '确认启用',
      tone: nextStatus === 'disabled' ? 'warning' : 'default',
    });
    if (!confirmed) return;

    if (!classId || !/^\d+$/.test(classId)) {
      setSubmitError('请先选择学生所在班级');
      return;
    }
    if (!singleStudentDraft.studentNo.trim() || !singleStudentDraft.name.trim()) {
      setSubmitError('请填写完整的准考证号和姓名');
      return;
    }

    setStatusSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(null);

    try {
      const payload: StudentUpdatePayload = {
        classId: Number(classId),
        studentNo: singleStudentDraft.studentNo.trim(),
        name: singleStudentDraft.name.trim(),
        gender: singleStudentDraft.gender.trim() || null,
        avatarUrl: editingStudent.avatarUrl ?? null,
        status: nextStatus,
      };
      await adminApi.updateStudent(token, editingStudent.id, payload);
      await onSaved();
      setSubmitSuccess(nextStatus === 'enabled' ? '学生已启用' : '学生已停用');
      if (nextStatus === 'disabled') {
        closeImportModal(true);
      } else {
        setEditingStudent((prev) => (prev ? { ...prev, status: nextStatus } : prev));
      }
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : '学生状态更新失败');
    } finally {
      setStatusSubmitting(false);
    }
  }

  async function handleImport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting || petAdminBusy || statusSubmitting) return;
    setSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(null);

    try {
      if (editingStudent) {
        if (!classId || !/^\d+$/.test(classId)) {
          throw new Error('请先选择学生所在班级');
        }
        if (!singleStudentDraft.studentNo.trim() || !singleStudentDraft.name.trim()) {
          throw new Error('请填写完整的准考证号和姓名');
        }

        const duplicatedExistingStudent = listStudents.find(
          (item) =>
            item.id !== editingStudent.id &&
            item.classId === Number(classId) &&
            normalizeStudentNo(item.studentNo) === normalizeStudentNo(singleStudentDraft.studentNo),
        );
        if (duplicatedExistingStudent) {
          throw new Error(`准考证号重复：${singleStudentDraft.studentNo.trim()} 已存在于目标班级`);
        }

        const payload: StudentUpdatePayload = {
          classId: Number(classId),
          studentNo: singleStudentDraft.studentNo.trim(),
          name: singleStudentDraft.name.trim(),
          gender: singleStudentDraft.gender.trim() || null,
          avatarUrl: editingStudent.avatarUrl ?? null,
        };
        await adminApi.updateStudent(token, editingStudent.id, payload);
        await onSaved();
        setSubmitSuccess('学生信息已更新');
        closeImportModal(true);
        return;
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

      const allStudentsHaveClassName = payloadStudents.every((item) => item.className?.trim());
      if (!classId && (entryMode === 'single' || !allStudentsHaveClassName)) {
        throw new Error(entryMode === 'single' ? '请先选择学生所在班级' : '请先选择导入班级，或在表格中提供班级列');
      }

      if (classId && !/^\d+$/.test(classId)) {
        throw new Error('导入班级无效，请重新选择');
      }

      if (entryMode === 'single' && (!payloadStudents[0]?.studentNo || !payloadStudents[0]?.name)) {
        throw new Error('请填写完整的准考证号和姓名');
      }

      const duplicatedStudentNoInPayload = Array.from(
        payloadStudents.reduce((map, item) => {
          const key = normalizeStudentNo(item.studentNo);
          map.set(key, (map.get(key) ?? 0) + 1);
          return map;
        }, new Map<string, number>()),
      ).find(([, count]) => count > 1)?.[0];
      if (duplicatedStudentNoInPayload) {
        throw new Error(`上传文件内准考证号重复：${duplicatedStudentNoInPayload}`);
      }

      const payload: StudentImportPayload = {
        classId: Number(classId || 0),
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
      title={pagePresentation.title}
      subtitle={pagePresentation.shellSubtitle}
      loading={loading}
      user={user}
      status={
        <>
          {loading ? <div className="status-card">学生数据加载中...</div> : null}
          {error ? <div className="status-card error">{error}</div> : null}
          {submitSuccess ? <div className="status-card success">{submitSuccess}</div> : null}
        </>
      }
    >
      <div className="admin-list-desk">
      <div className="page-header admin-list-page-header">
        <div>
          <h2>{pagePresentation.heading}</h2>
          <p className="page-desc">{pagePresentation.description}</p>
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
              placeholder="搜索学生姓名/准考证号..."
              value={searchKeyword}
              onChange={(event) => setSearchKeyword(event.target.value)}
            />
          </div>
          {!isSubjectTeacher ? (
            <>
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
                {classFilterOptions.map((item) => (
                  <option key={item.id} value={item.id}>
                    {gradeFilter === 'all' ? `${item.gradeName} ${item.name}` : item.name}
                  </option>
                ))}
              </select>
              {allowEdit ? (
                <select
                  className="filter-select"
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}
                >
                  <option value="enabled">正常</option>
                  <option value="disabled">已停用</option>
                  <option value="all">全部状态</option>
                </select>
              ) : null}
            </>
          ) : null}
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

      {!isSubjectTeacher ? (
        <div className="std-metric-grid std-metric-grid--4">
          <button type="button" className="std-metric-card std-metric-card--blue std-metric-card--action" onClick={resetListFilters}>
            <div className="std-metric-card__top">
              <div className="std-metric-card__icon"><span className="sec-metric-glyph">总</span></div>
              <span className="std-metric-card__label">学生总数</span>
            </div>
            <div className="std-metric-card__value">{metricStudents.length}</div>
            <div className="std-metric-card__hint">当前已建立档案、可参与成长统计的学生</div>
          </button>
          <button type="button" className="std-metric-card std-metric-card--green std-metric-card--action" onClick={() => setFocusFilter('pet_bound')}>
            <div className="std-metric-card__top">
              <div className="std-metric-card__icon"><span className="sec-metric-glyph">宠</span></div>
              <span className="std-metric-card__label">萌宠绑定率</span>
            </div>
            <div className="std-metric-card__value">
              {metricStudents.length ? `${Math.round((studentsWithPetCount / metricStudents.length) * 100)}%` : '0%'}
            </div>
            <div className="std-metric-card__hint">已完成萌宠绑定的学生覆盖比例</div>
          </button>
          <button type="button" className="std-metric-card std-metric-card--purple std-metric-card--action" onClick={() => setShowOverview(true)}>
            <div className="std-metric-card__top">
              <div className="std-metric-card__icon"><span className="sec-metric-glyph">学</span></div>
              <span className="std-metric-card__label">学业覆盖</span>
            </div>
            <div className="std-metric-card__value">
              {metricStudents.length ? `${Math.round((studentsWithAcademicCount / metricStudents.length) * 100)}%` : '0%'}
            </div>
            <div className="std-metric-card__hint">
              {latestAcademicExamName ? `最近：${latestAcademicExamName}` : '导入成绩后展示覆盖情况'}
            </div>
          </button>
          <button
            type="button"
            className={`std-metric-card std-metric-card--amber std-metric-card--action${showOverview ? ' active' : ''}`}
            onClick={() => setShowOverview((prev) => !prev)}
          >
            <div className="std-metric-card__top">
              <div className="std-metric-card__icon"><span className="sec-metric-glyph">析</span></div>
              <span className="std-metric-card__label">{showOverview ? '收起分析' : '更多分析'}</span>
            </div>
            <div className="std-metric-card__value std-metric-card__value--text">
              {studentsWithAcademicCount} 人已有成绩 · {academicCoveredClassCount || coveredClassCount} 班已接入
            </div>
            <div className="std-metric-card__hint">展开查看年级、班级与学生维度分析</div>
          </button>
        </div>
      ) : null}

      {!isSubjectTeacher && showOverview ? (
        <div className="panel summary-panel">
          {gradeFilter !== 'all' || classFilter !== 'all' || focusFilter !== 'all' || statusFilter !== 'enabled' || searchKeyword.trim() ? (
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
                <div><span>学生总数</span><strong>{metricStudents.length} 人</strong></div>
                <div><span>平均当前积分</span><strong>{averageCurrentScore} 分</strong></div>
                <div><span>男生人数</span><strong>{genderSummary.male} 人</strong></div>
                <div><span>女生人数</span><strong>{genderSummary.female} 人</strong></div>
              </div>
            </div>
            <div className="detail-card">
              <h4>成长覆盖</h4>
              <div className="detail-list">
                <div><span>已绑定萌宠</span><strong>{studentsWithPetCount} 人</strong></div>
                <div><span>待孕育星种</span><strong>{studentsWithoutPet} 人</strong></div>
                <div><span>高等级萌宠</span><strong>{highLevelPetCount} 人</strong></div>
                <div><span>数据覆盖班级</span><strong>{coveredClassCount} 个</strong></div>
              </div>
            </div>
            <div className="detail-card">
              <h4>学业概览</h4>
              <div className="detail-list">
                <div><span>最近考试</span><strong>{latestAcademicExamName ?? '暂无'}</strong></div>
                <div><span>成绩覆盖</span><strong>{studentsWithAcademicCount} 人</strong></div>
                <div><span>覆盖班级</span><strong>{academicCoveredClassCount} 个</strong></div>
                <div><span>平均总分</span><strong>{academicAverageTotalScore || '-'} 分</strong></div>
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
              <h4>班级学业覆盖</h4>
              <div className="mini-list">
                {academicClassStats.slice(0, 4).map((item) => (
                  <div className="mini-list-item" key={item.classId}>
                    <div>
                      <strong>{item.className}</strong>
                      <span>{item.studentCount} 名学生已有成绩</span>
                    </div>
                    <b>{item.averageTotalScore} 分</b>
                  </div>
                ))}
                {academicClassStats.length === 0 ? (
                  <div className="mini-list-item">
                    <div>
                      <strong>暂无成绩数据</strong>
                      <span>导入成绩表后，这里会显示各班学业覆盖。</span>
                    </div>
                    <b>待导入</b>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <div className="panel admin-list-panel security-accounts-panel">
        <div className="security-panel-head">
          <div className="sec-nav-tabs">
            <button
              className={`sec-nav-tab${listTab === 'students' ? ' active' : ''}`}
              type="button"
              onClick={() => setListTab('students')}
            >
              学生列表
            </button>
            <button
              className={`sec-nav-tab${listTab === 'scores' ? ' active' : ''}`}
              type="button"
              onClick={() => setListTab('scores')}
            >
              成绩列表
            </button>
          </div>
          <div className="admin-list-tab-head">
            <p className="page-desc">
              {listTab === 'students'
                ? '查看学生档案、积分与萌宠绑定情况。'
                : selectedAcademicExam
                  ? `查看 ${selectedAcademicExam.name} 的学生成绩明细。`
                  : '按考试批次管理历史成绩，进入某次考试后查看学生明细。'}
            </p>
            {listTab === 'scores' ? (
              <div className="academic-scores-toolbar">
                {selectedAcademicExam ? (
                  <button className="btn btn-ghost" type="button" onClick={() => setExamFilter('all')}>
                    ← 返回历次考试
                  </button>
                ) : null}
                {!isSubjectTeacher && selectedAcademicExam ? (
                  <select className="filter-select" value={examFilter} onChange={(event) => setExamFilter(event.target.value)}>
                    <option value="all">全部考试</option>
                    {academicExams.map((item) => (
                      <option key={item.id} value={item.id}>
                        {[item.periodLabel, item.name, formatDate(item.examDate)].filter(Boolean).join(' · ')}
                      </option>
                    ))}
                  </select>
                ) : null}
                {allowImport ? (
                  <button className="btn btn-outline" type="button" onClick={openAcademicImportModal}>
                    导入成绩表
                  </button>
                ) : null}
                {allowDeleteAcademicExam && selectedAcademicExam ? (
                  <button
                    className="btn btn-ghost op-btn--danger-text"
                    type="button"
                    disabled={academicExamDeleteSubmitting}
                    onClick={() => void handleAcademicExamDelete(selectedAcademicExam)}
                  >
                    {academicExamDeleteSubmitting ? '删除中...' : '删除考试'}
                  </button>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
        {listTab === 'students' ? (
          <>
            <div className="data-table-wrap security-table-wrap">
              <table className="data-table security-table">
                <thead>
                  <tr>

                    <th>{renderSortHeader('姓名', 'name')}</th>
                    <th>{renderSortHeader('班级', 'className')}</th>
                    <th>{renderSortHeader('准考证号', 'studentNo')}</th>
                    <th>{renderSortHeader('最近总分', 'totalScore')}</th>
                    <th>{renderSortHeader('校次', 'schoolRank')}</th>
                    <th>{renderSortHeader('班次', 'classRank')}</th>
                    <th>{renderSortHeader('萌宠/等级', 'petName')}</th>
                    <th>状态</th>
                    <th>{renderSortHeader('当前积分', 'currentScore')}</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {studentPagination.pagedItems.map((row) => (
                    <tr key={row.id}>

                      <td className="security-name-cell">{row.name}</td>
                      <td>{row.className}</td>
                      <td>{row.studentNo}</td>
                      <td>
                        {row.latestAcademic ? (
                          <div className="table-main-sub">
                            <strong>{row.latestAcademic.totalScore ?? '-'}</strong>
                            <span>{row.latestAcademic.examName} · {formatDate(row.latestAcademic.examDate)}</span>
                          </div>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td>
                        {row.latestAcademic ? (
                          <div className="table-main-sub">
                            <strong>{row.latestAcademic.schoolRank ?? '-'}</strong>
                            <span>{formatRankDelta(row.latestAcademic.schoolRankDelta)}</span>
                          </div>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td>
                        {row.latestAcademic ? (
                          <div className="table-main-sub">
                            <strong>{row.latestAcademic.classRank ?? '-'}</strong>
                            <span>{formatRankDelta(row.latestAcademic.classRankDelta)}</span>
                          </div>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td>
                        <div className="table-main-sub">
                          <strong>
                            {row.pet?.name ?? '未领养'}
                            {row.pet ? ` Lv.${row.currentPetLevel}` : ''}
                          </strong>
                          <span>
                            {row.pet?.nickname?.trim() ? row.pet.nickname.trim() : (row.pet ? '-' : '')}
                          </span>
                        </div>
                      </td>
                      <td>
                        <span className={(row.status ?? 'enabled') === 'enabled' ? 'status-on' : 'status-off'}>
                          {formatEnabledStatus(row.status, '正常', '已停用')}
                        </span>
                      </td>
                      <td>{row.currentScore}</td>
                      <td>
                        <button className="op-btn" type="button" onClick={() => openStudentDetail(row.id)}>
                          详情
                        </button>
                        {allowEdit ? (
                          <button className="op-btn" type="button" onClick={() => openEditStudentModal(row)}>
                            编辑
                          </button>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="table-empty">
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
          </>
        ) : (
          <>
            {examFilter === 'all' ? (
              academicExams.length === 0 ? (
                <div className="academic-empty-panel">
                  <div className="academic-empty-panel__icon">
                    <PresentationGlyph name="chart" />
                  </div>
                  <strong>暂无考试数据</strong>
                  <span>导入成绩汇总表后，历次考试将按批次归档展示，便于回溯与对比。</span>
                  {allowImport ? (
                    <button className="btn btn-primary" type="button" onClick={openAcademicImportModal}>
                      导入成绩表
                    </button>
                  ) : null}
                </div>
              ) : (
                <div className="data-table-wrap security-table-wrap">
                  <table className="data-table security-table academic-exam-list-table">
                    <thead>
                      <tr>
                        <th>考试</th>
                        <th>考试日期</th>
                        <th>学期标签</th>
                        <th>成绩记录</th>
                        <th>导入时间</th>
                        <th>操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {academicExams.map((exam) => (
                        <tr key={exam.id}>
                          <td>
                            <div className="table-main-sub">
                              <strong>{exam.name}</strong>
                              <span>{exam.gradeName ?? exam.sourceFile ?? '-'}</span>
                            </div>
                          </td>
                          <td>{formatDate(exam.examDate)}</td>
                          <td>
                            {exam.periodLabel ? (
                              <span className="academic-meta-pill academic-meta-pill--accent">{exam.periodLabel}</span>
                            ) : (
                              '-'
                            )}
                          </td>
                          <td>
                            <span className="academic-record-badge">{exam.recordCount} 条</span>
                          </td>
                          <td className="security-muted-cell">{formatDateTime(exam.importedAt)}</td>
                          <td className="security-actions-cell">
                            <button className="op-btn" type="button" onClick={() => setExamFilter(String(exam.id))}>
                              查看成绩
                            </button>
                            {allowImport ? (
                              <button className="op-btn" type="button" onClick={() => openAcademicExamEditModal(exam)}>
                                编辑信息
                              </button>
                            ) : null}
                            {allowDeleteAcademicExam ? (
                              <button
                                className="op-btn op-btn--danger"
                                type="button"
                                disabled={academicExamDeleteSubmitting}
                                onClick={() => void handleAcademicExamDelete(exam)}
                              >
                                删除
                              </button>
                            ) : null}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            ) : (
              <>
                {academicScoresError ? <div className="status-card error">{academicScoresError}</div> : null}
                {selectedAcademicExam ? (
                  <div className="academic-exam-hero">
                    <div className="academic-exam-hero__main">
                      <h4 className="academic-exam-hero__title">{selectedAcademicExam.name}</h4>
                      <div className="academic-exam-hero__meta">
                        <span className="academic-meta-pill">{formatDate(selectedAcademicExam.examDate)}</span>
                        {selectedAcademicExam.periodLabel ? (
                          <span className="academic-meta-pill academic-meta-pill--accent">{selectedAcademicExam.periodLabel}</span>
                        ) : null}
                        {selectedAcademicExam.gradeName ? (
                          <span className="academic-meta-pill">{selectedAcademicExam.gradeName}</span>
                        ) : null}
                        <span className="academic-meta-pill">导入 {formatDateTime(selectedAcademicExam.importedAt)}</span>
                      </div>
                    </div>
                    <div className="academic-exam-hero__stats">
                      <div className="academic-exam-stat">
                        <span>当前筛选</span>
                        <strong>{currentExamScoreStats?.studentCount ?? 0}<small> 人</small></strong>
                      </div>
                      <div className="academic-exam-stat">
                        <span>平均总分</span>
                        <strong>{currentExamScoreStats?.averageTotalScore ?? '-'}<small> 分</small></strong>
                      </div>
                      <div className="academic-exam-stat academic-exam-stat--progress">
                        <span>校次进步</span>
                        <strong>{currentExamScoreStats?.progressCount ?? 0}<small> 人</small></strong>
                      </div>
                      <div className="academic-exam-stat academic-exam-stat--decline">
                        <span>校次退步</span>
                        <strong>{currentExamScoreStats?.declineCount ?? 0}<small> 人</small></strong>
                      </div>
                    </div>
                  </div>
                ) : null}
                <div className="data-table-wrap security-table-wrap">
                  <table className="data-table security-table">
                    <thead>
                      <tr>
                        <th>学生</th>
                        <th>班级</th>
                        <th>总分</th>
                        <th>校次</th>
                        <th>班次</th>
                        <th>操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {academicScorePagination.pagedItems.map((row) => (
                        <tr key={row.id}>
                          <td className="security-name-cell">
                            <div className="table-main-sub">
                              <strong>{row.studentName}</strong>
                              <span>{row.studentNo}</span>
                            </div>
                          </td>
                          <td>{row.className}</td>
                          <td>
                            <span className="academic-score-value">
                              {row.totalScore ?? '-'}
                              {row.totalScore !== null && row.totalScore !== undefined ? <small>分</small> : null}
                            </span>
                          </td>
                          <td>
                            <div className="academic-rank-cell">
                              <strong>{row.schoolRank ?? '-'}</strong>
                              {renderRankDeltaChip(row.schoolRankDelta)}
                            </div>
                          </td>
                          <td>
                            <div className="academic-rank-cell">
                              <strong>{row.classRank ?? '-'}</strong>
                              {renderRankDeltaChip(row.classRankDelta)}
                            </div>
                          </td>
                          <td className="security-actions-cell">
                            <button className="op-btn" type="button" onClick={() => openStudentDetail(row.studentId)}>
                              学生详情
                            </button>
                          </td>
                        </tr>
                      ))}
                      {!academicScoresLoading && academicScores.length === 0 ? (
                        <tr>
                          <td colSpan={6}>
                            <div className="academic-empty-panel">
                              <div className="academic-empty-panel__icon">
                                <PresentationGlyph name="student" />
                              </div>
                              <strong>当前筛选条件下没有成绩数据</strong>
                              <span>可调整顶部搜索、年级或班级筛选，或返回历次考试切换批次。</span>
                            </div>
                          </td>
                        </tr>
                      ) : null}
                      {academicScoresLoading ? (
                        <tr>
                          <td colSpan={6} className="table-empty">
                            成绩明细加载中...
                          </td>
                        </tr>
                      ) : null}
                    </tbody>
                  </table>
                </div>
                <TablePagination
                  currentPage={academicScorePagination.currentPage}
                  pageSize={academicScorePagination.pageSize}
                  totalItems={academicScorePagination.totalItems}
                  totalPages={academicScorePagination.totalPages}
                  onPageChange={academicScorePagination.setCurrentPage}
                  onPageSizeChange={academicScorePagination.setPageSize}
                />
              </>
            )}
          </>
        )}
      </div>

      {(allowImport || allowEdit) && showImport ? (
        <Modal
          title={editingStudent ? '编辑学生' : entryMode === 'single' ? '新增学生' : '导入学生'}
          subtitle={
            editingStudent
              ? '修改学生基础信息与所在班级'
              : entryMode === 'single'
                ? '支持逐个新增学生档案'
                : '支持逐行粘贴或上传 Excel 批量导入学生档案'
          }
          onClose={closeImportModal}
        >
          <form className="form-grid" onSubmit={handleImport}>
            <label className="span-2">
              <span>{editingStudent || entryMode === 'single' ? '所在班级' : '目标班级'}</span>
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
                  <span>准考证号</span>
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
                {editingStudent ? (
                  <div className="span-2 detail-card student-pet-reset-card">
                    <h4>账号状态</h4>
                    <div className="detail-list">
                      <div>
                        <span>当前状态</span>
                        <strong>{formatEnabledStatus(editingStudent.status, '正常', '已停用')}</strong>
                      </div>
                      <div className="settings-note">
                        {(editingStudent.status ?? 'enabled') === 'enabled'
                          ? '停用后，该学生将不再出现在大屏端、班主任/任课老师管理窗口，也不会参与 AI 班级/科目分析。历史数据保留。'
                          : '启用后，该学生将恢复在各端的正常展示与使用。'}
                      </div>
                      <div className="form-actions" style={{ marginTop: 12, paddingTop: 0 }}>
                        <button
                          type="button"
                          className={`ghost-button${(editingStudent.status ?? 'enabled') === 'enabled' ? ' op-btn--danger-text' : ''}`}
                          disabled={statusSubmitting || submitting || petAdminBusy}
                          onClick={() => void handleToggleStudentStatus()}
                        >
                          {statusSubmitting
                            ? '处理中...'
                            : (editingStudent.status ?? 'enabled') === 'enabled'
                              ? '停用学生'
                              : '启用学生'}
                        </button>
                      </div>
                    </div>
                  </div>
                ) : null}
                {editingStudent ? (
                  <div className="span-2 detail-card student-pet-reset-card">
                    <h4>萌宠领取</h4>
                    {editingStudent.pet ? (
                      <div className="detail-list">
                        <div>
                          <span>当前萌宠</span>
                          <strong>
                            {editingStudent.pet.name}（Lv.{editingStudent.pet.currentLevel}）
                          </strong>
                        </div>
                        <div>
                          <span>萌宠昵称</span>
                          <strong>
                            {editingStudent.pet.nickname?.trim() || editingStudent.pet.name}
                            {editingStudent.pet.nickname?.trim() ? '（自定义）' : '（默认）'}
                          </strong>
                        </div>
                        <div className="settings-note">
                          {editingStudent.pet.currentLevel === 1
                            ? '可将领取状态重置为「未领取」，学生可在展示端重新选择萌宠；积分与成长记录不受影响。'
                            : '仅萌宠等级为 1 时可重置为未领取，请先确认学生萌宠尚未升级。'}
                        </div>
                        <div className="settings-note">
                          重置萌宠昵称将恢复为图鉴默认名称，并清除展示端 7 天改名冷却，便于学生立即重新取名。
                        </div>
                        <div className="form-actions" style={{ marginTop: 12, paddingTop: 0, gap: 10 }}>
                          <button
                            type="button"
                            className="ghost-button"
                            disabled={
                              petAdminBusy ||
                              submitting ||
                              statusSubmitting ||
                              editingStudent.pet.currentLevel !== 1
                            }
                            onClick={() => void handleResetPet()}
                          >
                            {resetPetSubmitting ? '重置中...' : '重置宠物'}
                          </button>
                          <button
                            type="button"
                            className="ghost-button"
                            disabled={petAdminBusy || submitting || statusSubmitting}
                            onClick={() => void handleResetPetNickname()}
                          >
                            {resetPetNicknameSubmitting ? '重置中...' : '重置宠物昵称'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="settings-note">当前为未领取状态</div>
                    )}
                  </div>
                ) : null}
              </>
            ) : (
              <>
                <label className="span-2">
                  <span>Excel 导入</span>
                  <input type="file" accept=".xlsx,.xls,.csv" onChange={(event) => void handleExcelImport(event)} />
                  <div className="settings-note">
                    支持 `.xlsx/.xls/.csv`，可使用表头：准考证号、姓名、年级、班级、性别、头像地址。表格中有班级时按行内班级导入。
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
              <button
                type="button"
                className="ghost-button"
                onClick={() => closeImportModal()}
                disabled={submitting || petAdminBusy || statusSubmitting}
              >
                取消
              </button>
              <button type="submit" className="toolbar-button" disabled={submitting || petAdminBusy || statusSubmitting}>
                {submitting
                  ? editingStudent || entryMode === 'single'
                    ? '提交中...'
                    : '导入中...'
                  : editingStudent
                    ? '保存修改'
                    : entryMode === 'single'
                      ? '确认新增'
                      : '开始导入'}
              </button>
            </div>
          </form>
        </Modal>
      ) : null}

      {allowImport && showAcademicExamEdit && editingAcademicExam ? (
        <Modal
          title="编辑考试信息"
          subtitle="修改考试标题、日期与学期标签；已导入的成绩明细不会被重算"
          onClose={closeAcademicExamEditModal}
        >
          <form className="form-grid" onSubmit={handleAcademicExamUpdate}>
            <div className="academic-modal-layout span-2">
              <div className="academic-modal-form-panel">
                <h5 className="academic-modal-section-title">可编辑字段</h5>
                <label className="span-2">
                  <span>考试标题</span>
                  <input
                    value={academicExamDraft.examName}
                    onChange={(event) => setAcademicExamDraft((prev) => ({ ...prev, examName: event.target.value }))}
                    placeholder="例如：七年级上学期期中考试"
                    required
                  />
                </label>
                <label>
                  <span>考试日期</span>
                  <PickerInput
                    type="date"
                    value={academicExamDraft.examDate}
                    onChange={(event) => setAcademicExamDraft((prev) => ({ ...prev, examDate: event.target.value }))}
                    required
                  />
                </label>
                <label>
                  <span>学期标签</span>
                  <input
                    value={academicExamDraft.periodLabel ?? ''}
                    onChange={(event) => setAcademicExamDraft((prev) => ({ ...prev, periodLabel: event.target.value }))}
                    placeholder="例如：2025 秋季学期"
                  />
                </label>
              </div>
              <div className="academic-modal-ref-panel">
                <h5 className="academic-modal-section-title">当前批次</h5>
                <div className="detail-list">
                  <div><span>原考试标题</span><strong>{editingAcademicExam.name}</strong></div>
                  <div><span>原考试日期</span><strong>{formatDate(editingAcademicExam.examDate)}</strong></div>
                  <div><span>成绩记录</span><strong>{editingAcademicExam.recordCount} 条</strong></div>
                  <div><span>导入时间</span><strong>{formatDateTime(editingAcademicExam.importedAt)}</strong></div>
                </div>
                <div className="academic-modal-tip">
                  此处仅更新考试元信息，不会重新解析 Excel 或修改学生各科得分、排名与进退步数据。
                </div>
              </div>
            </div>
            {submitError ? <div className="status-card error span-2">{submitError}</div> : null}
            <div className="modal-actions span-2">
              <button className="btn btn-ghost" type="button" onClick={() => closeAcademicExamEditModal()}>
                取消
              </button>
              <button className="btn btn-primary" type="submit" disabled={academicExamEditSubmitting}>
                {academicExamEditSubmitting ? '保存中...' : '保存考试信息'}
              </button>
            </div>
          </form>
        </Modal>
      ) : null}

      {allowImport && showAcademicImport ? (
        <Modal
          title="导入成绩表"
          subtitle="按实际考试日期归档学业数据；历史成绩不会影响当前积分、萌宠等级和排行榜"
          onClose={closeAcademicImportModal}
        >
          <form className="form-grid" onSubmit={handleAcademicImport}>
            {academicImportData ? (
              <>
                <label>
                  <span>考试名称</span>
                  <input
                    value={academicImportExamName}
                    onChange={(event) => setAcademicImportExamName(event.target.value)}
                    placeholder="例如：八年级期中测试"
                    required
                  />
                </label>
                <label>
                  <span>年级</span>
                  <input
                    value={academicImportGradeName}
                    onChange={(event) => setAcademicImportGradeName(event.target.value)}
                    placeholder="例如：八年级"
                    list="academic-grade-options"
                  />
                  <datalist id="academic-grade-options">
                    {['一年级', '二年级', '三年级', '四年级', '五年级', '六年级', '七年级', '八年级', '九年级'].map((grade) => (
                      <option key={grade} value={grade} />
                    ))}
                  </datalist>
                </label>
              </>
            ) : null}
            <label>
              <span>考试日期</span>
              <PickerInput
                type="date"
                value={academicImportExamDate}
                onChange={(event) => {
                  const nextDate = event.target.value;
                  setAcademicImportExamDate(nextDate);
                  setAcademicImportExamDateEdited(true);
                  if (!academicImportPeriodLabelEdited) {
                    setAcademicImportPeriodLabel(inferAcademicPeriodLabel(
                      buildAcademicImportSourceText(
                        academicImportExamName,
                        academicImportData?.sourceFile,
                        academicImportFileName,
                      ),
                      nextDate,
                      currentSemester?.name,
                    ));
                  }
                }}
                required
              />
              {academicImportData && !academicImportExamDateEdited ? (
                <span className="field-hint">已根据文件名、考试类型和学期自动识别，可手动调整</span>
              ) : null}
            </label>
            <label>
              <span>学期标签</span>
              <input
                value={academicImportPeriodLabel}
                onChange={(event) => {
                  setAcademicImportPeriodLabel(event.target.value);
                  setAcademicImportPeriodLabelEdited(true);
                }}
                placeholder={currentSemester?.name ?? '例如：2025-2026学年上学期'}
              />
            </label>
            <label className="span-2">
              <span>成绩汇总表</span>
              <div className="academic-upload-field">
                <input type="file" accept=".xlsx,.xls" onChange={(event) => void handleAcademicExcelImport(event)} />
                <div className="settings-note">
                  支持两层表头：准考证号、班级、姓名，以及语文/数学/英语等科目的得分、联考排名、校次、班次和进退步。
                  {academicImportFileName ? ` 当前文件：${academicImportFileName}` : ' 请选择 .xlsx 或 .xls 文件。'}
                </div>
              </div>
            </label>
            {academicImportData ? (
              <div className="detail-card span-2">
                <h4>导入预览</h4>
                <div className="academic-import-preview-grid">
                  <div className="academic-import-stat">
                    <span>学生数量</span>
                    <strong>{academicImportData.students.length} 人</strong>
                  </div>
                  <div className="academic-import-stat">
                    <span>成绩记录</span>
                    <strong>
                      {academicImportData.students.reduce((sum, item) => sum + item.subjects.length, 0)} 条
                    </strong>
                  </div>
                  <div className="academic-import-stat">
                    <span>识别来源</span>
                    <strong>{academicImportData.sourceFile ?? academicImportFileName}</strong>
                  </div>
                </div>
                <div className="mini-list academic-import-preview-list">
                  {academicImportData.students.slice(0, 3).map((item) => (
                    <div className="mini-list-item" key={`${item.studentNo}-${item.name}`}>
                      <div>
                        <strong>{item.name}</strong>
                        <span>{item.className} · {item.studentNo}</span>
                      </div>
                      <b>{item.subjects.find((subject) => subject.subjectName === '总分')?.score ?? '-'} 分</b>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
            {submitError ? <div className="status-card error span-2">{submitError}</div> : null}
            <div className="modal-actions span-2">
              <button type="button" className="btn btn-ghost" onClick={() => closeAcademicImportModal()} disabled={academicImportSubmitting}>
                取消
              </button>
              <button type="submit" className="btn btn-primary" disabled={academicImportSubmitting || !academicImportData}>
                {academicImportSubmitting ? '导入中...' : '开始导入成绩'}
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
          <div className="detail-grid student-growth-archive">
            <div className="detail-card">
              <h4>基本资料</h4>
              <div className="detail-list">
                <div><span>姓名</span><strong>{selectedStudent.name}</strong></div>
                <div><span>班级</span><strong>{selectedStudent.className}</strong></div>
                <div><span>准考证号</span><strong>{selectedStudent.studentNo}</strong></div>
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
                <div><span>荣誉勋章</span><strong>{selectedStudentDetail?.profile?.honorsCount ?? 0} 枚</strong></div>
              </div>
            </div>
            <div className="detail-card span-2">
              <h4>荣誉勋章</h4>
              {studentHonorsLoading ? <div className="student-ai-placeholder">荣誉记录加载中...</div> : null}
              {studentHonorsError ? <div className="status-card error">{studentHonorsError}</div> : null}
              {!studentHonorsLoading && !studentHonorsError ? (
                studentHonorRecords.length > 0 ? (
                  <div className="student-growth-honor-grid">
                    {studentHonorRecords.map((item) => (
                      <article key={item.id} className="student-growth-honor-card">
                        <div className="student-growth-honor-icon">
                          {item.honorIconUrl ? (
                            <img src={resolveAssetUrl(item.honorIconUrl)} alt={item.honorName} />
                          ) : (
                            <span>{item.honorName.slice(0, 1)}</span>
                          )}
                        </div>
                        <div className="student-growth-honor-main">
                          <strong>{item.honorName}</strong>
                          <span>
                            {formatDate(item.grantedAt)}
                            {item.grantedByName ? ` · ${item.grantedByName}` : ''}
                          </span>
                          {item.remark ? <p>{item.remark}</p> : null}
                        </div>
                      </article>
                    ))}
                  </div>
                ) : (
                  <div className="student-ai-placeholder">该学生暂无荣誉记录</div>
                )
              ) : null}
            </div>
            <div className="detail-card span-2">
              <h4>学业成长</h4>
              {studentAcademicLoading ? <div className="student-ai-placeholder">学业成长数据加载中...</div> : null}
              {studentAcademicError ? <div className="status-card error">{studentAcademicError}</div> : null}
              {!studentAcademicLoading && !studentAcademicError ? (
                studentAcademicRecords.length > 0 ? (
                  <>
                    <div className="detail-list">
                      <div><span>最近考试</span><strong>{studentAcademicRecords[0].examName}</strong></div>
                      <div><span>考试日期</span><strong>{formatDate(studentAcademicRecords[0].examDate)}</strong></div>
                      <div>
                        <span>总分</span>
                        <strong>{studentAcademicRecords[0].subjects.find((item) => item.subjectName === '总分')?.score ?? '-'} 分</strong>
                      </div>
                      <div>
                        <span>校次</span>
                        <strong>{studentAcademicRecords[0].subjects.find((item) => item.subjectName === '总分')?.schoolRank ?? '-'}</strong>
                      </div>
                      <div>
                        <span>班次</span>
                        <strong>{studentAcademicRecords[0].subjects.find((item) => item.subjectName === '总分')?.classRank ?? '-'}</strong>
                      </div>
                    </div>
                    <div className="mini-list">
                      {studentAcademicRecords[0].subjects.filter((item) => item.subjectName !== '总分').slice(0, 6).map((item) => (
                        <div className="mini-list-item" key={`${studentAcademicRecords[0].examId}-${item.subjectCode}`}>
                          <div>
                            <strong>{item.subjectName}</strong>
                            <span>校次 {item.schoolRank ?? '-'} · 班次 {item.classRank ?? '-'}</span>
                          </div>
                          <b>{item.score ?? '-'} 分</b>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="mini-list-item">
                    <div>
                      <strong>暂无成绩记录</strong>
                      <span>导入成绩表后，这里会展示学业成长维度。</span>
                    </div>
                    <b>待导入</b>
                  </div>
                )
              ) : null}
            </div>
            <div className="detail-card span-2">
              <div className="student-ai-header">
                <div>
                  <h4>AI 学情分析</h4>
                  <p>基于课堂、作业、学科和测评相关积分事件生成阶段性总结。</p>
                </div>
                {selectedStudentAiSummary ? (
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
                      {studentAiGenerating ? '生成中...' : '重新生成'}
                    </button>
                  </div>
                ) : null}
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
                        {normalizeDimensionSummary(selectedStudentAiSummary.dimensionSummary).slice(0, 4).map((item, index) => (
                          <div className="mini-list-item" key={`${item.dimension}-${item.count}-${index}`}>
                            <div>
                              <strong>{item.dimension}</strong>
                              <span>正向 {item.positiveCount ?? 0} 次，负向 {item.negativeCount ?? 0} 次</span>
                            </div>
                            <b>{item.count} 次</b>
                          </div>
                        ))}
                        {normalizeDimensionSummary(selectedStudentAiSummary.dimensionSummary).length === 0 ? (
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
                <div className="student-ai-collapsed">
                  <div>
                    <strong>当前周期暂无学情缓存</strong>
                    <p>AI 学情模块已折叠。点击“生成报告”后将落库并展示阶段性分析结果。</p>
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
                      {studentAiGenerating ? '生成中...' : '生成报告'}
                    </button>
                  </div>
                </div>
              ) : null}
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
                  <ScoreRecordListItem
                    key={`${item.id}-${item.createdAt}`}
                    record={item}
                    studentName={selectedStudent.name}
                    canReverse={canShowScoreRecordReverse(item, user, { homeroomClassIds })}
                    onReverse={() => setScoreRecordReverseTarget(item)}
                  />
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

      {scoreRecordReverseTarget && selectedStudent ? (
        <ScoreRecordReverseModal
          record={scoreRecordReverseTarget}
          studentName={selectedStudent.name}
          currentScore={selectedStudentDetail?.profile?.currentScore ?? selectedStudent.currentScore}
          onClose={() => {
            if (scoreRecordReverseLoading) return;
            setScoreRecordReverseTarget(null);
          }}
          onConfirm={handleStudentScoreRecordReverse}
        />
      ) : null}

      </div>
    </Shell>
  );
}

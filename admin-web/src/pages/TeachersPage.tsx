import { useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { Modal } from '../components/Modal';
import { PermissionScopeTableCell } from '../components/PermissionScopeTableCell';
import { PickerInput } from '../components/PickerInput';
import { Shell } from '../components/Shell';
import { TablePagination } from '../components/TablePagination';
import { usePagination } from '../hooks/usePagination';
import type {
  AdminClass,
  PermissionUser,
  PermissionUserImportResult,
  PermissionUserUpsertPayload,
  RoleTemplate,
  SessionUser,
  TeacherLiveStatusRow,
  TeacherScheduleSlotRow,
} from '../lib/api';
import { adminApi } from '../lib/api';
import type { PermissionUserFormState } from '../types/admin';
import { createPermissionUserForm, formatEnabledStatus, normalizeKeyword } from '../utils/adminForms';
import { canManageTeachers } from '../utils/adminPermissions';

const teacherRoleCodes = ['homeroom_teacher', 'subject_teacher'];
const managerRoleCodes = ['super_admin', 'school_admin', 'academic_admin', 'moral_admin'];
const staffRoleCodes = [...managerRoleCodes, ...teacherRoleCodes];

function isTeacherRoleCode(roleCode: string) {
  return teacherRoleCodes.includes(roleCode);
}

function isManagerStaffRole(roleCode: string) {
  return managerRoleCodes.includes(roleCode);
}

const teacherSubjectOptions = [
  { code: 'chinese', label: '语文' },
  { code: 'math', label: '数学' },
  { code: 'english', label: '英语' },
  { code: 'physics', label: '物理' },
  { code: 'chemistry', label: '化学' },
  { code: 'geography', label: '地理' },
  { code: 'biology', label: '生物' },
  { code: 'history', label: '历史' },
  { code: 'politics', label: '政治' },
  { code: 'computer', label: '计算机' },
  { code: 'art', label: '美术' },
  { code: 'music', label: '音乐' },
  { code: 'pe', label: '体育' },
] as const;

type TeachersPageProps = {
  token: string;
  user: SessionUser | null;
  classes: AdminClass[];
  loading: boolean;
  error: string | null;
};

type TeacherSortKey = 'name' | 'username' | 'roleName' | 'scopeDisplay' | 'permissionSummary' | 'status' | 'currentStatus';
type SortDirection = 'asc' | 'desc';
type TeacherPanelTab = 'teachers' | 'schedule';
type ScheduleMode = 'teacher' | 'class';
type ScheduleCellSlot = {
  id: number;
  periodNo: number;
  startTime: string;
  endTime: string;
  subject: string;
  teacherName: string;
  className: string | null;
  isPending: boolean;
};
type ScheduleGroupedRow = {
  key: string;
  name: string;
  secondaryLabel: string;
  isPending: boolean;
  totalSlots: number;
  values: Record<number, ScheduleCellSlot[]>;
};
type SchedulePeriodDefinition = {
  periodNo: number;
  startTime: string;
  endTime: string;
};

const weekdayLabels = ['星期一', '星期二', '星期三', '星期四', '星期五'] as const;

function normalizeLoginUsername(value: string) {
  return value.trim().toLowerCase();
}

function hasTeachingDutyTag(dutyTags: string[]) {
  return dutyTags.some((tag) => tag.includes('班主任') || tag.includes('任课教师'));
}

function shouldShowInTeacherList(row: PermissionUser) {
  if (['school_admin', 'academic_admin', 'moral_admin', 'homeroom_teacher', 'subject_teacher'].includes(row.roleCode)) {
    return true;
  }
  if (row.roleCode !== 'super_admin') return false;
  return hasTeachingDutyTag(row.dutyTags) || row.classIds.length > 0 || row.subjectScopes.length > 0;
}

function getTodayDateInputValue() {
  return new Date().toISOString().slice(0, 10);
}

function getCurrentTimeInputValue() {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}

function normalizeTimeInputValue(value: string | null | undefined) {
  const matched = String(value ?? '').match(/^(\d{1,2}):(\d{2})/);
  if (!matched) return '';
  return `${matched[1].padStart(2, '0')}:${matched[2]}`;
}

function buildLocalDateTimeIso(date: string, time: string) {
  if (!date || !time) return null;
  const normalizedTime = normalizeTimeInputValue(time);
  if (!normalizedTime) return null;
  const parsed = new Date(`${date}T${normalizedTime}:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

function formatLiveStatusRangeLabel(date: string, start: string, end: string) {
  if (start && end) return `${date} ${start} - ${end}`;
  return '当前时刻';
}

export function TeachersPage({ token, user, classes, loading, error }: TeachersPageProps) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [teacherView, setTeacherView] = useState<'all' | 'manager' | 'homeroom_teacher' | 'subject_teacher'>('all');
  const [teacherPanelTab, setTeacherPanelTab] = useState<TeacherPanelTab>('teachers');
  const [statsView, setStatsView] = useState<'grade' | 'class' | 'teacher'>('grade');
  const [teachers, setTeachers] = useState<PermissionUser[]>([]);
  const [roleTemplates, setRoleTemplates] = useState<RoleTemplate[]>([]);
  const [showEditor, setShowEditor] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<PermissionUser | null>(null);
  const [selectedTeacher, setSelectedTeacher] = useState<PermissionUser | null>(null);
  const [form, setForm] = useState<PermissionUserFormState>(() => createPermissionUserForm());
  const [pageLoading, setPageLoading] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);
  const [editorError, setEditorError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [importRows, setImportRows] = useState<Array<{ name: string; phone?: string; roles?: string; teachingClasses?: string }>>([]);
  const [importResult, setImportResult] = useState<PermissionUserImportResult | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [importFileName, setImportFileName] = useState('');
  const importFileInputRef = useRef<HTMLInputElement | null>(null);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [focusFilter, setFocusFilter] = useState<'all' | 'multi_class'>('all');
  const [liveStatusFilter, setLiveStatusFilter] = useState<'all' | 'busy' | 'free'>('all');
  const [sortConfig, setSortConfig] = useState<{ key: TeacherSortKey; direction: SortDirection } | null>(null);
  const [teacherLiveMap, setTeacherLiveMap] = useState<Record<number, TeacherLiveStatusRow>>({});
  const [liveBusyCount, setLiveBusyCount] = useState(0);
  const [liveFreeCount, setLiveFreeCount] = useState(0);
  const [editorGradeFilter, setEditorGradeFilter] = useState('all');
  const [editorClassKeyword, setEditorClassKeyword] = useState('');
  const [editorActiveClassId, setEditorActiveClassId] = useState<number | null>(null);
  const returnTo = searchParams.get('returnTo');
  const returnLabel = searchParams.get('returnLabel') || '返回来源页面';
  const [scheduleSlots, setScheduleSlots] = useState<TeacherScheduleSlotRow[]>([]);
  const [selectedScheduleTeacher, setSelectedScheduleTeacher] = useState<PermissionUser | null>(null);
  const [scheduleMode, setScheduleMode] = useState<ScheduleMode>('teacher');
  const [liveStatusDate, setLiveStatusDate] = useState(getTodayDateInputValue);
  const [liveStatusStart, setLiveStatusStart] = useState(getCurrentTimeInputValue);
  const [liveStatusEnd, setLiveStatusEnd] = useState(getCurrentTimeInputValue);
  const [liveStatusRangeActive, setLiveStatusRangeActive] = useState(false);
  const [liveStatusPeriodKey, setLiveStatusPeriodKey] = useState('custom');
  const allowManageTeachers = canManageTeachers(user?.roleCode);

  const teacherRoleTemplates = useMemo(
    () => roleTemplates.filter((item) => teacherRoleCodes.includes(item.code)),
    [roleTemplates],
  );
  const staffRoleTemplates = useMemo(
    () => roleTemplates.filter((item) => staffRoleCodes.includes(item.code)),
    [roleTemplates],
  );

  function buildLiveStatusQuery() {
    if (!liveStatusRangeActive) return undefined;
    if (!liveStatusStart && !liveStatusEnd) return undefined;
    if (!liveStatusStart || !liveStatusEnd) return undefined;
    const startAt = buildLocalDateTimeIso(liveStatusDate, liveStatusStart);
    const endAt = buildLocalDateTimeIso(liveStatusDate, liveStatusEnd);
    if (!startAt || !endAt) return undefined;
    return {
      startAt,
      endAt,
    };
  }

  async function loadTeachers(query?: { at?: string; startAt?: string; endAt?: string }) {
    const [usersResponse, rolesResponse, liveResponse, slotResponse] = await Promise.all([
      adminApi.permissionUsers(token),
      adminApi.roleTemplates(token),
      adminApi.teacherLiveStatus(token, query),
      adminApi.teacherScheduleSlots(token),
    ]);
    const teacherRows = usersResponse.data.filter((row) => row.status === 'enabled' && shouldShowInTeacherList(row));
    setTeachers(teacherRows);
    setRoleTemplates(rolesResponse.data);
    const liveMap = Object.fromEntries(liveResponse.data.rows.map((item) => [item.teacherId, item]));
    setTeacherLiveMap(liveMap);
    setLiveBusyCount(teacherRows.filter((row) => liveMap[row.id]?.status === 'busy').length);
    setLiveFreeCount(teacherRows.filter((row) => liveMap[row.id]?.status === 'free').length);
    setScheduleSlots(slotResponse.data);
  }

  useEffect(() => {
    let active = true;
    setPageLoading(true);
    Promise.all([
      adminApi.permissionUsers(token),
      adminApi.roleTemplates(token),
      adminApi.teacherLiveStatus(token, buildLiveStatusQuery()),
      adminApi.teacherScheduleSlots(token),
    ])
      .then(([usersResponse, rolesResponse, liveResponse, slotResponse]) => {
        if (!active) return;
        const teacherRows = usersResponse.data.filter((row) => row.status === 'enabled' && shouldShowInTeacherList(row));
        setTeachers(teacherRows);
        setRoleTemplates(rolesResponse.data);
        const liveMap = Object.fromEntries(liveResponse.data.rows.map((item) => [item.teacherId, item]));
        setTeacherLiveMap(liveMap);
        setLiveBusyCount(teacherRows.filter((row) => liveMap[row.id]?.status === 'busy').length);
        setLiveFreeCount(teacherRows.filter((row) => liveMap[row.id]?.status === 'free').length);
        setScheduleSlots(slotResponse.data);
      })
      .catch((err) => {
        if (!active) return;
        setPageError(err instanceof Error ? err.message : '教师数据加载失败');
      })
      .finally(() => {
        if (active) setPageLoading(false);
      });

    return () => {
      active = false;
    };
  }, [liveStatusDate, liveStatusEnd, liveStatusRangeActive, liveStatusStart, token]);

  useEffect(() => {
    const nextTeacherView = searchParams.get('teacherView');
    const nextStatsView = searchParams.get('statsView');
    const nextRoleFilter = searchParams.get('roleFilter');
    const nextFocusFilter = searchParams.get('focusFilter');
    const nextLiveStatusFilter = searchParams.get('liveStatus');
    const nextSearch = searchParams.get('keyword');
    const targetUserId = searchParams.get('userId');

    if (nextTeacherView === 'all' || nextTeacherView === 'manager' || nextTeacherView === 'homeroom_teacher' || nextTeacherView === 'subject_teacher') {
      setTeacherView(nextTeacherView);
    }
    if (nextStatsView === 'grade' || nextStatsView === 'class' || nextStatsView === 'teacher') {
      setStatsView(nextStatsView);
    }
    if (nextRoleFilter) setRoleFilter(nextRoleFilter);
    setFocusFilter(nextFocusFilter === 'multi_class' ? 'multi_class' : 'all');
    setLiveStatusFilter(nextLiveStatusFilter === 'busy' || nextLiveStatusFilter === 'free' ? nextLiveStatusFilter : 'all');
    setSearchKeyword(nextSearch ?? '');
    if (targetUserId && teachers.length > 0) {
      const matched = teachers.find((item) => item.id === Number(targetUserId));
      if (matched) setSelectedTeacher(matched);
    }
  }, [searchParams, teachers]);

  function openCreate() {
    if (!allowManageTeachers) return;
    setEditingTeacher(null);
    setForm({ ...createPermissionUserForm(), roleCode: teacherRoleTemplates[0]?.code ?? 'homeroom_teacher' });
    setEditorError(null);
    setEditorGradeFilter('all');
    setEditorClassKeyword('');
    setEditorActiveClassId(classes[0]?.id ?? null);
    setShowEditor(true);
  }

  function openEdit(row: PermissionUser) {
    if (!allowManageTeachers) return;
    setEditingTeacher(row);
    setForm(createPermissionUserForm(row));
    setEditorError(null);
    setEditorGradeFilter('all');
    setEditorClassKeyword('');
    setEditorActiveClassId(row.classIds[0] ?? row.subjectScopes[0]?.classId ?? classes[0]?.id ?? null);
    setShowEditor(true);
  }

  function openDetail(row: PermissionUser) {
    setSelectedTeacher(row);
    const params = new URLSearchParams(searchParams);
    params.set('userId', String(row.id));
    setSearchParams(params, { replace: true });
  }

  function closeDetail() {
    setSelectedTeacher(null);
    const params = new URLSearchParams(searchParams);
    params.delete('userId');
    setSearchParams(params, { replace: true });
  }

  function closeEditor() {
    setShowEditor(false);
    setEditorError(null);
  }

  function closeImportModal() {
    setShowImportModal(false);
    setImportError(null);
  }

  function getImportCell(row: Record<string, unknown>, keys: string[]) {
    for (const key of keys) {
      const value = row[key];
      if (value !== undefined && value !== null && String(value).trim()) {
        return String(value).trim().replace(/\.0$/, '');
      }
    }
    return '';
  }

  async function handleImportFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setImportError(null);
    setImportResult(null);
    setImportFileName(file.name);

    try {
      const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      if (!firstSheetName) throw new Error('导入文件中没有工作表');
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(workbook.Sheets[firstSheetName], { defval: '' });
      const parsedRows = rows
        .map((row) => ({
          name: getImportCell(row, ['姓名', '教师姓名', 'name']),
          phone: getImportCell(row, ['手机', '手机号', '联系电话', 'phone']) || undefined,
          roles: getImportCell(row, ['职务角色', '角色', '岗位', '职务', 'roles']) || undefined,
          teachingClasses: getImportCell(row, ['任课班级', '授课班级', '负责班级', 'teachingClasses']) || undefined,
        }))
        .filter((row) => row.name);

      if (parsedRows.length === 0) {
        throw new Error('未识别到教师姓名，请确认表头为「姓名 / 手机 / 职务角色 / 任课班级」');
      }

      setImportRows(parsedRows);
      setShowImportModal(true);
    } catch (err) {
      setImportRows([]);
      setImportError(err instanceof Error ? err.message : '导入文件解析失败');
      setShowImportModal(true);
    }
  }

  async function handleImportSubmit() {
    if (importResult) return;
    if (importRows.length === 0) {
      setImportError('没有可导入的数据');
      return;
    }
    setImporting(true);
    setImportError(null);
    setSubmitSuccess(null);

    try {
      const response = await adminApi.importPermissionUsers(token, { rows: importRows });
      setImportResult(response.data);
      const warnNote =
        response.data.warnings.length > 0 ? `另有 ${response.data.warnings.length} 条需在结果中查阅的警告。` : '';
      setSubmitSuccess(
        `批量导入完成：新增 ${response.data.createdCount} 人，更新 ${response.data.updatedCount} 人，跳过 ${response.data.skippedCount} 人。${warnNote}`,
      );
      await loadTeachers();
    } catch (err) {
      setImportError(err instanceof Error ? err.message : '教师批量导入失败');
    } finally {
      setImporting(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setEditorError(null);
    setSubmitSuccess(null);

    try {
      const subjectScopes = Array.from(
        new Map(
          form.subjectScopeKeys.map((key) => {
            const [classId, subjectCode] = key.split(':');
            return [
              key,
              {
                classId: Number(classId),
                subjectCode,
              },
            ];
          }),
        ).values(),
      );
      const isManagerStaff = isManagerStaffRole(form.roleCode);
      const payload: PermissionUserUpsertPayload = {
        name: form.name.trim(),
        username: form.username.trim(),
        roleCode: form.roleCode,
        phone: form.phone.trim() || undefined,
        classIds:
          isManagerStaff || form.roleCode === 'subject_teacher'
            ? Array.from(new Set(subjectScopes.map((item) => item.classId)))
            : form.classIds.map(Number),
        subjectScopes,
        resetPassword: form.resetPassword,
      };

      if (!payload.name || !payload.username) {
        throw new Error('请填写完整的教师姓名和登录账号');
      }
      if (!isManagerStaff) {
        if (!isTeacherRoleCode(payload.roleCode)) {
          throw new Error('教师管理仅支持班主任和任课教师岗位');
        }
        if (payload.roleCode === 'subject_teacher' && subjectScopes.length === 0) {
          throw new Error('任课教师至少需要配置一个授课班级和学科');
        }
        if (payload.roleCode === 'homeroom_teacher' && payload.classIds?.length === 0) {
          throw new Error('班主任至少需要负责一个班级');
        }
      }

      const allUsersResponse = await adminApi.permissionUsers(token);
      const normalizedUsername = normalizeLoginUsername(payload.username);
      const duplicatedUser = allUsersResponse.data.find(
        (item) =>
          normalizeLoginUsername(item.username) === normalizedUsername &&
          item.id !== editingTeacher?.id,
      );
      if (duplicatedUser) {
        throw new Error(`登录账号重复：${payload.username} 已被占用`);
      }

      if (editingTeacher) {
        await adminApi.updatePermissionUser(token, editingTeacher.id, payload);
        setSubmitSuccess('教师信息已更新');
      } else {
        const result = await adminApi.createPermissionUser(token, payload);
        setSubmitSuccess(`教师账号已创建，默认密码 ${result.data.defaultPassword}`);
      }

      await loadTeachers();
      closeEditor();
    } catch (err) {
      setEditorError(err instanceof Error ? err.message : '教师信息保存失败');
    }
  }

  async function handleResetPassword(id: number) {
    setPageError(null);
    setSubmitSuccess(null);
    try {
      const result = await adminApi.resetPermissionUserPassword(token, id);
      setSubmitSuccess(`密码已重置为 ${result.data.defaultPassword}`);
    } catch (err) {
      setPageError(err instanceof Error ? err.message : '密码重置失败');
    }
  }

  const filteredTeachers = useMemo(() => {
    const keyword = normalizeKeyword(searchKeyword);
    return teachers.filter((row) => {
      const matchesView =
        teacherView === 'all' ||
        row.roleCode === teacherView ||
        (teacherView === 'manager' && ['super_admin', 'school_admin', 'academic_admin', 'moral_admin'].includes(row.roleCode));
      const matchesKeyword =
        !keyword ||
        normalizeKeyword(row.name).includes(keyword) ||
        normalizeKeyword(row.username).includes(keyword) ||
        normalizeKeyword(row.dutyTags.join(' ')).includes(keyword) ||
        normalizeKeyword(row.scopeDisplay).includes(keyword);
      const matchesRole = roleFilter === 'all' || row.roleCode === roleFilter;
      const matchesFocus = focusFilter === 'all' || row.classIds.length > 1;
      const liveStatus = teacherLiveMap[row.id]?.status;
      const matchesLiveStatus =
        liveStatusFilter === 'all' ||
        (liveStatusFilter === 'busy' && liveStatus === 'busy') ||
        (liveStatusFilter === 'free' && liveStatus === 'free');
      return matchesView && matchesKeyword && matchesRole && matchesFocus && matchesLiveStatus;
    });
  }, [focusFilter, liveStatusFilter, roleFilter, searchKeyword, teacherLiveMap, teacherView, teachers]);
  const sortedTeachers = useMemo(() => {
    if (!sortConfig) return filteredTeachers;

    const directionFactor = sortConfig.direction === 'asc' ? 1 : -1;
    const compareText = (left: string, right: string) =>
      left.localeCompare(right, 'zh-CN', { numeric: true }) * directionFactor;

    return [...filteredTeachers].sort((left, right) => {
      switch (sortConfig.key) {
        case 'name':
          return compareText(left.name, right.name) || compareText(left.username, right.username);
        case 'username':
          return compareText(left.username, right.username) || compareText(left.name, right.name);
        case 'roleName':
          return compareText(left.roleName, right.roleName) || compareText(left.name, right.name);
        case 'scopeDisplay':
          return compareText(left.scopeDisplay || '未分配负责范围', right.scopeDisplay || '未分配负责范围') || compareText(left.name, right.name);
        case 'permissionSummary':
          return compareText(left.permissionSummary, right.permissionSummary) || compareText(left.name, right.name);
        case 'status':
          return compareText(formatEnabledStatus(left.status), formatEnabledStatus(right.status)) || compareText(left.name, right.name);
        case 'currentStatus':
          return compareText(getLiveStatusSortValue(left), getLiveStatusSortValue(right)) || compareText(left.name, right.name);
        default:
          return 0;
      }
    });
  }, [filteredTeachers, sortConfig]);

  const homeroomCount = teachers.filter((row) => row.roleCode === 'homeroom_teacher').length;
  const teacherPagination = usePagination(
    sortedTeachers,
    `${searchKeyword}|${roleFilter}|${teacherView}|${focusFilter}|${liveStatusFilter}|${sortConfig?.key ?? 'default'}|${sortConfig?.direction ?? 'default'}|${teachers.length}`,
  );
  const selectedRoleTemplate = staffRoleTemplates.find((item) => item.code === form.roleCode);
  const selectedTeacherRoleTemplate = staffRoleTemplates.find((item) => item.code === selectedTeacher?.roleCode);
  const isManagerStaffEditor = isManagerStaffRole(form.roleCode);
  const teachingRoleBadge = isManagerStaffEditor
    ? '管理岗兼职任课'
    : form.roleCode === 'homeroom_teacher'
      ? '班主任主责'
      : '任课教师';

  const selectedSubjectClassIds = useMemo(
    () => Array.from(new Set(form.subjectScopeKeys.map((item) => Number(item.split(':')[0])))),
    [form.subjectScopeKeys],
  );
  const selectedClassPreview = useMemo(
    () =>
      classes.filter((item) =>
        form.roleCode === 'homeroom_teacher'
          ? form.classIds.includes(String(item.id))
          : selectedSubjectClassIds.includes(item.id),
      ),
    [classes, form.classIds, form.roleCode, selectedSubjectClassIds],
  );
  // 授课学科与班主任负责班级独立配置，学科侧展示全校班级供直接勾选
  const subjectAssignableClasses = useMemo(() => classes, [classes]);
  const editorGradeOptions = useMemo(
    () => Array.from(new Set(subjectAssignableClasses.map((item) => item.gradeName))),
    [subjectAssignableClasses],
  );
  const filteredEditorClasses = useMemo(() => {
    const keyword = normalizeKeyword(editorClassKeyword);
    return subjectAssignableClasses.filter((item) => {
      const matchesGrade = editorGradeFilter === 'all' || item.gradeName === editorGradeFilter;
      const matchesKeyword =
        !keyword ||
        normalizeKeyword(`${item.gradeName} ${item.name}`).includes(keyword) ||
        normalizeKeyword(item.code).includes(keyword);
      return matchesGrade && matchesKeyword;
    });
  }, [editorClassKeyword, editorGradeFilter, subjectAssignableClasses]);
  const activeEditorClass = filteredEditorClasses.find((item) => item.id === editorActiveClassId) ?? filteredEditorClasses[0] ?? null;
  const selectedSubjectScopeItems = useMemo(
    () =>
      form.subjectScopeKeys
        .map((key) => {
          const [classIdText, subjectCode] = key.split(':');
          const classId = Number(classIdText);
          const classInfo = classes.find((item) => item.id === classId);
          const subjectInfo = teacherSubjectOptions.find((item) => item.code === subjectCode);
          if (!classInfo || !subjectInfo) return null;
          return {
            key,
            classId,
            classLabel: `${classInfo.gradeName} ${classInfo.name}`,
            subjectCode,
            subjectLabel: subjectInfo.label,
          };
        })
        .filter((item): item is NonNullable<typeof item> => Boolean(item)),
    [classes, form.subjectScopeKeys],
  );

  function getTeacherClassSummary(row: PermissionUser | null) {
    if (!row) return [];
    return classes.filter((item) => row.classIds.includes(item.id));
  }

  function toggleSubjectScope(classId: number, subjectCode: string, checked: boolean) {
    const scopeKey = `${classId}:${subjectCode}`;
    setForm((prev) => ({
      ...prev,
      subjectScopeKeys: checked
        ? Array.from(new Set([...prev.subjectScopeKeys, scopeKey]))
        : prev.subjectScopeKeys.filter((item) => item !== scopeKey),
    }));
  }

  function toggleHomeroomClass(classId: number, checked: boolean) {
    setForm((prev) => ({
      ...prev,
      classIds: checked
        ? Array.from(new Set([...prev.classIds, String(classId)]))
        : prev.classIds.filter((item) => item !== String(classId)),
      subjectScopeKeys: checked
        ? prev.subjectScopeKeys
        : prev.subjectScopeKeys.filter((item) => !item.startsWith(`${classId}:`)),
    }));
  }

  function toggleAllSubjectsForClass(classId: number, checked: boolean) {
    const scopeKeys = teacherSubjectOptions.map((item) => `${classId}:${item.code}`);
    setForm((prev) => ({
      ...prev,
      subjectScopeKeys: checked
        ? Array.from(new Set([...prev.subjectScopeKeys, ...scopeKeys]))
        : prev.subjectScopeKeys.filter((item) => !scopeKeys.includes(item)),
    }));
  }

  useEffect(() => {
    if (!showEditor) return;
    const nextActiveId = activeEditorClass?.id ?? subjectAssignableClasses[0]?.id ?? null;
    if (nextActiveId !== editorActiveClassId) {
      setEditorActiveClassId(nextActiveId);
    }
  }, [activeEditorClass?.id, editorActiveClassId, showEditor, subjectAssignableClasses]);

  function buildTeachersLocation(selectedUserId?: number) {
    const params = new URLSearchParams();
    if (teacherView !== 'all') params.set('teacherView', teacherView);
    if (statsView !== 'grade') params.set('statsView', statsView);
    if (roleFilter !== 'all') params.set('roleFilter', roleFilter);
    if (focusFilter !== 'all') params.set('focusFilter', focusFilter);
    if (liveStatusFilter !== 'all') params.set('liveStatus', liveStatusFilter);
    if (searchKeyword.trim()) params.set('keyword', searchKeyword.trim());
    if (selectedUserId) params.set('userId', String(selectedUserId));
    return params.size > 0 ? `/teachers?${params.toString()}` : '/teachers';
  }

  function navigateWithQuery(path: string, query: Record<string, string | number | null | undefined>) {
    const params = new URLSearchParams();
    Object.entries(query).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') return;
      params.set(key, String(value));
    });
    navigate(params.size > 0 ? `${path}?${params.toString()}` : path);
  }

  function syncTeacherFilterParams(nextState: {
    teacherView?: 'all' | 'manager' | 'homeroom_teacher' | 'subject_teacher';
    roleFilter?: string;
    focusFilter?: 'all' | 'multi_class';
    liveStatusFilter?: 'all' | 'busy' | 'free';
    searchKeyword?: string;
  }) {
    const params = new URLSearchParams(searchParams);
    const nextTeacherView = nextState.teacherView ?? teacherView;
    const nextRoleFilter = nextState.roleFilter ?? roleFilter;
    const nextFocusFilter = nextState.focusFilter ?? focusFilter;
    const nextLiveStatusFilter = nextState.liveStatusFilter ?? liveStatusFilter;
    const nextSearchKeyword = nextState.searchKeyword ?? searchKeyword;

    if (nextTeacherView !== 'all') params.set('teacherView', nextTeacherView);
    else params.delete('teacherView');

    if (nextRoleFilter !== 'all') params.set('roleFilter', nextRoleFilter);
    else params.delete('roleFilter');

    if (nextFocusFilter !== 'all') params.set('focusFilter', nextFocusFilter);
    else params.delete('focusFilter');

    if (nextLiveStatusFilter !== 'all') params.set('liveStatus', nextLiveStatusFilter);
    else params.delete('liveStatus');

    if (nextSearchKeyword.trim()) params.set('keyword', nextSearchKeyword.trim());
    else params.delete('keyword');

    setSearchParams(params, { replace: true });
  }

  function resetListFilters() {
    setSearchKeyword('');
    setRoleFilter('all');
    setTeacherView('all');
    setFocusFilter('all');
    setLiveStatusFilter('all');
    syncTeacherFilterParams({
      teacherView: 'all',
      roleFilter: 'all',
      focusFilter: 'all',
      liveStatusFilter: 'all',
      searchKeyword: '',
    });
  }

  function applyLiveStatusFilter(nextFilter: 'all' | 'busy' | 'free') {
    setLiveStatusFilter(nextFilter);
    syncTeacherFilterParams({ liveStatusFilter: nextFilter });
    void loadTeachers(buildLiveStatusQuery());
  }

  function toggleSort(key: TeacherSortKey) {
    setSortConfig((prev) => {
      if (!prev || prev.key !== key) {
        return { key, direction: 'asc' };
      }
      return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
    });
  }

  function renderSortHeader(label: string, key: TeacherSortKey) {
    const active = sortConfig?.key === key;
    const indicator = active ? (sortConfig.direction === 'asc' ? '↑' : '↓') : '↕';
    return (
      <button className={`table-sort-button${active ? ' active' : ''}`} type="button" onClick={() => toggleSort(key)}>
        <span>{label}</span>
        <b>{indicator}</b>
      </button>
    );
  }

  function getLiveStatusSortValue(row: PermissionUser) {
    const live = teacherLiveMap[row.id];
    if (!live) return '未配置课表';
    if (live.status === 'free') return '空闲';
    if (live.busyType === 'research') return `教研 ${live.currentSubject ?? ''}`.trim();
    return `有课 第${live.currentPeriodNo ?? '-'}节 ${live.currentSubject ?? ''} ${live.currentClassName ?? ''}`.trim();
  }

  function getLiveStatusTooltip(row: PermissionUser) {
    const live = teacherLiveMap[row.id];
    if (!live || live.status !== 'busy') return undefined;
    if (live.busyType === 'research') {
      return `${live.currentSubject ?? '教研'} ${live.startTime ?? ''}-${live.endTime ?? ''}`.trim();
    }
    return `第${live.currentPeriodNo ?? '-'}节 ${live.currentSubject ?? ''} ${live.currentClassName ?? ''} ${live.startTime ?? ''}-${live.endTime ?? ''}`.trim();
  }

  function renderLiveStatusCell(row: PermissionUser) {
    const live = teacherLiveMap[row.id];
    if (!live) {
      return <span className="teacher-live-status muted">未配置课表</span>;
    }
    if (live.status === 'free') {
      return <span className="teacher-live-status free">空闲</span>;
    }
    const tooltip = getLiveStatusTooltip(row);
    const isResearch = live.busyType === 'research';
    return (
      <span className={`teacher-live-status ${isResearch ? 'research' : 'busy'}`}>
        <span className="teacher-live-status-detail">
          {isResearch ? '教研' : '有课'}
          {tooltip ? <span className="teacher-live-status-tooltip">{tooltip}</span> : null}
        </span>
      </span>
    );
  }

  const scheduleByTeacher = useMemo(() => {
    return scheduleSlots.reduce<Record<string, TeacherScheduleSlotRow[]>>((acc, slot) => {
      const key = slot.teacherId ? `teacher-${slot.teacherId}` : `pending-${slot.teacherName}`;
      if (!acc[key]) acc[key] = [];
      acc[key].push(slot);
      return acc;
    }, {});
  }, [scheduleSlots]);

  const groupedScheduleRows = useMemo<ScheduleGroupedRow[]>(() => {
    const map = new Map<string, ScheduleGroupedRow>();
    for (const slot of scheduleSlots) {
      const key =
        scheduleMode === 'teacher'
          ? slot.teacherId
            ? `teacher-${slot.teacherId}`
            : `pending-teacher-${slot.teacherName}`
          : slot.className
            ? `class-${slot.className}`
            : `pending-class-${slot.teacherName}`;
      const name = scheduleMode === 'teacher' ? slot.teacherName : slot.className || '未关联班级';
      const secondaryLabel = scheduleMode === 'teacher' ? slot.roleName : slot.isPending ? '待关联' : '已导入';
      const current = map.get(key) ?? {
        key,
        name,
        secondaryLabel,
        isPending: slot.isPending,
        totalSlots: 0,
        values: {} as Record<number, ScheduleCellSlot[]>,
      };
      current.isPending = current.isPending || slot.isPending;
      current.totalSlots += 1;
      if (!current.values[slot.weekday]) current.values[slot.weekday] = [];
      current.values[slot.weekday].push({
        id: slot.id,
        periodNo: slot.periodNo,
        startTime: slot.startTime,
        endTime: slot.endTime,
        subject: slot.subject,
        teacherName: slot.teacherName,
        className: slot.className,
        isPending: slot.isPending,
      });
      map.set(key, current);
    }
    return Array.from(map.values())
      .map((row) => ({
        ...row,
        values: Object.fromEntries(
          Object.entries(row.values).map(([weekday, slots]) => [
            Number(weekday),
            [...slots].sort((left, right) => {
              if (left.periodNo !== right.periodNo) return left.periodNo - right.periodNo;
              return `${left.startTime}${left.endTime}`.localeCompare(`${right.startTime}${right.endTime}`, 'zh-CN');
            }),
          ]),
        ) as Record<number, ScheduleCellSlot[]>,
      }))
      .sort((a, b) => {
        if (a.isPending !== b.isPending) return a.isPending ? 1 : -1;
        return a.name.localeCompare(b.name, 'zh-CN', { numeric: true });
      });
  }, [scheduleMode, scheduleSlots]);

  const schedulePeriods = useMemo<SchedulePeriodDefinition[]>(() => {
    const periodMap = new Map<number, SchedulePeriodDefinition>();
    for (const slot of scheduleSlots) {
      const existing = periodMap.get(slot.periodNo);
      if (!existing) {
        periodMap.set(slot.periodNo, {
          periodNo: slot.periodNo,
          startTime: normalizeTimeInputValue(slot.startTime),
          endTime: normalizeTimeInputValue(slot.endTime),
        });
      }
    }
    return Array.from(periodMap.values()).sort((left, right) => {
      if (left.periodNo !== right.periodNo) return left.periodNo - right.periodNo;
      return `${left.startTime}${left.endTime}`.localeCompare(`${right.startTime}${right.endTime}`, 'zh-CN');
    });
  }, [scheduleSlots]);
  const liveStatusPeriodOptions = useMemo(
    () =>
      schedulePeriods.map((period) => ({
        ...period,
        key: `${period.periodNo}-${period.startTime}-${period.endTime}`,
        label: `第${period.periodNo}节 ${period.startTime}-${period.endTime}`,
      })),
    [schedulePeriods],
  );

  const schedulePagination = usePagination(groupedScheduleRows, `${teacherPanelTab}|${scheduleMode}|${groupedScheduleRows.length}`);
  const liveStatusRangeLabel = useMemo(
    () => (liveStatusRangeActive ? formatLiveStatusRangeLabel(liveStatusDate, liveStatusStart, liveStatusEnd) : '当前时刻'),
    [liveStatusDate, liveStatusEnd, liveStatusRangeActive, liveStatusStart],
  );

  function applyLiveStatusPeriod(periodKey: string) {
    setLiveStatusPeriodKey(periodKey);
    const period = liveStatusPeriodOptions.find((item) => item.key === periodKey);
    if (!period) return;
    setLiveStatusStart(normalizeTimeInputValue(period.startTime));
    setLiveStatusEnd(normalizeTimeInputValue(period.endTime));
    setLiveStatusRangeActive(true);
  }

  function renderTeacherScheduleSummary(key: string, weekday: number) {
    const slots = (scheduleByTeacher[key] ?? [])
      .filter((item) => item.weekday === weekday)
      .sort((a, b) => a.periodNo - b.periodNo)
      .map((item) => `第${item.periodNo}节 ${item.subject}${item.className ? `(${item.className})` : ''}`);
    return slots.length > 0 ? slots.join('；') : '-';
  }

  function renderScheduleCell(row: ScheduleGroupedRow, weekday: number) {
    const slots = row.values[weekday] ?? [];
    const slotMap = new Map(slots.map((slot) => [slot.periodNo, slot]));
    return (
      <div className="schedule-cell-stack">
        {schedulePeriods.map((period) => {
          const slot = slotMap.get(period.periodNo);
          if (!slot) {
            return <div className="schedule-slot-card empty" key={`${row.key}-${weekday}-empty-${period.periodNo}`} />;
          }
          return (
            <div className={`schedule-slot-card${slot.isPending ? ' pending' : ''}`} key={`${row.key}-${weekday}-${slot.id}`}>
              <div className="schedule-slot-head">
                <strong>{`第${slot.periodNo}节`}</strong>
                <span>{`${slot.startTime}-${slot.endTime}`}</span>
              </div>
              <div className="schedule-slot-subject">{slot.subject}</div>
              <div className="schedule-slot-meta">
                {scheduleMode === 'teacher' ? slot.className || '未关联班级' : slot.teacherName}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <Shell
      title="教师管理"
      subtitle="从校级视角管理班主任、任课教师和任教范围"
      user={user}
      status={
        <>
          {loading || pageLoading ? <div className="status-card">教师数据整理中...</div> : null}
          {error ? <div className="status-card error">{error}</div> : null}
          {pageError ? <div className="status-card error">{pageError}</div> : null}
          {submitSuccess ? <div className="status-card success">{submitSuccess}</div> : null}
        </>
      }
    >
      <div className="admin-list-desk">
      <div className="page-header admin-list-page-header">
        <div>
          <h2>教师管理</h2>
          <p className="page-desc">聚合查看全校教职工结构、班级覆盖、系统角色和职务标签。</p>
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
              placeholder="搜索教师姓名/账号/负责范围..."
              value={searchKeyword}
              onChange={(event) => setSearchKeyword(event.target.value)}
            />
          </div>
          <select className="filter-select" value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)}>
            <option value="all">全部教师岗位</option>
            {staffRoleTemplates.map((item) => (
              <option key={item.code} value={item.code}>
                {item.name}
              </option>
            ))}
          </select>
          {allowManageTeachers ? (
            <>
              <button className="btn btn-primary" type="button" onClick={openCreate}>
                新增教师
              </button>
              <input
                ref={importFileInputRef}
                type="file"
                accept=".xlsx,.xls"
                hidden
                onChange={handleImportFileChange}
              />
              <button className="ghost-button" type="button" onClick={() => importFileInputRef.current?.click()}>
                批量导入
              </button>
            </>
          ) : null}
        </div>
      </div>

      <div className="security-filter-card admin-live-filter-card">
        <div className="security-filter-grid admin-live-filter-grid">
          <label className="security-filter-field">
            <span className="security-filter-label">忙闲判断日期</span>
            <PickerInput
              wrapperClassName="picker-input-inline"
              className="filter-select security-filter-select"
              type="date"
              value={liveStatusDate}
              onChange={(event) => {
                setLiveStatusDate(event.target.value);
                if (liveStatusRangeActive) {
                  setLiveStatusRangeActive(true);
                }
              }}
            />
          </label>
          <label className="security-filter-field">
            <span className="security-filter-label">课节时间段</span>
            <select
              className="filter-select security-filter-select"
              value={liveStatusPeriodKey}
              onChange={(event) => applyLiveStatusPeriod(event.target.value)}
              disabled={liveStatusPeriodOptions.length === 0}
            >
              <option value="custom">按课节时间段</option>
              {liveStatusPeriodOptions.map((period) => (
                <option key={period.key} value={period.key}>
                  {period.label}
                </option>
              ))}
            </select>
          </label>
          <label className="security-filter-field">
            <span className="security-filter-label">开始时间</span>
            <PickerInput
              wrapperClassName="picker-input-inline"
              className="filter-select security-filter-select"
              type="time"
              step="60"
              value={liveStatusStart}
              onChange={(event) => {
                setLiveStatusStart(event.target.value);
                setLiveStatusPeriodKey('custom');
                setLiveStatusRangeActive(true);
              }}
            />
          </label>
          <label className="security-filter-field">
            <span className="security-filter-label">结束时间</span>
            <PickerInput
              wrapperClassName="picker-input-inline"
              className="filter-select security-filter-select"
              type="time"
              step="60"
              value={liveStatusEnd}
              onChange={(event) => {
                setLiveStatusEnd(event.target.value);
                setLiveStatusPeriodKey('custom');
                setLiveStatusRangeActive(true);
              }}
            />
          </label>
        </div>
      </div>

      <div className="std-metric-grid std-metric-grid--3">
        <button
          type="button"
          className={`std-metric-card std-metric-card--blue std-metric-card--action${liveStatusFilter === 'all' ? ' active' : ''}`}
          onClick={() => {
            resetListFilters();
            void loadTeachers(buildLiveStatusQuery());
          }}
        >
          <div className="std-metric-card__top">
            <div className="std-metric-card__icon"><span className="sec-metric-glyph">总</span></div>
            <span className="std-metric-card__label">教师总数</span>
          </div>
          <div className="std-metric-card__value">{teachers.length}</div>
          <div className="std-metric-card__hint">纳入系统、具备管理或教学身份的账号</div>
        </button>
        <button
          type="button"
          className={`std-metric-card std-metric-card--amber std-metric-card--action${liveStatusFilter === 'busy' ? ' active' : ''}`}
          onClick={() => applyLiveStatusFilter('busy')}
        >
          <div className="std-metric-card__top">
            <div className="std-metric-card__icon"><span className="sec-metric-glyph">课</span></div>
            <span className="std-metric-card__label">当前有课</span>
          </div>
          <div className="std-metric-card__value">{liveBusyCount}</div>
          <div className="std-metric-card__hint">按所选时间段筛选有课教师</div>
        </button>
        <button
          type="button"
          className={`std-metric-card std-metric-card--green std-metric-card--action${liveStatusFilter === 'free' ? ' active' : ''}`}
          onClick={() => applyLiveStatusFilter('free')}
        >
          <div className="std-metric-card__top">
            <div className="std-metric-card__icon"><span className="sec-metric-glyph">闲</span></div>
            <span className="std-metric-card__label">当前空闲</span>
          </div>
          <div className="std-metric-card__value">{liveFreeCount}</div>
          <div className="std-metric-card__hint">按所选时间段筛选空闲教师</div>
        </button>
      </div>

      {showEditor ? (
        <Modal
          title={editingTeacher && isManagerStaffEditor ? '编辑兼课配置' : editingTeacher ? '编辑教师' : '新增教师'}
          subtitle={
            isManagerStaffEditor
              ? '管理岗位保持不变，此处仅维护兼职授课班级与学科'
              : '统一维护教师身份、班级主责与授课学科'
          }
          onClose={closeEditor}
        >
          <form className="settings-form teacher-editor-form" onSubmit={handleSubmit}>
            <div className="teacher-editor-shell">
              <div className="teacher-editor-hero">
                <div className="teacher-editor-hero-main">
                  <span className="teacher-editor-kicker">{editingTeacher ? '编辑分工' : '新增教师'}</span>
                  <h4>{form.name.trim() || '填写教师信息并配置任教范围'}</h4>
                  <p>
                    {isManagerStaffEditor
                      ? '系统角色保持不变。直接在下方选择班级并勾选兼教学科，用于任课工作视角与展示端规则。'
                      : '先确定岗位，再设置主负责班级与授课学科。班主任也可以补充兼教学科，用于展示端学科规则和后续权限判断。'}
                  </p>
                  <div className="teacher-editor-meta-row">
                    <span className="teacher-editor-meta-pill">{teachingRoleBadge}</span>
                    <span className="teacher-editor-meta-pill">
                      {form.roleCode === 'homeroom_teacher' ? '已选班级' : '已选授课班级'}{' '}
                      {form.roleCode === 'homeroom_teacher' ? form.classIds.length : selectedSubjectClassIds.length} 个
                    </span>
                    <span className="teacher-editor-meta-pill">已选学科 {selectedSubjectScopeItems.length} 组</span>
                  </div>
                </div>
                <div className="teacher-editor-hero-side">
                  <div className="teacher-editor-summary-card">
                    <span>岗位能力摘要</span>
                    <strong>{selectedRoleTemplate?.name ?? (isManagerStaffEditor ? '管理岗位' : '教师岗位')}</strong>
                    <div className="settings-tag-row compact">
                      {(selectedRoleTemplate?.permissions ?? []).map((item) => (
                        <span className="settings-tag" key={item}>{item}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="teacher-editor-grid">
                <div className="detail-card span-2">
                  <h4>基础信息</h4>
                  <div className="s-row permission-row-2">
                    <div className="s-field">
                      <label>教师姓名</label>
                      <input type="text" value={form.name} onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))} />
                    </div>
                    <div className="s-field">
                      <label>登录账号</label>
                      <input type="text" value={form.username} onChange={(event) => setForm((prev) => ({ ...prev, username: event.target.value }))} />
                    </div>
                  </div>
                  <div className="s-row permission-row-2">
                    <div className="s-field">
                      <label>{isManagerStaffEditor ? '系统角色' : '教师岗位'}</label>
                      {isManagerStaffEditor ? (
                        <input type="text" value={selectedRoleTemplate?.name ?? form.roleCode} readOnly />
                      ) : (
                        <select value={form.roleCode} onChange={(event) => setForm((prev) => ({ ...prev, roleCode: event.target.value }))}>
                          {teacherRoleTemplates.map((item) => (
                            <option key={item.code} value={item.code}>
                              {item.name}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                    <div className="s-field">
                      <label>联系电话</label>
                      <input type="text" value={form.phone} onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))} />
                    </div>
                  </div>
                </div>

                {form.roleCode === 'homeroom_teacher' ? (
                  <details className="detail-card span-2 teacher-editor-collapsible-card" open>
                    <summary className="teacher-editor-section-head">
                      <div>
                        <h4>班主任负责班级</h4>
                        <p>勾选班主任主负责班级；兼教学科在下方单独配置，可跨班选择。</p>
                      </div>
                      <b>{form.classIds.length} 个班级</b>
                    </summary>
                    <div className="teacher-class-grid">
                      {classes.map((item) => {
                        const selected = form.classIds.includes(String(item.id));
                        return (
                          <button
                            key={item.id}
                            type="button"
                            className={`teacher-class-card${selected ? ' active' : ''}`}
                            onClick={() => toggleHomeroomClass(item.id, !selected)}
                          >
                            <strong>{item.gradeName} {item.name}</strong>
                            <span>{item.studentCount} 名学生</span>
                            <b>{selected ? '已选择' : '点击选择'}</b>
                          </button>
                        );
                      })}
                    </div>
                  </details>
                ) : null}

                <div className="detail-card span-2">
                  <div className="teacher-editor-section-head">
                    <div>
                      <h4>{form.roleCode === 'homeroom_teacher' ? '授课学科（可选）' : '授课学科配置'}</h4>
                      <p>
                        {form.roleCode === 'homeroom_teacher'
                          ? '与上方负责班级独立：先筛班级，再为当前班勾选兼教学科。'
                          : '先筛班级，再为当前班勾选学科。这样可以在班级很多时保持操作可控。'}
                      </p>
                    </div>
                    <b>{selectedSubjectScopeItems.length} 组班级-学科</b>
                  </div>
                  {subjectAssignableClasses.length > 0 ? (
                    <div className="teacher-editor-scope-panel">
                      <div className="teacher-editor-scope-sidebar">
                        <div className="teacher-editor-filter-bar">
                          <input
                            type="text"
                            value={editorClassKeyword}
                            placeholder="搜索班级名称或编码"
                            onChange={(event) => setEditorClassKeyword(event.target.value)}
                          />
                          <select value={editorGradeFilter} onChange={(event) => setEditorGradeFilter(event.target.value)}>
                            <option value="all">全部年级</option>
                            {editorGradeOptions.map((item) => (
                              <option key={item} value={item}>{item}</option>
                            ))}
                          </select>
                        </div>
                        <div className="teacher-editor-class-list">
                          {filteredEditorClasses.map((item) => {
                            const selectedCount = selectedSubjectScopeItems.filter((scope) => scope.classId === item.id).length;
                            return (
                              <button
                                key={item.id}
                                type="button"
                                className={`teacher-editor-class-item${activeEditorClass?.id === item.id ? ' active' : ''}`}
                                onClick={() => setEditorActiveClassId(item.id)}
                              >
                                <div>
                                  <strong>{item.gradeName} {item.name}</strong>
                                  <span>{item.studentCount} 名学生</span>
                                </div>
                                <b>{selectedCount} 科</b>
                              </button>
                            );
                          })}
                          {filteredEditorClasses.length === 0 ? (
                            <div className="teacher-editor-empty">当前筛选下没有可配置的班级</div>
                          ) : null}
                        </div>
                      </div>
                      <div className="teacher-editor-scope-main">
                        {activeEditorClass ? (
                          <>
                            <div className="teacher-editor-active-head">
                              <div>
                                <strong>{activeEditorClass.gradeName} {activeEditorClass.name}</strong>
                                <span>{activeEditorClass.studentCount} 名学生</span>
                              </div>
                              <div className="teacher-editor-inline-actions">
                                <button
                                  type="button"
                                  className="ghost-button"
                                  onClick={() => toggleAllSubjectsForClass(activeEditorClass.id, true)}
                                >
                                  本班全选
                                </button>
                                <button
                                  type="button"
                                  className="ghost-button"
                                  onClick={() => toggleAllSubjectsForClass(activeEditorClass.id, false)}
                                >
                                  清空本班
                                </button>
                              </div>
                            </div>
                            <div className="teacher-editor-subject-grid">
                              {teacherSubjectOptions.map((subject) => {
                                const checked = form.subjectScopeKeys.includes(`${activeEditorClass.id}:${subject.code}`);
                                return (
                                  <button
                                    key={`${activeEditorClass.id}-${subject.code}`}
                                    type="button"
                                    className={`teacher-editor-subject-chip${checked ? ' active' : ''}`}
                                    onClick={() => toggleSubjectScope(activeEditorClass.id, subject.code, !checked)}
                                  >
                                    <span>{subject.label}</span>
                                    <b>{checked ? '已选' : '选择'}</b>
                                  </button>
                                );
                              })}
                            </div>
                          </>
                        ) : (
                          <div className="teacher-editor-empty">请选择左侧班级后再配置学科</div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="teacher-editor-empty">暂无可配置班级，请先在班级管理中创建班级。</div>
                  )}
                </div>

                <div className="detail-card">
                  <h4>{form.roleCode === 'homeroom_teacher' ? '当前已选班级' : '当前已选授课班级'}</h4>
                  <div className="teacher-editor-selection-list">
                    {selectedClassPreview.map((item) => (
                      <div className="teacher-editor-selection-item" key={item.id}>
                        <strong>{item.gradeName} {item.name}</strong>
                        <span>{item.studentCount} 名学生</span>
                      </div>
                    ))}
                    {selectedClassPreview.length === 0 ? <div className="teacher-editor-empty inline">尚未选择班级</div> : null}
                  </div>
                </div>

                <div className="detail-card">
                  <h4>当前已选学科组合</h4>
                  <div className="teacher-editor-selection-list">
                    {selectedSubjectScopeItems.map((item) => (
                      <div className="teacher-editor-selection-item" key={item.key}>
                        <strong>{item.classLabel}</strong>
                        <span>{item.subjectLabel}</span>
                      </div>
                    ))}
                    {selectedSubjectScopeItems.length === 0 ? <div className="teacher-editor-empty inline">尚未选择授课学科</div> : null}
                  </div>
                </div>
              </div>
            </div>
            {editingTeacher ? (
              <label className="checkbox-item">
                <input type="checkbox" checked={form.resetPassword} onChange={(event) => setForm((prev) => ({ ...prev, resetPassword: event.target.checked }))} />
                同时重置密码为 123456
              </label>
            ) : null}
            {editorError ? <div className="status-card error">{editorError}</div> : null}
            <div className="form-actions">
              <button className="ghost-button" type="button" onClick={closeEditor}>
                取消
              </button>
              <button className="toolbar-button" type="submit">
                {editingTeacher
                  ? isManagerStaffEditor
                    ? '保存兼课配置'
                    : '保存修改'
                  : '保存并开通'}
              </button>
            </div>
          </form>
        </Modal>
      ) : null}
      {showImportModal ? (
        <Modal
          title="批量导入教师"
          subtitle="支持“姓名 / 手机 / 角色 / 任课班级”格式；角色为空时默认按任课教师导入；若角色写为“班主任（40班）”会按角色列解析班主任负责班级，“教务 / 德育”等标签仍会参与系统角色判断"
          onClose={closeImportModal}
        >
          <div className="settings-form">
            {!importResult ? (
              <div className="detail-card">
                <h4>导入预览</h4>
                <div className="detail-grid">
                  <div><span>文件</span><strong>{importFileName || '未选择'}</strong></div>
                  <div><span>识别人数</span><strong>{importRows.length} 人</strong></div>
                  <div><span>默认密码</span><strong>123456</strong></div>
                </div>
                <p className="page-desc">
                  同一手机号或同名账号会更新原账号。角色列会写入职务标签并用以推断系统角色；其中“班主任（xx班）”会单独解析班主任负责班级，“教务 / 德育 / 考试管理员”等标签仍按管理岗位识别。任课班级列继续用于解析授课班级与学科。新账号用户名按姓名拼音生成。
                </p>
              </div>
            ) : null}
            {importError ? <div className="status-card error">{importError}</div> : null}
            {!importResult && importRows.length > 0 ? (
              <div className="table-wrap compact-table">
                <table>
                  <thead>
                    <tr>
                      <th>姓名</th>
                      <th>手机</th>
                      <th>职务角色</th>
                      <th>任课班级</th>
                    </tr>
                  </thead>
                  <tbody>
                    {importRows.slice(0, 8).map((row, index) => (
                      <tr key={`${row.name}-${index}`}>
                        <td>{row.name}</td>
                        <td>{row.phone || '-'}</td>
                        <td>{row.roles || '-'}</td>
                        <td>{row.teachingClasses || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {importRows.length > 8 ? <div className="teacher-editor-empty inline">仅预览前 8 行，其余数据会一并导入。</div> : null}
              </div>
            ) : null}
            {importResult ? (
              <div className="detail-card">
                <h4>导入结果</h4>
                <div className="detail-grid">
                  <div><span>新增账号</span><strong>{importResult.createdCount} 个</strong></div>
                  <div><span>更新已有账号</span><strong>{importResult.updatedCount} 个</strong></div>
                  <div><span>跳过</span><strong>{importResult.skippedCount} 个</strong></div>
                  {importResult.warnings.length > 0 ? (
                    <div><span>警告</span><strong>{importResult.warnings.length} 条</strong></div>
                  ) : null}
                </div>
                {importResult.skippedCount > 0 ? (
                  <div className="teacher-editor-empty inline">
                    {importResult.results
                      .filter((item) => item.action === 'skipped')
                      .map((item) => (
                        <div key={`${item.row}-${item.name}`}>第 {item.row} 行 {item.name}：{item.message || '导入失败'}</div>
                      ))}
                  </div>
                ) : null}
                {importResult.warnings.length > 0 ? (
                  <div className="teacher-editor-empty inline">
                    <p className="page-desc">
                      以下含职务为空或任课范围未配置的提示；若该行账号已成功导入或更新，请在教师管理中尽快补全信息。
                    </p>
                    {importResult.warnings.map((item, idx) => (
                      <div key={`${idx}-${item}`}>{item}</div>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : null}
            <div className="modal-actions">
              <button className="ghost-button" type="button" onClick={closeImportModal}>
                关闭
              </button>
              {!importResult ? (
                <button className="btn btn-primary" type="button" disabled={importing || importRows.length === 0} onClick={handleImportSubmit}>
                  {importing ? '导入中...' : '确认导入'}
                </button>
              ) : null}
            </div>
          </div>
        </Modal>
      ) : null}
      {selectedTeacher ? (
        <Modal
          title={`${selectedTeacher.name} · 教师详情`}
          subtitle="查看教师岗位、负责班级和当前权限边界"
          onClose={closeDetail}
        >
          <div className="detail-grid">
            <div className="detail-card">
              <h4>教师信息</h4>
              <div className="detail-list">
                <div><span>姓名</span><strong>{selectedTeacher.name}</strong></div>
                <div><span>登录账号</span><strong>{selectedTeacher.username}</strong></div>
                <div><span>系统角色</span><strong>{selectedTeacher.roleName}</strong></div>
                <div><span>职务标签</span><strong>{selectedTeacher.dutyTags.length > 0 ? selectedTeacher.dutyTags.join('、') : '未设置'}</strong></div>
                <div><span>账号状态</span><strong>{formatEnabledStatus(selectedTeacher.status)}</strong></div>
              </div>
            </div>
            <div className="detail-card">
              <h4>任教范围</h4>
              <div className="detail-list">
                <div><span>负责范围</span><strong>{selectedTeacher.scopeDisplay}</strong></div>
                <div><span>负责班级数</span><strong>{selectedTeacher.classIds.length} 个</strong></div>
                <div><span>联系电话</span><strong>{selectedTeacher.phone || '未填写'}</strong></div>
                <div><span>权限摘要</span><strong>{selectedTeacher.permissionSummary}</strong></div>
              </div>
            </div>
            {selectedTeacher.subjectScopes.length > 0 ? (
              <div className="detail-card span-2">
                <h4>授课学科</h4>
                <div className="mini-list">
                  {selectedTeacher.subjectScopes.map((item) => (
                    <div className="mini-list-item" key={`${item.classId}-${item.subjectCode}`}>
                      <div>
                        <strong>{item.gradeName ?? ''} {item.className ?? `班级${item.classId}`}</strong>
                        <span>授课学科：{item.subjectLabel}</span>
                      </div>
                      <b>{item.subjectLabel}</b>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
            <div className="detail-card span-2">
              <h4>负责班级</h4>
              <div className="mini-list">
                {getTeacherClassSummary(selectedTeacher).map((item) => (
                  <div className="mini-list-item" key={item.id}>
                    <div>
                      <strong>{item.gradeName} {item.name}</strong>
                      <span>{item.studentCount} 名学生 · 班级目标 {item.targetScore ?? 0} 分</span>
                    </div>
                    <b>{item.displayStatus === 'enabled' ? '展示中' : '未展示'}</b>
                  </div>
                ))}
                {selectedTeacher.classIds.length === 0 ? (
                  <div className="mini-list-item">
                    <div>
                      <strong>未分配班级</strong>
                      <span>当前教师尚未绑定班级，可在编辑教师中补充分工。</span>
                    </div>
                    <b>待处理</b>
                  </div>
                ) : null}
              </div>
            </div>
            <div className="detail-card span-2">
              <h4>岗位能力</h4>
              <div className="settings-tag-row">
                {(selectedTeacherRoleTemplate?.permissions ?? selectedTeacher.permissions).map((item) => (
                  <span className="settings-tag" key={item}>{item}</span>
                ))}
              </div>
            </div>
            <div className="detail-card span-2">
              <h4>联动入口</h4>
              <div className="form-actions" style={{ justifyContent: 'flex-start', marginTop: 0 }}>
                <button
                  className="ghost-button"
                  type="button"
                  onClick={() =>
                    navigateWithQuery('/classes', {
                      classIds: selectedTeacher.classIds.join(','),
                      returnTo: buildTeachersLocation(selectedTeacher.id),
                      returnLabel: '返回教师管理',
                    })
                  }
                >
                  查看相关班级
                </button>
                <button
                  className="ghost-button"
                  type="button"
                  onClick={() =>
                    navigateWithQuery('/organization', {
                      activeTab: 'accounts',
                      userId: selectedTeacher.id,
                      returnTo: buildTeachersLocation(selectedTeacher.id),
                      returnLabel: '返回教师管理',
                    })
                  }
                >
                  查看账号治理
                </button>
              </div>
            </div>
          </div>
        </Modal>
      ) : null}
      {selectedScheduleTeacher ? (
        <Modal
          title={`${selectedScheduleTeacher.name} · 课程安排`}
          subtitle="按星期展示该教师全部课时"
          onClose={() => setSelectedScheduleTeacher(null)}
        >
          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>星期</th>
                  <th>课程明细</th>
                </tr>
              </thead>
              <tbody>
                {[1, 2, 3, 4, 5].map((weekday) => (
                  <tr key={weekday}>
                    <td>{`星期${['一', '二', '三', '四', '五'][weekday - 1]}`}</td>
                    <td>{renderTeacherScheduleSummary(`teacher-${selectedScheduleTeacher.id}`, weekday)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Modal>
      ) : null}
      <div className="panel admin-list-panel security-accounts-panel">
        <div className="security-panel-head">
          <div className="sec-nav-tabs">
            {[
              ['teachers', '教师信息'],
              ['schedule', '课程表数据'],
            ].map(([key, label]) => (
              <button
                key={key}
                className={`sec-nav-tab${teacherPanelTab === key ? ' active' : ''}`}
                type="button"
                onClick={() => setTeacherPanelTab(key as TeacherPanelTab)}
              >
                {label}
              </button>
            ))}
          </div>
          <p className="page-desc">查看教职工账号、系统角色、职务标签与课程表安排。</p>
        </div>
        {teacherPanelTab === 'teachers' ? (
          <>
            <div className="admin-list-live-banner">
              当前忙闲判断时间：<strong>{liveStatusRangeLabel}</strong>
            </div>
            <div className="security-chip-row">
          {[
            ['all', '全部教师'],
            ['manager', '管理职务'],
            ['homeroom_teacher', '班主任'],
            ['subject_teacher', '任课教师'],
          ].map(([key, label]) => (
            <button
              key={key}
              type="button"
              className={`security-chip${teacherView === key ? ' active' : ''}`}
              onClick={() => setTeacherView(key as typeof teacherView)}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="data-table-wrap security-table-wrap">
          <table className="data-table security-table">
            <thead>
              <tr>
                <th>{renderSortHeader('姓名', 'name')}</th>
                <th>{renderSortHeader('账号', 'username')}</th>
                <th>{renderSortHeader('系统角色', 'roleName')}</th>
                <th>职务标签</th>
                <th>{renderSortHeader('负责范围', 'scopeDisplay')}</th>
                <th>{renderSortHeader('当前状态', 'currentStatus')}</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {teacherPagination.pagedItems.map((row) => (
                <tr key={row.id}>
                  <td className="security-name-cell permission-name">{row.name}</td>
                  <td>{row.username}</td>
                  <td>{row.roleName}</td>
                  <td>
                    {row.dutyTags.length > 0 ? (
                      <div className="settings-tag-row compact">
                        {row.dutyTags.map((tag) => <span className="settings-tag" key={tag}>{tag}</span>)}
                      </div>
                    ) : '-'}
                  </td>
                  <PermissionScopeTableCell row={row} classes={classes} />
                  <td>{renderLiveStatusCell(row)}</td>
                  <td>
                    <button className="op-btn" type="button" onClick={() => openDetail(row)}>查看详情</button>
                    {allowManageTeachers ? (
                      <button className="op-btn" type="button" onClick={() => openEdit(row)}>
                        {isManagerStaffRole(row.roleCode) ? '编辑兼课' : '编辑教师'}
                      </button>
                    ) : null}
                    <button className="op-btn" type="button" onClick={() => setSelectedScheduleTeacher(row)}>查看课程</button>
                  </td>
                </tr>
              ))}
              {filteredTeachers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="table-empty">
                    当前筛选条件下没有教师数据
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
        <TablePagination
          currentPage={teacherPagination.currentPage}
          pageSize={teacherPagination.pageSize}
          totalItems={teacherPagination.totalItems}
          totalPages={teacherPagination.totalPages}
          onPageChange={teacherPagination.setCurrentPage}
          onPageSizeChange={teacherPagination.setPageSize}
        />
          </>
        ) : null}
        {teacherPanelTab === 'schedule' ? (
          <>
            <div className="page-header" style={{ marginTop: 16 }}>
              <div>
                <div className="panel-title">课程表数据</div>
                <p className="page-desc">按教师或班级查看已导入课程表，每天课时按节次顺序排列。</p>
              </div>
            </div>
            <div className="security-chip-row">
              <button
                type="button"
                className={`security-chip${scheduleMode === 'teacher' ? ' active' : ''}`}
                onClick={() => setScheduleMode('teacher')}
              >
                按教师
              </button>
              <button
                type="button"
                className={`security-chip${scheduleMode === 'class' ? ' active' : ''}`}
                onClick={() => setScheduleMode('class')}
              >
                按班级
              </button>
            </div>
            <div className="settings-note" style={{ marginTop: 14 }}>
              当前以 {scheduleMode === 'teacher' ? '教师' : '班级'} 为一行展示，每个单元格按节次从前到后排列，便于快速查看忙闲分布。
            </div>
            <div className="data-table-wrap security-table-wrap">
              <table className="data-table security-table">
                <thead>
                  <tr>
                    <th>{scheduleMode === 'teacher' ? '教师' : '班级'}</th>
                    <th>{scheduleMode === 'teacher' ? '岗位' : '状态'}</th>
                    <th>本周课时</th>
                    {weekdayLabels.map((label) => (
                      <th key={label}>{label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {schedulePagination.pagedItems.map((row) => (
                    <tr key={row.key}>
                      <td className="permission-name">
                        <div className="schedule-row-title">
                          <strong>{row.name}</strong>
                          <span>{row.isPending ? '待关联数据' : '已建立关联'}</span>
                        </div>
                      </td>
                      <td>{row.secondaryLabel}</td>
                      <td>{row.totalSlots} 节</td>
                      {[1, 2, 3, 4, 5].map((weekday) => (
                        <td className="schedule-day-cell" key={`${row.key}-${weekday}`}>
                          {renderScheduleCell(row, weekday)}
                        </td>
                      ))}
                    </tr>
                  ))}
                  {groupedScheduleRows.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="table-empty">
                        当前还没有课程表数据
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
            <TablePagination
              currentPage={schedulePagination.currentPage}
              pageSize={schedulePagination.pageSize}
              totalItems={schedulePagination.totalItems}
              totalPages={schedulePagination.totalPages}
              onPageChange={schedulePagination.setCurrentPage}
              onPageSizeChange={schedulePagination.setPageSize}
            />
          </>
        ) : null}
      </div>

      </div>
    </Shell>
  );
}

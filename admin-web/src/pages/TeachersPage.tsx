import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Modal } from '../components/Modal';
import { Shell } from '../components/Shell';
import { TablePagination } from '../components/TablePagination';
import { usePagination } from '../hooks/usePagination';
import type { AdminClass, PermissionUser, PermissionUserUpsertPayload, RoleTemplate, SessionUser } from '../lib/api';
import { adminApi } from '../lib/api';
import type { PermissionUserFormState } from '../types/admin';
import { createPermissionUserForm, formatEnabledStatus, normalizeKeyword } from '../utils/adminForms';

const teacherRoleCodes = ['homeroom_teacher', 'subject_teacher'];
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
  { code: 'arts_it', label: '音美信综合' },
  { code: 'pe', label: '体育' },
] as const;

type TeachersPageProps = {
  token: string;
  user: SessionUser | null;
  classes: AdminClass[];
  loading: boolean;
  error: string | null;
};

type TeacherSortKey = 'name' | 'username' | 'roleName' | 'scopeDisplay' | 'permissionSummary' | 'status';
type SortDirection = 'asc' | 'desc';

function normalizeLoginUsername(value: string) {
  return value.trim().toLowerCase();
}

export function TeachersPage({ token, user, classes, loading, error }: TeachersPageProps) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [teacherView, setTeacherView] = useState<'all' | 'homeroom_teacher' | 'subject_teacher'>('all');
  const [statsView, setStatsView] = useState<'grade' | 'class' | 'teacher'>('grade');
  const [showOverview, setShowOverview] = useState(false);
  const [teachers, setTeachers] = useState<PermissionUser[]>([]);
  const [roleTemplates, setRoleTemplates] = useState<RoleTemplate[]>([]);
  const [showEditor, setShowEditor] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<PermissionUser | null>(null);
  const [selectedTeacher, setSelectedTeacher] = useState<PermissionUser | null>(null);
  const [form, setForm] = useState<PermissionUserFormState>(() => createPermissionUserForm());
  const [pageLoading, setPageLoading] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);
  const [editorError, setEditorError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [focusFilter, setFocusFilter] = useState<'all' | 'multi_class'>('all');
  const [sortConfig, setSortConfig] = useState<{ key: TeacherSortKey; direction: SortDirection } | null>(null);
  const [editorGradeFilter, setEditorGradeFilter] = useState('all');
  const [editorClassKeyword, setEditorClassKeyword] = useState('');
  const [editorActiveClassId, setEditorActiveClassId] = useState<number | null>(null);
  const returnTo = searchParams.get('returnTo');
  const returnLabel = searchParams.get('returnLabel') || '返回来源页面';

  const teacherRoleTemplates = useMemo(
    () => roleTemplates.filter((item) => teacherRoleCodes.includes(item.code)),
    [roleTemplates],
  );

  async function loadTeachers() {
    const [usersResponse, rolesResponse] = await Promise.all([adminApi.permissionUsers(token), adminApi.roleTemplates(token)]);
    const teacherRows = usersResponse.data.filter((row) => teacherRoleCodes.includes(row.roleCode));
    setTeachers(teacherRows);
    setRoleTemplates(rolesResponse.data);
  }

  useEffect(() => {
    let active = true;
    setPageLoading(true);
    Promise.all([adminApi.permissionUsers(token), adminApi.roleTemplates(token)])
      .then(([usersResponse, rolesResponse]) => {
        if (!active) return;
        setTeachers(usersResponse.data.filter((row) => teacherRoleCodes.includes(row.roleCode)));
        setRoleTemplates(rolesResponse.data);
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
  }, [token]);

  useEffect(() => {
    const nextTeacherView = searchParams.get('teacherView');
    const nextStatsView = searchParams.get('statsView');
    const nextRoleFilter = searchParams.get('roleFilter');
    const nextFocusFilter = searchParams.get('focusFilter');
    const nextSearch = searchParams.get('keyword');
    const targetUserId = searchParams.get('userId');

    if (nextTeacherView === 'all' || nextTeacherView === 'homeroom_teacher' || nextTeacherView === 'subject_teacher') {
      setTeacherView(nextTeacherView);
    }
    if (nextStatsView === 'grade' || nextStatsView === 'class' || nextStatsView === 'teacher') {
      setStatsView(nextStatsView);
    }
    if (nextRoleFilter) setRoleFilter(nextRoleFilter);
    if (nextFocusFilter === 'multi_class') setFocusFilter('multi_class');
    if (nextSearch) setSearchKeyword(nextSearch);
    if (targetUserId && teachers.length > 0) {
      const matched = teachers.find((item) => item.id === Number(targetUserId));
      if (matched) setSelectedTeacher(matched);
    }
  }, [searchParams, teachers]);

  function openCreate() {
    setEditingTeacher(null);
    setForm({ ...createPermissionUserForm(), roleCode: teacherRoleTemplates[0]?.code ?? 'homeroom_teacher' });
    setEditorError(null);
    setEditorGradeFilter('all');
    setEditorClassKeyword('');
    setEditorActiveClassId(classes[0]?.id ?? null);
    setShowEditor(true);
  }

  function openEdit(row: PermissionUser) {
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
      const payload: PermissionUserUpsertPayload = {
        name: form.name.trim(),
        username: form.username.trim(),
        roleCode: form.roleCode,
        phone: form.phone.trim() || undefined,
        classIds:
          form.roleCode === 'subject_teacher'
            ? Array.from(new Set(subjectScopes.map((item) => item.classId)))
            : form.classIds.map(Number),
        subjectScopes: subjectScopes.length > 0 ? subjectScopes : undefined,
        resetPassword: form.resetPassword,
      };

      if (!payload.name || !payload.username) {
        throw new Error('请填写完整的教师姓名和登录账号');
      }
      if (!teacherRoleCodes.includes(payload.roleCode)) {
        throw new Error('教师管理仅支持班主任和任课教师岗位');
      }
      if (payload.roleCode === 'subject_teacher' && subjectScopes.length === 0) {
        throw new Error('任课教师至少需要配置一个授课班级和学科');
      }
      if (payload.roleCode === 'homeroom_teacher' && payload.classIds?.length === 0) {
        throw new Error('班主任至少需要负责一个班级');
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
      const matchesView = teacherView === 'all' || row.roleCode === teacherView;
      const matchesKeyword =
        !keyword ||
        normalizeKeyword(row.name).includes(keyword) ||
        normalizeKeyword(row.username).includes(keyword) ||
        normalizeKeyword(row.scopeDisplay).includes(keyword);
      const matchesRole = roleFilter === 'all' || row.roleCode === roleFilter;
      const matchesFocus = focusFilter === 'all' || row.classIds.length > 1;
      return matchesView && matchesKeyword && matchesRole && matchesFocus;
    });
  }, [focusFilter, roleFilter, searchKeyword, teacherView, teachers]);
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
        default:
          return 0;
      }
    });
  }, [filteredTeachers, sortConfig]);

  const homeroomCount = teachers.filter((row) => row.roleCode === 'homeroom_teacher').length;
  const subjectCount = teachers.filter((row) => row.roleCode === 'subject_teacher').length;
  const multiClassCount = teachers.filter((row) => row.classIds.length > 1).length;
  const uncoveredClasses = classes.filter((item) => !item.homeroomTeacher?.id);
  const scopedTeachers = teachers.filter((row) => teacherView === 'all' || row.roleCode === teacherView);
  const busiestTeachers = [...teachers]
    .sort((a, b) => b.classIds.length - a.classIds.length || a.name.localeCompare(b.name, 'zh-CN'))
    .slice(0, 4);
  const gradeCoverage = Array.from(
    classes.reduce((map, item) => {
      const current = map.get(item.gradeName) ?? { gradeName: item.gradeName, classCount: 0, teacherCount: new Set<number>() };
      current.classCount += 1;
      if (item.homeroomTeacher?.id) current.teacherCount.add(item.homeroomTeacher.id);
      map.set(item.gradeName, current);
      return map;
    }, new Map<string, { gradeName: string; classCount: number; teacherCount: Set<number> }>()),
  ).map(([, item]) => ({
    gradeName: item.gradeName,
    classCount: item.classCount,
    teacherCount: item.teacherCount.size,
  }));
  const gradeStats = Array.from(
    classes.reduce((map, item) => {
      const current = map.get(item.gradeName) ?? {
        gradeName: item.gradeName,
        classCount: 0,
        studentCount: 0,
        homeroomAssignedCount: 0,
        teacherSet: new Set<number>(),
      };
      current.classCount += 1;
      current.studentCount += item.studentCount;
      if (item.homeroomTeacher?.id) current.homeroomAssignedCount += 1;
      scopedTeachers.forEach((teacher) => {
        if (teacher.classIds.includes(item.id)) current.teacherSet.add(teacher.id);
      });
      map.set(item.gradeName, current);
      return map;
    }, new Map<string, { gradeName: string; classCount: number; studentCount: number; homeroomAssignedCount: number; teacherSet: Set<number> }>()),
  ).map(([, item]) => ({
    gradeName: item.gradeName,
    classCount: item.classCount,
    studentCount: item.studentCount,
    homeroomAssignedCount: item.homeroomAssignedCount,
    teacherCount: item.teacherSet.size,
  }));
  const classStats = classes.map((item) => {
    const relatedTeachers = scopedTeachers.filter((teacher) => teacher.classIds.includes(item.id));
    return {
      id: item.id,
      gradeName: item.gradeName,
      className: item.name,
      studentCount: item.studentCount,
      homeroomTeacherName: item.homeroomTeacher?.name ?? '待分配',
      teacherCount: relatedTeachers.length,
      teacherSummary: relatedTeachers.map((teacher) => teacher.name).join('、') || '暂无教师绑定',
    };
  });
  const teacherStats = scopedTeachers
    .map((teacher) => ({
      id: teacher.id,
      name: teacher.name,
      roleName: teacher.roleName,
      classCount: teacher.classIds.length,
      scopeDisplay: teacher.scopeDisplay || '未分配负责范围',
    }))
    .sort((a, b) => b.classCount - a.classCount || a.name.localeCompare(b.name, 'zh-CN'));
  const teacherPagination = usePagination(
    sortedTeachers,
    `${searchKeyword}|${roleFilter}|${teacherView}|${focusFilter}|${sortConfig?.key ?? 'default'}|${sortConfig?.direction ?? 'default'}|${teachers.length}`,
  );
  const selectedRoleTemplate = teacherRoleTemplates.find((item) => item.code === form.roleCode);
  const selectedTeacherRoleTemplate = teacherRoleTemplates.find((item) => item.code === selectedTeacher?.roleCode);

  const selectedHomeroomClasses = useMemo(
    () => classes.filter((item) => form.classIds.includes(String(item.id))),
    [classes, form.classIds],
  );
  const selectedSubjectClassIds = useMemo(
    () => Array.from(new Set(form.subjectScopeKeys.map((item) => Number(item.split(':')[0])))),
    [form.subjectScopeKeys],
  );
  const selectedClassPreview = useMemo(
    () =>
      classes.filter((item) =>
        form.roleCode === 'subject_teacher'
          ? selectedSubjectClassIds.includes(item.id)
          : form.classIds.includes(String(item.id)),
      ),
    [classes, form.classIds, form.roleCode, selectedSubjectClassIds],
  );
  const subjectAssignableClasses = useMemo(() => selectedHomeroomClasses, [selectedHomeroomClasses]);
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

  function resetListFilters() {
    setSearchKeyword('');
    setRoleFilter('all');
    setTeacherView('all');
    setFocusFilter('all');
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
      <div className="page-header">
        <div>
          <h2>教师管理</h2>
          <p className="page-desc">聚合查看全校教师结构、班级覆盖和岗位分工。</p>
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
            {teacherRoleTemplates.map((item) => (
              <option key={item.code} value={item.code}>
                {item.name}
              </option>
            ))}
          </select>
          <button className="btn btn-primary" type="button" onClick={openCreate}>
            新增教师
          </button>
        </div>
      </div>

      <div className="metric-strip">
        <div className="metric-card">
          <span>教师总数</span>
          <button className="metric-value-button" type="button" onClick={resetListFilters}>
            {teachers.length}
          </button>
          <p>当前纳入系统、具备教学岗位身份的账号数量。</p>
        </div>
        <div className="metric-card">
          <span>班主任人数</span>
          <button
            className="metric-value-button"
            type="button"
            onClick={() => {
              setTeacherView('homeroom_teacher');
              setFocusFilter('all');
            }}
          >
            {homeroomCount}
          </button>
          <p>承担班级主责、可执行兑换审核与班级管理的教师。</p>
        </div>
        <div className="metric-card">
          <span>跨班教师</span>
          <button className="metric-value-button" type="button" onClick={() => setFocusFilter('multi_class')}>
            {multiClassCount}
          </button>
          <p>同时覆盖多个班级的教师人数，适合作为排课与负载观察重点。</p>
        </div>
        <button
          className={`metric-card metric-card-action${showOverview ? " active" : ""}`}
          type="button"
          onClick={() => setShowOverview((prev) => !prev)}
        >
          <span>{showOverview ? "收起更多分析" : "更多分析"}</span>
          <strong>{showOverview ? "收起剩余分析卡片" : "展开剩余分析卡片"}</strong>
          <p>
            {uncoveredClasses.length} 个班待补班主任，
            当前 {homeroomCount} 位班主任在岗，展开后可查看年级、班级、教师等更多分析。
          </p>
        </button>
      </div>
      {showOverview ? (
        <div className="panel summary-panel">
          {teacherView !== 'all' || roleFilter !== 'all' || focusFilter !== 'all' || searchKeyword.trim() ? (
            <div className="summary-panel-actions">
              <button className="ghost-button" type="button" onClick={resetListFilters}>
                查看全部教师
              </button>
            </div>
          ) : null}
          <div className="detail-grid">
            <div className="detail-card">
              <h4>教师总数</h4>
              <div className="detail-list">
                <div><span>当前教师账号</span><strong>{teachers.length} 人</strong></div>
                <div><span>覆盖班级</span><strong>{new Set(teachers.flatMap((item) => item.classIds)).size} 个</strong></div>
              </div>
            </div>
            <div className="detail-card">
              <h4>岗位结构</h4>
              <div className="detail-list">
                <div><span>班主任</span><strong>{homeroomCount} 人</strong></div>
                <div><span>任课教师</span><strong>{subjectCount} 人</strong></div>
              </div>
            </div>
            <div className="detail-card">
              <h4>年级覆盖</h4>
              <div className="mini-list">
                {gradeCoverage.slice(0, 4).map((item) => (
                  <div className="mini-list-item" key={item.gradeName}>
                    <div>
                      <strong>{item.gradeName}</strong>
                      <span>{item.classCount} 个班级已建立教师绑定</span>
                    </div>
                    <b>{item.teacherCount} 人</b>
                  </div>
                ))}
              </div>
            </div>
            <div className="detail-card">
              <h4>重点关注</h4>
              <div className="mini-list">
                {busiestTeachers.map((item) => (
                  <div className="mini-list-item" key={item.id}>
                    <div>
                      <strong>{item.name}</strong>
                      <span>{item.roleName} · {item.scopeDisplay || '未分配负责范围'}</span>
                    </div>
                    <b>{item.classIds.length} 个班</b>
                  </div>
                ))}
                {busiestTeachers.length === 0 ? (
                  <div className="mini-list-item">
                    <div>
                      <strong>暂无教师数据</strong>
                      <span>新增教师后，这里会展示当前覆盖范围较广的教师。</span>
                    </div>
                    <b>待建立</b>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {showEditor ? (
        <Modal
          title={editingTeacher ? '编辑教师' : '新增教师'}
          subtitle="统一维护教师身份、班级主责与授课学科"
          onClose={closeEditor}
        >
          <form className="settings-form teacher-editor-form" onSubmit={handleSubmit}>
            <div className="teacher-editor-shell">
              <div className="teacher-editor-hero">
                <div className="teacher-editor-hero-main">
                  <span className="teacher-editor-kicker">{editingTeacher ? '编辑分工' : '新增教师'}</span>
                  <h4>{form.name.trim() || '填写教师信息并配置任教范围'}</h4>
                  <p>
                    先确定岗位，再设置主负责班级与授课学科。班主任也可以补充兼教学科，用于展示端学科规则和后续权限判断。
                  </p>
                  <div className="teacher-editor-meta-row">
                    <span className="teacher-editor-meta-pill">{form.roleCode === 'homeroom_teacher' ? '班主任主责' : '任课教师'}</span>
                    <span className="teacher-editor-meta-pill">已选班级 {form.classIds.length} 个</span>
                    <span className="teacher-editor-meta-pill">已选学科 {selectedSubjectScopeItems.length} 组</span>
                  </div>
                </div>
                <div className="teacher-editor-hero-side">
                  <div className="teacher-editor-summary-card">
                    <span>岗位能力摘要</span>
                    <strong>{selectedRoleTemplate?.name ?? '教师岗位'}</strong>
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
                      <label>教师岗位</label>
                      <select value={form.roleCode} onChange={(event) => setForm((prev) => ({ ...prev, roleCode: event.target.value }))}>
                        {teacherRoleTemplates.map((item) => (
                          <option key={item.code} value={item.code}>
                            {item.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="s-field">
                      <label>联系电话</label>
                      <input type="text" value={form.phone} onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))} />
                    </div>
                  </div>
                </div>

                <div className="detail-card span-2">
                  <div className="teacher-editor-section-head">
                    <div>
                      <h4>{form.roleCode === 'homeroom_teacher' ? '班主任负责班级' : '授课班级'}</h4>
                      <p>{form.roleCode === 'homeroom_teacher' ? '先勾选班主任主负责班级，再决定是否补充兼教学科。' : '任课教师通过班级-学科组合建立可用规则范围。'}</p>
                    </div>
                    <b>{form.classIds.length} 个班级</b>
                  </div>
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
                </div>

                <div className="detail-card span-2">
                  <div className="teacher-editor-section-head">
                    <div>
                      <h4>{form.roleCode === 'homeroom_teacher' ? '授课学科（可选）' : '授课学科配置'}</h4>
                      <p>
                        先筛班级，再为当前班勾选学科。这样可以在班级很多时保持操作可控。
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
                    <div className="teacher-editor-empty">
                      {form.roleCode === 'homeroom_teacher' ? '请先选择班主任负责班级，再补充授课学科。' : '暂无可配置班级。'}
                    </div>
                  )}
                </div>

                <div className="detail-card">
                  <h4>当前已选班级</h4>
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
                {editingTeacher ? '保存修改' : '保存并开通'}
              </button>
            </div>
          </form>
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
                <div><span>岗位</span><strong>{selectedTeacher.roleName}</strong></div>
                <div><span>账号状态</span><strong>{formatEnabledStatus(selectedTeacher.status)}</strong></div>
              </div>
            </div>
            <div className="detail-card">
              <h4>任教范围</h4>
              <div className="detail-list">
                <div><span>负责范围</span><strong>{selectedTeacher.scopeDisplay}</strong></div>
                <div><span>负责班级数</span><strong>{selectedTeacher.classIds.length} 个</strong></div>
                <div><span>联系电话</span><strong>{selectedTeacher.phone || '未填写'}</strong></div>
                <div><span>岗位摘要</span><strong>{selectedTeacher.permissionSummary}</strong></div>
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
                      keyword: selectedTeacher.name,
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

      <div className="panel">
        <div className="page-header">
          <div>
            <div className="panel-title">教师列表</div>
            <p className="page-desc">查看教师账号、岗位分工与负责范围。</p>
          </div>
        </div>
        <div className="tabs">
          {[
            ['all', '全部教师'],
            ['homeroom_teacher', '班主任'],
            ['subject_teacher', '任课教师'],
          ].map(([key, label]) => (
            <button
              key={key}
              className={`tab${teacherView === key ? ' active' : ''}`}
              type="button"
              onClick={() => setTeacherView(key as typeof teacherView)}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>{renderSortHeader('姓名', 'name')}</th>
                <th>{renderSortHeader('账号', 'username')}</th>
                <th>{renderSortHeader('岗位', 'roleName')}</th>
                <th>{renderSortHeader('负责范围', 'scopeDisplay')}</th>
                <th>{renderSortHeader('岗位摘要', 'permissionSummary')}</th>
                <th>{renderSortHeader('状态', 'status')}</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {teacherPagination.pagedItems.map((row) => (
                <tr key={row.id}>
                  <td className="permission-name">{row.name}</td>
                  <td>{row.username}</td>
                  <td>{row.roleName}</td>
                  <td>{row.scopeDisplay}</td>
                  <td>{row.permissionSummary}</td>
                  <td><span className={row.status === 'enabled' ? 'status-on' : 'status-off'}>{formatEnabledStatus(row.status)}</span></td>
                  <td>
                    <button className="op-btn" type="button" onClick={() => openDetail(row)}>查看详情</button>
                    <button className="op-btn" type="button" onClick={() => openEdit(row)}>编辑教师</button>
                    <button className="op-btn" type="button" onClick={() => void handleResetPassword(row.id)}>重置密码</button>
                  </td>
                </tr>
              ))}
              {filteredTeachers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="table-empty">
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
      </div>

    </Shell>
  );
}

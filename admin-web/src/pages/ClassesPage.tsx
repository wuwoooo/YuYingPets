import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Modal } from "../components/Modal";
import { Shell } from "../components/Shell";
import { TablePagination } from "../components/TablePagination";
import { usePagination } from "../hooks/usePagination";
import type {
  AdminClass,
  ClassUpsertPayload,
  DisplayTerminal,
  GradeConfig,
  PermissionUser,
  SessionUser,
  SystemSettings,
} from "../lib/api";
import { adminApi } from "../lib/api";
import type { ClassFormState } from "../types/admin";
import {
  buildClassCode,
  buildGradeCode,
  buildSortOrder,
  createClassForm,
  normalizeKeyword,
} from "../utils/adminForms";
import { canEditClassSettings, canManageClasses } from "../utils/adminPermissions";

type ClassesPageProps = {
  token: string;
  user: SessionUser | null;
  classes: AdminClass[];
  loading: boolean;
  error: string | null;
  onSaved: () => Promise<void>;
};

type ClassSortKey =
  | "name"
  | "gradeName"
  | "homeroomTeacher"
  | "studentCount"
  | "targetScore"
  | "displayStatus";

type SortDirection = "asc" | "desc";

function normalizeClassText(value: string) {
  return value.trim().toLowerCase();
}

export function ClassesPage({
  token,
  user,
  classes,
  loading,
  error,
  onSaved,
}: ClassesPageProps) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [statsView, setStatsView] = useState<"grade" | "class" | "governance">("grade");
  const [editingClass, setEditingClass] = useState<AdminClass | null>(null);
  const [selectedClass, setSelectedClass] = useState<AdminClass | null>(null);
  const [showOverview, setShowOverview] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [listTab, setListTab] = useState<"class" | "display">("class");
  const [form, setForm] = useState<ClassFormState>(() =>
    createClassForm(classes[0]?.semesterId),
  );
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [gradeFilter, setGradeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [focusFilter, setFocusFilter] = useState<"all" | "governance_pending">("all");
  const [sortConfig, setSortConfig] = useState<{ key: ClassSortKey; direction: SortDirection } | null>(null);
  const [pageLoading, setPageLoading] = useState(false);
  const [currentSemester, setCurrentSemester] = useState<
    SystemSettings["semester"] | null
  >(null);
  const [gradeConfigs, setGradeConfigs] = useState<GradeConfig[]>([]);
  const [teacherOptions, setTeacherOptions] = useState<PermissionUser[]>([]);
  const [displayTerminals, setDisplayTerminals] = useState<DisplayTerminal[]>([]);
  const [displayTerminalsLoading, setDisplayTerminalsLoading] = useState(false);
  const [displayTerminalsError, setDisplayTerminalsError] = useState<string | null>(null);
  const returnTo = searchParams.get("returnTo");
  const returnLabel = searchParams.get("returnLabel") || "返回来源页面";

  const defaultSemesterId = classes[0]?.semesterId;
  const allowCreate = canManageClasses(user?.roleCode);
  const allowViewDisplayTerminals = canManageClasses(user?.roleCode);
  const allowEdit = canEditClassSettings(user?.roleCode);
  const isHomeroomTeacher = user?.roleCode === "homeroom_teacher";
  const pageTitle =
    user?.roleCode === "homeroom_teacher"
      ? "我的班级"
      : user?.roleCode === "subject_teacher"
        ? "我的授课班级"
        : "班级管理";
  const pageSubtitle =
    user?.roleCode === "homeroom_teacher"
      ? "维护本班口号、目标积分和展示状态，作为班主任的班级运营入口。"
      : user?.roleCode === "subject_teacher"
        ? "查看自己授课班级的学生规模、展示状态和评价入口。"
        : "维护班级名称、班主任和展示设置，内部编号由系统自动处理";
  const gradeOptions = useMemo(
    () =>
      Array.from(
        new Set(classes.map((item) => item.gradeName).filter(Boolean)),
      ),
    [classes],
  );
  const formGradeOptions = useMemo(() => {
    const options = new Set(
      gradeConfigs
        .filter((item) => item.status === "enabled")
        .map((item) => item.name),
    );
    gradeOptions.forEach((item) => options.add(item));
    if (form.gradeName.trim()) {
      options.add(form.gradeName.trim());
    }
    return Array.from(options);
  }, [form.gradeName, gradeConfigs, gradeOptions]);

  useEffect(() => {
    const keyword = searchParams.get("keyword");
    const teacherStatus = searchParams.get("teacherStatus");
    const nextGradeName = searchParams.get("gradeName");
    const nextStatusFilter = searchParams.get("statusFilter");
    const nextFocusFilter = searchParams.get("focusFilter");
    const classId = searchParams.get("classId");
    const nextStatsView = searchParams.get("statsView");
    if (keyword) setSearchKeyword(keyword);
    if (nextGradeName) setGradeFilter(nextGradeName);
    if (nextStatusFilter === "enabled" || nextStatusFilter === "disabled" || nextStatusFilter === "all") {
      setStatusFilter(nextStatusFilter);
    }
    if (nextFocusFilter === "governance_pending") setFocusFilter("governance_pending");
    if (teacherStatus === "unassigned") setStatusFilter("all");
    if (nextStatsView === "grade" || nextStatsView === "class" || nextStatsView === "governance") {
      setStatsView(nextStatsView);
    }
    if (classId) {
      const matched = classes.find((item) => item.id === Number(classId));
      if (matched) setSelectedClass(matched);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!allowCreate) return;
    let active = true;
    setPageLoading(true);
    Promise.all([adminApi.settings(token), adminApi.permissionUsers(token)])
      .then(([settingsResponse, usersResponse]) => {
        if (!active) return;
        setCurrentSemester(settingsResponse.data.semester);
        setGradeConfigs(settingsResponse.data.gradeConfigs ?? []);
        setTeacherOptions(
          usersResponse.data.filter(
            (item) =>
              item.roleCode === "homeroom_teacher" && item.status === "enabled",
          ),
        );
      })
      .catch((err) => {
        if (!active) return;
        setSubmitError(
          err instanceof Error ? err.message : "班级配置数据加载失败",
        );
      })
      .finally(() => {
        if (active) setPageLoading(false);
      });

    return () => {
      active = false;
    };
  }, [allowCreate, token]);

  useEffect(() => {
    if (!allowViewDisplayTerminals) {
      setDisplayTerminals([]);
      setDisplayTerminalsError(null);
      return;
    }

    let active = true;
    setDisplayTerminalsLoading(true);
    setDisplayTerminalsError(null);

    adminApi
      .displayTerminals(token)
      .then((response) => {
        if (!active) return;
        setDisplayTerminals(response.data);
      })
      .catch((err) => {
        if (!active) return;
        setDisplayTerminalsError(
          err instanceof Error ? err.message : "大屏列表加载失败",
        );
      })
      .finally(() => {
        if (active) setDisplayTerminalsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [allowViewDisplayTerminals, token, classes.length]);

  useEffect(() => {
    if (!allowViewDisplayTerminals && listTab === "display") {
      setListTab("class");
    }
  }, [allowViewDisplayTerminals, listTab]);

  const filteredClasses = useMemo(() => {
    const keyword = normalizeKeyword(searchKeyword);
    return classes.filter((row) => {
      const matchesKeyword =
        !keyword ||
        normalizeKeyword(row.name).includes(keyword) ||
        normalizeKeyword(row.code).includes(keyword) ||
        normalizeKeyword(row.homeroomTeacher?.name ?? "").includes(keyword);
      const matchesGrade =
        gradeFilter === "all" || row.gradeName === gradeFilter;
      const matchesStatus =
        statusFilter === "all" || row.displayStatus === statusFilter;
      const matchesFocus =
        focusFilter === "all" ||
        (!row.homeroomTeacher ||
          row.displayStatus !== "enabled" ||
          row.targetScore === null ||
          row.targetScore === undefined);
      const matchesTeacherStatus =
        searchParams.get("teacherStatus") !== "unassigned" || !row.homeroomTeacher;
      return matchesKeyword && matchesGrade && matchesStatus && matchesFocus && matchesTeacherStatus;
    });
  }, [classes, focusFilter, gradeFilter, searchKeyword, statusFilter, searchParams]);
  const sortedClasses = useMemo(() => {
    if (!sortConfig) return filteredClasses;

    const directionFactor = sortConfig.direction === "asc" ? 1 : -1;
    const compareText = (left: string, right: string) =>
      left.localeCompare(right, "zh-CN", { numeric: true }) * directionFactor;
    const compareNumber = (left: number, right: number) => (left - right) * directionFactor;
    const compareOptionalNumber = (left: number | null | undefined, right: number | null | undefined) => {
      const leftMissing = left === null || left === undefined;
      const rightMissing = right === null || right === undefined;
      if (leftMissing && rightMissing) return 0;
      if (leftMissing) return 1;
      if (rightMissing) return -1;
      return compareNumber(left, right);
    };

    return [...filteredClasses].sort((left, right) => {
      switch (sortConfig.key) {
        case "name":
          return compareText(left.name, right.name) || compareText(left.gradeName, right.gradeName);
        case "gradeName":
          return compareText(left.gradeName, right.gradeName) || compareText(left.name, right.name);
        case "homeroomTeacher":
          return compareText(left.homeroomTeacher?.name ?? "", right.homeroomTeacher?.name ?? "") || compareText(left.name, right.name);
        case "studentCount":
          return compareNumber(left.studentCount, right.studentCount) || compareText(left.name, right.name);
        case "targetScore":
          return compareOptionalNumber(left.targetScore, right.targetScore) || compareText(left.name, right.name);
        case "displayStatus":
          return compareText(left.displayStatus === "enabled" ? "展示中" : "未展示", right.displayStatus === "enabled" ? "展示中" : "未展示") || compareText(left.name, right.name);
        default:
          return 0;
      }
    });
  }, [filteredClasses, sortConfig]);
  const classPagination = usePagination(
    sortedClasses,
    `${searchKeyword}|${gradeFilter}|${statusFilter}|${focusFilter}|${sortConfig?.key ?? "default"}|${sortConfig?.direction ?? "default"}|${classes.length}`,
  );
  const sortedDisplayTerminals = useMemo(
    () =>
      [...displayTerminals].sort((left, right) => {
        if (left.onlineStatus !== right.onlineStatus) {
          return left.onlineStatus === "online" ? -1 : 1;
        }
        const leftName = `${left.classInfo?.gradeName ?? ""}${left.classInfo?.className ?? ""}${left.terminalName}`;
        const rightName = `${right.classInfo?.gradeName ?? ""}${right.classInfo?.className ?? ""}${right.terminalName}`;
        return leftName.localeCompare(rightName, "zh-CN", { numeric: true });
      }),
    [displayTerminals],
  );
  const displayTerminalPagination = usePagination(
    sortedDisplayTerminals,
    `display|${sortedDisplayTerminals.length}|${sortedDisplayTerminals.map((item) => `${item.id}:${item.onlineStatus}:${item.classId ?? "none"}`).join("|")}`,
  );
  const enabledClassCount = classes.filter((row) => row.displayStatus === "enabled").length;
  const disabledClassCount = classes.filter((row) => row.displayStatus !== "enabled").length;
  const assignedTeacherCount = classes.filter((row) => row.homeroomTeacher?.id).length;
  const targetConfiguredCount = classes.filter((row) => row.targetScore !== null && row.targetScore !== undefined).length;
  const governancePendingCount = classes.filter(
    (row) =>
      !row.homeroomTeacher ||
      row.displayStatus !== "enabled" ||
      row.targetScore === null ||
      row.targetScore === undefined,
  ).length;
  const averageStudentCount = classes.length
    ? Math.round(classes.reduce((sum, row) => sum + row.studentCount, 0) / classes.length)
    : 0;

  function formatDateTime(value: string | null) {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";
    return date.toLocaleString("zh-CN", { hour12: false });
  }
  const gradeOverview = Array.from(
    classes.reduce((map, row) => {
      const current = map.get(row.gradeName) ?? {
        gradeName: row.gradeName,
        classCount: 0,
        studentCount: 0,
        enabledCount: 0,
        assignedTeacherCount: 0,
      };
      current.classCount += 1;
      current.studentCount += row.studentCount;
      if (row.displayStatus === "enabled") current.enabledCount += 1;
      if (row.homeroomTeacher?.id) current.assignedTeacherCount += 1;
      map.set(row.gradeName, current);
      return map;
    }, new Map<string, { gradeName: string; classCount: number; studentCount: number; enabledCount: number; assignedTeacherCount: number }>()),
  ).sort((a, b) => b[1].classCount - a[1].classCount || a[0].localeCompare(b[0], "zh-CN"));
  const governanceWatchList = [...classes]
    .filter((row) => !row.homeroomTeacher || row.displayStatus !== "enabled" || row.targetScore === null || row.targetScore === undefined)
    .sort((a, b) => {
      const aRisk = Number(!a.homeroomTeacher) + Number(a.displayStatus !== "enabled") + Number(a.targetScore === null || a.targetScore === undefined);
      const bRisk = Number(!b.homeroomTeacher) + Number(b.displayStatus !== "enabled") + Number(b.targetScore === null || b.targetScore === undefined);
      return bRisk - aRisk || b.studentCount - a.studentCount;
    })
    .slice(0, 4);
  const scopedClasses = filteredClasses;
  const scopedGradeStats = Array.from(
    scopedClasses.reduce((map, row) => {
      const current = map.get(row.gradeName) ?? {
        gradeName: row.gradeName,
        classCount: 0,
        studentCount: 0,
        enabledCount: 0,
        assignedTeacherCount: 0,
        currentScoreTotal: 0,
      };
      current.classCount += 1;
      current.studentCount += row.studentCount;
      current.currentScoreTotal += row.currentScoreTotal;
      if (row.displayStatus === "enabled") current.enabledCount += 1;
      if (row.homeroomTeacher?.id) current.assignedTeacherCount += 1;
      map.set(row.gradeName, current);
      return map;
    }, new Map<string, { gradeName: string; classCount: number; studentCount: number; enabledCount: number; assignedTeacherCount: number; currentScoreTotal: number }>()),
  )
    .map(([, item]) => ({
      ...item,
      averageClassScore: item.classCount ? Math.round(item.currentScoreTotal / item.classCount) : 0,
    }))
    .sort((a, b) => b.classCount - a.classCount || b.studentCount - a.studentCount);
  const scopedClassStats = [...scopedClasses]
    .map((row) => ({
      id: row.id,
      gradeName: row.gradeName,
      className: row.name,
      homeroomTeacherName: row.homeroomTeacher?.name ?? "待配置",
      studentCount: row.studentCount,
      displayStatusLabel: row.displayStatus === "enabled" ? "展示中" : "未展示",
      currentScoreTotal: row.currentScoreTotal,
      targetGap:
        row.targetScore === null || row.targetScore === undefined
          ? "未设置"
          : `${Math.max(row.targetScore - row.currentScoreTotal, 0)}`,
    }))
    .sort((a, b) => b.studentCount - a.studentCount || b.currentScoreTotal - a.currentScoreTotal);
  const scopedGovernanceStats = [...scopedClasses]
    .map((row) => ({
      id: row.id,
      gradeName: row.gradeName,
      className: row.name,
      homeroomTeacherName: row.homeroomTeacher?.name ?? "待配置",
      displayStatusLabel: row.displayStatus === "enabled" ? "展示中" : "未展示",
      targetScoreLabel:
        row.targetScore === null || row.targetScore === undefined
          ? "未设置"
          : `${row.targetScore} 分`,
      governanceStatus: [
        !row.homeroomTeacher ? "待配班主任" : null,
        row.displayStatus !== "enabled" ? "未开启展示" : null,
        row.targetScore === null || row.targetScore === undefined ? "未设目标积分" : null,
      ].filter(Boolean).join(" · ") || "配置完整",
    }))
    .sort((a, b) => {
      const aRisk = Number(a.governanceStatus !== "配置完整");
      const bRisk = Number(b.governanceStatus !== "配置完整");
      return bRisk - aRisk || a.governanceStatus.localeCompare(b.governanceStatus, "zh-CN");
    });

  function openCreate() {
    setSelectedClass(null);
    setEditingClass(null);
    setSubmitError(null);
    setForm(createClassForm(defaultSemesterId));
    setShowCreate(true);
  }

  function openEdit(row: AdminClass) {
    setSelectedClass(null);
    setShowCreate(false);
    setSubmitError(null);
    setEditingClass(row);
    setForm(createClassForm(defaultSemesterId, row));
  }

  function openDetail(row: AdminClass) {
    setShowCreate(false);
    setEditingClass(null);
    setSubmitError(null);
    setSelectedClass(row);
    const params = new URLSearchParams(searchParams);
    params.set("classId", String(row.id));
    setSearchParams(params, { replace: true });
  }

  function focusGrade(gradeName: string) {
    setGradeFilter(gradeName);
    setSearchKeyword("");
    setStatsView("class");
  }

  function focusClass(rowId: number, gradeName: string) {
    const matched = classes.find((item) => item.id === rowId);
    if (!matched) return;
    setGradeFilter(gradeName);
    setSearchKeyword(matched.name);
    openDetail(matched);
  }

  function closeModal(force = false) {
    if (submitting && !force) return;
    setShowCreate(false);
    setEditingClass(null);
    setSelectedClass(null);
    setSubmitError(null);
    if (selectedClass) {
      const params = new URLSearchParams(searchParams);
      params.delete("classId");
      setSearchParams(params, { replace: true });
    }
  }

  function buildClassesLocation(selectedClassId?: number) {
    const params = new URLSearchParams();
    if (searchKeyword.trim()) params.set("keyword", searchKeyword.trim());
    if (searchParams.get("teacherStatus") === "unassigned") params.set("teacherStatus", "unassigned");
    if (gradeFilter !== "all") params.set("gradeName", gradeFilter);
    if (statusFilter !== "all") params.set("statusFilter", statusFilter);
    if (focusFilter !== "all") params.set("focusFilter", focusFilter);
    if (statsView !== "grade") params.set("statsView", statsView);
    if (selectedClassId) params.set("classId", String(selectedClassId));
    return params.size > 0 ? `/classes?${params.toString()}` : "/classes";
  }

  function navigateWithQuery(path: string, query: Record<string, string | number | null | undefined>) {
    const params = new URLSearchParams();
    Object.entries(query).forEach(([key, value]) => {
      if (value === undefined || value === null || value === "") return;
      params.set(key, String(value));
    });
    navigate(params.size > 0 ? `${path}?${params.toString()}` : path);
  }

  function resetListFilters() {
    setSearchKeyword("");
    setGradeFilter("all");
    setStatusFilter("all");
    setFocusFilter("all");
  }

  function toggleSort(key: ClassSortKey) {
    setSortConfig((prev) => {
      if (!prev || prev.key !== key) {
        return { key, direction: "asc" };
      }
      return { key, direction: prev.direction === "asc" ? "desc" : "asc" };
    });
  }

  function renderSortHeader(label: string, key: ClassSortKey) {
    const active = sortConfig?.key === key;
    const indicator = active ? (sortConfig.direction === "asc" ? "↑" : "↓") : "↕";
    return (
      <button
        className={`table-sort-button${active ? " active" : ""}`}
        type="button"
        onClick={() => toggleSort(key)}
      >
        <span>{label}</span>
        <b>{indicator}</b>
      </button>
    );
  }

  function goToStudentsManagement(rowId: number, gradeName: string, label: string) {
    navigateWithQuery("/students", {
      classId: rowId,
      gradeName,
      statsView: "class",
      returnTo: buildClassesLocation(rowId),
      returnLabel: label,
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(null);

    try {
      const semesterId = form.semesterId || (editingClass?.semesterId ? String(editingClass.semesterId) : currentSemester?.id ? String(currentSemester.id) : "");
      const gradeName = form.gradeName.trim();
      const className = form.name.trim();
      const targetScoreText = form.targetScore.trim();
      const semesterIdNumber = Number(semesterId);

      if (!editingClass && (!semesterId || !gradeName || !className)) {
        throw new Error("请填写完整的班级基础信息");
      }

      if (targetScoreText && (!/^\d+$/.test(targetScoreText) || Number(targetScoreText) < 0)) {
        throw new Error("班级目标积分必须是大于等于 0 的整数");
      }

      const duplicatedClass = classes.find((item) => {
        if (item.id === editingClass?.id) return false;
        return (
          item.semesterId === semesterIdNumber &&
          normalizeClassText(item.gradeName) === normalizeClassText(gradeName) &&
          normalizeClassText(item.name) === normalizeClassText(className)
        );
      });
      if (duplicatedClass) {
        throw new Error(`班级重复：${duplicatedClass.gradeName} ${duplicatedClass.name} 已存在`);
      }

      if (editingClass) {
        const payload: ClassUpsertPayload = isHomeroomTeacher
          ? {
              semesterId: editingClass.semesterId,
              code: editingClass.code,
              gradeCode: editingClass.gradeCode,
              gradeName: editingClass.gradeName,
              name: editingClass.name,
              homeroomTeacherId: editingClass.homeroomTeacher?.id ?? null,
              slogan: form.slogan.trim() || null,
              targetScore: targetScoreText ? Number(targetScoreText) : null,
              displayStatus: form.displayStatus || "enabled",
              sortOrder: editingClass.sortOrder ?? null,
            }
          : {
              semesterId: Number(semesterId),
              code: buildClassCode(
                semesterId,
                buildGradeCode(
                  gradeName,
                  classes,
                  gradeConfigs,
                  editingClass?.gradeCode || form.gradeCode,
                ),
                className,
                classes,
                editingClass?.code || form.code,
              ),
              gradeCode: buildGradeCode(
                gradeName,
                classes,
                gradeConfigs,
                editingClass?.gradeCode || form.gradeCode,
              ),
              gradeName,
              name: className,
              homeroomTeacherId: form.homeroomTeacherId
                ? Number(form.homeroomTeacherId)
                : null,
              slogan: form.slogan.trim() || null,
              targetScore: targetScoreText ? Number(targetScoreText) : null,
              displayStatus: form.displayStatus || "enabled",
              sortOrder: buildSortOrder(
                buildGradeCode(
                  gradeName,
                  classes,
                  gradeConfigs,
                  editingClass?.gradeCode || form.gradeCode,
                ),
                classes,
                editingClass?.sortOrder ? String(editingClass.sortOrder) : form.sortOrder,
              ),
            };
        await adminApi.updateClass(token, editingClass.id, payload);
      } else {
        const gradeCode = buildGradeCode(
          gradeName,
          classes,
          gradeConfigs,
          form.gradeCode,
        );
        const payload: ClassUpsertPayload = {
          semesterId: Number(semesterId),
          code: buildClassCode(semesterId, gradeCode, className, classes, form.code),
          gradeCode,
          gradeName,
          name: className,
          homeroomTeacherId: form.homeroomTeacherId
            ? Number(form.homeroomTeacherId)
            : null,
          slogan: form.slogan.trim() || null,
          targetScore: targetScoreText ? Number(targetScoreText) : null,
          displayStatus: form.displayStatus || "enabled",
          sortOrder: buildSortOrder(gradeCode, classes, form.sortOrder),
        };
        await adminApi.createClass(token, payload);
      }

      await onSaved();
      setSubmitSuccess(editingClass ? "班级信息已更新" : "班级已创建");
      closeModal(true);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "提交失败");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Shell
      title={pageTitle}
      subtitle={pageSubtitle}
      user={user}
      status={
        <>
          {loading || pageLoading ? (
            <div className="status-card">班级数据加载中...</div>
          ) : null}
          {error ? <div className="status-card error">{error}</div> : null}
          {submitSuccess ? (
            <div className="status-card success">{submitSuccess}</div>
          ) : null}
        </>
      }
    >
      <div className="page-header">
        <div>
          <h2>{pageTitle}</h2>
          <p className="page-desc">
            {isHomeroomTeacher
              ? "班主任可在这里维护本班口号、目标积分，并进入学生管理和班级评价。"
              : user?.roleCode === "subject_teacher"
                ? "任课教师在这里查看自己的授课班级，并进入学生查看与学科评价。"
                : "聚合查看全校班级规模、展示状态和班主任配置覆盖情况。"}
          </p>
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
              placeholder="搜索班级名称..."
              value={searchKeyword}
              onChange={(event) => setSearchKeyword(event.target.value)}
            />
          </div>
          <select
            className="filter-select"
            value={gradeFilter}
            onChange={(event) => setGradeFilter(event.target.value)}
          >
            <option>全部年级</option>
            {gradeOptions.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <select
            className="filter-select"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value="all">全部状态</option>
            <option value="enabled">展示中</option>
            <option value="disabled">未展示</option>
          </select>
          {allowCreate ? (
            <button className="btn btn-primary" onClick={openCreate}>
              + 新建班级
            </button>
          ) : null}
        </div>
      </div>

      <div className="metric-strip">
        <div className="metric-card">
          <span>班级总数</span>
          <button className="metric-value-button" type="button" onClick={resetListFilters}>
            {classes.length}
          </button>
          <p>当前纳入系统管理的班级数量，是校级组织盘点的基础口径。</p>
        </div>
        <div className="metric-card">
          <span>展示中班级</span>
          <button
            className="metric-value-button"
            type="button"
            onClick={() => {
              setStatusFilter("enabled");
              setFocusFilter("all");
            }}
          >
            {enabledClassCount}
          </button>
          <p>已接入展示端的大屏班级数量，可用于观察汇报页覆盖范围。</p>
        </div>
        <div className="metric-card">
          <span>待治理班级</span>
          <button
            className="metric-value-button"
            type="button"
            onClick={() => {
              setStatusFilter("all");
              setFocusFilter("governance_pending");
            }}
          >
            {governancePendingCount}
          </button>
          <p>仍需补齐展示、班主任或目标积分配置的班级数量。</p>
        </div>
        <button
          className={`metric-card metric-card-action${showOverview ? " active" : ""}`}
          type="button"
          onClick={() => setShowOverview((prev) => !prev)}
        >
          <span>{showOverview ? "收起更多分析" : "更多分析"}</span>
          <strong>{showOverview ? "收起剩余分析卡片" : "展开剩余分析卡片"}</strong>
          <p>
            {classes.length - assignedTeacherCount} 个待配班主任，
            {disabledClassCount} 个未展示，展开后可查看年级、班级、治理等更多分析。
          </p>
        </button>
      </div>

      {showOverview ? (
        <div className="panel summary-panel">
          {gradeFilter !== "all" || statusFilter !== "all" || focusFilter !== "all" || searchKeyword.trim() ? (
            <div className="summary-panel-actions">
              <button className="ghost-button" type="button" onClick={resetListFilters}>
                查看全部班级
              </button>
            </div>
          ) : null}
          <div className="detail-grid">
            <div className="detail-card">
              <h4>班级规模</h4>
              <div className="detail-list">
                <div><span>班级总数</span><strong>{classes.length} 个</strong></div>
                <div><span>学生总数</span><strong>{classes.reduce((sum, row) => sum + row.studentCount, 0)} 人</strong></div>
                <div><span>平均班额</span><strong>{averageStudentCount} 人</strong></div>
                <div><span>停用展示班级</span><strong>{disabledClassCount} 个</strong></div>
              </div>
            </div>
            <div className="detail-card">
              <h4>治理覆盖</h4>
              <div className="detail-list">
                <div><span>已配班主任</span><strong>{assignedTeacherCount} 个</strong></div>
                <div><span>待配班主任</span><strong>{classes.length - assignedTeacherCount} 个</strong></div>
                <div><span>已设目标积分</span><strong>{targetConfiguredCount} 个</strong></div>
                <div><span>待补运营目标</span><strong>{classes.length - targetConfiguredCount} 个</strong></div>
              </div>
            </div>
            <div className="detail-card">
              <h4>年级分布</h4>
              <div className="mini-list">
                {gradeOverview.slice(0, 4).map(([gradeName, item]) => (
                  <div className="mini-list-item" key={gradeName}>
                    <div>
                      <strong>{gradeName}</strong>
                      <span>{item.classCount} 个班，{item.studentCount} 名学生</span>
                    </div>
                    <b>{item.enabledCount}/{item.classCount} 展示</b>
                  </div>
                ))}
                {gradeOverview.length === 0 ? (
                  <div className="mini-list-item">
                    <div>
                      <strong>暂无班级数据</strong>
                      <span>创建班级后，这里会展示年级层面的组织分布。</span>
                    </div>
                    <b>待建立</b>
                  </div>
                ) : null}
              </div>
            </div>
            <div className="detail-card">
              <h4>治理待办</h4>
              <div className="mini-list">
                {governanceWatchList.map((item) => {
                  const issues = [
                    !item.homeroomTeacher ? "待配班主任" : null,
                    item.displayStatus !== "enabled" ? "未开启展示" : null,
                    item.targetScore === null || item.targetScore === undefined ? "未设目标积分" : null,
                  ].filter(Boolean).join(" · ");
                  return (
                    <div className="mini-list-item" key={item.id}>
                      <div>
                        <strong>{item.gradeName} {item.name}</strong>
                        <span>{issues || "治理状态正常"}</span>
                      </div>
                      <b>{item.studentCount} 人</b>
                    </div>
                  );
                })}
                {governanceWatchList.length === 0 ? (
                  <div className="mini-list-item">
                    <div>
                      <strong>当前治理状态完整</strong>
                      <span>所有班级都已完成展示、班主任和目标积分的基础配置。</span>
                    </div>
                    <b>已完成</b>
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
            <div className="panel-title">
              {listTab === "class" ? "班级列表" : "大屏列表"}
            </div>
            <p className="page-desc">
              {listTab === "class"
                ? "查看班级基础信息、展示状态与班主任配置。"
                : "展示每个大屏终端绑定到的班级，以及当前 websocket 在线状态。"}
            </p>
          </div>
        </div>

        {allowViewDisplayTerminals ? (
          <div className="tabs">
            <button
              className={`tab${listTab === "class" ? " active" : ""}`}
              type="button"
              onClick={() => setListTab("class")}
            >
              班级列表
            </button>
            <button
              className={`tab${listTab === "display" ? " active" : ""}`}
              type="button"
              onClick={() => setListTab("display")}
            >
              大屏列表
            </button>
          </div>
        ) : null}

        {listTab === "class" ? (
          <>
            <div className="data-table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>{renderSortHeader("班级", "name")}</th>
                    <th>{renderSortHeader("年级", "gradeName")}</th>
                    <th>{renderSortHeader("班主任", "homeroomTeacher")}</th>
                    <th>{renderSortHeader("人数", "studentCount")}</th>
                    <th>{renderSortHeader("目标积分", "targetScore")}</th>
                    <th>{renderSortHeader("状态", "displayStatus")}</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {classPagination.pagedItems.map((row) => (
                    <tr key={row.id}>
                      <td>{row.name}</td>
                      <td>{row.gradeName}</td>
                      <td>{row.homeroomTeacher?.name ?? "-"}</td>
                      <td>{row.studentCount}</td>
                      <td>
                        {row.targetScore === null || row.targetScore === undefined
                          ? "未设置"
                          : `${row.targetScore} 分`}
                      </td>
                      <td>
                        <span
                          className={
                            row.displayStatus === "enabled"
                              ? "status-on"
                              : "status-off"
                          }
                        >
                          {row.displayStatus === "enabled" ? "展示中" : "未展示"}
                        </span>
                      </td>
                      <td>
                        <button
                          className="op-btn"
                          type="button"
                          onClick={() => openDetail(row)}
                        >
                          详情
                        </button>
                        {allowEdit ? (
                          <button
                            className="op-btn"
                            type="button"
                            onClick={() => openEdit(row)}
                          >
                            编辑
                          </button>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                  {filteredClasses.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="table-empty">
                        当前筛选条件下没有班级数据
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
            <TablePagination
              currentPage={classPagination.currentPage}
              pageSize={classPagination.pageSize}
              totalItems={classPagination.totalItems}
              totalPages={classPagination.totalPages}
              onPageChange={classPagination.setCurrentPage}
              onPageSizeChange={classPagination.setPageSize}
            />
          </>
        ) : (
          <>
            {displayTerminalsLoading ? (
              <div className="status-card">大屏列表加载中...</div>
            ) : null}
            {displayTerminalsError ? (
              <div className="status-card error">{displayTerminalsError}</div>
            ) : null}
            <div className="data-table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>终端名称</th>
                    <th>终端编码</th>
                    <th>绑定班级</th>
                    <th>班级展示状态</th>
                    <th>在线状态</th>
                    <th>最近在线</th>
                  </tr>
                </thead>
                <tbody>
                  {displayTerminalPagination.pagedItems.map((row) => (
                    <tr key={row.id}>
                      <td>{row.terminalName}</td>
                      <td>{row.terminalCode}</td>
                      <td>
                        {row.classInfo
                          ? `${row.classInfo.gradeName} ${row.classInfo.className}`
                          : "未绑定班级"}
                      </td>
                      <td>
                        {row.classInfo ? (
                          <span
                            className={
                              row.classInfo.displayStatus === "enabled"
                                ? "status-on"
                                : "status-off"
                            }
                          >
                            {row.classInfo.displayStatus === "enabled"
                              ? "展示中"
                              : "未展示"}
                          </span>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td>
                        <span
                          className={
                            row.onlineStatus === "online" ? "status-on" : "status-off"
                          }
                        >
                          {row.onlineStatus === "online" ? "在线" : "离线"}
                        </span>
                      </td>
                      <td>{formatDateTime(row.lastOnlineAt)}</td>
                    </tr>
                  ))}
                  {!displayTerminalsLoading && displayTerminalPagination.totalItems === 0 ? (
                    <tr>
                      <td colSpan={6} className="table-empty">
                        当前没有可展示的大屏终端
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
            <TablePagination
              currentPage={displayTerminalPagination.currentPage}
              pageSize={displayTerminalPagination.pageSize}
              totalItems={displayTerminalPagination.totalItems}
              totalPages={displayTerminalPagination.totalPages}
              onPageChange={displayTerminalPagination.setCurrentPage}
              onPageSizeChange={displayTerminalPagination.setPageSize}
            />
          </>
        )}
      </div>

      {allowEdit && (showCreate || editingClass) ? (
        <Modal
          title={editingClass ? (isHomeroomTeacher ? "编辑本班运营信息" : "编辑班级") : "新建班级"}
          subtitle=""
          onClose={closeModal}
        >
          <form className="form-grid" onSubmit={handleSubmit}>
            <label className="span-2">
              <span>班级名称</span>
              <input
                value={form.name}
                disabled={isHomeroomTeacher}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, name: event.target.value }))
                }
              />
            </label>
            <label>
              <span>所属年级</span>
              <select
                value={form.gradeName}
                disabled={isHomeroomTeacher}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    gradeName: event.target.value,
                  }))
                }
              >
                <option value="">请选择年级</option>
                {formGradeOptions.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>展示状态</span>
              <select
                value={form.displayStatus}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    displayStatus: event.target.value,
                  }))
                }
              >
                <option value="enabled">开启班级展示</option>
                <option value="disabled">暂不在大屏展示</option>
              </select>
            </label>
            <label>
              <span>所属学期</span>
              <input
                value={editingClass ? `${editingClass.semesterId} 学期` : currentSemester?.name ?? "请先到系统设置中配置当前学期"}
                readOnly
              />
            </label>
            <label>
              <span>班主任</span>
              <select
                value={form.homeroomTeacherId}
                disabled={isHomeroomTeacher}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    homeroomTeacherId: event.target.value,
                  }))
                }
              >
                <option value="">暂不指定</option>
                {teacherOptions.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}（{item.username}）
                  </option>
                ))}
              </select>
              <small className="field-hint">
                {isHomeroomTeacher
                  ? "班主任账号由学校管理员统一分配，这里只保留查看。"
                  : teacherOptions.length > 0
                  ? "可直接选择已创建的班主任账号。"
                  : "暂无可选班主任，请先到账号管理中创建教师账号。"}
              </small>
            </label>
            <label>
              <span>班级目标积分</span>
              <input
                value={form.targetScore}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    targetScore: event.target.value,
                  }))
                }
              />
              <small className="field-hint">
                用于展示这个班级本学期想达到的积分目标，不填也可以。
              </small>
            </label>
            <label className="span-2">
              <span>班级口号</span>
              <input
                value={form.slogan}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, slogan: event.target.value }))
                }
              />
            </label>
            {submitError ? (
              <div className="status-card error span-2">{submitError}</div>
            ) : null}
            <div className="form-actions span-2">
              <button
                type="button"
                className="ghost-button"
                onClick={() => closeModal()}
                disabled={submitting}
              >
                取消
              </button>
              <button
                type="submit"
                className="toolbar-button"
                disabled={submitting}
              >
                {submitting
                  ? "提交中..."
                  : editingClass
                    ? "保存修改"
                    : "创建班级"}
              </button>
            </div>
          </form>
        </Modal>
      ) : null}

      {selectedClass ? (
        <Modal
          title={`${selectedClass.name} · 班级档案`}
          subtitle="按原型查看班级基础信息、展示状态与运营建议"
          onClose={closeModal}
        >
          <div className="detail-grid">
            <div className="detail-card">
              <h4>基础信息</h4>
              <div className="detail-list">
                <div>
                  <span>班级名称</span>
                  <strong>{selectedClass.name}</strong>
                </div>
                <div>
                  <span>年级</span>
                  <strong>{selectedClass.gradeName}</strong>
                </div>
                <div>
                  <span>所属学期</span>
                  <strong>{currentSemester?.name ?? "当前学期"}</strong>
                </div>
                <div>
                  <span>班级口号</span>
                  <strong>{selectedClass.slogan ?? "待补充"}</strong>
                </div>
              </div>
            </div>
            <div className="detail-card">
              <h4>管理与展示</h4>
              <div className="detail-list">
                <div>
                  <span>班主任</span>
                  <strong>
                    {selectedClass.homeroomTeacher?.name ?? "待配置"}
                  </strong>
                </div>
                <div>
                  <span>展示状态</span>
                  <strong>
                    {selectedClass.displayStatus === "enabled"
                      ? "已在大屏展示"
                      : "暂未展示"}
                  </strong>
                </div>
                <div>
                  <span>目标积分</span>
                  <strong>{selectedClass.targetScore ?? "未设置"}</strong>
                </div>
                <div>
                  <span>学生人数</span>
                  <strong>{selectedClass.studentCount}</strong>
                </div>
              </div>
            </div>
            <div className="detail-card">
              <h4>成长概览</h4>
              <div className="detail-list">
                <div>
                  <span>当前总积分</span>
                  <strong>{selectedClass.currentScoreTotal}</strong>
                </div>
                <div>
                  <span>累计总积分</span>
                  <strong>{selectedClass.totalScoreTotal}</strong>
                </div>
                <div>
                  <span>目标完成率</span>
                  <strong>
                    {selectedClass.targetScore
                      ? `${Math.min(
                          100,
                          Math.round((selectedClass.currentScoreTotal / selectedClass.targetScore) * 100),
                        )}%`
                      : "未设置目标"}
                  </strong>
                </div>
                <div>
                  <span>距离目标</span>
                  <strong>
                    {selectedClass.targetScore
                      ? Math.max(
                          selectedClass.targetScore -
                            selectedClass.currentScoreTotal,
                          0,
                        )
                      : "未设置目标"}
                  </strong>
                </div>
              </div>
            </div>
            <div className="detail-card">
              <h4>运营建议</h4>
              <div className="settings-note-list">
                <div className="settings-note">
                  建议把班级目标积分与展示端榜单阈值保持一致，避免汇报页口径不统一。
                </div>
                <div className="settings-note">
                  若班级已接入展示大屏，推荐同步检查班主任与设备登录状态。
                </div>
                <div className="settings-note">
                  学生数量发生变更后，建议同步做一次学生导入复核，保持班级看板准确。
                </div>
              </div>
            </div>
            <div className="detail-card span-2">
              <h4>联动入口</h4>
              <div className="form-actions" style={{ justifyContent: "flex-start", marginTop: 0 }}>
                {selectedClass.homeroomTeacher ? (
                  <button
                    className="ghost-button"
                    type="button"
                    onClick={() =>
                      navigateWithQuery("/teachers", {
                        userId: selectedClass.homeroomTeacher?.id,
                        returnTo: buildClassesLocation(selectedClass.id),
                        returnLabel: "返回班级管理",
                      })
                    }
                  >
                    查看班主任详情
                  </button>
                ) : null}
                {selectedClass.homeroomTeacher ? (
                  <button
                    className="ghost-button"
                    type="button"
                    onClick={() =>
                      navigateWithQuery("/organization", {
                        activeTab: "accounts",
                        userId: selectedClass.homeroomTeacher?.id,
                        returnTo: buildClassesLocation(selectedClass.id),
                        returnLabel: "返回班级管理",
                      })
                    }
                  >
                    查看班主任账号
                  </button>
                ) : null}
                <button
                  className="ghost-button"
                  type="button"
                  onClick={() =>
                    navigateWithQuery("/teachers", {
                      keyword: selectedClass.name,
                      returnTo: buildClassesLocation(selectedClass.id),
                      returnLabel: "返回班级管理",
                    })
                  }
                >
                  查看相关教师
                </button>
              </div>
            </div>
          </div>
        </Modal>
      ) : null}
    </Shell>
  );
}

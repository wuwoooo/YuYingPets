import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Modal } from "../components/Modal";
import { PickerInput } from "../components/PickerInput";
import { Shell } from "../components/Shell";
import { TablePagination } from "../components/TablePagination";
import { useConfirmDialog } from "../context/ConfirmDialogContext";
import { usePagination } from "../hooks/usePagination";
import { HonorGrantModal } from "../components/HonorGrantModal";
import type {
  AdminClass,
  ClassUpsertPayload,
  DisplayTerminal,
  GradeConfig,
  Honor,
  HonorRecord,
  PermissionUser,
  SessionUser,
  SystemSettings,
} from "../lib/api";
import { adminApi } from "../lib/api";
import { canGrantClassHonors } from "../utils/adminPermissions";
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
  honors: Honor[];
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

type DisplayTerminalSortKey =
  | "terminalName"
  | "terminalCode"
  | "boundClass"
  | "displayStatus"
  | "onlineStatus"
  | "lastOnlineAt";

type SortDirection = "asc" | "desc";

function normalizeClassText(value: string) {
  return value.trim().toLowerCase();
}

export function ClassesPage({
  token,
  user,
  classes,
  honors,
  loading,
  error,
  onSaved,
}: ClassesPageProps) {
  const allowGrantClassHonors = canGrantClassHonors(user?.roleCode);
  const [showClassHonorGrant, setShowClassHonorGrant] = useState(false);
  const [classHonorRecords, setClassHonorRecords] = useState<HonorRecord[]>([]);
  const [classHonorsLoading, setClassHonorsLoading] = useState(false);
  const [classHonorGrantSuccess, setClassHonorGrantSuccess] = useState<string | null>(null);
  const { confirm } = useConfirmDialog();
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
  const [displaySortConfig, setDisplaySortConfig] = useState<{
    key: DisplayTerminalSortKey;
    direction: SortDirection;
  } | null>(null);
  const [pageLoading, setPageLoading] = useState(false);
  const [currentSemester, setCurrentSemester] = useState<
    SystemSettings["semester"] | null
  >(null);
  const [gradeConfigs, setGradeConfigs] = useState<GradeConfig[]>([]);
  const [teacherOptions, setTeacherOptions] = useState<PermissionUser[]>([]);
  const [displayTerminals, setDisplayTerminals] = useState<DisplayTerminal[]>([]);
  const [displayTerminalsLoading, setDisplayTerminalsLoading] = useState(false);
  const [displayTerminalsError, setDisplayTerminalsError] = useState<string | null>(null);
  const [deletingDisplayTerminalId, setDeletingDisplayTerminalId] = useState<number | null>(null);
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
    const classIds = searchParams.get("classIds");
    const teacherStatus = searchParams.get("teacherStatus");
    const nextGradeName = searchParams.get("gradeName");
    const nextStatusFilter = searchParams.get("statusFilter");
    const nextFocusFilter = searchParams.get("focusFilter");
    const classId = searchParams.get("classId");
    const nextStatsView = searchParams.get("statsView");
    if (keyword) setSearchKeyword(keyword);
    if (classIds) setSearchKeyword("");
    if (nextGradeName) setGradeFilter(nextGradeName);
    if (nextStatusFilter === "enabled" || nextStatusFilter === "disabled" || nextStatusFilter === "all") {
      setStatusFilter(nextStatusFilter);
    }
    if (nextFocusFilter === "governance_pending") setFocusFilter("governance_pending");
    if (teacherStatus === "unassigned") setStatusFilter("all");
    if (nextStatsView === "grade" || nextStatsView === "class" || nextStatsView === "governance") {
      setStatsView(nextStatsView);
    }
    /** 工作台深链：直达编辑表单，避免仅用 classId 先打开班级档案与本弹层并存 */
    const editRequested = searchParams.get("edit") === "1";
    const idNum = classId ? Number(classId) : NaN;
    const matchedClass =
      Number.isFinite(idNum) && idNum > 0
        ? classes.find((item) => item.id === idNum)
        : undefined;
    if (editRequested && matchedClass && allowEdit) {
      setSelectedClass(null);
      setShowCreate(false);
      setSubmitError(null);
      setEditingClass(matchedClass);
      setForm(createClassForm(defaultSemesterId, matchedClass));
      const params = new URLSearchParams(searchParams);
      params.delete("edit");
      params.delete("classId");
      setSearchParams(params, { replace: true });
      return;
    }
    if (classId && matchedClass) {
      setSelectedClass(matchedClass);
    }
  }, [allowEdit, classes, defaultSemesterId, searchParams, setSearchParams]);

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

  const isCountdownPending = (row: AdminClass) => {
    if (!row.countdownTitle?.trim() || !row.countdownDeadlineAt) return true;
    const deadlineAt = new Date(row.countdownDeadlineAt).getTime();
    return Number.isNaN(deadlineAt) || deadlineAt <= Date.now();
  };
  const buildGovernanceIssues = (row: AdminClass) =>
    [
      !row.homeroomTeacher ? "待配班主任" : null,
      row.displayStatus !== "enabled" ? "未开启展示" : null,
      row.targetScore === null || row.targetScore === undefined ? "未设目标积分" : null,
      isCountdownPending(row) ? "倒计时待设置" : null,
    ].filter(Boolean);
  const getGovernanceRiskScore = (row: AdminClass) => buildGovernanceIssues(row).length;

  const filteredClasses = useMemo(() => {
    const keyword = normalizeKeyword(searchKeyword);
    const classIdFilter = new Set(
      (searchParams.get("classIds") ?? "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
        .map((item) => Number(item))
        .filter((item) => Number.isFinite(item)),
    );
    return classes.filter((row) => {
      const matchesClassIds = classIdFilter.size === 0 || classIdFilter.has(row.id);
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
        getGovernanceRiskScore(row) > 0;
      const matchesTeacherStatus =
        searchParams.get("teacherStatus") !== "unassigned" || !row.homeroomTeacher;
      return matchesClassIds && matchesKeyword && matchesGrade && matchesStatus && matchesFocus && matchesTeacherStatus;
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
  const filteredDisplayTerminals = useMemo(() => {
    const keyword = normalizeKeyword(searchKeyword);
    return displayTerminals.filter((row) => {
      const boundClassLabel = row.classInfo
        ? `${row.classInfo.gradeName}${row.classInfo.className}`
        : "";
      const onlineStatusLabel = row.onlineStatus === "online" ? "在线" : "离线";
      const displayStatusLabel = row.classInfo
        ? row.classInfo.displayStatus === "enabled"
          ? "展示中"
          : "未展示"
        : "未绑定";
      const matchesKeyword =
        !keyword ||
        normalizeKeyword(row.terminalName).includes(keyword) ||
        normalizeKeyword(row.terminalCode).includes(keyword) ||
        normalizeKeyword(boundClassLabel).includes(keyword) ||
        normalizeKeyword(row.classInfo?.gradeName ?? "").includes(keyword) ||
        normalizeKeyword(row.classInfo?.className ?? "").includes(keyword) ||
        normalizeKeyword(onlineStatusLabel).includes(keyword) ||
        normalizeKeyword(displayStatusLabel).includes(keyword);
      const matchesGrade =
        gradeFilter === "all" || row.classInfo?.gradeName === gradeFilter;
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "enabled"
          ? row.onlineStatus === "online"
          : row.onlineStatus !== "online");
      return matchesKeyword && matchesGrade && matchesStatus;
    });
  }, [displayTerminals, gradeFilter, searchKeyword, statusFilter]);
  const classPagination = usePagination(
    sortedClasses,
    `${searchKeyword}|${gradeFilter}|${statusFilter}|${focusFilter}|${sortConfig?.key ?? "default"}|${sortConfig?.direction ?? "default"}|${classes.length}`,
  );
  const sortedDisplayTerminals = useMemo(() => {
    const getBoundClassLabel = (row: DisplayTerminal) =>
      row.classInfo ? `${row.classInfo.gradeName}${row.classInfo.className}` : "";
    const getDisplayStatusLabel = (row: DisplayTerminal) => {
      if (!row.classInfo) return "未绑定";
      return row.classInfo.displayStatus === "enabled" ? "展示中" : "未展示";
    };
    const getLastOnlineTime = (row: DisplayTerminal) => {
      if (!row.lastOnlineAt) return null;
      const time = new Date(row.lastOnlineAt).getTime();
      return Number.isNaN(time) ? null : time;
    };
    const defaultCompare = (left: DisplayTerminal, right: DisplayTerminal) => {
      if (left.onlineStatus !== right.onlineStatus) {
        return left.onlineStatus === "online" ? -1 : 1;
      }
      const leftName = `${getBoundClassLabel(left)}${left.terminalName}`;
      const rightName = `${getBoundClassLabel(right)}${right.terminalName}`;
      return leftName.localeCompare(rightName, "zh-CN", { numeric: true });
    };

    if (!displaySortConfig) {
      return [...filteredDisplayTerminals].sort(defaultCompare);
    }

    const directionFactor = displaySortConfig.direction === "asc" ? 1 : -1;
    const compareText = (left: string, right: string) =>
      left.localeCompare(right, "zh-CN", { numeric: true }) * directionFactor;
    const compareOptionalTimestamp = (left: number | null, right: number | null) => {
      const leftMissing = left === null;
      const rightMissing = right === null;
      if (leftMissing && rightMissing) return 0;
      if (leftMissing) return 1;
      if (rightMissing) return -1;
      return (left - right) * directionFactor;
    };

    return [...filteredDisplayTerminals].sort((left, right) => {
      switch (displaySortConfig.key) {
        case "terminalName":
          return (
            compareText(left.terminalName, right.terminalName) ||
            compareText(left.terminalCode, right.terminalCode)
          );
        case "terminalCode":
          return (
            compareText(left.terminalCode, right.terminalCode) ||
            compareText(left.terminalName, right.terminalName)
          );
        case "boundClass":
          return (
            compareText(getBoundClassLabel(left), getBoundClassLabel(right)) ||
            compareText(left.terminalName, right.terminalName)
          );
        case "displayStatus":
          return (
            compareText(getDisplayStatusLabel(left), getDisplayStatusLabel(right)) ||
            compareText(getBoundClassLabel(left), getBoundClassLabel(right))
          );
        case "onlineStatus":
          return (
            compareText(
              left.onlineStatus === "online" ? "在线" : "离线",
              right.onlineStatus === "online" ? "在线" : "离线",
            ) || compareText(left.terminalName, right.terminalName)
          );
        case "lastOnlineAt":
          return (
            compareOptionalTimestamp(getLastOnlineTime(left), getLastOnlineTime(right)) ||
            compareText(left.terminalName, right.terminalName)
          );
        default:
          return 0;
      }
    });
  }, [displaySortConfig, filteredDisplayTerminals]);
  const displayTerminalPagination = usePagination(
    sortedDisplayTerminals,
    `display|${searchKeyword}|${gradeFilter}|${statusFilter}|${displaySortConfig?.key ?? "default"}|${displaySortConfig?.direction ?? "default"}|${sortedDisplayTerminals.length}|${sortedDisplayTerminals.map((item) => `${item.id}:${item.onlineStatus}:${item.classId ?? "none"}`).join("|")}`,
  );
  const hasActiveListFilters =
    searchKeyword.trim() || gradeFilter !== "all" || statusFilter !== "all";
  const hasActiveClassFilters = hasActiveListFilters || focusFilter !== "all";
  const enabledClassCount = classes.filter((row) => row.displayStatus === "enabled").length;
  const disabledClassCount = classes.filter((row) => row.displayStatus !== "enabled").length;
  const assignedTeacherCount = classes.filter((row) => row.homeroomTeacher?.id).length;
  const targetConfiguredCount = classes.filter((row) => row.targetScore !== null && row.targetScore !== undefined).length;
  const countdownReadyCount = classes.filter((row) => !isCountdownPending(row)).length;
  const governancePendingCount = classes.filter((row) => getGovernanceRiskScore(row) > 0).length;
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
    .filter((row) => getGovernanceRiskScore(row) > 0)
    .sort((a, b) => {
      const aRisk = getGovernanceRiskScore(a);
      const bRisk = getGovernanceRiskScore(b);
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
      governanceStatus: buildGovernanceIssues(row).join(" · ") || "配置完整",
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

  const reloadClassHonorRecords = useCallback(async (classId: number) => {
    setClassHonorsLoading(true);
    try {
      const response = await adminApi.honorRecords(token, {
        targetType: "class",
        classId,
      });
      setClassHonorRecords(
        [...response.data].sort(
          (left, right) => new Date(right.grantedAt).getTime() - new Date(left.grantedAt).getTime(),
        ),
      );
    } catch {
      setClassHonorRecords([]);
    } finally {
      setClassHonorsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!selectedClass) {
      setClassHonorRecords([]);
      setClassHonorGrantSuccess(null);
      return;
    }
    setClassHonorGrantSuccess(null);
    void reloadClassHonorRecords(selectedClass.id);
  }, [reloadClassHonorRecords, selectedClass?.id]);

  function closeModal(force = false) {
    if (submitting && !force) return;
    setShowCreate(false);
    setEditingClass(null);
    setSelectedClass(null);
    setSubmitError(null);
    setClassHonorGrantSuccess(null);
    setClassHonorRecords([]);
    if (selectedClass) {
      const params = new URLSearchParams(searchParams);
      params.delete("classId");
      setSearchParams(params, { replace: true });
    }
  }

  function buildClassesLocation(selectedClassId?: number) {
    const params = new URLSearchParams();
    if (searchKeyword.trim()) params.set("keyword", searchKeyword.trim());
    const classIds = searchParams.get("classIds");
    if (classIds) params.set("classIds", classIds);
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
    const params = new URLSearchParams(searchParams);
    params.delete("classIds");
    params.delete("keyword");
    params.delete("gradeName");
    params.delete("statusFilter");
    params.delete("focusFilter");
    setSearchParams(params, { replace: true });
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

  function toggleDisplaySort(key: DisplayTerminalSortKey) {
    setDisplaySortConfig((prev) => {
      if (!prev || prev.key !== key) {
        return { key, direction: "asc" };
      }
      return { key, direction: prev.direction === "asc" ? "desc" : "asc" };
    });
  }

  function renderDisplaySortHeader(label: string, key: DisplayTerminalSortKey) {
    const active = displaySortConfig?.key === key;
    const indicator = active ? (displaySortConfig.direction === "asc" ? "↑" : "↓") : "↕";
    return (
      <button
        className={`table-sort-button${active ? " active" : ""}`}
        type="button"
        onClick={() => toggleDisplaySort(key)}
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
      const countdownTitle = form.countdownTitle.trim();
      const countdownDeadlineText = form.countdownDeadlineAt.trim();
      const semesterIdNumber = Number(semesterId);

      if (!editingClass && (!semesterId || !gradeName || !className)) {
        throw new Error("请填写完整的班级基础信息");
      }

      if (targetScoreText && (!/^\d+$/.test(targetScoreText) || Number(targetScoreText) < 0)) {
        throw new Error("班级目标积分必须是大于等于 0 的整数");
      }

      let countdownPayload: Pick<ClassUpsertPayload, "countdownTitle" | "countdownDeadlineAt"> = {
        countdownTitle: null,
        countdownDeadlineAt: null,
      };
      if (countdownTitle && countdownDeadlineText) {
        const deadlineAt = new Date(countdownDeadlineText);
        if (Number.isNaN(deadlineAt.getTime())) {
          throw new Error("倒计时截止时间格式不正确");
        }
        countdownPayload = {
          countdownTitle,
          countdownDeadlineAt: deadlineAt.toISOString(),
        };
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
              ...countdownPayload,
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
              ...countdownPayload,
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
          ...countdownPayload,
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

  async function deleteDisplayTerminal(row: DisplayTerminal) {
    const confirmed = await confirm({
      title: "删除大屏终端",
      message:
        `确认删除终端「${row.terminalName}」吗？\n` +
        `${row.classInfo ? `当前绑定班级：${row.classInfo.gradeName} ${row.classInfo.className}` : "当前未绑定班级"}`,
      confirmLabel: "确认删除",
      tone: "danger",
    });
    if (!confirmed) return;

    try {
      setSubmitError(null);
      setSubmitSuccess(null);
      setDeletingDisplayTerminalId(row.id);
      await adminApi.deleteDisplayTerminal(token, row.id);
      setDisplayTerminals((current) => current.filter((item) => item.id !== row.id));
      setSubmitSuccess(`终端「${row.terminalName}」已删除`);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "大屏终端删除失败");
    } finally {
      setDeletingDisplayTerminalId(null);
    }
  }

  return (
    <Shell
      title={pageTitle}
      subtitle={pageSubtitle}
      loading={loading || pageLoading}
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
      <div className="admin-list-desk">
      <div className="page-header admin-list-page-header">
        <div>
          <h2>{pageTitle}</h2>
          <p className="page-desc">
            {isHomeroomTeacher
              ? "班主任可在这里维护本班口号、目标积分，并进入学生管理和学生评价。"
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
              placeholder={
                listTab === "display"
                  ? "搜索终端名称、编码、绑定班级或在线状态..."
                  : "搜索班级名称..."
              }
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
            <option value="enabled">{listTab === "display" ? "在线" : "展示中"}</option>
            <option value="disabled">{listTab === "display" ? "离线" : "未展示"}</option>
          </select>
          {allowCreate ? (
            <button className="btn btn-primary" onClick={openCreate}>
              + 新建班级
            </button>
          ) : null}
        </div>
      </div>

      {!isHomeroomTeacher ? (
      <div className="std-metric-grid std-metric-grid--4">
        <button type="button" className="std-metric-card std-metric-card--blue std-metric-card--action" onClick={resetListFilters}>
          <div className="std-metric-card__top">
            <div className="std-metric-card__icon"><span className="sec-metric-glyph">总</span></div>
            <span className="std-metric-card__label">班级总数</span>
          </div>
          <div className="std-metric-card__value">{classes.length}</div>
          <div className="std-metric-card__hint">当前纳入系统管理的班级数量</div>
        </button>
        <button
          type="button"
          className="std-metric-card std-metric-card--green std-metric-card--action"
          onClick={() => {
            setStatusFilter("enabled");
            setFocusFilter("all");
          }}
        >
          <div className="std-metric-card__top">
            <div className="std-metric-card__icon"><span className="sec-metric-glyph">展</span></div>
            <span className="std-metric-card__label">展示中班级</span>
          </div>
          <div className="std-metric-card__value">{enabledClassCount}</div>
          <div className="std-metric-card__hint">已接入展示端的大屏班级数量</div>
        </button>
        <button
          type="button"
          className="std-metric-card std-metric-card--purple std-metric-card--action"
          onClick={() => {
            setStatusFilter("all");
            setFocusFilter("governance_pending");
          }}
        >
          <div className="std-metric-card__top">
            <div className="std-metric-card__icon"><span className="sec-metric-glyph">治</span></div>
            <span className="std-metric-card__label">待治理班级</span>
          </div>
          <div className="std-metric-card__value">{governancePendingCount}</div>
          <div className="std-metric-card__hint">待补齐展示、班主任或运营配置</div>
        </button>
        <button
          type="button"
          className={`std-metric-card std-metric-card--amber std-metric-card--action${showOverview ? " active" : ""}`}
          onClick={() => setShowOverview((prev) => !prev)}
        >
          <div className="std-metric-card__top">
            <div className="std-metric-card__icon"><span className="sec-metric-glyph">析</span></div>
            <span className="std-metric-card__label">{showOverview ? "收起分析" : "更多分析"}</span>
          </div>
          <div className="std-metric-card__value std-metric-card__value--text">
            {classes.length - assignedTeacherCount} 班待配班主任
          </div>
          <div className="std-metric-card__hint">展开查看年级分布与治理待办</div>
        </button>
      </div>
      ) : null}

      {!isHomeroomTeacher && showOverview ? (
        <div className="panel summary-panel">
          {hasActiveClassFilters ? (
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
                <div><span>有效倒计时</span><strong>{countdownReadyCount} 个</strong></div>
                <div><span>倒计时待设置</span><strong>{classes.length - countdownReadyCount} 个</strong></div>
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
                  const issues = buildGovernanceIssues(item).join(" · ");
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
                      <span>所有班级都已完成展示、班主任、目标积分和有效倒计时配置。</span>
                    </div>
                    <b>已完成</b>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <div className="panel admin-list-panel security-accounts-panel">
        <div className="security-panel-head">
          {allowViewDisplayTerminals ? (
            <div className="sec-nav-tabs">
              <button
                className={`sec-nav-tab${listTab === "class" ? " active" : ""}`}
                type="button"
                onClick={() => setListTab("class")}
              >
                班级列表
              </button>
              <button
                className={`sec-nav-tab${listTab === "display" ? " active" : ""}`}
                type="button"
                onClick={() => setListTab("display")}
              >
                大屏列表
              </button>
            </div>
          ) : (
            <div className="panel-title">班级列表</div>
          )}
          <p className="page-desc">
            {listTab === "class"
              ? "查看班级基础信息、展示状态与班主任配置。"
              : "展示每个大屏终端绑定到的班级，以及当前 websocket 在线状态。"}
          </p>
        </div>

        {listTab === "class" ? (
          <>
            <div className="data-table-wrap security-table-wrap">
              <table className="data-table security-table">
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
                      <td className="security-name-cell">{row.name}</td>
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
            <div className="data-table-wrap security-table-wrap">
              <table className="data-table security-table">
                <thead>
                  <tr>
                    <th>{renderDisplaySortHeader("终端名称", "terminalName")}</th>
                    <th>{renderDisplaySortHeader("终端编码", "terminalCode")}</th>
                    <th>{renderDisplaySortHeader("绑定班级", "boundClass")}</th>
                    <th>{renderDisplaySortHeader("班级展示状态", "displayStatus")}</th>
                    <th>{renderDisplaySortHeader("在线状态", "onlineStatus")}</th>
                    <th>{renderDisplaySortHeader("最近在线", "lastOnlineAt")}</th>
                    <th>操作</th>
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
                      <td>
                        <button
                          type="button"
                          className="op-btn op-btn--danger"
                          onClick={() => void deleteDisplayTerminal(row)}
                          disabled={deletingDisplayTerminalId === row.id}
                        >
                          {deletingDisplayTerminalId === row.id ? "删除中..." : "删除"}
                        </button>
                      </td>
                    </tr>
                  ))}
                  {!displayTerminalsLoading && displayTerminalPagination.totalItems === 0 ? (
                    <tr>
                      <td colSpan={7} className="table-empty">
                        {hasActiveListFilters
                          ? "当前筛选条件下没有大屏终端"
                          : "当前没有可展示的大屏终端"}
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
            <label>
              <span>倒计时标题</span>
              <input
                value={form.countdownTitle}
                placeholder="例如：距离期末表彰"
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    countdownTitle: event.target.value,
                  }))
                }
              />
              <small className="field-hint">
                标题和截止时间都填写后，班级大屏才会显示倒计时。
              </small>
            </label>
            <label>
              <span>倒计时截止时间</span>
              <PickerInput
                type="datetime-local"
                value={form.countdownDeadlineAt}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    countdownDeadlineAt: event.target.value,
                  }))
                }
              />
              <small className="field-hint">
                清空标题或时间即可关闭该班倒计时。
              </small>
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
          title={`${selectedClass.gradeName}${selectedClass.name}`}
          subtitle="班级档案"
          onClose={closeModal}
        >
          {(() => {
            const targetScore = selectedClass.targetScore ?? 0;
            const targetProgress =
              targetScore > 0
                ? Math.min(100, Math.round((selectedClass.currentScoreTotal / targetScore) * 100))
                : null;
            const scoreGap =
              targetScore > 0 ? Math.max(targetScore - selectedClass.currentScoreTotal, 0) : null;
            const displayEnabled = selectedClass.displayStatus === "enabled";

            return (
              <div className="class-archive">
                {classHonorGrantSuccess ? (
                  <div className="class-archive-alert success">{classHonorGrantSuccess}</div>
                ) : null}

                <section className="class-archive-metrics" aria-label="班级关键指标">
                  <div className="class-archive-metric">
                    <span>学生人数</span>
                    <strong>{selectedClass.studentCount}</strong>
                  </div>
                  <div className="class-archive-metric">
                    <span>当前积分</span>
                    <strong>{selectedClass.currentScoreTotal.toLocaleString("zh-CN")}</strong>
                  </div>
                  <div className="class-archive-metric">
                    <span>目标完成</span>
                    <strong>{targetProgress !== null ? `${targetProgress}%` : "未设置"}</strong>
                  </div>
                  <div className="class-archive-metric accent">
                    <span>集体荣誉</span>
                    <strong>{classHonorsLoading ? "…" : classHonorRecords.length}</strong>
                  </div>
                </section>

                <section className="class-archive-columns">
                  <div className="class-archive-panel">
                    <h4>档案信息</h4>
                    <dl className="class-archive-facts">
                      <div>
                        <dt>班级</dt>
                        <dd>{selectedClass.name}</dd>
                      </div>
                      <div>
                        <dt>年级</dt>
                        <dd>{selectedClass.gradeName}</dd>
                      </div>
                      <div>
                        <dt>学期</dt>
                        <dd>{currentSemester?.name ?? "当前学期"}</dd>
                      </div>
                      <div>
                        <dt>班主任</dt>
                        <dd>{selectedClass.homeroomTeacher?.name ?? "待配置"}</dd>
                      </div>
                      <div>
                        <dt>展示状态</dt>
                        <dd>
                          <span className={`class-archive-tag${displayEnabled ? " on" : ""}`}>
                            {displayEnabled ? "大屏展示中" : "暂未展示"}
                          </span>
                        </dd>
                      </div>
                      <div className="span-2">
                        <dt>班级口号</dt>
                        <dd>{selectedClass.slogan?.trim() || "待补充"}</dd>
                      </div>
                    </dl>
                  </div>

                  <div className="class-archive-panel">
                    <h4>积分成长</h4>
                    {targetProgress !== null ? (
                      <div className="class-archive-progress">
                        <div className="class-archive-progress-head">
                          <span>目标 {targetScore.toLocaleString("zh-CN")} 分</span>
                          <strong>{targetProgress}%</strong>
                        </div>
                        <div className="class-archive-progress-track">
                          <i style={{ width: `${targetProgress}%` }} />
                        </div>
                        <p>距目标还差 {scoreGap?.toLocaleString("zh-CN")} 分</p>
                      </div>
                    ) : (
                      <p className="class-archive-muted">尚未设置班级目标积分</p>
                    )}
                    <dl className="class-archive-facts compact">
                      <div>
                        <dt>累计积分</dt>
                        <dd>{selectedClass.totalScoreTotal.toLocaleString("zh-CN")}</dd>
                      </div>
                      <div>
                        <dt>当前积分</dt>
                        <dd>{selectedClass.currentScoreTotal.toLocaleString("zh-CN")}</dd>
                      </div>
                    </dl>
                  </div>
                </section>

                <section className="class-archive-panel class-archive-panel--honors">
                  <div className="class-archive-panel-head">
                    <div>
                      <h4>集体荣誉</h4>
                      <p>{classHonorsLoading ? "加载中…" : `共 ${classHonorRecords.length} 项记录`}</p>
                    </div>
                    {allowGrantClassHonors ? (
                      <button
                        className="toolbar-button"
                        type="button"
                        onClick={() => setShowClassHonorGrant(true)}
                      >
                        颁发集体荣誉
                      </button>
                    ) : null}
                  </div>
                  {classHonorsLoading ? (
                    <div className="class-archive-honors-empty">荣誉记录加载中…</div>
                  ) : classHonorRecords.length > 0 ? (
                    <ul className="class-archive-honor-list">
                      {classHonorRecords.map((item) => (
                        <li key={item.id} className="class-archive-honor-item">
                          <div className="class-archive-honor-main">
                            <strong>{item.honorName}</strong>
                            <span>
                              {new Date(item.grantedAt).toLocaleString("zh-CN", {
                                year: "numeric",
                                month: "2-digit",
                                day: "2-digit",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                              {item.grantedByName ? ` · ${item.grantedByName}` : ""}
                            </span>
                          </div>
                          {item.remark ? <p>{item.remark}</p> : null}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="class-archive-honors-empty">暂无集体荣誉，可点击右上角颁发</div>
                  )}
                </section>

                <section className="class-archive-actions" aria-label="快捷操作">
                  <span className="class-archive-actions-label">快捷操作</span>
                  <div className="class-archive-actions-group">
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
                        班主任详情
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
                        班主任账号
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
                      相关教师
                    </button>
                  </div>
                </section>

                <details className="class-archive-tips">
                  <summary>运营建议</summary>
                  <ul>
                    <li>建议把班级目标积分与展示端榜单阈值保持一致，避免汇报口径不统一。</li>
                    <li>若班级已接入展示大屏，推荐同步检查班主任与设备在线状态。</li>
                    <li>学生人数变更后，建议复核学生导入，保持看板数据准确。</li>
                  </ul>
                </details>
              </div>
            );
          })()}
        </Modal>
      ) : null}
      {selectedClass && showClassHonorGrant ? (
        <HonorGrantModal
          token={token}
          target={{
            targetType: "class",
            classId: selectedClass.id,
            className: `${selectedClass.gradeName}${selectedClass.name}`,
          }}
          honors={honors}
          onClose={() => setShowClassHonorGrant(false)}
          onGranted={async () => {
            await onSaved();
            if (!selectedClass) return;
            await reloadClassHonorRecords(selectedClass.id);
            setClassHonorGrantSuccess(`集体荣誉已颁发至 ${selectedClass.gradeName}${selectedClass.name}`);
          }}
        />
      ) : null}
      </div>
    </Shell>
  );
}

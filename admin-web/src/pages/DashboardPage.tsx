import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAdminView } from "../context/AdminViewContext";
import { PresentationGlyph } from "../components/PresentationGlyph";
import { Shell } from "../components/Shell";
import { TeacherAcademicDeskInsights } from "../components/TeacherAcademicDeskInsights";
import { ruleSubjectLabelMap, resolveSubjectLabel } from "../constants/admin";
import { canManageAdminConfig, canViewSchoolPresentation, canManageDisplays } from "../utils/adminPermissions";
import type {
  AcademicDeskOverviewPayload,
  AdminClass,
  AdminStudent,
  AcademicExamListItem,
  AcademicScoreListRow,
  AnalyticsData,
  DisplayTerminal,
  HonorRecord,
  PermissionUser,
  RewardOrder,
  ScoreRecord,
  SchoolAcademicGrowthPayload,
  ScoreRule,
  TeacherWorkbenchContext,
} from "../lib/api";
import { adminApi } from "../lib/api";
import {
  buildAcademicGrowthSummary,
  type AcademicGrowthSummary,
} from "../utils/academicGrowth";
import {
  buildTeacherDeskAcademicBrief,
  mapDeskOverviewGradeBench,
} from "../utils/teacherDeskAcademicBrief";
import type { AdminState } from "../types/admin";

type DashboardPageProps = Omit<AdminState, "token"> & {
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
  return a.localeCompare(b, "zh-CN");
}

function isClassCountdownPending(classInfo: AdminClass | null | undefined) {
  if (!classInfo?.countdownTitle?.trim() || !classInfo.countdownDeadlineAt) {
    return true;
  }
  const deadlineAt = new Date(classInfo.countdownDeadlineAt).getTime();
  return Number.isNaN(deadlineAt) || deadlineAt <= Date.now();
}

async function copyTextWithFallback(text: string) {
  if (
    typeof navigator !== "undefined" &&
    navigator.clipboard &&
    typeof navigator.clipboard.writeText === "function"
  ) {
    await navigator.clipboard.writeText(text);
    return;
  }

  if (typeof document === "undefined") {
    throw new Error("clipboard unavailable");
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "true");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  textarea.style.pointerEvents = "none";
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();

  const copied = document.execCommand("copy");
  document.body.removeChild(textarea);
  if (!copied) {
    throw new Error("copy failed");
  }
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
  const location = useLocation();
  const { subjectViews, activeSubjectView, setActiveViewKey } = useAdminView();
  const isHomeroomTeacher = user?.roleCode === "homeroom_teacher";
  const isSubjectTeacher = user?.roleCode === "subject_teacher";
  const isTeacherDashboard = isHomeroomTeacher || isSubjectTeacher;
  const canViewGovernance = canManageAdminConfig(user?.roleCode);
  const [rankTab, setRankTab] = useState<"class" | "student" | "honor">(
    "class",
  );
  const [rankGradeName, setRankGradeName] = useState<string>("");
  const [presentSubmitting, setPresentSubmitting] = useState(false);
  const [presentMessage, setPresentMessage] = useState<string | null>(null);
  const [permissionUsers, setPermissionUsers] = useState<PermissionUser[]>([]);
  const [honorRecords, setHonorRecords] = useState<HonorRecord[]>([]);
  const [teacherRecentRecords, setTeacherRecentRecords] = useState<
    ScoreRecord[]
  >([]);
  const [teacherRewardOrders, setTeacherRewardOrders] = useState<RewardOrder[]>(
    [],
  );
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(
    null,
  );
  const [recentScoreRecords, setRecentScoreRecords] = useState<ScoreRecord[]>(
    [],
  );
  const [displayTerminals, setDisplayTerminals] = useState<DisplayTerminal[]>(
    [],
  );
  const [academicExams, setAcademicExams] = useState<AcademicExamListItem[]>(
    [],
  );
  const [academicScores, setAcademicScores] = useState<AcademicScoreListRow[]>(
    [],
  );
  const [schoolAcademicGrowth, setSchoolAcademicGrowth] =
    useState<SchoolAcademicGrowthPayload | null>(null);
  const [selectedAcademicExamId, setSelectedAcademicExamId] = useState<
    number | null
  >(null);
  /** 驾驶舱「班级积分对比」：当前选中年级的展示范围 */
  const [cockpitCompareGradeName, setCockpitCompareGradeName] =
    useState<string>("");
  const activeTeacherClassId = isSubjectTeacher
    ? (activeSubjectView?.classId ?? null)
    : null;
  const activeTeacherSubject = isSubjectTeacher
    ? (activeSubjectView?.subjectCode ?? "")
    : "";

  const [callQueueModalOpen, setCallQueueModalOpen] = useState(false);
  const [selectedCallGrade, setSelectedCallGrade] = useState<string>('');
  const [selectedCallClassId, setSelectedCallClassId] = useState<number | ''>('');
  const [selectedCallStudentIds, setSelectedCallStudentIds] = useState<number[]>([]);
  const [callLocation, setCallLocation] = useState('');
  const [classCallQueue, setClassCallQueue] = useState<any[]>([]);
  const [callSubmitting, setCallSubmitting] = useState(false);
  const [callMessage, setCallMessage] = useState<string | null>(null);

  const callGradeOptions = useMemo(() => {
    const grades = classes.map(c => c.gradeName).filter(Boolean);
    return Array.from(new Set(grades));
  }, [classes]);

  const filteredCallClasses = useMemo(() => {
    if (!selectedCallGrade) return classes;
    return classes.filter(c => c.gradeName === selectedCallGrade);
  }, [classes, selectedCallGrade]);

  const loadClassQueue = async (classId: number) => {
    try {
      const resp = await adminApi.callQueueList(token, classId);
      if (resp.code === 0) {
        setClassCallQueue(resp.data || []);
      }
    } catch (err) {
      console.error("加载排队列表失败", err);
    }
  };

  useEffect(() => {
    if (callQueueModalOpen && selectedCallClassId) {
      loadClassQueue(Number(selectedCallClassId));
    }
  }, [callQueueModalOpen, selectedCallClassId]);

  const openCallQueueModal = () => {
    setCallQueueModalOpen(true);
    setCallMessage(null);
    setCallLocation('');
    setSelectedCallStudentIds([]);
    if (primaryHomeroomClass) {
      setSelectedCallGrade(primaryHomeroomClass.gradeName || '');
      setSelectedCallClassId(primaryHomeroomClass.id);
    } else if (classes.length > 0) {
      setSelectedCallGrade(classes[0].gradeName || '');
      setSelectedCallClassId(classes[0].id);
    } else {
      setSelectedCallGrade('');
      setSelectedCallClassId('');
    }
  };

  const handleCreateCall = async () => {
    if (!selectedCallClassId) {
      setCallMessage("请选择班级");
      return;
    }
    if (selectedCallStudentIds.length === 0) {
      setCallMessage("请选择至少一名学生");
      return;
    }
    if (!callLocation.trim()) {
      setCallMessage("请输入叫号地点");
      return;
    }

    setCallSubmitting(true);
    setCallMessage(null);
    try {
      const res = await adminApi.createCallQueue(token, {
        classId: Number(selectedCallClassId),
        studentIds: selectedCallStudentIds,
        location: callLocation.trim(),
      });
      if (res.code === 0) {
        setCallMessage("呼叫发起成功！");
        setSelectedCallStudentIds([]);
        loadClassQueue(Number(selectedCallClassId));
      } else {
        setCallMessage(res.message || "呼叫发起失败");
      }
    } catch (err: any) {
      setCallMessage(err?.message || "呼叫服务异常");
    } finally {
      setCallSubmitting(false);
    }
  };

  const handleCancelCall = async (callId: number) => {
    try {
      const res = await adminApi.cancelCallQueue(token, callId);
      if (res.code === 0) {
        if (selectedCallClassId) {
          loadClassQueue(Number(selectedCallClassId));
        }
      } else {
        alert(res.message || "取消失败");
      }
    } catch (err: any) {
      alert(err?.message || "操作异常");
    }
  };

  const classStudents = useMemo(() => {
    if (!selectedCallClassId) return [];
    return students.filter(s => s.classId === Number(selectedCallClassId));
  }, [students, selectedCallClassId]);

  const renderCallQueueModal = () => {
    if (!callQueueModalOpen) return null;
    return (
      <div className="modal-backdrop" onClick={() => setCallQueueModalOpen(false)} style={{ zIndex: 9999 }}>
        <div className="modal-card cq-modal" onClick={(e) => e.stopPropagation()}>
          {/* 深色顶栏 */}
          <div className="cq-modal-header">
            <div className="cq-modal-header-left">
              <span className="cq-modal-icon">
                <svg viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>
              </span>
              <div>
                <h3 className="cq-modal-title">大屏叫号工作台</h3>
                <p className="cq-modal-subtitle">选择班级与学生，发起大屏闪烁通知</p>
              </div>
            </div>
            <button type="button" className="cq-modal-close" onClick={() => setCallQueueModalOpen(false)}>×</button>
          </div>

          {/* 双栏内容区 */}
          <div className="cq-modal-body">
            {/* 左侧：发起呼叫表单 */}
            <div className="cq-form-panel">
              <div className="cq-section-title">
                <span className="cq-section-title-icon blue">
                  <svg viewBox="0 0 24 24"><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" /></svg>
                </span>
                发起新呼叫
              </div>

              <div className="cq-field">
                <label className="cq-field-label">呼叫班级</label>
                <div style={{ display: 'flex', gap: 10 }}>
                  <select
                    value={selectedCallGrade}
                    onChange={(e) => {
                      setSelectedCallGrade(e.target.value);
                      setSelectedCallClassId('');
                      setSelectedCallStudentIds([]);
                    }}
                    style={{ flex: 1 }}
                  >
                    <option value="">-- 全部年级 --</option>
                    {callGradeOptions.map((g) => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                  <select
                    value={selectedCallClassId}
                    onChange={(e) => {
                      setSelectedCallClassId(e.target.value ? Number(e.target.value) : '');
                      setSelectedCallStudentIds([]);
                    }}
                    style={{ flex: 1 }}
                  >
                    <option value="">-- 请选择班级 --</option>
                    {filteredCallClasses.map((c) => (
                      <option key={c.id} value={c.id}>{c.gradeName} {c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="cq-field">
                <label className="cq-field-label">呼叫目的地</label>
                <input
                  type="text"
                  placeholder="例如：班主任办公室、书吧"
                  value={callLocation}
                  onChange={(e) => setCallLocation(e.target.value)}
                />
                <div className="cq-quick-tags">
                  {['班主任办公室', '教师办公室', '德育办公室', '教务办公室', '校长办公室', '书吧'].map(loc => (
                    <span
                      key={loc}
                      className={`cq-quick-tag${callLocation === loc ? ' active' : ''}`}
                      onClick={() => setCallLocation(loc)}
                    >
                      {loc}
                    </span>
                  ))}
                </div>
              </div>

              <div className="cq-field">
                <div className="cq-student-header">
                  <label className="cq-field-label" style={{ margin: 0 }}>
                    被呼叫学生
                    {selectedCallStudentIds.length > 0 && (
                      <span style={{ color: '#2980b9', fontWeight: 800, marginLeft: 6 }}>
                        ({selectedCallStudentIds.length}人)
                      </span>
                    )}
                  </label>
                  {classStudents.length > 0 && (
                    <div className="cq-student-actions">
                      <button type="button" className="select-all" onClick={() => setSelectedCallStudentIds(classStudents.map(s => s.id))}>全选</button>
                      <button type="button" className="clear-all" onClick={() => setSelectedCallStudentIds([])}>清空</button>
                    </div>
                  )}
                </div>
                <div className="cq-student-grid">
                  {classStudents.length === 0 ? (
                    <div className="cq-student-empty">请先选择班级</div>
                  ) : (
                    classStudents.map((s) => {
                      const isChecked = selectedCallStudentIds.includes(s.id);
                      return (
                        <label key={s.id} className={`cq-student-chip${isChecked ? ' checked' : ''}`}>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedCallStudentIds([...selectedCallStudentIds, s.id]);
                              } else {
                                setSelectedCallStudentIds(selectedCallStudentIds.filter(id => id !== s.id));
                              }
                            }}
                          />
                          <span>{s.name}</span>
                        </label>
                      );
                    })
                  )}
                </div>
              </div>

              {callMessage && (
                <div className={`cq-message ${callMessage.includes("成功") ? "success" : "error"}`}>
                  {callMessage}
                </div>
              )}

              <button
                type="button"
                className="cq-submit-btn"
                disabled={callSubmitting || !selectedCallClassId}
                onClick={handleCreateCall}
              >
                {callSubmitting ? "正在发起呼叫..." : "发起大屏叫号"}
              </button>
            </div>

            {/* 右侧：排队队列 */}
            <div className="cq-queue-panel">
              <div className="cq-section-title">
                <span className="cq-section-title-icon amber">
                  <svg viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                </span>
                排队队列
              </div>

              {classCallQueue.length === 0 ? (
                <div className="cq-queue-empty">
                  <div>
                    <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                    <div>当前无排队记录</div>
                  </div>
                </div>
              ) : (
                <div className="cq-queue-list">
                  {classCallQueue.map((item) => {
                    const isCalling = item.status === 'calling';
                    return (
                      <div key={item.id} className={`cq-queue-item${isCalling ? ' active' : ''}`}>
                        {isCalling && <span className="cq-queue-item-status calling">呼叫中</span>}
                        {!isCalling && <span className="cq-queue-item-status pending">排队中</span>}
                        <div className="cq-queue-item-location">前往：{item.location}</div>
                        <div className="cq-queue-item-meta">
                          发起人：{item.callerName || `老师#${item.callerId}`}
                        </div>
                        <div className="cq-queue-item-students">
                          被叫学生：{item.calledStudents?.map((s: any) => s.name).join('、')}
                        </div>
                        <div className="cq-queue-item-footer">
                          <button type="button" className="cq-cancel-btn" onClick={() => handleCancelCall(item.id)}>
                            撤销呼叫
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  useEffect(() => {
    if (location.pathname !== "/dashboard") return;
    if (location.hash !== "#teacher-academic-snapshot") return;
    requestAnimationFrame(() => {
      document.getElementById("teacher-academic-snapshot")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  }, [location.pathname, location.hash]);

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
      .honorRecords(token, { targetType: "student" })
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

  /** 校级驾驶舱独占：教师学业数据改为下方独立 effect，避免在此处清空成绩单 */
  useEffect(() => {
    if (isTeacherDashboard) {
      setAnalyticsData(null);
      setRecentScoreRecords([]);
      setDisplayTerminals([]);
      return;
    }
    let active = true;
    const canManageDisp = canManageDisplays(user?.roleCode);
    Promise.all([
      adminApi.analytics(token),
      adminApi.scoreRecords(token),
      canManageDisp ? adminApi.displayTerminals(token) : Promise.resolve({ data: [] }),
      adminApi.academicExams(token),
    ])
      .then(([analyticsResp, recordsResp, terminalsResp, examsResp]) => {
        if (!active) return;
        setAnalyticsData(analyticsResp.data);
        setRecentScoreRecords(
          recordsResp.data
            .sort(
              (a, b) =>
                new Date(b.createdAt).getTime() -
                new Date(a.createdAt).getTime(),
            )
            .slice(0, 20),
        );
        setDisplayTerminals(terminalsResp.data);
        setAcademicExams(examsResp.data);
      })
      .catch(() => {
        if (!active) return;
      });
    return () => {
      active = false;
    };
  }, [isTeacherDashboard, token, user?.roleCode]);

  const [teacherAcademicLoading, setTeacherAcademicLoading] = useState(false);
  const [teacherSubjectDesk, setTeacherSubjectDesk] =
    useState<AcademicDeskOverviewPayload["subjectFocus"]>(null);
  const [teacherSubjectDeskLoading, setTeacherSubjectDeskLoading] =
    useState(false);
  const [teacherDeskGradeBench, setTeacherDeskGradeBench] =
    useState<ReturnType<typeof mapDeskOverviewGradeBench>>(null);
  const [subjectTeacherWorkbench, setSubjectTeacherWorkbench] =
    useState<TeacherWorkbenchContext | null>(null);
  const [subjectTeacherWorkbenchLoading, setSubjectTeacherWorkbenchLoading] =
    useState(false);
  const [subjectTeacherWorkbenchError, setSubjectTeacherWorkbenchError] =
    useState<string | null>(null);
  const [subjectTeacherCopyMessage, setSubjectTeacherCopyMessage] = useState<
    string | null
  >(null);
  const [homeroomCopyMessage, setHomeroomCopyMessage] = useState<string | null>(
    null,
  );

  function scrollToAttentionStudents() {
    document.getElementById("teacher-attention-students")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  useEffect(() => {
    if (!isTeacherDashboard || !token) return;
    let active = true;
    setTeacherAcademicLoading(true);
    Promise.all([adminApi.academicExams(token), adminApi.academicScores(token)])
      .then(([examsResp, scoresResp]) => {
        if (!active) return;
        setAcademicExams(examsResp.data);
        setAcademicScores(scoresResp.data);
      })
      .catch(() => {
        if (!active) return;
        setAcademicExams([]);
        setAcademicScores([]);
      })
      .finally(() => {
        if (!active) return;
        setTeacherAcademicLoading(false);
      });

    return () => {
      active = false;
    };
  }, [isTeacherDashboard, token]);

  useEffect(() => {
    if (isTeacherDashboard || !token) {
      setSchoolAcademicGrowth(null);
      return;
    }
    let active = true;
    adminApi
      .academicSchoolGrowth(token, {
        examId: selectedAcademicExamId ?? undefined,
      })
      .then((response) => {
        if (!active) return;
        setSchoolAcademicGrowth(response.data);
      })
      .catch(() => {
        if (!active) return;
        setSchoolAcademicGrowth(null);
      });
    return () => {
      active = false;
    };
  }, [isTeacherDashboard, selectedAcademicExamId, token]);

  const metrics = useMemo(() => {
    const totalScore = classes.reduce((sum, item) => sum + item.classScore, 0);
    const displayReadyClasses = classes.filter(
      (item) => item.displayStatus === "enabled",
    ).length;
    const activeStudents = students.filter(
      (item) => item.currentScore > 0 || item.currentPetLevel > 0,
    ).length;
    const positiveRules = rules.filter(
      (item) => item.sentiment === "positive",
    ).length;
    const classParticipation =
      classes.length > 0
        ? ((displayReadyClasses / classes.length) * 100).toFixed(1)
        : "0.0";
    const studentParticipation =
      students.length > 0
        ? ((activeStudents / students.length) * 100).toFixed(1)
        : "0.0";
    const averageLevel =
      students.length > 0
        ? (
            students.reduce((sum, item) => sum + item.currentPetLevel, 0) /
            students.length
          ).toFixed(1)
        : "0.0";
    const honorsGranted = honors.reduce(
      (sum, item) => sum + item.grantedCount,
      0,
    );

    return [
      {
        label: "全校总积分",
        icon: "chart" as const,
        value: totalScore.toLocaleString("zh-CN"),
        note: "↑ 12.5%",
        noteHint: "较上周",
      },
      {
        label: "活跃班级数",
        icon: "school" as const,
        value: `${displayReadyClasses}`,
        valueSuffix: classes.length > 0 ? `/${classes.length}` : undefined,
        sub: `${classParticipation}% 参与率`,
      },
      {
        label: "活跃学生数",
        icon: "student" as const,
        value: `${activeStudents}`,
        valueSuffix: students.length > 0 ? `/${students.length}` : undefined,
        sub: `${studentParticipation}% 参与率`,
      },
      {
        label: "正向规则数",
        icon: "fire" as const,
        value: `${positiveRules}`,
        note: "↑ 8.3%",
        noteHint: "较上周",
      },
      {
        label: "勋章发放数",
        icon: "medal" as const,
        value: `${honorsGranted}`,
        sub: "本月累计",
      },
      {
        label: "平均成长等级",
        icon: "paw" as const,
        value: `Lv.${averageLevel}`,
        note: "↑ +0.3",
        noteHint: "较上月",
      },
    ];
  }, [classes, honors, rules, students]);

  const rankGradeOptions = useMemo(
    () =>
      Array.from(new Set(classes.map((item) => item.gradeName))).sort(
        compareGradeName,
      ),
    [classes],
  );

  useEffect(() => {
    if (!rankGradeOptions.includes(rankGradeName)) {
      setRankGradeName(rankGradeOptions[0] ?? "");
    }
  }, [rankGradeName, rankGradeOptions]);

  useEffect(() => {
    if (!rankGradeOptions.includes(cockpitCompareGradeName)) {
      setCockpitCompareGradeName(rankGradeOptions[0] ?? "");
    }
  }, [cockpitCompareGradeName, rankGradeOptions]);

  const gradeTopClasses = useMemo(() => {
    const rows = classes
      .filter((item) => item.gradeName === rankGradeName)
      .sort(
        (left, right) =>
          right.classScore - left.classScore ||
          left.name.localeCompare(right.name, "zh-CN"),
      )
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
    const grouped = new Map<
      number,
      {
        studentId: number;
        studentName: string;
        className: string;
        honorCount: number;
        lastGrantedAt: string;
      }
    >();

    honorRecords.forEach((item) => {
      if (item.targetType !== "student" || !item.studentId || !item.studentName)
        return;
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
      if (
        new Date(item.grantedAt).getTime() >
        new Date(current.lastGrantedAt).getTime()
      ) {
        current.lastGrantedAt = item.grantedAt;
      }
    });

    return Array.from(grouped.values())
      .sort(
        (left, right) =>
          right.honorCount - left.honorCount ||
          new Date(right.lastGrantedAt).getTime() -
            new Date(left.lastGrantedAt).getTime(),
      )
      .slice(0, 3);
  }, [honorRecords]);

  const rankRows = useMemo(() => {
    if (rankTab === "class") {
      return gradeTopClasses.map((item) => ({
        id: `class-${item.id}`,
        rank: item.rank,
        name: `${item.gradeName} ${item.name}`,
        score: `${item.classScore} 分`,
      }));
    }
    if (rankTab === "student") {
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
      noPetStudents > 0
        ? `仍有 ${noPetStudents} 名学生未绑定萌宠成长档案`
        : "系统正常运行中，数据同步状态稳定",
    ];
  }, [classes, students]);

  const governanceMetrics = useMemo(() => {
    const teacherUsers = permissionUsers.filter((item) =>
      ["homeroom_teacher", "subject_teacher"].includes(item.roleCode),
    );
    const disabledUsers = permissionUsers.filter(
      (item) => item.status === "disabled",
    ).length;
    const highPrivilegeUsers = permissionUsers.filter((item) =>
      ["super_admin", "school_admin"].includes(item.roleCode),
    ).length;
    const uncoveredClasses = classes.filter(
      (item) => !item.homeroomTeacher?.id,
    ).length;
    const multiClassTeachers = teacherUsers.filter(
      (item) => item.classIds.length > 1,
    ).length;

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
      const matchedTeachers = governanceMetrics.teacherUsers.filter((teacher) =>
        teacher.classIds.includes(item.id),
      );
      if (!gradeTeacherMap.has(item.gradeName))
        gradeTeacherMap.set(item.gradeName, new Set<number>());
      matchedTeachers.forEach((teacher) =>
        gradeTeacherMap.get(item.gradeName)?.add(teacher.id),
      );
    });

    const gradeCoverage = Array.from(gradeTeacherMap.entries())
      .map(([gradeName, teachers]) => ({
        gradeName,
        teacherCount: teachers.size,
      }))
      .sort(
        (left, right) =>
          right.teacherCount - left.teacherCount ||
          left.gradeName.localeCompare(right.gradeName, "zh-CN"),
      )
      .slice(0, 3);

    const riskyAccounts = permissionUsers
      .filter((item) => item.status === "disabled" || !item.lastLoginAt)
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
    const totalScore =
      analyticsData?.totalScore ??
      classes.reduce((s, c) => s + c.classScore, 0);
    const displayReadyClasses = classes.filter(
      (c) => c.displayStatus === "enabled",
    ).length;
    const activeStudents = students.filter(
      (s) => s.currentScore > 0 || s.currentPetLevel > 0,
    ).length;
    const positiveEvents = analyticsData?.positiveRuleCount ?? 0;
    const negativeEvents = analyticsData?.negativeRuleCount ?? 0;
    const honorsGranted = honors.reduce((s, h) => s + h.grantedCount, 0);
    const riskCount = analyticsData?.riskStudents?.length ?? 0;
    const avgScore =
      analyticsData?.averageScore ??
      (students.length
        ? Math.round(
            students.reduce((s, st) => s + st.currentScore, 0) /
              students.length,
          )
        : 0);
    const activeDays = analyticsData?.activeDays ?? 0;
    const onlineTerminals = displayTerminals.filter(
      (t) => t.onlineStatus === "online",
    ).length;
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
    () =>
      analyticsData?.topClasses ??
      [...classes]
        .sort((a, b) => b.classScore - a.classScore)
        .slice(0, 8)
        .map((c) => ({
          id: c.id,
          name: `${c.gradeName} ${c.name}`,
          currentScoreTotal: c.classScore,
        })),
    [analyticsData, classes],
  );

  const cockpitTopStudents = useMemo(
    () =>
      analyticsData?.topStudents ??
      [...students]
        .sort((a, b) => b.currentScore - a.currentScore)
        .slice(0, 8)
        .map((s) => ({
          studentId: s.id,
          studentName: s.name,
          classId: s.classId,
          className: s.className,
          currentScore: s.currentScore,
        })),
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

  const teacherAcademicGrowth = useMemo(
    () =>
      buildAcademicGrowthSummary(
        academicExams,
        academicScores,
        classes,
        students,
        selectedAcademicExamId,
      ),
    [academicExams, academicScores, classes, selectedAcademicExamId, students],
  );

  const academicGrowth: AcademicGrowthSummary = isTeacherDashboard
    ? teacherAcademicGrowth
    : (schoolAcademicGrowth as AcademicGrowthSummary | null) ??
      buildAcademicGrowthSummary([], [], classes, students, null);

  /** 学业成长趋势：最多 2 场考试 + 4 个亮点班级，不足时用进步之星补位（共 6 行） */
  const academicTrendPanelItems = useMemo(() => {
    const examSlotMax = 2;
    const classHighlightCount = 4;
    const slotLimit = examSlotMax + classHighlightCount;
    const examRows = academicGrowth.trend.slice(0, examSlotMax).map((item) => ({
      kind: "exam" as const,
      key: `exam-${item.examId}`,
      item,
    }));
    const classRows = academicGrowth.classSummaries
      .slice(
        0,
        Math.min(classHighlightCount, slotLimit - examRows.length),
      )
      .map((item) => ({
        kind: "class" as const,
        key: `class-${item.classId}`,
        item,
      }));
    const leaderRows = academicGrowth.progressLeaders
      .slice(0, Math.max(0, slotLimit - examRows.length - classRows.length))
      .map((item) => ({
        kind: "leader" as const,
        key: `leader-${item.studentId}`,
        item,
      }));
    return [...examRows, ...classRows, ...leaderRows].slice(0, slotLimit);
  }, [academicGrowth]);

  /** 学业关注名单：固定 5 行，预警学生不足时用风险班级与高分承压学生补位 */
  const academicRiskPanelItems = useMemo(() => {
    const slotLimit = 5;
    const riskStudentIds = new Set(
      academicGrowth.riskStudents.map((item) => item.studentId),
    );
    const studentRows = academicGrowth.riskStudents
      .slice(0, slotLimit)
      .map((item) => ({
        kind: "student" as const,
        key: `risk-${item.studentId}`,
        tag: "学业预警",
        item,
      }));
    const classRows = academicGrowth.classSummaries
      .filter(
        (item) =>
          item.riskLevel !== "low" &&
          (item.declineCount > 0 || item.riskLevel === "high"),
      )
      .sort(
        (left, right) =>
          right.declineCount - left.declineCount ||
          left.growthIndex - right.growthIndex,
      )
      .slice(0, Math.max(0, slotLimit - studentRows.length))
      .map((item) => ({
        kind: "class" as const,
        key: `risk-class-${item.classId}`,
        item,
      }));
    const usedStudentIds = new Set(
      studentRows.map((row) => row.item.studentId),
    );
    const quietRows = academicGrowth.studentSignals
      .filter(
        (item) =>
          item.quadrant === "quiet" &&
          !usedStudentIds.has(item.studentId) &&
          !riskStudentIds.has(item.studentId),
      )
      .sort((left, right) => left.rankDelta - right.rankDelta)
      .slice(
        0,
        Math.max(0, slotLimit - studentRows.length - classRows.length),
      )
      .map((item) => ({
        kind: "student" as const,
        key: `quiet-${item.studentId}`,
        tag: "高分承压",
        item,
      }));
    return [...studentRows, ...classRows, ...quietRows];
  }, [academicGrowth]);

  const academicRiskMetricMax = useMemo(() => {
    const studentItems = academicRiskPanelItems.filter(
      (row) => row.kind === "student",
    );
    return {
      scoreDelta: Math.max(
        ...studentItems.map((row) => Math.abs(row.item.scoreDelta)),
        1,
      ),
      rankDelta: Math.max(
        ...studentItems.map((row) => Math.abs(row.item.rankDelta)),
        1,
      ),
    };
  }, [academicRiskPanelItems]);

  useEffect(() => {
    if (!academicExams.length) {
      setSelectedAcademicExamId(null);
      return;
    }
    setSelectedAcademicExamId((current) => {
      if (current && academicExams.some((exam) => exam.id === current)) {
        return current;
      }
      return academicExams[0]?.id ?? null;
    });
  }, [academicExams]);

  useEffect(() => {
    if (!isTeacherDashboard || !token) {
      return;
    }
    /** 任课以外的角色不拉单科工作台；不改变年级对标（可由班主任工作台独立 effect 写入） */
    if (!isSubjectTeacher) {
      setTeacherSubjectDesk(null);
      setTeacherSubjectDeskLoading(false);
      return;
    }

    if (!activeTeacherClassId || !activeTeacherSubject) {
      setTeacherSubjectDesk(null);
      setTeacherDeskGradeBench(null);
      setTeacherSubjectDeskLoading(false);
      return;
    }

    const latestExamId = academicGrowth.latestExam?.id;
    if (!latestExamId) {
      setTeacherSubjectDesk(null);
      setTeacherDeskGradeBench(null);
      setTeacherSubjectDeskLoading(false);
      return;
    }
    let cancelled = false;
    setTeacherSubjectDeskLoading(true);
    adminApi
      .academicDeskOverview(token, {
        classId: activeTeacherClassId,
        examId: latestExamId,
        subjectCode: activeTeacherSubject,
      })
      .then((resp) => {
        if (!cancelled) {
          setTeacherSubjectDesk(resp.data.subjectFocus);
          setTeacherDeskGradeBench(
            mapDeskOverviewGradeBench(resp.data.gradeExamBenchmark),
          );
        }
      })
      .catch(() => {
        if (!cancelled) {
          setTeacherSubjectDesk(null);
          setTeacherDeskGradeBench(null);
        }
      })
      .finally(() => {
        if (!cancelled) setTeacherSubjectDeskLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [
    academicGrowth.latestExam?.id,
    activeTeacherClassId,
    activeTeacherSubject,
    isSubjectTeacher,
    isTeacherDashboard,
    token,
  ]);

  useEffect(() => {
    if (!isSubjectTeacher || !token) {
      setSubjectTeacherWorkbench(null);
      setSubjectTeacherWorkbenchError(null);
      setSubjectTeacherWorkbenchLoading(false);
      return;
    }
    if (!activeTeacherClassId || !activeTeacherSubject) {
      setSubjectTeacherWorkbench(null);
      setSubjectTeacherWorkbenchError("请先在顶部选择班级与学科。");
      setSubjectTeacherWorkbenchLoading(false);
      return;
    }

    let cancelled = false;
    setSubjectTeacherWorkbenchLoading(true);
    setSubjectTeacherWorkbenchError(null);
    setSubjectTeacherCopyMessage(null);

    adminApi
      .teacherWorkbenchContext(token, {
        classId: activeTeacherClassId,
        subjectCode: activeTeacherSubject,
      })
      .then((response) => {
        if (cancelled) return;
        setSubjectTeacherWorkbench(response.data);
      })
      .catch((err) => {
        if (cancelled) return;
        setSubjectTeacherWorkbench(null);
        setSubjectTeacherWorkbenchError(
          err instanceof Error ? err.message : "教学工作台加载失败",
        );
      })
      .finally(() => {
        if (!cancelled) setSubjectTeacherWorkbenchLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [activeTeacherClassId, activeTeacherSubject, isSubjectTeacher, token]);

  const academicClassMatrixRows = useMemo(() => {
    const rows = academicGrowth.classSummaries;
    const points = rows.map((item) => {
      const progressRate = item.participantCount
        ? Math.round((item.progressCount / item.participantCount) * 100)
        : 0;
      return {
        ...item,
        progressRate,
        bubbleSize: 14 + Math.min(10, item.participantCount * 0.5),
      };
    });

    const growthValues = points.map((item) => item.growthIndex);
    const progressValues = points.map((item) => item.progressRate);
    const minGrowth = Math.min(...growthValues, 0);
    const maxGrowth = Math.max(...growthValues, 1);
    const minProgress = Math.min(...progressValues, 0);
    const maxProgress = Math.max(...progressValues, 1);
    const growthRange = Math.max(maxGrowth - minGrowth, 1);
    const progressRange = Math.max(maxProgress - minProgress, 1);

    return points.map((item, index) => {
      const ringOffset = index - (points.length - 1) / 2;
      const spreadX = points.length > 1 ? ringOffset * 5 : 0;
      const spreadY = ((index % 4) - 1.5) * 6;
      return {
        ...item,
        xPercent: Math.max(
          12,
          Math.min(
            88,
            18 + ((item.growthIndex - minGrowth) / growthRange) * 64 + spreadX,
          ),
        ),
        yPercent: Math.max(
          14,
          Math.min(
            86,
            82 -
              ((item.progressRate - minProgress) / progressRange) * 62 +
              spreadY,
          ),
        ),
      };
    });
  }, [academicGrowth.classSummaries]);

  const cockpitRecentHonors = useMemo(
    () =>
      [...honorRecords]
        .sort(
          (a, b) =>
            new Date(b.grantedAt).getTime() - new Date(a.grantedAt).getTime(),
        )
        .slice(0, 8),
    [honorRecords],
  );

  const cockpitStudentLayers = useMemo(() => {
    const highGrowth = students.filter((s) => s.currentPetLevel >= 5).length;
    const stable = students.filter(
      (s) => s.currentPetLevel >= 2 && s.currentPetLevel < 5,
    ).length;
    const low = students.filter((s) => s.currentPetLevel < 2).length;
    const withPet = students.filter((s) => s.pet).length;
    const over100 = students.filter((s) => s.currentScore >= 100).length;
    return {
      highGrowth,
      stable,
      low,
      withPet,
      noPet: students.length - withPet,
      over100,
    };
  }, [students]);

  /** 数据结构：当前年级内各班级积分，用于柱状对比 */
  const cockpitClassCompareBars = useMemo(() => {
    const inGrade = classes.filter(
      (c) => c.gradeName === cockpitCompareGradeName,
    );
    // 同年级的班级仅展示积分前 6 名
    const sorted = [...inGrade]
      .sort(
        (a, b) =>
          b.classScore - a.classScore || a.name.localeCompare(b.name, "zh-CN"),
      )
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

  /** 主图：全校班级积分排名前 10，与面板标题「班级积分Top10」口径一致 */
  const cockpitTop10Bars = useMemo(() => {
    const rankedClasses = [...classes]
      .sort((a, b) => b.classScore - a.classScore)
      .slice(0, 10);
    const uniqueGradeCount = new Set(
      rankedClasses.map((item) => item.gradeName?.trim()).filter(Boolean),
    ).size;
    const max = Math.max(...rankedClasses.map((c) => c.classScore), 1);
    return rankedClasses.map((c, index) => ({
      id: c.id,
      rank: index + 1,
      label:
        uniqueGradeCount <= 1
          ? c.name.trim()
          : `${c.gradeName} ${c.name}`.trim(),
      value: c.classScore,
      heightPercent: Math.max(6, Math.round((c.classScore / max) * 100)),
    }));
  }, [classes]);

  const trendPoints = useMemo(() => {
    const source = [...classes]
      .sort((left, right) => right.classScore - left.classScore)
      .slice(0, 7)
      .map((item) => item.classScore);
    const values =
      source.length > 0
        ? source.reverse()
        : [120, 180, 150, 210, 260, 240, 300];
    const dateLabels = values.map((_, index) => {
      const offset = values.length - 1 - index;
      const date = new Date();
      date.setDate(date.getDate() - offset);
      const month = `${date.getMonth() + 1}`.padStart(2, "0");
      const day = `${date.getDate()}`.padStart(2, "0");
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

  const trendLine = trendPoints
    .map((point) => `${point.x},${point.y}`)
    .join(" ");
  const trendArea = `${trendLine} ${trendPoints[trendPoints.length - 1]?.x ?? 400},150 40,150`;

  async function handleEnterPresentMode() {
    setPresentSubmitting(true);
    setPresentMessage(null);
    try {
      if (!canViewSchoolPresentation(user?.roleCode)) {
        throw new Error("当前角色无权使用汇报展示模式");
      }
      await adminApi.setPresentationMode(token, "report");
      navigate("/presentation");
    } catch (err) {
      setPresentMessage(
        err instanceof Error ? err.message : "切换汇报展示模式失败",
      );
    } finally {
      setPresentSubmitting(false);
    }
  }

  function handleEnterRealtimeMonitor() {
    navigate("/realtime-monitor");
  }

  function navigateWithQuery(
    path: string,
    query: Record<string, string | number | null | undefined>,
  ) {
    const params = new URLSearchParams();
    Object.entries(query).forEach(([key, value]) => {
      if (value === undefined || value === null || value === "") return;
      params.set(key, String(value));
    });
    params.set("returnTo", "/dashboard");
    params.set(
      "returnLabel",
      isTeacherDashboard ? "返回工作台" : "返回校级驾驶舱",
    );
    navigate(params.size > 0 ? `${path}?${params.toString()}` : path);
  }

  function navigateToEvaluation(
    query: Record<string, string | number | null | undefined> = {},
  ) {
    const params = new URLSearchParams();
    Object.entries(query).forEach(([key, value]) => {
      if (value === undefined || value === null || value === "") return;
      params.set(key, String(value));
    });
    navigate(
      params.size > 0 ? `/evaluation?${params.toString()}` : "/evaluation",
    );
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

  const homeroomManagedClasses = useMemo(() => {
    if (!isHomeroomTeacher || !user?.id) return [];
    return classes.filter((c) => c.homeroomTeacher?.id === user.id);
  }, [classes, isHomeroomTeacher, user?.id]);

  const homeroomTargetPendingClasses = useMemo(
    () =>
      homeroomManagedClasses.filter(
        (c) => c.targetScore === null || c.targetScore === undefined,
      ).length,
    [homeroomManagedClasses],
  );

  const homeroomCountdownPendingClasses = useMemo(
    () => homeroomManagedClasses.filter((c) => isClassCountdownPending(c)).length,
    [homeroomManagedClasses],
  );

  const primaryHomeroomClass = useMemo(() => {
    if (!isHomeroomTeacher) return null;
    const pool =
      homeroomManagedClasses.length > 0 ? homeroomManagedClasses : classes;
    return (
      [...pool].sort(
        (left, right) =>
          right.studentCount - left.studentCount ||
          right.classScore - left.classScore,
      )[0] ?? null
    );
  }, [classes, homeroomManagedClasses, isHomeroomTeacher]);

  const primaryHomeroomStudents = useMemo(() => {
    if (!primaryHomeroomClass) return [];
    return students
      .filter((item) => item.classId === primaryHomeroomClass.id)
      .sort(
        (left, right) =>
          right.currentScore - left.currentScore ||
          right.currentPetLevel - left.currentPetLevel,
      );
  }, [primaryHomeroomClass, students]);

  /** 班主任本班学生在评价侧的「当前积分」人均值（非教务卷面分） */
  const primaryHomeroomBehaviorAvg = useMemo(() => {
    const n = primaryHomeroomStudents.length;
    if (!n) return 0;
    return Math.round(
      primaryHomeroomStudents.reduce(
        (sum, item) => sum + item.currentScore,
        0,
      ) / n,
    );
  }, [primaryHomeroomStudents]);

  /** 班主任工作台：整场年级对标由服务端在全库聚合，不靠列表接口裁剪 */
  useEffect(() => {
    if (!isTeacherDashboard || !token) return;
    if (!isHomeroomTeacher || isSubjectTeacher) return;

    const classId = primaryHomeroomClass?.id;
    const examId = academicGrowth.latestExam?.id;
    if (!classId || !examId) {
      setTeacherDeskGradeBench(null);
      return;
    }
    let cancelled = false;
    adminApi
      .academicDeskOverview(token, { classId, examId })
      .then((resp) => {
        if (!cancelled)
          setTeacherDeskGradeBench(
            mapDeskOverviewGradeBench(resp.data.gradeExamBenchmark),
          );
      })
      .catch(() => {
        if (!cancelled) setTeacherDeskGradeBench(null);
      });
    return () => {
      cancelled = true;
    };
  }, [
    academicGrowth.latestExam?.id,
    isHomeroomTeacher,
    isSubjectTeacher,
    isTeacherDashboard,
    primaryHomeroomClass?.id,
    token,
  ]);

  /** 班级口号 / 目标积分未配置时在工作台显性提示（班主任视角） */
  const homeroomClassOpsGaps = useMemo(() => {
    if (!isHomeroomTeacher || !primaryHomeroomClass) {
      return {
        needsBanner: false,
        sloganMissing: false,
        targetMissing: false,
        countdownMissing: false,
      };
    }
    const sloganMissing = !primaryHomeroomClass.slogan?.trim();
    const targetMissing =
      primaryHomeroomClass.targetScore === null ||
      primaryHomeroomClass.targetScore === undefined;
    const countdownMissing = isClassCountdownPending(primaryHomeroomClass);
    return {
      needsBanner: sloganMissing || targetMissing || countdownMissing,
      sloganMissing,
      targetMissing,
      countdownMissing,
    };
  }, [isHomeroomTeacher, primaryHomeroomClass]);

  function navigateHomeroomClassQuickSetup() {
    if (!primaryHomeroomClass) return;
    const params = new URLSearchParams({
      classId: String(primaryHomeroomClass.id),
      edit: "1",
      returnTo: "/dashboard",
      returnLabel: "返回工作台",
    });
    navigate(`/classes?${params.toString()}`);
  }

  /** 工作台对齐「当前班级」视角的学业汇总（数据来源与校级驾驶舱相同 API，后端按.token 裁剪） */
  const teacherDeskAcademic = useMemo(() => {
    if (!isTeacherDashboard) return null;
    const deskClassId =
      isHomeroomTeacher && primaryHomeroomClass
        ? primaryHomeroomClass.id
        : isSubjectTeacher && activeTeacherClassId
          ? activeTeacherClassId
          : null;
    const classRow =
      deskClassId === null
        ? null
        : (academicGrowth.classSummaries.find(
            (row) => row.classId === deskClassId,
          ) ?? null);
    const linkClassId =
      deskClassId ?? primaryHomeroomClass?.id ?? activeTeacherClassId ?? null;
    return { deskClassId, classRow, growth: academicGrowth, linkClassId };
  }, [
    academicGrowth,
    activeTeacherClassId,
    isHomeroomTeacher,
    isSubjectTeacher,
    isTeacherDashboard,
    primaryHomeroomClass,
  ]);

  const academicExamsSortedDesc = useMemo(
    () =>
      [...academicExams].sort(
        (left, right) =>
          new Date(right.examDate || right.importedAt).getTime() -
          new Date(left.examDate || left.importedAt).getTime(),
      ),
    [academicExams],
  );

  const academicTotalScoreRows = useMemo(
    () =>
      academicScores.filter(
        (row) => !row.subjectCode || row.subjectCode === "total",
      ),
    [academicScores],
  );

  const teacherDeskBrief = useMemo(
    () =>
      buildTeacherDeskAcademicBrief(
        academicGrowth,
        teacherDeskAcademic?.deskClassId ?? null,
        {
          totalScoreRows: academicTotalScoreRows,
          examsOrdered: academicExamsSortedDesc,
          gradeExamBenchmark: teacherDeskGradeBench,
        },
      ),
    [
      academicExamsSortedDesc,
      academicGrowth,
      academicTotalScoreRows,
      teacherDeskAcademic?.deskClassId,
      teacherDeskGradeBench,
    ],
  );

  function renderTeacherAcademicSnapshotPanel(options?: {
    panelTitle?: string;
    footerNote?: string;
  }) {
    if (!isTeacherDashboard || !teacherDeskAcademic) return null;
    const { deskClassId, growth, linkClassId } = teacherDeskAcademic;
    return (
      <section id="teacher-academic-snapshot">
        <TeacherAcademicDeskInsights
          panelTitle={options?.panelTitle}
          deskPerspective={isSubjectTeacher ? "subject" : "homeroom"}
          brief={teacherDeskBrief}
          hasExam={Boolean(growth.latestExam)}
          loading={teacherAcademicLoading}
          deskClassId={deskClassId}
          linkClassId={linkClassId}
          subjectFocus={isSubjectTeacher ? teacherSubjectDesk : null}
          subjectFocusLoading={Boolean(
            isSubjectTeacher && teacherSubjectDeskLoading,
          )}
          subjectLabel={
            activeTeacherSubject
              ? resolveSubjectLabel(activeTeacherSubject)
              : undefined
          }
          onOpenScores={(q) =>
            navigateWithQuery("/students", {
              tab: q.tab ?? "scores",
              examId: q.examId,
              classId: q.classId,
              studentId: q.studentId,
            })
          }
          footerNote={
            options?.footerNote ??
            "教务快照基于最近一次成绩归档与联考对标，不受「班级概览 / 教学概览」页上方日期区间筛选影响；积分趋势与 AI 请以概览所选区间为准。"
          }
        />
      </section>
    );
  }

  useEffect(() => {
    if (!isTeacherDashboard) {
      setTeacherRecentRecords([]);
      setTeacherRewardOrders([]);
      return;
    }

    const targetClassId =
      user?.roleCode === "homeroom_teacher"
        ? primaryHomeroomClass?.id
        : undefined;

    let active = true;
    Promise.all([
      adminApi.scoreRecords(
        token,
        isSubjectTeacher
          ? {
              ...(activeTeacherClassId
                ? { classId: activeTeacherClassId }
                : {}),
              ...(activeTeacherSubject
                ? { subjectCode: activeTeacherSubject }
                : {}),
            }
          : targetClassId
            ? { classId: targetClassId }
            : undefined,
      ),
      user?.roleCode === "homeroom_teacher" && targetClassId
        ? adminApi.rewardOrders(token, { classId: targetClassId })
        : Promise.resolve({
            code: 0,
            message: "ok",
            data: [] as RewardOrder[],
          }),
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
  }, [
    activeTeacherClassId,
    activeTeacherSubject,
    isSubjectTeacher,
    isTeacherDashboard,
    primaryHomeroomClass?.id,
    token,
    user?.roleCode,
  ]);

  const teacherMetrics = useMemo(() => {
    const classCount = classes.length;
    const studentCount = students.length;
    const noPetStudents = students.filter((item) => !item.pet).length;
    const averageScore = studentCount
      ? Math.round(
          students.reduce((sum, item) => sum + item.currentScore, 0) /
            studentCount,
        )
      : 0;
    const highFrequencyRuleCount = rules.filter((item) => {
      if (!item.isHighFrequency || !item.adminEnabled) return false;
      if (item.moduleType === "general") return true;
      if (isSubjectTeacher) {
        return item.subjectCode
          ? teacherSubjectCodes.includes(item.subjectCode)
          : false;
      }
      return true;
    }).length;
    const targetPendingClasses = classes.filter(
      (item) => item.targetScore === null || item.targetScore === undefined,
    ).length;

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
        .sort(
          (left, right) =>
            right.currentScore - left.currentScore ||
            right.currentPetLevel - left.currentPetLevel,
        )
        .slice(0, 5),
    [students],
  );

  const teacherRules = useMemo(
    () =>
      rules
        .filter((item) => {
          if (!item.adminEnabled) return false;
          if (item.moduleType === "general") return true;
          if (isSubjectTeacher) {
            return item.subjectCode
              ? teacherSubjectCodes.includes(item.subjectCode)
              : false;
          }
          return true;
        })
        .sort(
          (left, right) =>
            Number(right.isHighFrequency) - Number(left.isHighFrequency) ||
            Math.abs(right.scoreValue) - Math.abs(left.scoreValue),
        )
        .slice(0, 6),
    [isSubjectTeacher, rules, teacherSubjectCodes],
  );

  const homeroomBehaviorStats = useMemo(() => {
    const relatedStudentIds = new Set(
      primaryHomeroomStudents.map((item) => item.id),
    );
    const records = teacherRecentRecords.filter((item) =>
      relatedStudentIds.has(item.studentId),
    );
    const positiveCount = records.filter((item) => item.scoreDelta > 0).length;
    const negativeCount = records.filter((item) => item.scoreDelta < 0).length;
    const dimensionMap = new Map<string, number>();
    records.forEach((item) => {
      const key = item.dimension || item.tag || item.sceneCode || "其他";
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
    return teacherRules.filter(
      (item) =>
        item.moduleType === "general" ||
        item.subjectCode === activeTeacherSubject,
    );
  }, [activeTeacherSubject, isSubjectTeacher, teacherRules]);

  const filteredTeacherRecentRecords = useMemo(() => {
    if (!isSubjectTeacher || !activeTeacherSubject) return teacherRecentRecords;
    return teacherRecentRecords.filter(
      (item) =>
        item.subjectCode === activeTeacherSubject ||
        (!item.subjectCode && item.sourceRole === "subject_teacher"),
    );
  }, [activeTeacherSubject, isSubjectTeacher, teacherRecentRecords]);

  const homeroomWatchStudents = useMemo(() => {
    const relatedRecords = teacherRecentRecords.filter((item) =>
      primaryHomeroomStudents.some((student) => student.id === item.studentId),
    );
    const negativeCountByStudent = new Map<number, number>();
    relatedRecords.forEach((item) => {
      if (item.scoreDelta >= 0) return;
      negativeCountByStudent.set(
        item.studentId,
        (negativeCountByStudent.get(item.studentId) ?? 0) + 1,
      );
    });

    return [...primaryHomeroomStudents]
      .map((student) => ({
        ...student,
        negativeCount: negativeCountByStudent.get(student.id) ?? 0,
        noPet: !student.pet,
      }))
      .filter(
        (student) =>
          student.negativeCount > 0 ||
          student.currentScore < 20 ||
          student.noPet,
      )
      .sort((left, right) => {
        if (right.negativeCount !== left.negativeCount)
          return right.negativeCount - left.negativeCount;
        if (left.currentScore !== right.currentScore)
          return left.currentScore - right.currentScore;
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
        .sort(
          (left, right) =>
            right.currentScore - left.currentScore ||
            right.currentPetLevel - left.currentPetLevel,
        ),
    [activeTeacherClassId, students],
  );

  const activeTeacherClassSummary = useMemo(() => {
    const studentCount = activeTeacherClassStudents.length;
    const averageScore = studentCount
      ? Math.round(
          activeTeacherClassStudents.reduce(
            (sum, item) => sum + item.currentScore,
            0,
          ) / studentCount,
        )
      : 0;
    const highLevelCount = activeTeacherClassStudents.filter(
      (item) => item.currentPetLevel >= 5,
    ).length;
    const noPetCount = activeTeacherClassStudents.filter(
      (item) => !item.pet,
    ).length;
    const topStudent = activeTeacherClassStudents[0] ?? null;

    return {
      studentCount,
      averageScore,
      highLevelCount,
      noPetCount,
      topStudent,
    };
  }, [activeTeacherClassStudents]);

  const currentSubjectViewLabel = useMemo(() => {
    if (!isSubjectTeacher || !activeSubjectView) return "";
    const classInfo = classes.find(
      (item) => item.id === activeSubjectView.classId,
    );
    const subjectLabel = resolveSubjectLabel(activeSubjectView.subjectCode);
    const classLabel = classInfo
      ? `${classInfo.gradeName} ${classInfo.name}`
      : `班级 #${activeSubjectView.classId}`;
    return `${classLabel} · ${subjectLabel}`;
  }, [activeSubjectView, classes, isSubjectTeacher]);

  const activeSubjectDisplayLabel = useMemo(
    () =>
      resolveSubjectLabel(
        subjectTeacherWorkbench?.contextHeader.subjectCode ??
          activeTeacherSubject,
        subjectTeacherWorkbench?.contextHeader.subjectLabel,
      ),
    [
      activeTeacherSubject,
      subjectTeacherWorkbench?.contextHeader.subjectCode,
      subjectTeacherWorkbench?.contextHeader.subjectLabel,
    ],
  );

  const subjectContextCards = useMemo(
    () =>
      subjectViews.map((item) => {
        const classInfo =
          classes.find((row) => row.id === item.classId) ?? null;
        const subjectLabel = resolveSubjectLabel(item.subjectCode);
        const classStudents = students.filter(
          (student) => student.classId === item.classId,
        );
        return {
          ...item,
          classLabel: classInfo
            ? `${classInfo.gradeName} ${classInfo.name}`
            : `班级 #${item.classId}`,
          subjectLabel,
          studentCount: classStudents.length,
          isActive: activeSubjectView?.key === item.key,
        };
      }),
    [activeSubjectView?.key, classes, students, subjectViews],
  );

  /** 任课教师视角：当前班级近 7 日评价次数 */
  const activeClassWeeklyEvalCount = useMemo(() => {
    if (!isSubjectTeacher || !activeTeacherClassId) return 0;
    const weekMs = 7 * 24 * 60 * 60 * 1000;
    const cutoff = Date.now() - weekMs;
    return teacherRecentRecords.filter(
      (r) =>
        r.classId === activeTeacherClassId &&
        new Date(r.createdAt).getTime() >= cutoff,
    ).length;
  }, [activeTeacherClassId, isSubjectTeacher, teacherRecentRecords]);

  /** 任课教师工作台：全科授课范围近一周评价活跃度 */
  const subjectTeacherWeeklyPulse = useMemo(() => {
    if (!isSubjectTeacher) {
      return { weekCount: 0, latestLabel: null as string | null };
    }
    const weekMs = 7 * 24 * 60 * 60 * 1000;
    const cutoff = Date.now() - weekMs;
    const weekCount = teacherRecentRecords.filter(
      (r) => new Date(r.createdAt).getTime() >= cutoff,
    ).length;
    const last = teacherRecentRecords[0];
    return {
      weekCount,
      latestLabel: last
        ? new Date(last.createdAt).toLocaleString("zh-CN")
        : null,
    };
  }, [isSubjectTeacher, teacherRecentRecords]);

  const homeroomTaskList = useMemo(() => {
    const tasks: Array<{
      id: string;
      title: string;
      detail: string;
      actionLabel: string;
      onClickPath: string;
    }> = [];

    if (
      primaryHomeroomClass &&
      (primaryHomeroomClass.targetScore === null ||
        primaryHomeroomClass.targetScore === undefined)
    ) {
      tasks.push({
        id: "target-score",
        title: "补充班级目标积分",
        detail:
          "当前本班还没有设置目标积分，建议尽快补齐，便于展示端形成成长目标。",
        actionLabel: "去设置",
        onClickPath: "/classes",
      });
    }

    if (
      homeroomTargetPendingClasses > 0 &&
      primaryHomeroomClass?.targetScore != null &&
      primaryHomeroomClass?.targetScore !== undefined
    ) {
      tasks.push({
        id: "targets-remaining-classes",
        title: "还有其他负责班未设目标积分",
        detail: `${homeroomTargetPendingClasses} 个你负责的班级仍未设置目标积分，请在班级管理中依次补齐。`,
        actionLabel: "去班级",
        onClickPath: "/classes",
      });
    }

    if (primaryHomeroomClass && homeroomClassOpsGaps.countdownMissing) {
      tasks.push({
        id: "class-countdown",
        title: primaryHomeroomClass.countdownDeadlineAt ? "更新班级倒计时" : "设置班级倒计时",
        detail: primaryHomeroomClass.countdownDeadlineAt
          ? "当前本班倒计时已到期，建议设置新的班级节点，让展示大屏继续呈现近期目标。"
          : "当前本班还没有设置有效倒计时，建议补齐标题和截止时间，展示大屏会自动显示。",
        actionLabel: "去设置",
        onClickPath: "/classes",
      });
    }

    if (
      homeroomCountdownPendingClasses > 0 &&
      primaryHomeroomClass &&
      !homeroomClassOpsGaps.countdownMissing
    ) {
      tasks.push({
        id: "countdowns-remaining-classes",
        title: "还有其他负责班倒计时待设置",
        detail: `${homeroomCountdownPendingClasses} 个你负责的班级未设置有效倒计时或倒计时已到期，请在班级管理中更新。`,
        actionLabel: "去班级",
        onClickPath: "/classes",
      });
    }

    const noPetStudents = primaryHomeroomStudents.filter((item) => !item.pet);
    if (noPetStudents.length > 0) {
      tasks.push({
        id: "pet-profile",
        title: "补齐萌宠档案",
        detail: `还有 ${noPetStudents.length} 名学生未领养萌宠，建议班主任尽快引导完成成长档案。`,
        actionLabel: "看学生",
        onClickPath: "/students",
      });
    }

    const highNegativeStudents = homeroomWatchStudents.filter(
      (item) => item.negativeCount >= 2,
    );
    if (highNegativeStudents.length > 0) {
      tasks.push({
        id: "negative-watch",
        title: "关注近期负向偏多学生",
        detail: `${highNegativeStudents.length} 名学生近期被提醒次数偏多，建议班主任尽快跟进沟通。`,
        actionLabel: "去查看",
        onClickPath: "/students",
      });
    }

    if (teacherRewardOrders.length > 0) {
      tasks.push({
        id: "reward-orders",
        title: "跟进最近兑换",
        detail: `最近有 ${teacherRewardOrders.length} 条兑换记录，建议确认学生领取与班级反馈。`,
        actionLabel: "看兑换",
        onClickPath: "/rewards",
      });
    }

    return tasks.slice(0, 4);
  }, [
    homeroomTargetPendingClasses,
    homeroomCountdownPendingClasses,
    homeroomClassOpsGaps.countdownMissing,
    homeroomWatchStudents,
    primaryHomeroomClass,
    primaryHomeroomStudents,
    teacherRewardOrders.length,
  ]);

  const homeroomPriorityTasks = useMemo(
    () => homeroomTaskList.slice(0, 3),
    [homeroomTaskList],
  );

  const homeroomPriorityStudents = useMemo(
    () => homeroomWatchStudents.slice(0, 5),
    [homeroomWatchStudents],
  );

  const homeroomQuickActions = useMemo(
    () => [
      {
        key: "evaluation",
        label: "去学生评价",
        detail: "先把今天的关键表现记下来，后续 AI 才能给出更稳妥的提醒。",
        actionLabel: "去办",
        onClick: () =>
          navigateToEvaluation({
            classId: primaryHomeroomClass?.id,
            mode: "single",
          }),
      },
      {
        key: "students",
        label: "看学生档案",
        detail: "打开本班学生页，逐个查看积分、最近记录和成绩单。",
        actionLabel: "去看",
        onClick: () =>
          navigateWithQuery("/students", {
            classId: primaryHomeroomClass?.id,
            statsView: "class",
          }),
      },
      {
        key: "rewards",
        label: "处理兑换",
        detail: "确认最近兑换是否已发放，及时给学生反馈。",
        actionLabel: "去处理",
        onClick: () => navigate("/rewards"),
      },
    ],
    [primaryHomeroomClass],
  );

  const homeroomStatusCards = useMemo(() => {
    const configGapCount =
      Number(homeroomClassOpsGaps.sloganMissing) +
      Number(homeroomClassOpsGaps.targetMissing) +
      Number(homeroomClassOpsGaps.countdownMissing);
    return [
      {
        key: "students",
        label: "班级人数",
        value: String(primaryHomeroomStudents.length),
        sub:
          primaryHomeroomStudents.length > 0
            ? "本班当前在管学生"
            : "当前暂无学生数据",
      },
      {
        key: "behavior",
        label: "近7天行为波动",
        value: `${homeroomBehaviorStats.positiveCount}/${homeroomBehaviorStats.negativeCount}`,
        sub: "正向 / 负向记录数",
      },
      {
        key: "rewards",
        label: "待跟进兑换",
        value: String(teacherRewardOrders.length),
        sub:
          teacherRewardOrders.length > 0
            ? "建议尽快确认领取反馈"
            : "当前暂无待处理兑换",
      },
      {
        key: "config",
        label: "配置缺口",
        value: String(configGapCount),
        sub:
          configGapCount > 0
            ? "口号、目标积分或倒计时仍待补齐"
            : "班级基础配置完整",
      },
    ];
  }, [
    homeroomBehaviorStats.negativeCount,
    homeroomBehaviorStats.positiveCount,
    homeroomClassOpsGaps.sloganMissing,
    homeroomClassOpsGaps.targetMissing,
    homeroomClassOpsGaps.countdownMissing,
    primaryHomeroomStudents.length,
    teacherRewardOrders.length,
  ]);

  const homeroomActionDesk = useMemo(() => {
    const focusStudents = homeroomPriorityStudents.slice(0, 3).map((item) => {
      const reasonParts: string[] = [];
      if (item.negativeCount >= 2) {
        reasonParts.push(`近期待提醒 ${item.negativeCount} 次`);
      }
      if (item.currentScore < 20) {
        reasonParts.push(`当前积分 ${item.currentScore} 分`);
      }
      if (item.noPet) {
        reasonParts.push("未完成萌宠档案");
      }
      return {
        id: item.id,
        name: item.name,
        reason: reasonParts.join("，") || "近期需要班主任留意",
        action:
          item.negativeCount >= 2
            ? "先单独沟通，再同步任课老师近期课堂表现。"
            : item.noPet
              ? "提醒尽快完善成长档案，避免后续激励链路缺失。"
              : "结合最近记录和成绩单，给出一个短期改进目标。",
      };
    });

    const topTask = homeroomPriorityTasks[0];
    const headline = topTask
      ? `今天先处理「${topTask.title}」。`
      : primaryHomeroomClass
        ? "今天没有明显堆积事项，可先做日常评价并查看近7天复盘。"
        : "当前还未绑定主责班级，请先确认班主任负责班级。";

    const actionItems = [
      topTask?.detail,
      focusStudents[0]
        ? `优先看 ${focusStudents[0].name}：${focusStudents[0].action}`
        : null,
      homeroomBehaviorStats.negativeCount > homeroomBehaviorStats.positiveCount
        ? "本周负向提醒偏多，建议先从课堂纪律或作业习惯入手。"
        : "本周整体状态平稳，可用正向评价稳住班级节奏。",
    ].filter(Boolean) as string[];

    const communicationDraft = focusStudents[0]
      ? `请帮我一起关注${focusStudents[0].name}。最近${focusStudents[0].reason}，我这边会先做一次面对面沟通，也请任课老师这两天留意课堂表现，有新情况我们及时同步。`
      : "本班近期整体比较平稳。我会继续做日常评价记录，如果任课老师发现新的课堂波动，请及时同步，我这边会跟进。";

    return {
      headline,
      focusStudents,
      actionItems: actionItems.slice(0, 3),
      communicationDraft,
    };
  }, [
    homeroomBehaviorStats.negativeCount,
    homeroomBehaviorStats.positiveCount,
    homeroomPriorityStudents,
    homeroomPriorityTasks,
    primaryHomeroomClass,
  ]);

  const homeroomOverviewPreview = useMemo(() => {
    const trendDelta =
      homeroomBehaviorStats.positiveCount - homeroomBehaviorStats.negativeCount;
    const trendLabel =
      trendDelta >= 3
        ? "整体在回暖"
        : trendDelta <= -2
          ? "需要尽快稳住"
          : "整体比较平稳";
    const riskCount = homeroomPriorityStudents.filter(
      (item) => item.negativeCount >= 2,
    ).length;
    const headline = `近7天班级状态${trendLabel}，当前有 ${riskCount} 名学生需要优先处理。`;
    const bullets = [
      `正向 ${homeroomBehaviorStats.positiveCount} 次，负向 ${homeroomBehaviorStats.negativeCount} 次。`,
      homeroomPriorityStudents[0]
        ? `优先关注 ${homeroomPriorityStudents[0].name}${
            homeroomPriorityStudents[0].negativeCount > 0
              ? `，近期待提醒 ${homeroomPriorityStudents[0].negativeCount} 次`
              : "，建议结合最近记录设短期目标"
          }。`
        : "当前没有明显聚集的风险学生，可继续按常规节奏观察。",
      teacherRewardOrders.length > 0
        ? `最近有 ${teacherRewardOrders.length} 条兑换待跟进，建议和班级激励反馈一起处理。`
        : "兑换处理平稳，可把精力放在学生沟通和阶段复盘上。",
    ];
    return {
      headline,
      bullets,
      trendTone:
        trendDelta >= 3 ? "green" : trendDelta <= -2 ? "amber" : "blue",
      stats: [
        { key: "trend", label: "近7天走势", value: trendLabel },
        { key: "risk", label: "优先对象", value: `${riskCount} 人` },
        { key: "ops", label: "待办事项", value: `${homeroomPriorityTasks.length} 项` },
      ],
    };
  }, [
    homeroomBehaviorStats.negativeCount,
    homeroomBehaviorStats.positiveCount,
    homeroomPriorityStudents,
    homeroomPriorityTasks.length,
    teacherRewardOrders.length,
  ]);

  const teacherHeatZones = useMemo(() => {
    if (!isSubjectTeacher) return [];

    return classes
      .map((item) => {
        const classRecords = teacherRecentRecords.filter(
          (record) => record.classId === item.id,
        );
        const negativeCount = classRecords.filter(
          (record) => record.scoreDelta < 0,
        ).length;
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
        if (right.totalCount !== left.totalCount)
          return right.totalCount - left.totalCount;
        if (right.negativeCount !== left.negativeCount)
          return right.negativeCount - left.negativeCount;
        return left.classLabel.localeCompare(right.classLabel, "zh-CN");
      })
      .slice(0, 5);
  }, [classes, isSubjectTeacher, teacherRecentRecords]);

  const cockpitAlerts = useMemo(() => {
    const items: Array<{ level: "ok" | "warn" | "critical"; text: string }> =
      [];
    const lowClasses = [...classes]
      .sort((a, b) => a.classScore - b.classScore)
      .slice(0, 2);
    lowClasses.forEach((c) => {
      items.push({
        level: "warn",
        text: `${c.gradeName} ${c.name} 积分偏低（${c.classScore} 分），建议关注班级激励频率`,
      });
    });
    const noPetStudents = students.filter((s) => !s.pet).length;
    if (noPetStudents > 0) {
      items.push({
        level: "warn",
        text: `仍有 ${noPetStudents} 名学生未绑定萌宠成长档案`,
      });
    }
    const uncoveredClasses = classes.filter(
      (c) => !c.homeroomTeacher?.id,
    ).length;
    if (uncoveredClasses > 0) {
      items.push({
        level: "warn",
        text: `${uncoveredClasses} 个班级尚未配置班主任`,
      });
    }
    const offlineTerminals = displayTerminals.filter(
      (t) => t.onlineStatus === "offline",
    ).length;
    if (offlineTerminals > 0) {
      items.push({
        level: "warn",
        text: `${offlineTerminals} 台展示终端当前离线`,
      });
    }
    if (items.length === 0) {
      items.push({ level: "ok", text: "系统运行稳定，各项指标正常" });
    }
    return items;
  }, [classes, displayTerminals, students]);

  function openHomeroomOverview(days: 7 | 30) {
    const endDate = new Date().toISOString().slice(0, 10);
    const start = new Date();
    start.setDate(start.getDate() - (days - 1));
    const params = new URLSearchParams({
      startDate: start.toISOString().slice(0, 10),
      endDate,
    });
    if (primaryHomeroomClass?.gradeName) {
      params.set("gradeName", primaryHomeroomClass.gradeName);
    }
    if (primaryHomeroomClass?.id) {
      params.set("classId", String(primaryHomeroomClass.id));
    }
    navigate(`/analytics?${params.toString()}`);
  }

  /** `/me` 返回前 user 为空，否则会短暂按校级驾驶舱渲染 */
  const awaitingUserProfile = Boolean(token && user === null);

  if (awaitingUserProfile) {
    return (
      <Shell
        title="工作台"
        subtitle={loading ? "正在同步个人信息与任教范围…" : "即将就绪"}
        user={null}
        status={
          <>
            <div className="status-card">正在载入工作台，请稍候…</div>
            {error ? <div className="status-card error">{error}</div> : null}
          </>
        }
      >
        {null}
      </Shell>
    );
  }

  if (isTeacherDashboard) {
    return (
      <Shell
        title={isHomeroomTeacher ? "班级工作台" : "教学工作台"}
        subtitle={
          isHomeroomTeacher
            ? "今日待办：先处理任务、重点学生和沟通动作；需要看阶段趋势与原因时再去「班级概览」。"
            : "日常授课办事首页：教务学业快照常驻此处；若要按日期区间复盘积分与 AI，请前往「教学概览」。"
        }
        user={user}
        status={
          <>
            {loading ? (
              <div className="status-card">正在读取工作台数据...</div>
            ) : null}
            {error ? <div className="status-card error">{error}</div> : null}
          </>
        }
      >
        <div className="dashboard-head">
          <div className="dashboard-title-block">
            <div className="dashboard-page-title">
              {isHomeroomTeacher ? "班主任工作台" : "任课教师工作台"}
            </div>
            <div className="dashboard-page-sub">
              {isHomeroomTeacher ? "HOMEROOM DESK" : "TEACHING DESK"}
            </div>
          </div>
          <div className="page-actions">
            <button
              className="cq-trigger-btn"
              type="button"
              onClick={() => openCallQueueModal()}
            >
              <svg viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>
              大屏叫号
            </button>
          </div>
        </div>

        {isHomeroomTeacher ? (
          <div className="homeroom-desk">
            {homeroomClassOpsGaps.needsBanner && primaryHomeroomClass ? (
              <div
                className="status-card warn homeroom-ops-banner"
                role="region"
                aria-label="班级运营信息待完善"
                style={{ marginBottom: 18 }}
              >
                <div className="homeroom-ops-banner__row">
                  <div className="homeroom-ops-banner__lead">
                    <span className="homeroom-ops-banner__icon" aria-hidden>
                      !
                    </span>
                    <div>
                      <strong className="homeroom-ops-banner__title">
                        班级运营信息待完善
                      </strong>
                      <p className="homeroom-ops-banner__desc">
                        补全口号、目标积分与有效倒计时后，学生端与展示大屏可呈现班级文化、达标进度和近期节点。
                      </p>
                    </div>
                  </div>
                  <div
                    className="homeroom-ops-banner__badges"
                    aria-label="待补项"
                  >
                    {homeroomClassOpsGaps.sloganMissing ? (
                      <span className="homeroom-ops-chip">待填班级口号</span>
                    ) : null}
                    {homeroomClassOpsGaps.targetMissing ? (
                      <span className="homeroom-ops-chip">待设目标积分</span>
                    ) : null}
                    {homeroomClassOpsGaps.countdownMissing ? (
                      <span className="homeroom-ops-chip">
                        {primaryHomeroomClass.countdownDeadlineAt ? "倒计时已到期" : "待设班级倒计时"}
                      </span>
                    ) : null}
                  </div>
                  <div className="homeroom-ops-banner__actions">
                    <button
                      type="button"
                      className="toolbar-button"
                      onClick={() => navigateHomeroomClassQuickSetup()}
                    >
                      去设定
                    </button>
                    <button
                      type="button"
                      className="ghost-button"
                      onClick={() =>
                        navigate(
                          `/classes?classId=${primaryHomeroomClass.id}&returnTo=${encodeURIComponent("/dashboard")}&returnLabel=${encodeURIComponent("返回工作台")}`,
                        )
                      }
                    >
                      班级档案
                    </button>
                  </div>
                </div>
                <details className="homeroom-ops-banner__details">
                  <summary>影响说明</summary>
                  <ul className="homeroom-ops-banner__bullets">
                    {homeroomClassOpsGaps.sloganMissing ? (
                      <li>
                        未填班级口号时，本页与大屏以占位文案代替，不利于凝练班级共识。
                      </li>
                    ) : null}
                    {homeroomClassOpsGaps.targetMissing ? (
                      <li>
                        未设目标积分时，难以向学生呈现「当前积分相对学期目标」的对照。
                      </li>
                    ) : null}
                    {homeroomClassOpsGaps.countdownMissing ? (
                      <li>
                        未设置有效倒计时时，大屏不会在光荣排行榜上方呈现近期班级目标节点。
                      </li>
                    ) : null}
                  </ul>
                </details>
              </div>
            ) : null}
            <div className="teacher-hero-card homeroom-hero">
              <div className="teacher-hero-main">
                <span className="teacher-hero-kicker">今日待办</span>
                <h3>
                  {primaryHomeroomClass
                    ? `${primaryHomeroomClass.gradeName} ${primaryHomeroomClass.name}`
                    : "当前未绑定班级"}
                </h3>
                <p
                  className={
                    primaryHomeroomClass && homeroomClassOpsGaps.sloganMissing
                      ? "teacher-hero-tagline teacher-hero-tagline--muted"
                      : "teacher-hero-tagline"
                  }
                >
                  {!primaryHomeroomClass
                    ? "这里聚合本班运营、学生管理和学生评价，班主任进入后台后先看这一页。"
                    : homeroomClassOpsGaps.sloganMissing
                      ? "口号完善后将展示在此处；可在「维护班级设置」或班级档案中编辑。"
                      : primaryHomeroomClass.slogan}
                </p>
                <div className="teacher-hero-actions">
                  <button
                    type="button"
                    className="toolbar-button"
                    onClick={() =>
                      navigateToEvaluation({
                        classId: primaryHomeroomClass?.id,
                        mode: "single",
                      })
                    }
                  >
                    立即评价
                  </button>
                  <button
                    type="button"
                    className="ghost-button"
                    onClick={() => openHomeroomOverview(7)}
                  >
                    查看近7天复盘
                  </button>
                  <button
                    type="button"
                    className="ghost-button"
                    onClick={() => openHomeroomOverview(30)}
                  >
                    查看近30天复盘
                  </button>
                  <button
                    type="button"
                    className="ghost-button"
                    onClick={() => navigate("/classes")}
                  >
                    维护班级设置
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
                {homeroomClassOpsGaps.targetMissing && primaryHomeroomClass ? (
                  <button
                    type="button"
                    className="teacher-hero-stat teacher-hero-stat--action"
                    title="点击进入班级档案并设定目标积分"
                    onClick={() => navigateHomeroomClassQuickSetup()}
                  >
                    <span>目标积分</span>
                    <strong>未设定</strong>
                    <span className="teacher-hero-stat-cta">点击设定</span>
                  </button>
                ) : (
                  <div className="teacher-hero-stat">
                    <span>目标积分</span>
                    <strong>{primaryHomeroomClass?.targetScore ?? "—"}</strong>
                  </div>
                )}
              </div>
            </div>

            <div className="row-2 c50 homeroom-desk-row">
              <div className="panel homeroom-priority-panel">
                <div className="panel-title">今天先做什么</div>
                <div className="homeroom-insight-banner homeroom-insight-banner--soft">
                  <p>{homeroomActionDesk.headline}</p>
                </div>
                <div className="mini-list" style={{ marginTop: 12 }}>
                  {homeroomPriorityTasks.map((item) => (
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
                  {homeroomPriorityTasks.length === 0 ? (
                    <div className="mini-list-item">
                      <div>
                        <strong>当前没有堆积待办</strong>
                        <span>可先完成日常评价，再打开近7天复盘检查班级波动。</span>
                      </div>
                      <b>稳定</b>
                    </div>
                  ) : null}
                </div>
              </div>
              <div className="panel homeroom-overview-preview-panel">
                <div className="panel-title">班级概览</div>
                <div className="homeroom-insight-banner">
                  <p>{homeroomOverviewPreview.headline}</p>
                </div>
                <div className="std-metric-grid std-metric-grid--3">
                  {homeroomOverviewPreview.stats.map((item) => {
                    const tone =
                      item.key === "trend"
                        ? homeroomOverviewPreview.trendTone
                        : item.key === "risk"
                          ? "purple"
                          : "amber";
                    const iconName =
                      item.key === "trend"
                        ? "trend"
                        : item.key === "risk"
                          ? "student"
                          : "check";
                    const isTextValue = item.key === "trend";
                    return (
                      <div
                        key={item.key}
                        className={`std-metric-card std-metric-card--${tone}`}
                      >
                        <div className="std-metric-card__top">
                          <div className="std-metric-card__icon">
                            <PresentationGlyph name={iconName} />
                          </div>
                          <span className="std-metric-card__label">
                            {item.label}
                          </span>
                        </div>
                        <div
                          className={
                            isTextValue
                              ? "std-metric-card__value std-metric-card__value--text"
                              : "std-metric-card__value"
                          }
                        >
                          {item.value}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="homeroom-tip-list">
                  {homeroomOverviewPreview.bullets.map((item) => (
                    <div className="homeroom-tip-item" key={item}>
                      <span className="homeroom-tip-item__dot" aria-hidden />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
                <div className="teacher-hero-actions homeroom-overview-preview-actions">
                  <button
                    type="button"
                    className="toolbar-button"
                    onClick={() => openHomeroomOverview(7)}
                  >
                    查看近7天复盘
                  </button>
                  <button
                    type="button"
                    className="ghost-button"
                    onClick={() => openHomeroomOverview(30)}
                  >
                    查看近30天复盘
                  </button>
                  <button
                    type="button"
                    className="ghost-button"
                    onClick={() => navigate("/analytics")}
                  >
                    进入班级概览
                  </button>
                </div>
              </div>
            </div>

            <div className="row-2 c50 homeroom-desk-row">
              <div className="panel homeroom-focus-panel">
                <div className="panel-title">今天重点关注谁</div>
                <div className="mini-list">
                  {homeroomPriorityStudents.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      className="mini-list-item mini-list-item-button"
                      onClick={() =>
                        navigateWithQuery("/students", {
                          classId: item.classId,
                          studentId: item.id,
                          statsView: "student",
                        })
                      }
                    >
                      <div>
                        <strong>{item.name}</strong>
                        <span>
                          {item.negativeCount > 0
                            ? `近期待提醒 ${item.negativeCount} 次`
                            : `当前积分 ${item.currentScore} 分`}
                          {item.noPet ? " · 未完成萌宠档案" : ""}
                        </span>
                        <span>
                          {item.negativeCount >= 2
                            ? "建议先单独沟通，再同步任课老师。"
                            : item.noPet
                              ? "建议先提醒补齐成长档案。"
                              : "建议先结合最近记录设一个短期目标。"}
                        </span>
                      </div>
                      <b>
                        {item.negativeCount >= 2
                          ? "先谈"
                          : item.noPet
                            ? "补档"
                            : "去看"}
                      </b>
                    </button>
                  ))}
                  {homeroomPriorityStudents.length === 0 ? (
                    <div className="mini-list-item">
                      <div>
                        <strong>当前没有明显紧急对象</strong>
                        <span>本班近期整体平稳，可继续做常规评价并观察趋势变化。</span>
                      </div>
                      <b>平稳</b>
                    </div>
                  ) : null}
                </div>
              </div>
              <div className="panel homeroom-ai-panel">
                <div className="panel-title">AI 班主任建议</div>
                <div className="homeroom-ai-stack">
                  <div className="homeroom-insight-card homeroom-insight-card--priority">
                    <div className="homeroom-insight-card__head">
                      <div className="homeroom-insight-card__icon">
                        <PresentationGlyph name="star" />
                      </div>
                      <span>今天最该先处理</span>
                    </div>
                    <p>{homeroomActionDesk.headline}</p>
                  </div>
                  <div className="homeroom-insight-card">
                    <div className="homeroom-insight-card__head">
                      <div className="homeroom-insight-card__icon homeroom-insight-card__icon--green">
                        <PresentationGlyph name="check" />
                      </div>
                      <span>建议动作</span>
                    </div>
                    <div className="homeroom-action-list">
                      {homeroomActionDesk.actionItems.map((item, index) => (
                        <div className="homeroom-action-item" key={item}>
                          <span className="homeroom-action-item__step">
                            {index + 1}
                          </span>
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="homeroom-insight-card">
                    <div className="homeroom-insight-card__head">
                      <div className="homeroom-insight-card__icon homeroom-insight-card__icon--blue">
                        <PresentationGlyph name="summary" />
                      </div>
                      <span>可直接转发给任课老师</span>
                    </div>
                    <p>{homeroomActionDesk.communicationDraft}</p>
                    <div className="summary-panel-actions">
                      <button
                        type="button"
                        className="op-btn"
                        onClick={async () => {
                          try {
                            await copyTextWithFallback(
                              homeroomActionDesk.communicationDraft,
                            );
                            setHomeroomCopyMessage("协同提醒已复制");
                          } catch {
                            setHomeroomCopyMessage("复制失败，请手动复制上方内容");
                          }
                        }}
                      >
                        复制话术
                      </button>
                    </div>
                  </div>
                  <div className="homeroom-insight-card homeroom-insight-card--compact">
                    <div className="homeroom-insight-card__head">
                      <div className="homeroom-insight-card__icon homeroom-insight-card__icon--purple">
                        <PresentationGlyph name="bell" />
                      </div>
                      <span>快捷动作</span>
                    </div>
                    <div className="mini-list">
                      {homeroomQuickActions.map((item) => (
                        <button
                          key={item.key}
                          type="button"
                          className="mini-list-item mini-list-item-button"
                          onClick={item.onClick}
                        >
                          <div>
                            <strong>{item.label}</strong>
                            <span>{item.detail}</span>
                          </div>
                          <b>{item.actionLabel}</b>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                {homeroomCopyMessage ? (
                  <div className="status-card success">{homeroomCopyMessage}</div>
                ) : null}
              </div>
            </div>

            <div className="row-2 c50 homeroom-desk-row">
              <div className="panel homeroom-status-panel">
                <div className="panel-title">班级运行状态</div>
                <div className="std-metric-grid std-metric-grid--4">
                  {homeroomStatusCards.map((item) => {
                    const meta: Record<
                      string,
                      {
                        icon: "school" | "chart" | "gift" | "gear";
                        tone: "blue" | "green" | "amber" | "purple";
                      }
                    > = {
                      students: { icon: "school", tone: "blue" },
                      behavior: { icon: "chart", tone: "green" },
                      rewards: { icon: "gift", tone: "amber" },
                      config: { icon: "gear", tone: "purple" },
                    };
                    const cardMeta = meta[item.key] ?? meta.students;
                    return (
                      <div
                        key={item.key}
                        className={`std-metric-card std-metric-card--${cardMeta.tone}`}
                      >
                        <div className="std-metric-card__top">
                          <div className="std-metric-card__icon">
                            <PresentationGlyph name={cardMeta.icon} />
                          </div>
                          <span className="std-metric-card__label">
                            {item.label}
                          </span>
                        </div>
                        <div className="std-metric-card__value">{item.value}</div>
                        <div className="std-metric-card__hint">{item.sub}</div>
                      </div>
                    );
                  })}
                </div>
                <div className="mini-list">
                  {teacherRewardOrders.slice(0, 2).map((item) => (
                    <div className="mini-list-item" key={item.id}>
                      <div>
                        <strong>
                          {item.student.name} · {item.reward.name}
                        </strong>
                        <span>
                          消耗 {item.scoreCost} 分 ·{" "}
                          {new Date(item.createdAt).toLocaleString("zh-CN")}
                        </span>
                      </div>
                      <b>{item.status}</b>
                    </div>
                  ))}
                  {teacherRecentRecords.slice(0, 2).map((item) => {
                    const matchedStudent = students.find(
                      (row) => row.id === item.studentId,
                    );
                    return (
                      <div
                        className="mini-list-item"
                        key={`${item.id}-${item.createdAt}`}
                      >
                        <div>
                          <strong>
                            {matchedStudent?.name ?? `学生#${item.studentId}`} ·{" "}
                            {item.scoreDelta > 0 ? "+" : ""}
                            {item.scoreDelta} 分
                          </strong>
                          <span>
                            {item.ruleName ||
                              item.tag ||
                              item.dimension ||
                              item.sceneCode ||
                              "学生评价"}{" "}
                            · {new Date(item.createdAt).toLocaleString("zh-CN")}
                          </span>
                        </div>
                        <b>{item.operatorName || item.sourceRole}</b>
                      </div>
                    );
                  })}
                  {teacherRewardOrders.length === 0 &&
                  teacherRecentRecords.length === 0 ? (
                    <div className="mini-list-item">
                      <div>
                        <strong>当前没有最新动态</strong>
                        <span>完成一次评价或产生一次兑换后，这里会出现最新运行状态。</span>
                      </div>
                      <b>待更新</b>
                    </div>
                  ) : null}
                </div>
              </div>
              {renderTeacherAcademicSnapshotPanel({
                panelTitle: "学业专题卡",
                footerNote:
                  "最近一次考试快照，不随上方日期变化；用于辅助判断学情，不替代周期复盘。",
              })}
            </div>
          </div>
        ) : (
          <div className="subject-teacher-desk">
            <div className="teacher-hero-card subject-teacher-hero">
              <div className="teacher-hero-main">
                <span className="teacher-hero-kicker">当前查看</span>
                <h3>
                  {subjectTeacherWorkbench ? (
                    <>
                      {subjectTeacherWorkbench.contextHeader.gradeName}{" "}
                      {subjectTeacherWorkbench.contextHeader.className}
                      <span className="subject-teacher-hero-sep">·</span>
                      <span className="subject-teacher-hero-subject">
                        {activeSubjectDisplayLabel}
                      </span>
                    </>
                  ) : (
                    currentSubjectViewLabel || "请在顶部选择班级与学科"
                  )}
                </h3>
                <p>
                  这一页只看你现在选中的<strong>这个班、这门课</strong>
                  。你可以在这里快速判断：这节课该先关注谁、先做什么、这班最近学得怎么样。
                </p>
                <div className="teacher-hero-actions">
                  <button
                    type="button"
                    className="toolbar-button"
                    onClick={() =>
                      navigateToEvaluation({
                        classId: activeTeacherClassId,
                        subjectCode: activeTeacherSubject,
                        mode: "single",
                      })
                    }
                  >
                    进入学科评价
                  </button>
                  <button
                    type="button"
                    className="ghost-button"
                    onClick={() =>
                      navigateWithQuery("/students", {
                        classId: activeTeacherClassId,
                        statsView: "class",
                      })
                    }
                  >
                    查看当前班学生
                  </button>
                  <button
                    type="button"
                    className="ghost-button"
                    onClick={() =>
                      navigateWithQuery("/students", {
                        classId: activeTeacherClassId,
                        tab: "scores",
                      })
                    }
                  >
                    打开成绩单
                  </button>
                </div>
              </div>
              <div className="teacher-hero-aside">
                <div className="teacher-hero-stat">
                  <span>班里学生</span>
                  <strong>
                    {subjectTeacherWorkbench?.contextHeader.studentCount ??
                      activeTeacherClassSummary.studentCount}
                  </strong>
                </div>
                <div className="teacher-hero-stat">
                  <span>近 7 天记录</span>
                  <strong>
                    {subjectTeacherWorkbench?.contextHeader
                      .recentEvaluationCount ??
                      subjectTeacherWeeklyPulse.weekCount}
                  </strong>
                </div>
                <div className="teacher-hero-stat">
                  <span>成绩导入时间</span>
                  <strong>
                    {subjectTeacherWorkbench?.contextHeader
                      .latestAcademicImportedAt
                      ? new Date(
                          subjectTeacherWorkbench.contextHeader
                            .latestAcademicImportedAt,
                        ).toLocaleDateString("zh-CN")
                      : "—"}
                  </strong>
                </div>
              </div>
            </div>

            {subjectTeacherWorkbenchError ? (
              <div className="status-card error">
                {subjectTeacherWorkbenchError}
              </div>
            ) : null}
            {subjectTeacherCopyMessage ? (
              <div className="status-card success">
                {subjectTeacherCopyMessage}
              </div>
            ) : null}

            <div className="std-metric-grid">
              <div className="std-metric-card std-metric-card--blue">
                <div className="std-metric-card__top">
                  <div className="std-metric-card__icon">
                    <PresentationGlyph name="school" />
                  </div>
                  <span className="std-metric-card__label">当前班级</span>
                </div>
                <div className="std-metric-card__value">
                  {subjectTeacherWorkbench?.contextHeader.className ??
                    activeTeacherClass?.name ??
                    "—"}
                </div>
                <div className="std-metric-card__hint">
                  {subjectTeacherWorkbench
                    ? `${subjectTeacherWorkbench.contextHeader.gradeName} · 你现在看的就是这个班`
                    : "请在顶部选择班级"}
                </div>
              </div>

              <div className="std-metric-card std-metric-card--green">
                <div className="std-metric-card__top">
                  <div className="std-metric-card__icon">
                    <PresentationGlyph name="summary" />
                  </div>
                  <span className="std-metric-card__label">当前学科</span>
                </div>
                <div className="std-metric-card__value">
                  {activeSubjectDisplayLabel}
                </div>
                <div className="std-metric-card__hint">
                  下面的提醒和建议，都按这门课来
                </div>
              </div>

              <button
                type="button"
                className="std-metric-card std-metric-card--purple std-metric-card--action"
                onClick={scrollToAttentionStudents}
              >
                <div className="std-metric-card__top">
                  <div className="std-metric-card__icon">
                    <PresentationGlyph name="student" />
                  </div>
                  <span className="std-metric-card__label">重点学生</span>
                  <span className="std-metric-card__arrow" aria-hidden>
                    →
                  </span>
                </div>
                <div className="std-metric-card__value">
                  {subjectTeacherWorkbench?.attentionStudents.length ?? 0}
                  <span className="std-metric-card__unit">人</span>
                </div>
                <div className="std-metric-card__hint">
                  建议先看这几位，点击直达名单
                </div>
              </button>

              <div className="std-metric-card std-metric-card--amber std-metric-card--wide">
                <div className="std-metric-card__top">
                  <div className="std-metric-card__icon">
                    <PresentationGlyph name="fire" />
                  </div>
                  <span className="std-metric-card__label">最近学业导入</span>
                  {subjectTeacherWorkbench?.contextHeader
                    .latestAcademicImportedAt ? (
                    <span className="std-metric-card__badge">
                      {new Date(
                        subjectTeacherWorkbench.contextHeader
                          .latestAcademicImportedAt,
                      ).toLocaleDateString("zh-CN")}
                    </span>
                  ) : null}
                </div>
                <div
                  className="std-metric-card__value std-metric-card__value--text"
                  title={
                    subjectTeacherWorkbench?.contextHeader
                      .latestAcademicExamName ?? undefined
                  }
                >
                  {subjectTeacherWorkbench?.contextHeader
                    .latestAcademicExamName ?? "暂无"}
                </div>
                <div className="std-metric-card__hint">
                  用最近一次考试，判断这班现在的学情
                </div>
              </div>
            </div>

            <div className="row-2 c50">
              <div className="panel">
                <div className="panel-title">今天先这样安排</div>
                <div className="analytics-ai-card analytics-ai-card-soft">
                  <p>
                    {subjectTeacherWorkbenchLoading
                      ? "正在整理这个班这门课的建议..."
                      : (subjectTeacherWorkbench?.aiBrief.headline ??
                        "暂时还没有可用提醒，请先选择班级和学科。")}
                  </p>
                </div>
                <div className="teacher-copy-sections">
                  <div>
                    <div className="panel-title compact">为什么这样提醒你</div>
                    <div className="mini-list">
                      {(subjectTeacherWorkbench?.aiBrief.evidence ?? []).map(
                        (item) => (
                          <div className="mini-list-item" key={item}>
                            <div>
                              <strong>判断依据</strong>
                              <span>{item}</span>
                            </div>
                          </div>
                        ),
                      )}
                      {!subjectTeacherWorkbenchLoading &&
                      (subjectTeacherWorkbench?.aiBrief.evidence.length ??
                        0) === 0 ? (
                        <div className="mini-list-item">
                          <div>
                            <strong>暂无依据</strong>
                            <span>
                              这个班这门课最近记录还不够，暂时没法给出稳妥提醒。
                            </span>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </div>
                  <div>
                    <div className="panel-title compact">建议你先这样做</div>
                    <div className="mini-list">
                      {(subjectTeacherWorkbench?.aiBrief.actionItems ?? []).map(
                        (item, index) => (
                          <div className="mini-list-item" key={item}>
                            <div>
                              <strong>先做第 {index + 1} 步</strong>
                              <span>{item}</span>
                            </div>
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="panel">
                <div className="panel-title">快捷动作</div>
                <div className="mini-list">
                  {(subjectTeacherWorkbench?.quickActions ?? []).map(
                    (action) => (
                      <button
                        key={action.key}
                        type="button"
                        className="mini-list-item mini-list-item-button"
                        onClick={async () => {
                          if (action.actionType === "copy" && action.copyText) {
                            try {
                              await copyTextWithFallback(action.copyText);
                              setSubjectTeacherCopyMessage(
                                "发给班主任的话已复制",
                              );
                            } catch {
                              setSubjectTeacherCopyMessage(
                                "复制失败，请手动复制下方草稿",
                              );
                            }
                            return;
                          }
                          if (!action.targetPath) return;
                          navigateWithQuery(
                            action.targetPath,
                            action.query ?? {},
                          );
                        }}
                      >
                        <div>
                          <strong>{action.label}</strong>
                          <span>
                            {action.key === "evaluation"
                              ? "马上去记这节课的表现"
                              : action.key === "students"
                                ? "看这个班学生名单和个人情况"
                                : action.key === "scores"
                                  ? "看最近一次成绩单"
                                  : (action.copyText ??
                                    "复制下方可直接转发给班主任的话")}
                          </span>
                        </div>
                        <b>{action.actionType === "copy" ? "复制" : "去办"}</b>
                      </button>
                    ),
                  )}
                </div>
              </div>
            </div>

            <div className="panel" id="teacher-attention-students">
              <div className="panel-title">重点关注学生</div>
              <div className="mini-list">
                {(subjectTeacherWorkbench?.attentionStudents ?? []).map(
                  (item) => (
                    <button
                      key={item.studentId}
                      type="button"
                      className="mini-list-item mini-list-item-button"
                      onClick={() =>
                        navigateWithQuery("/students", {
                          classId: activeTeacherClassId,
                          studentId: item.studentId,
                          statsView: "student",
                        })
                      }
                    >
                      <div>
                        <strong>
                          {item.studentName}
                          <span
                            className={`analytics-inline-badge analytics-inline-badge--${item.priority}`}
                          >
                            {item.priority === "high"
                              ? "先看"
                              : item.priority === "medium"
                                ? "留意"
                                : "顺带看"}
                          </span>
                        </strong>
                        <span>{item.evidence}</span>
                        <span>建议：{item.recommendedAction}</span>
                        <div className="teacher-tag-row">
                          {item.reasonTags.map((tag) => (
                            <span className="teacher-tag" key={tag}>
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                      <b>去看</b>
                    </button>
                  ),
                )}
                {!subjectTeacherWorkbenchLoading &&
                (subjectTeacherWorkbench?.attentionStudents.length ?? 0) ===
                  0 ? (
                  <div className="mini-list-item">
                    <div>
                      <strong>当前暂无重点对象</strong>
                      <span>
                        这个班最近整体比较平稳，继续按正常节奏上课、记录就可以。
                      </span>
                    </div>
                    <b>稳定</b>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="panel">
              <div className="panel-title">最近一次考试参考</div>
              <p className="metric-sub" style={{ marginTop: -6 }}>
                这里看的是最近一次考试成绩，用来帮你判断这个班现在的学情，不会跟着上面日期变化。
              </p>
              <section id="teacher-academic-snapshot">
                <TeacherAcademicDeskInsights
                  deskPerspective="subject"
                  brief={teacherDeskBrief}
                  hasExam={Boolean(
                    subjectTeacherWorkbench?.academicBaseline.examTrends.length,
                  )}
                  loading={subjectTeacherWorkbenchLoading}
                  deskClassId={activeTeacherClassId}
                  linkClassId={activeTeacherClassId}
                  subjectFocus={
                    subjectTeacherWorkbench?.academicBaseline.subjectFocus ??
                    null
                  }
                  subjectFocusLoading={subjectTeacherWorkbenchLoading}
                  subjectLabel={activeSubjectDisplayLabel}
                  onOpenScores={(q) =>
                    navigateWithQuery("/students", {
                      tab: q.tab ?? "scores",
                      examId: q.examId,
                      classId: q.classId,
                      studentId: q.studentId,
                    })
                  }
                  footerNote="这里看的是这个班这门课最近一次考试情况；如果你想看一段时间内的变化，请去「教学复盘」。"
                />
              </section>
            </div>

            <div className="row-2 c50">
              <div className="panel">
                <div className="panel-title">最近记录</div>
                <div className="mini-list">
                  {(subjectTeacherWorkbench?.recentRecords ?? []).map(
                    (item) => (
                      <div
                        className="mini-list-item"
                        key={`${item.id}-${item.createdAt}`}
                      >
                        <div>
                          <strong>
                            {item.studentName} ·{" "}
                            {item.ruleName ||
                              item.tag ||
                              item.dimension ||
                              "学科评价"}
                          </strong>
                          <span>
                            {new Date(item.createdAt).toLocaleString("zh-CN")}
                            {item.operatorName ? ` · ${item.operatorName}` : ""}
                            {item.remark ? ` · ${item.remark}` : ""}
                          </span>
                        </div>
                        <b>
                          {item.scoreDelta > 0 ? "+" : ""}
                          {item.scoreDelta} 分
                        </b>
                      </div>
                    ),
                  )}
                  {!subjectTeacherWorkbenchLoading &&
                  (subjectTeacherWorkbench?.recentRecords.length ?? 0) === 0 ? (
                    <div className="mini-list-item">
                      <div>
                        <strong>暂无最近记录</strong>
                        <span>
                          你记过一次课堂表现后，这里就会显示最新记录。
                        </span>
                      </div>
                      <b>待更新</b>
                    </div>
                  ) : null}
                </div>
              </div>
              <div className="panel">
                <div className="panel-title">课后跟进</div>
                <div className="teacher-copy-sections">
                  <div className="teacher-draft-card">
                    <div className="panel-title compact">
                      给班主任的简短提醒
                    </div>
                    <p>
                      {subjectTeacherWorkbench?.followUpDrafts
                        .homeroomSyncShortDraft ?? "当前暂无协同草稿。"}
                    </p>
                  </div>
                  <div className="teacher-draft-card">
                    <div className="panel-title compact">
                      可直接转发给班主任
                    </div>
                    <p>
                      {subjectTeacherWorkbench?.followUpDrafts
                        .homeroomSyncForwardDraft ?? "当前暂无可转发内容。"}
                    </p>
                  </div>
                  <div className="teacher-draft-card">
                    <div className="panel-title compact">这节课小结</div>
                    <p>
                      {subjectTeacherWorkbench?.followUpDrafts
                        .lessonSummaryDraft ?? "当前暂无教学小结草稿。"}
                    </p>
                  </div>
                  <div className="teacher-draft-card">
                    <div className="panel-title compact">下次课提醒自己</div>
                    <p>
                      {subjectTeacherWorkbench?.followUpDrafts
                        .nextLessonDraft ?? "当前暂无下次课提醒。"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        {renderCallQueueModal()}
      </Shell>
    );
  }

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
          {loading ? (
            <div className="status-card">正在读取后台实时数据...</div>
          ) : null}
          {error ? <div className="status-card error">{error}</div> : null}
          {presentMessage ? (
            <div
              className={`status-card ${presentMessage.includes("失败") ? "error" : "success"}`}
            >
              {presentMessage}
            </div>
          ) : null}
        </>
      }
    >
      {/* 顶部标题与操作 */}
      <div className="ck-header">
        <div className="ck-header-left">
          <div className="ck-title">成长决策中心</div>
          <div className="ck-subtitle">SCHOOL GROWTH DECISION CENTER</div>
        </div>
        <div className="ck-header-actions">
          <button
            className="cq-trigger-btn"
            type="button"
            onClick={() => openCallQueueModal()}
          >
            <svg viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>
            大屏叫号
          </button>
          <button
            className="ck-action-btn ck-action-secondary"
            type="button"
            onClick={handleEnterRealtimeMonitor}
          >
            <PresentationGlyph name="chart" className="present-trigger-icon" />
            实时运行监控
          </button>
          <button
            className="ck-action-btn ck-action-primary"
            type="button"
            onClick={() => void handleEnterPresentMode()}
            disabled={presentSubmitting}
          >
            <PresentationGlyph
              name="display"
              className="present-trigger-icon"
            />
            {presentSubmitting ? "切换中..." : "汇报展示模式"}
          </button>
        </div>
      </div>

      {/* 第一层：核心 KPI */}
      <div className="ck-kpi-row">
        <div className="ck-kpi mc-blue">
          <div className="ck-kpi-icon">
            <PresentationGlyph name="chart" />
          </div>
          <div className="ck-kpi-body">
            <div className="ck-kpi-label">全校总积分</div>
            <div className="ck-kpi-value">
              {cockpitKpi.totalScore.toLocaleString("zh-CN")}
            </div>
            <div className="ck-kpi-sub">人均 {cockpitKpi.avgScore} 分</div>
          </div>
        </div>
        <div className="ck-kpi mc-green">
          <div className="ck-kpi-icon">
            <PresentationGlyph name="school" />
          </div>
          <div className="ck-kpi-body">
            <div className="ck-kpi-label">活跃班级</div>
            <div className="ck-kpi-value">
              {cockpitKpi.displayReadyClasses}
              <span className="ck-kpi-frac">/{cockpitKpi.classCount}</span>
            </div>
            <div className="ck-kpi-sub">
              {cockpitKpi.classCount > 0
                ? `${((cockpitKpi.displayReadyClasses / cockpitKpi.classCount) * 100).toFixed(0)}% 覆盖率`
                : "暂无数据"}
            </div>
          </div>
        </div>
        <div className="ck-kpi mc-purple">
          <div className="ck-kpi-icon">
            <PresentationGlyph name="student" />
          </div>
          <div className="ck-kpi-body">
            <div className="ck-kpi-label">活跃学生</div>
            <div className="ck-kpi-value">
              {cockpitKpi.activeStudents}
              <span className="ck-kpi-frac">/{cockpitKpi.studentCount}</span>
            </div>
            <div className="ck-kpi-sub">
              {cockpitKpi.studentCount > 0
                ? `${((cockpitKpi.activeStudents / cockpitKpi.studentCount) * 100).toFixed(0)}% 参与率`
                : "暂无数据"}
            </div>
          </div>
        </div>
        <div className="ck-kpi mc-teal">
          <div className="ck-kpi-icon">
            <PresentationGlyph name="fire" />
          </div>
          <div className="ck-kpi-body">
            <div className="ck-kpi-label">正向行为</div>
            <div className="ck-kpi-value">
              {cockpitKpi.positiveEvents.toLocaleString("zh-CN")}
            </div>
            <div className="ck-kpi-sub">
              负向 {cockpitKpi.negativeEvents} 次
            </div>
          </div>
        </div>
        <div className="ck-kpi mc-gold">
          <div className="ck-kpi-icon">
            <PresentationGlyph name="medal" />
          </div>
          <div className="ck-kpi-body">
            <div className="ck-kpi-label">勋章发放</div>
            <div className="ck-kpi-value">{cockpitKpi.honorsGranted}</div>
            <div className="ck-kpi-sub">累计授予</div>
          </div>
        </div>
        <div className="ck-kpi mc-red">
          <div className="ck-kpi-icon">
            <PresentationGlyph name="paw" />
          </div>
          <div className="ck-kpi-body">
            <div className="ck-kpi-label">风险学生</div>
            <div className="ck-kpi-value">{cockpitKpi.riskCount}</div>
            <div className="ck-kpi-sub">需关注</div>
          </div>
        </div>
      </div>

      <div className="ck-section-label">
        <span>学业成长决策层</span>
      </div>
      <div className="academic-decision-grid">
        <section className="panel academic-growth-hero">
          <div className="academic-growth-orbit" />
          <div className="academic-growth-hero-main">
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
                flexWrap: "wrap",
              }}
            >
              <div className="panel-title">学生成长指数</div>
              <select
                value={selectedAcademicExamId ?? ""}
                onChange={(event) =>
                  setSelectedAcademicExamId(
                    event.target.value ? Number(event.target.value) : null,
                  )
                }
                style={{
                  minWidth: 280,
                  maxWidth: "100%",
                  borderRadius: 14,
                  border: "1px solid rgba(147, 197, 253, 0.24)",
                  background: "rgba(15, 23, 42, 0.24)",
                  color: "#e2e8f0",
                  padding: "10px 14px",
                  fontSize: 14,
                }}
              >
                {academicExams.map((exam) => (
                  <option key={exam.id} value={exam.id}>
                    {exam.name}
                    {exam.gradeName ? ` · ${exam.gradeName}` : ""}
                  </option>
                ))}
              </select>
            </div>
            <div className="academic-growth-score">
              {academicGrowth.growthIndex}
            </div>
            <div className="academic-growth-meta">
              <span>{academicGrowth.latestExam?.name ?? "暂无考试数据"}</span>
              <span>覆盖率 {academicGrowth.coverageRate}%</span>
              <span>参考 {academicGrowth.participantCount} 人</span>
            </div>
            <p>{academicGrowth.insight.headline}</p>
          </div>
          <div className="academic-growth-kpis">
            <div>
              <span>最近均分</span>
              <strong>{academicGrowth.averageScore}</strong>
            </div>
            <div>
              <span>进步学生</span>
              <strong>{academicGrowth.progressCount}</strong>
            </div>
            <div>
              <span>预警学生</span>
              <strong>{academicGrowth.riskCount}</strong>
            </div>
          </div>
        </section>

        <section className="panel">
          <div className="panel-title">班级成长矩阵</div>
          <div className="academic-class-matrix">
            <div className="academic-matrix-guide vertical" />
            <div className="academic-matrix-guide horizontal" />
            <div className="academic-matrix-axis x">成长指数</div>
            <div className="academic-matrix-axis y">进步率</div>
            {academicClassMatrixRows.map((item) => (
              <button
                key={item.classId}
                type="button"
                className={`academic-class-node ${item.riskLevel}`}
                style={{
                  left: `${item.xPercent}%`,
                  top: `${item.yPercent}%`,
                  width: `${item.bubbleSize}px`,
                  height: `${item.bubbleSize}px`,
                }}
                onClick={() =>
                  navigateWithQuery("/classes", { classId: item.classId })
                }
              >
                <span className="academic-class-node-dot" />
                <span className="academic-class-node-tip">
                  <strong>{item.className}</strong>
                  <em>成长指数 {item.growthIndex}</em>
                  <em>进步率 {item.progressRate}%</em>
                  <em>参考 {item.participantCount} 人</em>
                </span>
              </button>
            ))}
            {academicClassMatrixRows.length === 0 ? (
              <div className="ck-empty">导入成绩后生成班级成长矩阵</div>
            ) : null}
          </div>
        </section>

        <section className="panel">
          <div className="panel-title">成长四象限</div>
          <div className="academic-quadrant-grid">
            {academicGrowth.quadrants.map((item) => (
              <div
                key={item.key}
                className={`academic-quadrant-card ${item.tone}`}
              >
                <strong>{item.count}</strong>
                <span>{item.label}</span>
              </div>
            ))}
          </div>
          <div className="ck-ai-section">
            <div className="ck-ai-section-label">管理建议</div>
            <div className="ck-ai-text">
              {academicGrowth.insight.suggestion}
            </div>
          </div>
        </section>
      </div>

      <div className="row-2 c50">
        <div className="panel academic-trend-panel">
          <div className="panel-title">学业成长趋势</div>
          {academicGrowth.latestExam ? (
            <div className="academic-trend-kpis">
              <div>
                <span>成长指数</span>
                <strong>{academicGrowth.growthIndex}</strong>
              </div>
              <div>
                <span>年级均分</span>
                <strong>{academicGrowth.averageScore}</strong>
              </div>
              <div>
                <span>覆盖率</span>
                <strong>{academicGrowth.coverageRate}%</strong>
              </div>
              <div>
                <span>参考人数</span>
                <strong>{academicGrowth.participantCount}</strong>
              </div>
            </div>
          ) : null}
          <div className="academic-trend-list">
            {academicTrendPanelItems.map((row) => {
              if (row.kind === "exam") {
                const item = row.item;
                const examDate = item.examDate || item.importedAt
                  ? new Date(item.examDate || item.importedAt).toLocaleDateString("zh-CN", {
                      month: "numeric",
                      day: "numeric",
                    })
                  : "";
                return (
                  <div className="academic-trend-card" key={row.key}>
                    <div className="academic-trend-card-head">
                      <div>
                        <strong title={item.examName}>{item.examName}</strong>
                        <span>
                          {examDate ? `${examDate} · ` : ""}
                          {item.participantCount} 人参考
                        </span>
                      </div>
                      <b>均分 {item.averageScore}</b>
                    </div>
                    <div className="academic-trend-dual">
                      <div className="academic-trend-metric">
                        <em>进步率</em>
                        <div className="academic-trend-track">
                          <i
                            style={{
                              width: `${Math.max(6, Math.min(100, item.progressRate))}%`,
                            }}
                          />
                        </div>
                        <strong>{item.progressRate}%</strong>
                      </div>
                      <div className="academic-trend-metric is-decline">
                        <em>退步率</em>
                        <div className="academic-trend-track">
                          <i
                            style={{
                              width: `${Math.max(6, Math.min(100, item.declineRate))}%`,
                            }}
                          />
                        </div>
                        <strong>{item.declineRate}%</strong>
                      </div>
                    </div>
                  </div>
                );
              }
              if (row.kind === "class") {
                const item = row.item;
                return (
                  <button
                    type="button"
                    className="academic-trend-card academic-trend-card-button"
                    key={row.key}
                    onClick={() =>
                      navigateWithQuery("/classes", { classId: item.classId })
                    }
                  >
                    <div className="academic-trend-card-head">
                      <div>
                        <strong>{item.className}</strong>
                        <span>班级成长亮点 · 成长指数 {item.growthIndex}</span>
                      </div>
                      <b>均分 {item.averageScore}</b>
                    </div>
                    <div className="academic-trend-card-foot">
                      进步 {item.progressCount} 人 · 退步 {item.declineCount} 人 ·
                      参考 {item.participantCount} 人
                    </div>
                  </button>
                );
              }
              const item = row.item;
              return (
                <button
                  type="button"
                  className="academic-trend-card academic-trend-card-button"
                  key={row.key}
                  onClick={() =>
                    navigateWithQuery("/students", {
                      studentId: item.studentId,
                      classId: item.classId,
                      statsView: "student",
                    })
                  }
                >
                  <div className="academic-trend-card-head">
                    <div>
                      <strong>
                        {item.studentName} · {item.className}
                      </strong>
                      <span>进步之星 · 较上次 +{item.rankDelta || item.scoreDelta}</span>
                    </div>
                    <b>总分 {item.totalScore}</b>
                  </div>
                  <div className="academic-trend-card-foot">{item.reason}</div>
                </button>
              );
            })}
            {academicTrendPanelItems.length === 0 ? (
              <div className="ck-empty">暂无跨考试趋势</div>
            ) : null}
          </div>
        </div>
        <div className="panel academic-risk-panel">
          <div className="panel-title">学业关注名单</div>
          {academicGrowth.latestExam ? (
            <div className="academic-trend-kpis academic-risk-kpis">
              <div>
                <span>预警学生</span>
                <strong>{academicGrowth.riskCount}</strong>
              </div>
              <div>
                <span>退步人数</span>
                <strong>{academicGrowth.declineCount}</strong>
              </div>
              <div>
                <span>重点帮扶</span>
                <strong>
                  {academicGrowth.quadrants.find((item) => item.key === "risk")
                    ?.count ?? 0}
                </strong>
              </div>
              <div>
                <span>高分承压</span>
                <strong>
                  {academicGrowth.quadrants.find((item) => item.key === "quiet")
                    ?.count ?? 0}
                </strong>
              </div>
            </div>
          ) : null}
          <div className="academic-trend-list">
            {academicRiskPanelItems.map((row) => {
              if (row.kind === "class") {
                const item = row.item;
                const declineRate = item.participantCount
                  ? Math.round((item.declineCount / item.participantCount) * 100)
                  : 0;
                const progressRate = item.participantCount
                  ? Math.round((item.progressCount / item.participantCount) * 100)
                  : 0;
                return (
                  <button
                    type="button"
                    className="academic-trend-card academic-trend-card-button academic-risk-card"
                    key={row.key}
                    onClick={() =>
                      navigateWithQuery("/classes", { classId: item.classId })
                    }
                  >
                    <div className="academic-trend-card-head">
                      <div>
                        <strong>{item.className}</strong>
                        <span>
                          学业风险班级 ·{" "}
                          {item.riskLevel === "high" ? "高风险" : "需关注"}
                        </span>
                      </div>
                      <b>均分 {item.averageScore}</b>
                    </div>
                    <div className="academic-trend-dual">
                      <div className="academic-trend-metric is-decline">
                        <em>退步率</em>
                        <div className="academic-trend-track">
                          <i
                            style={{
                              width: `${Math.max(6, Math.min(100, declineRate))}%`,
                            }}
                          />
                        </div>
                        <strong>{declineRate}%</strong>
                      </div>
                      <div className="academic-trend-metric">
                        <em>进步率</em>
                        <div className="academic-trend-track">
                          <i
                            style={{
                              width: `${Math.max(6, Math.min(100, progressRate))}%`,
                            }}
                          />
                        </div>
                        <strong>{progressRate}%</strong>
                      </div>
                    </div>
                    <div className="academic-trend-card-foot academic-risk-card-foot">
                      退步 {item.declineCount} 人 · 进步 {item.progressCount} 人 ·
                      参考 {item.participantCount} 人
                    </div>
                  </button>
                );
              }
              const item = row.item;
              const scoreWidth = Math.max(
                6,
                Math.min(
                  100,
                  Math.round(
                    (Math.abs(item.scoreDelta) /
                      academicRiskMetricMax.scoreDelta) *
                      100,
                  ),
                ),
              );
              const rankWidth = Math.max(
                6,
                Math.min(
                  100,
                  Math.round(
                    (Math.abs(item.rankDelta) /
                      academicRiskMetricMax.rankDelta) *
                      100,
                  ),
                ),
              );
              return (
                <button
                  type="button"
                  className="academic-trend-card academic-trend-card-button academic-risk-card"
                  key={row.key}
                  onClick={() =>
                    navigateWithQuery("/students", {
                      studentId: item.studentId,
                      classId: item.classId,
                      statsView: "student",
                    })
                  }
                >
                  <div className="academic-trend-card-head">
                    <div>
                      <strong>
                        {item.studentName} · {item.className}
                      </strong>
                      <span>
                        {row.tag} · {item.reason}
                      </span>
                    </div>
                    <b>总分 {item.totalScore}</b>
                  </div>
                  <div className="academic-trend-dual">
                    <div className="academic-trend-metric is-decline">
                      <em>较上次分差</em>
                      <div className="academic-trend-track">
                        <i style={{ width: `${scoreWidth}%` }} />
                      </div>
                      <strong>
                        {item.scoreDelta > 0 ? "+" : ""}
                        {item.scoreDelta}
                      </strong>
                    </div>
                    <div className="academic-trend-metric is-decline">
                      <em>名次变化</em>
                      <div className="academic-trend-track">
                        <i style={{ width: `${rankWidth}%` }} />
                      </div>
                      <strong>
                        {item.rankDelta > 0 ? "+" : ""}
                        {item.rankDelta}
                      </strong>
                    </div>
                  </div>
                  <div className="academic-trend-card-foot academic-risk-card-foot">
                    <span>点击查看学生学业档案</span>
                    <b>跟进</b>
                  </div>
                </button>
              );
            })}
            {academicRiskPanelItems.length === 0 ? (
              <div className="ck-empty">暂无学业预警学生</div>
            ) : null}
          </div>
        </div>
      </div>

      {/* 第二层：主视觉中心 —— 趋势图 + AI 洞察 */}
      <div className="ck-hero-row">
        <div className="ck-hero-chart panel">
          <div className="panel-title">班级积分Top10</div>
          <div
            className="ck-top10-chart"
            role="img"
            aria-label="全校班级积分排名前10柱状图"
          >
            {cockpitTop10Bars.map((item) => (
              <button
                type="button"
                key={item.id}
                className={`ck-top10-bar-col ${item.rank <= 3 ? "is-top" : ""}`}
                title={`${item.label} · ${item.value} 分`}
                onClick={() =>
                  navigateWithQuery("/classes", { classId: item.id })
                }
              >
                <span className="ck-top10-bar-value">{item.value}</span>
                <div className="ck-top10-bar-track">
                  <span
                    className="ck-top10-bar-fill"
                    style={{ height: `${item.heightPercent}%` }}
                  />
                </div>
                <span className="ck-top10-bar-label">{item.label}</span>
              </button>
            ))}
            {cockpitTop10Bars.length === 0 ? (
              <div className="ck-empty">暂无班级积分数据</div>
            ) : null}
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
                  {cockpitAiInsight.source === "ark" ? "AI 生成" : "规则推导"} ·{" "}
                  {new Date(cockpitAiInsight.generatedAt).toLocaleDateString(
                    "zh-CN",
                  )}
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
      <div className="ck-section-label">
        <span>数据结构分析</span>
      </div>
      <div className="ck-grid-3">
        <div className="panel ck-class-compare-panel">
          <div className="panel-title">
            <span>班级积分排名</span>
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
                onClick={() =>
                  navigateWithQuery("/classes", { classId: item.id })
                }
              >
                <span className="bar-label">{item.name}</span>
                <div className="bar-track">
                  <div
                    className={`bar-fill ${item.colorIndex % 3 === 0 ? "bar-blue" : item.colorIndex % 3 === 1 ? "bar-green" : "bar-red"}`}
                    style={{
                      width: `${Math.max(28, Math.round((item.value / item.maxScore) * 100))}%`,
                    }}
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
            {(cockpitRuleDistribution.length > 0
              ? cockpitRuleDistribution
              : Array.from(
                  rules.reduce((m, r) => {
                    const k = r.dimension || "未分类";
                    m.set(k, (m.get(k) ?? 0) + 1);
                    return m;
                  }, new Map<string, number>()),
                ).map(([name, value]) => ({ name, value }))
            )
              .slice(0, 6)
              .map((item, index) => {
                const maxVal = Math.max(
                  ...(cockpitRuleDistribution.length > 0
                    ? cockpitRuleDistribution
                    : [{ name: "", value: 1 }]
                  ).map((x) => x.value),
                  1,
                );
                return (
                  <div className="bar-row" key={item.name}>
                    <span className="bar-label">{item.name}</span>
                    <div className="bar-track">
                      <div
                        className={`bar-fill ${index % 3 === 0 ? "bar-blue" : index % 3 === 1 ? "bar-green" : "bar-red"}`}
                        style={{
                          width: `${Math.max(28, Math.round((item.value / maxVal) * 100))}%`,
                        }}
                      >
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
              const maxVal = Math.max(
                ...cockpitSubjectDistribution.map((x) => x.value),
                1,
              );
              return (
                <div className="bar-row" key={item.name}>
                  <span className="bar-label">
                    {ruleSubjectLabelMap[item.name] ?? item.name}
                  </span>
                  <div className="bar-track">
                    <div
                      className={`bar-fill ${index % 3 === 0 ? "bar-blue" : index % 3 === 1 ? "bar-green" : "bar-red"}`}
                      style={{
                        width: `${Math.max(28, Math.round((item.value / maxVal) * 100))}%`,
                      }}
                    >
                      {item.value}
                    </div>
                  </div>
                  <span className="bar-val">{item.value}</span>
                </div>
              );
            })}
            {cockpitSubjectDistribution.length === 0 ? (
              <div className="ck-empty">暂无学科事件数据</div>
            ) : null}
          </div>
        </div>
      </div>

      {/* 第四层：评价热力图 */}
      {cockpitHeatRows.length > 0 ? (
        <>
          <div className="ck-section-label">
            <span>评价时段分布</span>
          </div>
          <div className="panel ck-heatmap-panel">
            <div
              className="ck-heatmap-grid"
              style={{
                gridTemplateColumns: `80px repeat(${cockpitHeatCols.length}, 1fr)`,
              }}
            >
              <div className="ck-heatmap-cell ck-heatmap-corner" />
              {cockpitHeatCols.map((col) => (
                <div
                  key={col}
                  className="ck-heatmap-cell ck-heatmap-col-header"
                >
                  {col}
                </div>
              ))}
              {cockpitHeatRows.map((row, ri) => (
                <div
                  className="ck-heatmap-row-group"
                  key={row}
                  style={{ display: "contents" }}
                >
                  <div className="ck-heatmap-cell ck-heatmap-row-header">
                    {row}
                  </div>
                  {cockpitHeatCols.map((col, ci) => {
                    const count = cockpitHeatData[ri]?.values[ci] ?? 0;
                    const intensity =
                      count >= 8
                        ? 4
                        : count >= 5
                          ? 3
                          : count >= 2
                            ? 2
                            : count >= 1
                              ? 1
                              : 0;
                    return (
                      <div
                        key={`${row}-${col}`}
                        className={`ck-heatmap-cell ck-heat-${intensity}`}
                      >
                        {count}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </>
      ) : null}

      {/* 第五层：榜单与亮点 */}
      <div className="ck-section-label">
        <span>榜单与亮点</span>
      </div>
      <div className="ck-grid-3">
        <div className="panel">
          <div className="panel-title">明星班级</div>
          <div className="ck-rank-table">
            {cockpitTopClasses.slice(0, 6).map((item, index) => (
              <button
                key={item.id}
                type="button"
                className="ck-rank-row"
                onClick={() =>
                  navigateWithQuery("/classes", { classId: item.id })
                }
              >
                <span className={`rank-num r${Math.min(index + 1, 3)}`}>
                  {index + 1}
                </span>
                <span className="ck-rank-name">{item.name}</span>
                <span className="ck-rank-score">
                  {item.currentScoreTotal} 分
                </span>
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
                onClick={() =>
                  navigateWithQuery("/students", {
                    studentId: item.studentId,
                    classId: item.classId,
                    statsView: "student",
                  })
                }
              >
                <span className={`rank-num r${Math.min(index + 1, 3)}`}>
                  {index + 1}
                </span>
                <span className="ck-rank-name">
                  {item.studentName}
                  <span className="ck-rank-class">{item.className}</span>
                </span>
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
                  <strong>
                    {item.studentName ?? item.className} · {item.honorName}
                  </strong>
                  <span>
                    {item.grantedByName
                      ? `由 ${item.grantedByName} 授予`
                      : "系统授予"}{" "}
                    · {new Date(item.grantedAt).toLocaleDateString("zh-CN")}
                  </span>
                </div>
              </div>
            ))}
            {cockpitRecentHonors.length === 0 ? (
              <div className="ck-empty">暂无荣誉记录</div>
            ) : null}
          </div>
        </div>
      </div>

      {/* 第六层：学生成长分层 + 最新动态 */}
      <div className="ck-section-label">
        <span>学生成长与最近动态</span>
      </div>
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
              <div
                className="ck-activity-item"
                key={`${item.id}-${item.createdAt}`}
              >
                <span
                  className={`ck-activity-delta ${item.scoreDelta >= 0 ? "up" : "down"}`}
                >
                  {item.scoreDelta > 0 ? "+" : ""}
                  {item.scoreDelta}
                </span>
                <div className="ck-activity-body">
                  <strong>
                    {item.operatorName ?? item.sourceRole} →{" "}
                    {item.ruleName || item.tag || item.dimension || "评价"}
                  </strong>
                  <span>
                    {new Date(item.createdAt).toLocaleString("zh-CN", {
                      hour12: false,
                      month: "2-digit",
                      day: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>
            ))}
            {recentScoreRecords.length === 0 ? (
              <div className="ck-empty">暂无最近评价动态</div>
            ) : null}
          </div>
        </div>
      </div>

      {/* 第七层：风险预警 */}
      <div className="ck-section-label">
        <span>风险预警</span>
      </div>
      <div className="row-2 c50">
        <div className="panel">
          <div className="panel-title">风险学生</div>
          <div className="ck-risk-table">
            {cockpitRiskStudents.slice(0, 6).map((item) => (
              <button
                key={item.studentId}
                type="button"
                className="ck-risk-row"
                onClick={() =>
                  navigateWithQuery("/students", {
                    studentId: item.studentId,
                    statsView: "student",
                  })
                }
              >
                <span className={`ck-risk-badge ${item.riskLevel}`}>
                  {item.riskLevel === "high"
                    ? "高"
                    : item.riskLevel === "medium"
                      ? "中"
                      : "低"}
                </span>
                <div className="ck-risk-body">
                  <strong>{item.studentName}</strong>
                  <span>
                    {item.className} · 负向 {item.negativeCount} 次 · 净变化{" "}
                    {item.scoreDelta}
                  </span>
                </div>
                <span className="ck-risk-reason">{item.reason}</span>
              </button>
            ))}
            {cockpitRiskStudents.length === 0 ? (
              <div className="ck-empty">暂无明显风险学生</div>
            ) : null}
          </div>
        </div>
        <div className="panel">
          <div className="panel-title">系统预警</div>
          <div className="alert-list">
            {cockpitAlerts.map((item, index) => (
              <div
                className={`alert-item ${item.level === "ok" ? "ok" : "warn"}`}
                key={`${item.level}-${index}`}
              >
                {item.text}
              </div>
            ))}
          </div>
          <div className="ck-terminal-strip">
            <div className="ck-terminal-stat">
              <span>展示终端</span>
              <strong>
                {cockpitKpi.onlineTerminals}
                <span className="ck-kpi-frac">/{cockpitKpi.terminalCount}</span>
              </strong>
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
          <div className="ck-section-label">
            <span>组织治理概览</span>
          </div>
          <div className="ck-gov-strip">
            <div
              className="ck-gov-card"
              role="button"
              tabIndex={0}
              onClick={() =>
                navigateWithQuery("/teachers", { teacherView: "all" })
              }
              onKeyDown={(e) => {
                if (e.key === "Enter")
                  navigateWithQuery("/teachers", { teacherView: "all" });
              }}
            >
              <span>教师账号</span>
              <strong>{governanceMetrics.teacherUsers.length}</strong>
            </div>
            <div
              className="ck-gov-card"
              role="button"
              tabIndex={0}
              onClick={() =>
                navigateWithQuery("/classes", { teacherStatus: "unassigned" })
              }
              onKeyDown={(e) => {
                if (e.key === "Enter")
                  navigateWithQuery("/classes", {
                    teacherStatus: "unassigned",
                  });
              }}
            >
              <span>待补班主任</span>
              <strong>{governanceMetrics.uncoveredClasses}</strong>
            </div>
            <div
              className="ck-gov-card"
              role="button"
              tabIndex={0}
              onClick={() =>
                navigateWithQuery("/organization", {
                  activeTab: "accounts",
                  quickFilter: "disabled",
                })
              }
              onKeyDown={(e) => {
                if (e.key === "Enter")
                  navigateWithQuery("/organization", {
                    activeTab: "accounts",
                    quickFilter: "disabled",
                  });
              }}
            >
              <span>停用账号</span>
              <strong>{governanceMetrics.disabledUsers}</strong>
            </div>
            <div
              className="ck-gov-card"
              role="button"
              tabIndex={0}
              onClick={() =>
                navigateWithQuery("/organization", {
                  activeTab: "accounts",
                  quickFilter: "high_privilege",
                })
              }
              onKeyDown={(e) => {
                if (e.key === "Enter")
                  navigateWithQuery("/organization", {
                    activeTab: "accounts",
                    quickFilter: "high_privilege",
                  });
              }}
            >
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
                    onClick={() =>
                      navigateWithQuery("/teachers", {
                        teacherView: "all",
                        statsView: "grade",
                        gradeName: item.gradeName,
                      })
                    }
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
                    onClick={() =>
                      navigateWithQuery("/organization", {
                        activeTab: "accounts",
                        userId: item.id,
                      })
                    }
                  >
                    <div>
                      <strong>{item.name}</strong>
                      <span>
                        {item.roleName} ·{" "}
                        {item.lastLoginAt ? "已停用" : "从未登录"}
                      </span>
                    </div>
                    <b>{item.status === "enabled" ? "未登录" : "已停用"}</b>
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

      {renderCallQueueModal()}
    </Shell>
  );
}

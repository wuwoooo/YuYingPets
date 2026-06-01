import { useEffect, useMemo, useState } from "react";
import { Modal } from "../components/Modal";
import { PickerInput } from "../components/PickerInput";
import { Shell } from "../components/Shell";
import type {
  DisplaySettingsUpdatePayload,
  PetGrowthSettingsUpdatePayload,
  SemesterSettingsUpdatePayload,
  SessionUser,
  SystemSettings,
  TeacherOccupancyRule,
} from "../lib/api";
import { adminApi } from "../lib/api";
import { notifySettingsUpdated } from "../hooks/useCurrentSemesterName";
import type {
  DisplayFormState,
  PetGrowthFormState,
  SemesterFormState,
} from "../types/admin";
import {
  createDisplayForm,
  createPetGrowthForm,
  createSemesterForm,
} from "../utils/adminForms";

type SettingsPageProps = {
  token: string;
  user: SessionUser | null;
  loading: boolean;
  error: string | null;
};

type MissingTeacherDraft = {
  teacherName: string;
  create: boolean;
  username: string;
  password: string;
  roleCode: "subject_teacher" | "homeroom_teacher";
};

type MissingClassDraft = {
  className: string;
  create: boolean;
  gradeName: string;
};

const subjectOptions = [
  { code: "chinese", label: "语文" },
  { code: "math", label: "数学" },
  { code: "english", label: "英语" },
  { code: "physics", label: "物理" },
  { code: "chemistry", label: "化学" },
  { code: "geography", label: "地理" },
  { code: "biology", label: "生物" },
  { code: "history", label: "历史" },
  { code: "politics", label: "政治" },
  { code: "computer", label: "计算机" },
  { code: "art", label: "美术" },
  { code: "music", label: "音乐" },
  { code: "pe", label: "体育" },
] as const;

const weekdayOptions = [
  { value: 1, label: "周一" },
  { value: 2, label: "周二" },
  { value: 3, label: "周三" },
  { value: 4, label: "周四" },
  { value: 5, label: "周五" },
] as const;

export function SettingsPage({
  token,
  user,
  loading,
  error,
}: SettingsPageProps) {
  const [tab, setTab] = useState<"semester" | "petGrowth" | "display">(
    "semester",
  );
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [semesterForm, setSemesterForm] = useState<SemesterFormState>(() =>
    createSemesterForm(),
  );
  const [displayForm, setDisplayForm] = useState<DisplayFormState>(() =>
    createDisplayForm(),
  );
  const [petGrowthForm, setPetGrowthForm] = useState<PetGrowthFormState>(() =>
    createPetGrowthForm(),
  );
  const [pageLoading, setPageLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<
    "semester" | "research" | "petGrowth" | "display" | null
  >(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [scheduleFile, setScheduleFile] = useState<File | null>(null);
  const [importingSchedule, setImportingSchedule] = useState(false);
  const [pendingMissingTeachers, setPendingMissingTeachers] = useState<MissingTeacherDraft[]>([]);
  const [pendingMissingClasses, setPendingMissingClasses] = useState<MissingClassDraft[]>([]);
  const [researchRules, setResearchRules] = useState<TeacherOccupancyRule[]>([]);

  const displayModeLabel = "班级首页";
  const displayAnimationLabel = (
    {
      slow: "舒缓切换",
      normal: "标准节奏",
      fast: "快速切换",
    } as const
  )[displayForm.animationSpeed];
  const gradeOptions = useMemo(
    () => (settings?.gradeConfigs ?? []).filter((item) => item.status === "enabled").map((item) => item.name),
    [settings?.gradeConfigs],
  );

  async function loadSettings(activeRef?: { active: boolean }) {
    setPageLoading(true);
    try {
      const response = await adminApi.settings(token);
      const researchRuleResponse = await adminApi.teacherOccupancyRules(token);
      if (activeRef && !activeRef.active) return;
      setSettings(response.data);
      setResearchRules(researchRuleResponse.data);
      setPetGrowthForm(createPetGrowthForm(response.data.school));
      setSemesterForm(createSemesterForm(response.data.semester));
      setDisplayForm({
        ...createDisplayForm(response.data.display),
        defaultMode: "daily",
      });
    } catch (err) {
      if (activeRef && !activeRef.active) return;
      setSubmitError(err instanceof Error ? err.message : "系统配置加载失败");
    } finally {
      if (!activeRef || activeRef.active) setPageLoading(false);
    }
  }

  useEffect(() => {
    const activeRef = { active: true };
    void loadSettings(activeRef);

    return () => {
      activeRef.active = false;
    };
  }, [token]);

  async function handleSemesterSave() {
    if (savingKey) return;
    setSubmitError(null);
    setSubmitSuccess(null);
    setSavingKey("semester");

    try {
      if (!semesterForm.id) {
        throw new Error("请先配置当前学期");
      }
      if (
        !semesterForm.name.trim() ||
        !semesterForm.startDate ||
        !semesterForm.endDate
      ) {
        throw new Error("请填写完整的学期名称和起止日期");
      }
      if (semesterForm.startDate > semesterForm.endDate) {
        throw new Error("学期开始日期不能晚于结束日期");
      }

      const payload: SemesterSettingsUpdatePayload = {
        id: Number(semesterForm.id),
        name: semesterForm.name.trim(),
        startDate: semesterForm.startDate,
        endDate: semesterForm.endDate,
      };
      await adminApi.updateSemesterSettings(token, payload);
      await loadSettings();
      notifySettingsUpdated();
      setSubmitSuccess("学期配置已保存");
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "学期配置保存失败");
    } finally {
      setSavingKey(null);
    }
  }

  async function handleDisplaySave() {
    if (savingKey) return;
    setSubmitError(null);
    setSubmitSuccess(null);
    setSavingKey("display");

    try {
      if (!displayForm.title.trim()) {
        throw new Error("展示主标题不能为空");
      }
      if (!displayForm.weatherLabel.trim()) {
        throw new Error("天气城市名称不能为空");
      }

      const weatherLatitude = Number(displayForm.weatherLatitude);
      const weatherLongitude = Number(displayForm.weatherLongitude);
      if (!Number.isFinite(weatherLatitude) || weatherLatitude < -90 || weatherLatitude > 90) {
        throw new Error("天气纬度必须在 -90 到 90 之间");
      }
      if (!Number.isFinite(weatherLongitude) || weatherLongitude < -180 || weatherLongitude > 180) {
        throw new Error("天气经度必须在 -180 到 180 之间");
      }

      const payload: DisplaySettingsUpdatePayload = {
        title: displayForm.title.trim(),
        subtitle: displayForm.subtitle.trim() || undefined,
        bgImageUrl: displayForm.bgImageUrl.trim() || undefined,
        weatherLabel: displayForm.weatherLabel.trim(),
        weatherLatitude,
        weatherLongitude,
        animationSpeed: displayForm.animationSpeed,
        defaultMode: "daily",
        allowSkipAnimation: displayForm.allowSkipAnimation,
      };
      await adminApi.updateDisplaySettings(token, payload);
      await loadSettings();
      setSubmitSuccess("展示设置已保存");
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "展示设置保存失败");
    } finally {
      setSavingKey(null);
    }
  }

  async function handlePetGrowthSave() {
    if (savingKey) return;
    setSubmitError(null);
    setSubmitSuccess(null);
    setSavingKey("petGrowth");

    try {
      const classScoreStudentLinkMultiplier = petGrowthForm.classScoreStudentLinkMultiplier.trim();
      if (!/^\d+$/.test(classScoreStudentLinkMultiplier)) {
        throw new Error("班级评价联动倍率必须是大于等于 0 的整数");
      }

      const petDecoChangeCost = petGrowthForm.petDecoChangeCost.trim();
      if (!/^\d+$/.test(petDecoChangeCost)) {
        throw new Error("装扮更换积分消耗必须是大于等于 0 的整数");
      }
      if (Number(petDecoChangeCost) > 999) {
        throw new Error("装扮更换积分消耗不能超过 999");
      }

      const thresholds = petGrowthForm.thresholds.map((value, index) => {
        const trimmed = value.trim();
        if (!/^\d+$/.test(trimmed)) {
          throw new Error(`Lv.${index + 1} 的成长阈值必须是大于等于 0 的整数`);
        }
        return Number(trimmed);
      });

      for (let index = 1; index < thresholds.length; index += 1) {
        if (thresholds[index] < thresholds[index - 1]) {
          throw new Error(`Lv.${index + 1} 的成长阈值不能小于前一级`);
        }
      }

      const payload: PetGrowthSettingsUpdatePayload = {
        thresholds,
        classScoreStudentLinkMultiplier: Number(classScoreStudentLinkMultiplier),
        petDecoChangeCost: Number(petDecoChangeCost),
      };
      await adminApi.updatePetGrowthSettings(token, payload);
      await loadSettings();
      setSubmitSuccess("萌宠成长设置已保存");
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "萌宠成长设置保存失败");
    } finally {
      setSavingKey(null);
    }
  }

  async function handleResearchRulesSave() {
    if (savingKey) return;
    setSubmitError(null);
    setSubmitSuccess(null);
    setSavingKey("research");
    try {
      await adminApi.updateTeacherOccupancyRules(token, researchRules);
      await loadSettings();
      setSubmitSuccess("教研时间规则已保存");
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "教研时间规则保存失败");
    } finally {
      setSavingKey(null);
    }
  }

  function toggleResearchRuleWeekday(ruleId: number, weekday: number, checked: boolean) {
    setResearchRules((prev) =>
      prev.map((rule) =>
        rule.id === ruleId
          ? {
              ...rule,
              weekdays: checked
                ? Array.from(new Set([...rule.weekdays, weekday])).sort()
                : rule.weekdays.filter((item) => item !== weekday),
            }
          : rule,
      ),
    );
  }

  function toggleResearchRuleSubject(ruleId: number, subjectCode: string, checked: boolean) {
    setResearchRules((prev) =>
      prev.map((rule) =>
        rule.id === ruleId
          ? {
              ...rule,
              subjectCodes: checked
                ? Array.from(new Set([...rule.subjectCodes, subjectCode]))
                : rule.subjectCodes.filter((item) => item !== subjectCode),
            }
          : rule,
      ),
    );
  }

  async function handleImportSchedule() {
    if (importingSchedule) return;
    setSubmitError(null);
    setSubmitSuccess(null);
    setImportingSchedule(true);
    try {
      const result = await adminApi.importTeacherScheduleFromXls(token, {
        file: scheduleFile ?? undefined,
        createMissingTeachers: false,
      });
      if (
        result.data.needConfirmCreateTeachers &&
        ((result.data.missingTeachers?.length ?? 0) > 0 || (result.data.missingClasses?.length ?? 0) > 0)
      ) {
        setPendingMissingTeachers(
          (result.data.missingTeachers ?? []).map((item) => ({
            teacherName: item.teacherName,
            create: true,
            username: item.defaultUsername,
            password: item.defaultPassword,
            roleCode: item.defaultRoleCode,
          })),
        );
        setPendingMissingClasses(
          (result.data.missingClasses ?? []).map((className) => ({
            className,
            create: true,
            gradeName: gradeOptions[0] ?? "",
          })),
        );
        return;
      }
      await loadSettings();
      setSubmitSuccess(
        `课表导入完成：匹配教师 ${result.data.matchedTeacherCount} 人，导入课时 ${result.data.importedSlotCount} 条，待关联课时 ${result.data.pendingSlotCount ?? 0} 条`,
      );
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "课表导入失败");
    } finally {
      setImportingSchedule(false);
    }
  }

  async function handleConfirmScheduleImport() {
    if (importingSchedule) return;
    setSubmitError(null);
    setSubmitSuccess(null);
    setImportingSchedule(true);
    try {
      const missingGradeClass = pendingMissingClasses.find((item) => item.create && !item.gradeName.trim());
      if (missingGradeClass) {
        throw new Error(`请为班级 ${missingGradeClass.className} 选择所属年级`);
      }
      const result = await adminApi.importTeacherScheduleFromXlsAdvanced(token, {
        file: scheduleFile ?? undefined,
        createMissingTeachers: true,
        missingTeacherConfigs: pendingMissingTeachers.map((item) => ({
          teacherName: item.teacherName,
          create: item.create,
          username: item.username,
          password: item.password,
          roleCode: item.roleCode,
        })),
        missingClassConfigs: pendingMissingClasses.map((item) => {
          const grade = settings?.gradeConfigs?.find((gradeItem) => gradeItem.name === item.gradeName);
          return {
            className: item.className,
            create: item.create,
            gradeName: item.gradeName,
            gradeCode: grade?.code,
          };
        }),
      });
      setPendingMissingTeachers([]);
      setPendingMissingClasses([]);
      await loadSettings();
      setSubmitSuccess(
        `课表导入完成：新增教师 ${result.data.createdTeacherCount ?? 0} 人，新增班级 ${result.data.createdClassCount ?? 0} 个，匹配教师 ${result.data.matchedTeacherCount} 人，导入课时 ${result.data.importedSlotCount} 条，待关联课时 ${result.data.pendingSlotCount ?? 0} 条`,
      );
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "课表导入确认失败");
    } finally {
      setImportingSchedule(false);
    }
  }

  return (
    <Shell
      title="系统设置"
      subtitle="统一维护学期、萌宠成长和展示大屏等系统参数"
      loading={loading || pageLoading}
      user={user}
      status={
        <>
          {loading || pageLoading ? (
            <div className="status-card">系统配置载入中...</div>
          ) : null}
          {error ? <div className="status-card error">{error}</div> : null}
          {submitError ? (
            <div className="status-card error">{submitError}</div>
          ) : null}
          {submitSuccess ? (
            <div className="status-card success">{submitSuccess}</div>
          ) : null}
        </>
      }
    >
      <div className="page-header">
        <h2>系统设置</h2>
      </div>
      <div className="settings-tabs">
        {[
          ["semester", "学期配置"],
          ["petGrowth", "萌宠成长"],
          ["display", "展示大屏"],
        ].map(([key, label]) => (
          <button
            key={key}
            type="button"
            className={`settings-tab${tab === key ? " active" : ""}`}
            onClick={() => setTab(key as typeof tab)}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="panel">
        {tab === "semester" ? (
          <div className="settings-form">
            <div className="settings-summary-grid">
              <div className="settings-summary-card">
                <span>当前状态</span>
                <strong>
                  {settings?.semester?.status === "enabled"
                    ? "进行中"
                    : "未启用"}
                </strong>
                <p>当前学期作为后台统计、榜单与荣誉归属的默认口径。</p>
              </div>
              <div className="settings-summary-card">
                <span>当前学期</span>
                <strong>{semesterForm.name || "-"}</strong>
                <p>切换当前学期后，系统会自动把其他学期标记为历史学期。</p>
              </div>
            </div>
            <div className="s-field">
              <label>学期名称</label>
              <input
                type="text"
                value={semesterForm.name}
                onChange={(event) =>
                  setSemesterForm((prev) => ({
                    ...prev,
                    name: event.target.value,
                  }))
                }
              />
            </div>
            <div className="s-row">
              <div className="s-field">
                <label>开始日期</label>
                <PickerInput
                  type="date"
                  value={semesterForm.startDate}
                  onChange={(event) =>
                    setSemesterForm((prev) => ({
                      ...prev,
                      startDate: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="s-field">
                <label>结束日期</label>
                <PickerInput
                  type="date"
                  value={semesterForm.endDate}
                  onChange={(event) =>
                    setSemesterForm((prev) => ({
                      ...prev,
                      endDate: event.target.value,
                    }))
                  }
                />
              </div>
            </div>
            <div className="form-actions">
              <button
                type="button"
                className="toolbar-button"
                onClick={() => void handleSemesterSave()}
                disabled={savingKey !== null}
              >
                {savingKey === "semester" ? "保存中..." : "保存学期配置"}
              </button>
            </div>
            <div className="panel" style={{ marginTop: 20 }}>
              <div className="page-header" style={{ alignItems: "center" }}>
                <div>
                  <div className="panel-title">课程表导入</div>
                  <p className="page-desc">上传 `.xlsx` 后，系统会预检缺失教师与缺失班级，再决定创建或继续导入。</p>
                </div>
                <div className="page-actions">
                  <label className="teacher-upload-trigger">
                    <input
                      type="file"
                      accept=".xlsx"
                      onChange={(event) => setScheduleFile(event.target.files?.[0] ?? null)}
                    />
                    <span>{scheduleFile ? "重新选择文件" : "选择课表文件"}</span>
                  </label>
                  <div className="teacher-upload-file-name">
                    {scheduleFile ? scheduleFile.name : "支持 .xlsx"}
                  </div>
                  <button
                    type="button"
                    className="toolbar-button"
                    onClick={() => void handleImportSchedule()}
                    disabled={importingSchedule}
                  >
                    {importingSchedule ? "导入中..." : "执行导入"}
                  </button>
                </div>
              </div>
              <div className="settings-note" style={{ marginTop: 14 }}>
                这里只负责导入与预检。课程表查看已经放回“教师管理”，方便领导按教师与班级随时查看排课情况。
              </div>
            </div>
            <div className="panel" style={{ marginTop: 20 }}>
              <div className="page-header" style={{ alignItems: "center" }}>
                <div>
                  <div className="panel-title">教研时间规则</div>
                  <p className="page-desc">教研活动会计入教师忙闲状态。教师管理里筛选空闲老师时，会自动排除命中教研规则的教师。</p>
                </div>
                <button
                  type="button"
                  className="toolbar-button"
                  onClick={() => void handleResearchRulesSave()}
                  disabled={savingKey !== null}
                >
                  {savingKey === "research" ? "保存中..." : "保存教研规则"}
                </button>
              </div>
              <div className="data-table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>规则</th>
                      <th>星期</th>
                      <th>时间</th>
                      <th>学科</th>
                      <th>状态</th>
                    </tr>
                  </thead>
                  <tbody>
                    {researchRules.map((rule) => (
                      <tr key={rule.id}>
                        <td>
                          <input
                            className="filter-select"
                            value={rule.name}
                            onChange={(event) =>
                              setResearchRules((prev) =>
                                prev.map((item) => (item.id === rule.id ? { ...item, name: event.target.value } : item)),
                              )
                            }
                          />
                        </td>
                        <td>
                          <div className="settings-tag-row compact">
                            {weekdayOptions.map((weekday) => (
                              <label className="checkbox-item compact" key={`${rule.id}-${weekday.value}`}>
                                <input
                                  type="checkbox"
                                  checked={rule.weekdays.includes(weekday.value)}
                                  onChange={(event) => toggleResearchRuleWeekday(rule.id, weekday.value, event.target.checked)}
                                />
                                {weekday.label}
                              </label>
                            ))}
                          </div>
                        </td>
                        <td>
                          <div className="page-actions">
                            <PickerInput
                              wrapperClassName="picker-input-inline"
                              className="filter-select"
                              type="time"
                              step="60"
                              value={rule.startTime}
                              onChange={(event) =>
                                setResearchRules((prev) =>
                                  prev.map((item) => (item.id === rule.id ? { ...item, startTime: event.target.value } : item)),
                                )
                              }
                            />
                            <PickerInput
                              wrapperClassName="picker-input-inline"
                              className="filter-select"
                              type="time"
                              step="60"
                              value={rule.endTime}
                              onChange={(event) =>
                                setResearchRules((prev) =>
                                  prev.map((item) => (item.id === rule.id ? { ...item, endTime: event.target.value } : item)),
                                )
                              }
                            />
                          </div>
                        </td>
                        <td>
                          <div className="settings-tag-row compact">
                            {subjectOptions.map((subject) => (
                              <label className="checkbox-item compact" key={`${rule.id}-${subject.code}`}>
                                <input
                                  type="checkbox"
                                  checked={rule.subjectCodes.includes(subject.code)}
                                  onChange={(event) => toggleResearchRuleSubject(rule.id, subject.code, event.target.checked)}
                                />
                                {subject.label}
                              </label>
                            ))}
                          </div>
                        </td>
                        <td>
                          <select
                            className="filter-select"
                            value={rule.status}
                            onChange={(event) =>
                              setResearchRules((prev) =>
                                prev.map((item) =>
                                  item.id === rule.id
                                    ? { ...item, status: event.target.value as "enabled" | "disabled" }
                                    : item,
                                ),
                              )
                            }
                          >
                            <option value="enabled">启用</option>
                            <option value="disabled">停用</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                    {researchRules.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="table-empty">暂无教研时间规则</td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : null}
        {tab === "petGrowth" ? (
          <div className="settings-form">
            <div className="settings-hero settings-hero-display">
              <div className="settings-hero-copy">
                <span className="settings-hero-kicker">萌宠成长规则</span>
                <h3>统一配置萌宠进化所需的积分阈值</h3>
                <p>这里维护 Lv.1 到 Lv.10 的累计积分阈值，萌宠成长和后台图鉴默认都按这套积分口径执行。</p>
                <div className="settings-hero-tags">
                  <span className="settings-hero-tag">统一积分口径</span>
                  <span className="settings-hero-tag">
                    最高阈值 {petGrowthForm.thresholds[9] || "0"}
                  </span>
                  <span className="settings-hero-tag">10 级成长</span>
                  <span className="settings-hero-tag">
                    班级联动 x{petGrowthForm.classScoreStudentLinkMultiplier || "0"}
                  </span>
                  <span className="settings-hero-tag">
                    换装 {petGrowthForm.petDecoChangeCost || "10"} 分
                  </span>
                </div>
              </div>
              <div className="settings-display-preview">
                <span className="settings-display-preview-badge">成长预览</span>
                <strong>按积分进化</strong>
                <p>成长体系已统一为积分，不再维护独立的成长口径。</p>
                <div className="settings-display-preview-meta">
                  <span>Lv.1 {petGrowthForm.thresholds[0] || "0"}</span>
                  <span>Lv.5 {petGrowthForm.thresholds[4] || "0"}</span>
                  <span>Lv.10 {petGrowthForm.thresholds[9] || "0"}</span>
                </div>
              </div>
            </div>
            <div className="settings-note">
              当前页维护萌宠成长阈值、班级评价联动倍率，以及非升级免费机会下的装扮更换积分消耗。联动倍率为 0 表示关闭；装扮消耗为 0 表示除升级赠送的免费机会外不再扣分。
            </div>
            <div className="settings-grade-list" style={{ marginBottom: 20 }}>
              <div className="settings-grade-row">
                <div className="settings-grade-row-head">
                  <div>
                    <span className="settings-insight-label">装扮更换</span>
                    <h4>积分消耗</h4>
                  </div>
                  <span className="settings-grade-status enabled">
                    每次 {petGrowthForm.petDecoChangeCost || "10"} 分
                  </span>
                </div>
                <div className="s-field">
                  <label>非升级免费机会下，每次更换背景/边框/饰品消耗</label>
                  <input
                    type="number"
                    min="0"
                    max="999"
                    step="1"
                    value={petGrowthForm.petDecoChangeCost}
                    onChange={(event) =>
                      setPetGrowthForm((prev) => ({
                        ...prev,
                        petDecoChangeCost: event.target.value,
                      }))
                    }
                  />
                </div>
              </div>
              <div className="settings-grade-row">
                <div className="settings-grade-row-head">
                  <div>
                    <span className="settings-insight-label">班级评价联动</span>
                    <h4>学生积分倍率</h4>
                  </div>
                  <span className={`settings-grade-status ${Number(petGrowthForm.classScoreStudentLinkMultiplier || "0") > 0 ? "enabled" : ""}`}>
                    {Number(petGrowthForm.classScoreStudentLinkMultiplier || "0") > 0 ? "已启用" : "已关闭"}
                  </span>
                </div>
                <div className="s-field">
                  <label>每 1 点班级积分联动到每位学生</label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={petGrowthForm.classScoreStudentLinkMultiplier}
                    onChange={(event) =>
                      setPetGrowthForm((prev) => ({
                        ...prev,
                        classScoreStudentLinkMultiplier: event.target.value,
                      }))
                    }
                  />
                </div>
              </div>
            </div>
            <div className="settings-grade-list">
              {petGrowthForm.thresholds.map((value, index) => (
                <div className="settings-grade-row" key={`growth-${index + 1}`}>
                  <div className="settings-grade-row-head">
                    <div>
                      <span className="settings-insight-label">成长等级</span>
                      <h4>Lv.{index + 1}</h4>
                    </div>
                    <span className="settings-grade-status enabled">累计积分</span>
                  </div>
                  <div className="s-field">
                    <label>{`Lv.${index + 1} 阈值`}</label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={value}
                      onChange={(event) =>
                        setPetGrowthForm((prev) => ({
                          ...prev,
                          thresholds: prev.thresholds.map((item, itemIndex) =>
                            itemIndex === index ? event.target.value : item,
                          ),
                        }))
                      }
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="form-actions">
              <button
                type="button"
                className="toolbar-button"
                onClick={() => void handlePetGrowthSave()}
                disabled={savingKey !== null}
              >
                {savingKey === "petGrowth" ? "保存中..." : "保存萌宠成长设置"}
              </button>
            </div>
          </div>
        ) : null}
        {tab === "display" ? (
          <div className="settings-form">
            <div className="settings-hero settings-hero-display">
              <div className="settings-hero-copy">
                <span className="settings-hero-kicker">展示大屏体验设定</span>
                <h3>把设备入口、主视觉和展示节奏放在同一个控制面板</h3>
                <p>这部分配置直接决定班级展示设备开机后的第一印象。</p>
                <div className="settings-hero-tags">
                  <span className="settings-hero-tag">
                    在线设备 {(settings?.display.terminalCount ?? 0).toString()}
                  </span>
                  <span className="settings-hero-tag">
                    默认入口 {displayModeLabel}
                  </span>
                  <span className="settings-hero-tag">
                    {displayAnimationLabel}
                  </span>
                </div>
              </div>
              <div className="settings-display-preview">
                <span className="settings-display-preview-badge">
                  {displayModeLabel}
                </span>
                <strong>{displayForm.title || "请输入主标题"}</strong>
                <p>
                  {displayForm.subtitle ||
                    "副标题会出现在展示首页主标题下方，适合作为学校愿景或活动主题说明。"}
                </p>
                <div className="settings-display-preview-meta">
                  <span>
                    {displayForm.bgImageUrl.trim()
                      ? "已配置背景图"
                      : "未配置背景图"}
                  </span>
                  <span>{displayForm.weatherLabel || "未配置天气城市"}</span>
                  <span>
                    {displayForm.allowSkipAnimation
                      ? "允许跳过开场动画"
                      : "保留完整开场动画"}
                  </span>
                </div>
              </div>
            </div>
            <div className="settings-summary-grid settings-summary-grid-emphasis">
              <div className="settings-summary-card accent-blue">
                <span>已接入设备</span>
                <strong>{settings?.display.terminalCount ?? 0}</strong>
                <p>当前已启用的班级展示设备数量。</p>
              </div>
              <div className="settings-summary-card accent-gold">
                <span>默认入口</span>
                <strong>{displayModeLabel}</strong>
                <p>设备进入后默认打开班级展示首页。</p>
              </div>
              <div className="settings-summary-card accent-blue">
                <span>天气定位</span>
                <strong>{displayForm.weatherLabel || "未配置"}</strong>
                <p>
                  {displayForm.weatherLatitude || "--"} /{" "}
                  {displayForm.weatherLongitude || "--"}
                </p>
              </div>
            </div>
            <div className="s-field">
              <label>主标题</label>
              <input
                type="text"
                value={displayForm.title}
                onChange={(event) =>
                  setDisplayForm((prev) => ({
                    ...prev,
                    title: event.target.value,
                  }))
                }
              />
            </div>
            <div className="s-field">
              <label>副标题</label>
              <input
                type="text"
                value={displayForm.subtitle}
                onChange={(event) =>
                  setDisplayForm((prev) => ({
                    ...prev,
                    subtitle: event.target.value,
                  }))
                }
              />
            </div>
            <div className="s-field">
              <label>背景图链接</label>
              <input
                type="text"
                value={displayForm.bgImageUrl}
                onChange={(event) =>
                  setDisplayForm((prev) => ({
                    ...prev,
                    bgImageUrl: event.target.value,
                  }))
                }
              />
              <div className="field-hint">
                选填，可放学校主视觉或活动海报图片链接。
              </div>
            </div>
            <div className="s-field">
              <label>天气城市名称</label>
              <input
                type="text"
                value={displayForm.weatherLabel}
                onChange={(event) =>
                  setDisplayForm((prev) => ({
                    ...prev,
                    weatherLabel: event.target.value,
                  }))
                }
              />
              <div className="field-hint">
                展示端天气角标上显示的城市名，例如“大理”“北京校区”。
              </div>
            </div>
            <div className="s-row">
              <div className="s-field">
                <label>天气纬度</label>
                <input
                  type="number"
                  step="0.0001"
                  value={displayForm.weatherLatitude}
                  onChange={(event) =>
                    setDisplayForm((prev) => ({
                      ...prev,
                      weatherLatitude: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="s-field">
                <label>天气经度</label>
                <input
                  type="number"
                  step="0.0001"
                  value={displayForm.weatherLongitude}
                  onChange={(event) =>
                    setDisplayForm((prev) => ({
                      ...prev,
                      weatherLongitude: event.target.value,
                    }))
                  }
                />
              </div>
            </div>
            <div className="s-row">
              <div className="s-field">
                <label>切换节奏</label>
                <select
                  value={displayForm.animationSpeed}
                  onChange={(event) =>
                    setDisplayForm((prev) => ({
                      ...prev,
                      animationSpeed: event.target.value,
                    }))
                  }
                >
                  <option value="slow">舒缓</option>
                  <option value="normal">标准</option>
                  <option value="fast">快速</option>
                </select>
              </div>
            </div>
            <label className="checkbox-item">
              <input
                type="checkbox"
                checked={displayForm.allowSkipAnimation}
                onChange={(event) =>
                  setDisplayForm((prev) => ({
                    ...prev,
                    allowSkipAnimation: event.target.checked,
                  }))
                }
              />
              允许老师跳过开场动画
            </label>
            <div className="settings-note">
              当前版本展示大屏固定进入班级首页，这里只配置主视觉、切换节奏和动画策略，不再承担“汇报模式”切换。
            </div>
            <div className="form-actions">
              <button
                type="button"
                className="toolbar-button"
                onClick={() => void handleDisplaySave()}
                disabled={savingKey !== null}
              >
                {savingKey === "display" ? "保存中..." : "保存展示设置"}
              </button>
            </div>
          </div>
        ) : null}
      </div>
      {pendingMissingTeachers.length > 0 || pendingMissingClasses.length > 0 ? (
        <Modal
          title="导入前确认"
          subtitle="缺失教师与班级可逐行创建；创建班级时需要选择所属年级。"
          onClose={() => {
            setPendingMissingTeachers([]);
            setPendingMissingClasses([]);
          }}
        >
          <div className="settings-form">
            {pendingMissingTeachers.length > 0 ? (
              <div className="detail-card">
                <h4>缺失教师</h4>
                <div className="data-table-wrap">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>创建</th>
                        <th>教师姓名</th>
                        <th>角色</th>
                        <th>账号</th>
                        <th>密码</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingMissingTeachers.map((item, index) => (
                        <tr key={item.teacherName}>
                          <td>
                            <input
                              type="checkbox"
                              checked={item.create}
                              onChange={(event) =>
                                setPendingMissingTeachers((prev) =>
                                  prev.map((row, rowIndex) => (rowIndex === index ? { ...row, create: event.target.checked } : row)),
                                )
                              }
                            />
                          </td>
                          <td>{item.teacherName}</td>
                          <td>
                            <select
                              value={item.roleCode}
                              disabled={!item.create}
                              onChange={(event) =>
                                setPendingMissingTeachers((prev) =>
                                  prev.map((row, rowIndex) =>
                                    rowIndex === index
                                      ? { ...row, roleCode: event.target.value as "subject_teacher" | "homeroom_teacher" }
                                      : row,
                                  ),
                                )
                              }
                            >
                              <option value="subject_teacher">任课教师</option>
                              <option value="homeroom_teacher">班主任</option>
                            </select>
                          </td>
                          <td>
                            <input
                              value={item.username}
                              disabled={!item.create}
                              onChange={(event) =>
                                setPendingMissingTeachers((prev) =>
                                  prev.map((row, rowIndex) => (rowIndex === index ? { ...row, username: event.target.value } : row)),
                                )
                              }
                            />
                          </td>
                          <td>
                            <input
                              value={item.password}
                              disabled={!item.create}
                              onChange={(event) =>
                                setPendingMissingTeachers((prev) =>
                                  prev.map((row, rowIndex) => (rowIndex === index ? { ...row, password: event.target.value } : row)),
                                )
                              }
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : null}
            {pendingMissingClasses.length > 0 ? (
              <div className="detail-card">
                <h4>缺失班级</h4>
                <div className="data-table-wrap">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>创建</th>
                        <th>班级名称</th>
                        <th>所属年级</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingMissingClasses.map((item, index) => (
                        <tr key={item.className}>
                          <td>
                            <input
                              type="checkbox"
                              checked={item.create}
                              onChange={(event) =>
                                setPendingMissingClasses((prev) =>
                                  prev.map((row, rowIndex) => (rowIndex === index ? { ...row, create: event.target.checked } : row)),
                                )
                              }
                            />
                          </td>
                          <td>{item.className}</td>
                          <td>
                            <select
                              value={item.gradeName}
                              disabled={!item.create}
                              onChange={(event) =>
                                setPendingMissingClasses((prev) =>
                                  prev.map((row, rowIndex) => (rowIndex === index ? { ...row, gradeName: event.target.value } : row)),
                                )
                              }
                            >
                              <option value="">请选择年级</option>
                              {gradeOptions.map((gradeName) => (
                                <option key={gradeName} value={gradeName}>
                                  {gradeName}
                                </option>
                              ))}
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {gradeOptions.length === 0 ? (
                  <p className="settings-note">请先在系统设置中维护年级，再创建缺失班级。</p>
                ) : null}
              </div>
            ) : null}
            <div className="form-actions">
              <button
                type="button"
                className="ghost-button"
                onClick={() => {
                  setPendingMissingTeachers([]);
                  setPendingMissingClasses([]);
                }}
              >
                取消
              </button>
              <button
                type="button"
                className="toolbar-button"
                onClick={() => void handleConfirmScheduleImport()}
                disabled={importingSchedule}
              >
                {importingSchedule ? "处理中..." : "继续导入"}
              </button>
            </div>
          </div>
        </Modal>
      ) : null}
    </Shell>
  );
}

import { useEffect, useState } from "react";
import { Shell } from "../components/Shell";
import type {
  DisplaySettingsUpdatePayload,
  PetGrowthSettingsUpdatePayload,
  SemesterSettingsUpdatePayload,
  SessionUser,
  SystemSettings,
} from "../lib/api";
import { adminApi } from "../lib/api";
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
  const [pageLoading, setPageLoading] = useState(false);
  const [savingKey, setSavingKey] = useState<
    "semester" | "petGrowth" | "display" | null
  >(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  const displayModeLabel = "班级首页";
  const displayAnimationLabel = (
    {
      slow: "舒缓切换",
      normal: "标准节奏",
      fast: "快速切换",
    } as const
  )[displayForm.animationSpeed];

  async function loadSettings(activeRef?: { active: boolean }) {
    setPageLoading(true);
    try {
      const response = await adminApi.settings(token);
      if (activeRef && !activeRef.active) return;
      setSettings(response.data);
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

  return (
    <Shell
      title="系统设置"
      subtitle="统一维护学期、萌宠成长和展示大屏等系统参数"
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
                <input
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
                <input
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
              当前功能只保留“积分阈值”配置。已有萌宠图鉴如果单独配置了阶段阈值，建议同步调整为相同积分口径。
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
    </Shell>
  );
}

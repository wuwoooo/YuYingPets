import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { io, type Socket } from "socket.io-client";
import presentationLogo from "../assets/presentation-logo.svg";
import { PresentationGlyph } from "../components/PresentationGlyph";
import { PresentationFullscreenButton } from "../components/PresentationFullscreenButton";
import { PresentationHero3D } from "../components/PresentationHero3D";
import { ProjectionHeroThree } from "../components/ProjectionHeroThree";
import { resolveSubjectLabel } from "../constants/admin";
import {
  adminApi,
  type AcademicExamListItem,
  type AcademicScoreListRow,
  type AdminClass,
  type AdminStudent,
  type AnalyticsData,
  type DisplayTerminal,
  type DisplayWeatherPayload,
  type Honor,
  type HonorRecord,
  type Reward,
  type ScoreRecord,
  type ScoreRule,
  type SessionUser,
} from "../lib/api";
import { buildAcademicGrowthSummary } from "../utils/academicGrowth";
import { normalizeAcademicPeriodLabel } from "../utils/academicImport";
import {
  canViewSchoolPresentation,
} from "../utils/adminPermissions";
import "./ProjectionModePage.css";
import "./ProjectionModePage.outdoor.css";
import {
  getBubbleBackground,
  getHeatLevel,
  persistProjectionTheme,
  PROJECTION_CHART_COLORS,
  resolveProjectionTheme,
  type ProjectionTheme,
} from "./projectionTheme";

type ProjectionModePageProps = {
  token: string;
  user: SessionUser | null;
};

type ConnectionStatus = "connecting" | "online" | "offline";
type RefreshSource = "initial" | "realtime" | "poll" | "heartbeat";
type ProjectionLayoutMode = "classic" | "desktop" | "tablet-fluid";
type ProjectionLayoutPreference = "auto" | "classic" | "desktop" | "fluid";

/** 投屏页班级积分榜展示条数 */
const PROJECTION_TOP_CLASS_LIMIT = 10;
/** 电脑可读布局班级积分榜展示条数 */
const PROJECTION_DESKTOP_TOP_CLASS_LIMIT = 10;
/** 投屏页学生积分榜展示条数 */
const PROJECTION_TOP_STUDENT_LIMIT = 30;
/** 电脑可读布局学生积分榜展示条数 */
const PROJECTION_DESKTOP_TOP_STUDENT_LIMIT = 30;
/** 投屏页进步之星展示条数 */
const PROJECTION_PROGRESS_LEADER_LIMIT = 20;
/** 电脑可读布局进步之星展示条数 */
const PROJECTION_DESKTOP_PROGRESS_LEADER_LIMIT = 20;
/** 投屏页风险名单展示条数 */
const PROJECTION_RISK_PREVIEW_LIMIT = 18;
/** 电脑可读布局风险名单展示条数 */
const PROJECTION_DESKTOP_RISK_PREVIEW_LIMIT = 18;

function formatRiskLevelShort(level: "high" | "medium" | "low") {
  if (level === "high") return "高";
  if (level === "medium") return "中";
  return "低";
}

function resolveProjectionClassLabel(
  classId: number,
  fallbackClassName: string,
  classes: AdminClass[],
) {
  const info = classes.find((item) => item.id === classId);
  if (info?.name) return info.name;
  return fallbackClassName.replace(/^[\u4e00-\u9fa5\d]+年级/, "").trim() || fallbackClassName;
}

const PROJECTION_DAILY_SERIES_DAYS = 10;

/** 将 analytics 趋势转为投屏页序列；无 analytics 时回退本地聚合 */
function buildProjectionDailySeries(
  analytics: AnalyticsData | null,
  scoreRecords: ScoreRecord[],
) {
  const analyticsTrend = new Map(
    (analytics?.dailyTrend ?? []).map((item) => [item.date, item]),
  );
  return Array.from({ length: PROJECTION_DAILY_SERIES_DAYS }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (PROJECTION_DAILY_SERIES_DAYS - 1 - index));
    const key = date.toISOString().slice(0, 10);
    const analyticsItem = analyticsTrend.get(key);
    if (analyticsItem) {
      return {
        key,
        label: `${date.getMonth() + 1}/${date.getDate()}`,
        total: analyticsItem.total,
        score: analyticsItem.score,
        positive: analyticsItem.positive,
        negative: analyticsItem.negative,
      };
    }
    const records = scoreRecords.filter(
      (item) => item.createdAt.slice(0, 10) === key,
    );
    return {
      key,
      label: `${date.getMonth() + 1}/${date.getDate()}`,
      total: records.length,
      score: records.reduce((sum, item) => sum + item.scoreDelta, 0),
      positive: records.filter((item) => item.scoreDelta >= 0).length,
      negative: records.filter((item) => item.scoreDelta < 0).length,
    };
  });
}

/** 投屏页热力矩阵：按本周一至今天统计 */
function getProjectionWeekAnalyticsRange() {
  const now = new Date();
  const weekday = now.getDay();
  const mondayOffset = weekday === 0 ? -6 : 1 - weekday;
  const monday = new Date(now);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(now.getDate() + mondayOffset);
  const format = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };
  return {
    startDate: format(monday),
    endDate: format(now),
  };
}

type ProjectionSnapshot = {
  classes: AdminClass[];
  students: AdminStudent[];
  rules: ScoreRule[];
  honors: Honor[];
  rewards: Reward[];
  analytics: AnalyticsData | null;
  scoreRecords: ScoreRecord[];
  honorRecords: HonorRecord[];
  academicExams: AcademicExamListItem[];
  academicScores: AcademicScoreListRow[];
  displayTerminals: DisplayTerminal[];
  weatherInfo: DisplayWeatherPayload | null;
  weatherLabel: string;
  semesterName: string | null;
};

const emptySnapshot: ProjectionSnapshot = {
  classes: [],
  students: [],
  rules: [],
  honors: [],
  rewards: [],
  analytics: null,
  scoreRecords: [],
  honorRecords: [],
  academicExams: [],
  academicScores: [],
  displayTerminals: [],
  weatherInfo: null,
  weatherLabel: "大理",
  semesterName: null,
};

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ??
  (typeof window !== "undefined"
    ? `${window.location.origin}/api/v1`
    : "http://127.0.0.1:3000/api/v1");
const WS_BASE_URL = API_BASE_URL.replace(/\/api(?:\/v\d+)?\/?$/, "");

function formatCompact(value: number) {
  return new Intl.NumberFormat("zh-CN", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

function formatNumber(value: number) {
  return value.toLocaleString("zh-CN");
}

function formatClock(date: Date) {
  return new Intl.DateTimeFormat("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(date);
}

function getRecordLabel(record: ScoreRecord) {
  return (
    record.ruleName ||
    record.tag ||
    record.dimension ||
    record.sceneCode ||
    "评价"
  );
}

function makeSparkline(values: number[], width = 116, height = 34) {
  const source = values.length > 1 ? values : [0, ...values, 1];
  const max = Math.max(...source, 1);
  const min = Math.min(...source, 0);
  const range = Math.max(max - min, 1);
  return source
    .map((value, index) => {
      const x =
        source.length === 1 ? width : (index / (source.length - 1)) * width;
      const y = height - ((value - min) / range) * (height - 6) - 3;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}

function clampPercent(value: number, fallback = 0) {
  if (!Number.isFinite(value)) return fallback;
  return Math.max(0, Math.min(100, Math.round(value)));
}

function withCompetitionRank<T extends { value: number }>(rows: T[]) {
  let previousValue: number | null = null;
  let currentRank = 0;
  return rows.map((item, index) => {
    if (previousValue === null || item.value !== previousValue) {
      currentRank = index + 1;
      previousValue = item.value;
    }
    return { ...item, rank: currentRank };
  });
}


function resolveRiskStudentStats(analytics: AnalyticsData | null) {
  const stats = analytics?.riskStudentStats;
  if (stats) {
    return {
      high: stats.high,
      medium: stats.medium,
      low: stats.low,
      total: stats.total,
    };
  }
  const riskRows = analytics?.riskStudents ?? [];
  return {
    high: riskRows.filter((item) => item.riskLevel === "high").length,
    medium: riskRows.filter((item) => item.riskLevel === "medium").length,
    low: riskRows.filter((item) => item.riskLevel === "low").length,
    total: riskRows.length,
  };
}

function getSettledErrorMessage(reason: unknown, fallback: string) {
  return reason instanceof Error && reason.message ? reason.message : fallback;
}

function isTransientGatewayError(message: string) {
  return /接口请求失败: (502|503|504)/.test(message);
}

function waitMs(ms: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function resolveProjectionLayoutPreference(
  searchParams: URLSearchParams,
): ProjectionLayoutPreference {
  const raw = searchParams.get("layout");
  if (raw === "classic") return "classic";
  if (raw === "desktop") return "desktop";
  if (raw === "fluid") return "fluid";
  return "auto";
}

function resolveAutoProjectionLayout(
  viewportWidth: number,
  viewportHeight: number,
): ProjectionLayoutMode {
  if (!Number.isFinite(viewportWidth) || !Number.isFinite(viewportHeight) || viewportHeight <= 0) {
    return "classic";
  }
  const aspectRatio = viewportWidth / viewportHeight;
  if (typeof window === "undefined") {
    return aspectRatio >= 1.72 ? "classic" : "tablet-fluid";
  }
  const screenWidth = window.screen?.availWidth || window.screen?.width || viewportWidth;
  const screenHeight = window.screen?.availHeight || window.screen?.height || viewportHeight;
  const outerWidth = window.outerWidth || viewportWidth;
  const outerHeight = window.outerHeight || viewportHeight;
  const browserChromeWidth = Math.max(0, outerWidth - viewportWidth);
  const browserChromeHeight = Math.max(0, outerHeight - viewportHeight);
  const nearFullscreenViewport =
    viewportWidth >= screenWidth * 0.9 &&
    viewportHeight >= screenHeight * 0.82;
  const lowChromeShell =
    browserChromeWidth <= 24 &&
    browserChromeHeight <= 110;
  const fullscreenActive =
    typeof document !== "undefined" && !!document.fullscreenElement;
  const nearSixteenByNine =
    aspectRatio >= 1.7 &&
    aspectRatio <= 1.95;
  const shouldUseClassic =
    nearSixteenByNine &&
    (fullscreenActive || (nearFullscreenViewport && lowChromeShell));
  if (shouldUseClassic) return "classic";
  return aspectRatio <= 1.5 ? "tablet-fluid" : "desktop";
}

function resolveProjectionLayoutMode(
  preference: ProjectionLayoutPreference,
  viewportWidth: number,
  viewportHeight: number,
): ProjectionLayoutMode {
  if (preference === "classic") return "classic";
  if (preference === "desktop") return "desktop";
  if (preference === "fluid") return "tablet-fluid";
  return resolveAutoProjectionLayout(viewportWidth, viewportHeight);
}

async function loadProjectionSnapshot(
  token: string,
  analyticsWeekRange: ReturnType<typeof getProjectionWeekAnalyticsRange>,
): Promise<{ snapshot: ProjectionSnapshot; failures: string[] }> {
  const failures: string[] = [];

  const [coreResults, extraResults] = await Promise.all([
    Promise.allSettled([
      adminApi.classes(token),
      adminApi.students(token),
      adminApi.scoreRecords(token),
      adminApi
        .displayTerminals(token)
        .catch(() => ({ data: [] as DisplayTerminal[] })),
    ]),
    waitMs(80).then(() =>
      Promise.allSettled([
        adminApi.scoreRules(token),
        adminApi.honors(token),
        adminApi.rewards(token).catch(() => ({ data: [] as Reward[] })),
        adminApi
          .analyticsSummary(token, analyticsWeekRange)
          .catch(() => ({ data: null as AnalyticsData | null })),
        adminApi
          .analyticsHeatmap(token, analyticsWeekRange)
          .catch(() => ({ data: null as AnalyticsData | null })),
        adminApi.honorRecords(token),
        adminApi.academicExams(token),
        adminApi.academicScores(token, { includeSubjects: true }),
        adminApi.displaySettings(token),
      ]),
    ),
  ]);

  const [
    classesResult,
    studentsResult,
    scoreRecordsResult,
    displayTerminalsResult,
  ] = coreResults;
  const [
    rulesResult,
    honorsResult,
    rewardsResult,
    analyticsResult,
    heatmapResult,
    honorRecordsResult,
    academicExamsResult,
    academicScoresResult,
    displaySettingsResult,
  ] = extraResults;

  const trackFailure = (
    label: string,
    result: PromiseSettledResult<unknown>,
  ) => {
    if (result.status === "rejected") {
      failures.push(
        `${label}：${getSettledErrorMessage(result.reason, "加载失败")}`,
      );
    }
  };

  trackFailure("班级", classesResult);
  trackFailure("学生", studentsResult);
  trackFailure("积分记录", scoreRecordsResult);
  trackFailure("积分规则", rulesResult);
  trackFailure("荣誉", honorsResult);
  trackFailure("荣誉记录", honorRecordsResult);
  trackFailure("热力矩阵", heatmapResult);
  trackFailure("学业考试", academicExamsResult);
  trackFailure("学业成绩", academicScoresResult);
  trackFailure("展示终端", displayTerminalsResult);
  trackFailure("展示设置", displaySettingsResult);

  const classes =
    classesResult.status === "fulfilled" ? classesResult.value.data : [];
  const students =
    studentsResult.status === "fulfilled" ? studentsResult.value.data : [];
  const scoreRecords =
    scoreRecordsResult.status === "fulfilled"
      ? scoreRecordsResult.value.data
      : [];
  const rules =
    rulesResult.status === "fulfilled" ? rulesResult.value.data : [];
  const honors =
    honorsResult.status === "fulfilled" ? honorsResult.value.data : [];
  const rewards =
    rewardsResult.status === "fulfilled" ? rewardsResult.value.data : [];
  const analyticsSummary =
    analyticsResult.status === "fulfilled" ? analyticsResult.value.data : null;
  const analyticsHeatmap =
    heatmapResult.status === "fulfilled" ? heatmapResult.value.data : null;
  const analytics = (analyticsSummary
    ? {
        ...analyticsSummary,
        heatMap: analyticsHeatmap?.heatMap ?? analyticsSummary.heatMap,
      }
    : analyticsHeatmap) as AnalyticsData | null;
  const honorRecords =
    honorRecordsResult.status === "fulfilled"
      ? honorRecordsResult.value.data
      : [];
  const academicExams =
    academicExamsResult.status === "fulfilled"
      ? academicExamsResult.value.data
      : [];
  const academicScores =
    academicScoresResult.status === "fulfilled"
      ? academicScoresResult.value.data
      : [];
  const displayTerminals =
    displayTerminalsResult.status === "fulfilled"
      ? displayTerminalsResult.value.data
      : [];

  let weatherInfo: DisplayWeatherPayload | null = null;
  let weatherLabel = "大理";
  let semesterName: string | null = null;
  if (displaySettingsResult.status === "fulfilled") {
    const displaySettings = displaySettingsResult.value.data;
    const lat = Number(displaySettings.weatherLatitude);
    const lng = Number(displaySettings.weatherLongitude);
    weatherLabel = displaySettings.weatherLabel?.trim() || "大理";
    semesterName = displaySettings.currentSemester?.name
      ? normalizeAcademicPeriodLabel(displaySettings.currentSemester.name)
      : null;
    const weatherResponse = await adminApi
      .displayWeather(token, {
        latitude: Number.isFinite(lat) ? lat : undefined,
        longitude: Number.isFinite(lng) ? lng : undefined,
        label: weatherLabel,
      })
      .catch(() => ({ data: null as DisplayWeatherPayload | null }));
    weatherInfo = weatherResponse.data;
  }

  return {
    snapshot: {
      classes,
      students,
      rules,
      honors,
      rewards,
      analytics,
      scoreRecords: scoreRecords
        .slice()
        .sort(
          (left, right) =>
            new Date(right.createdAt).getTime() -
            new Date(left.createdAt).getTime(),
        ),
      honorRecords: honorRecords
        .slice()
        .sort(
          (left, right) =>
            new Date(right.grantedAt).getTime() -
            new Date(left.grantedAt).getTime(),
        ),
      academicExams,
      academicScores,
      displayTerminals,
      weatherInfo,
      weatherLabel,
      semesterName,
    },
    failures,
  };
}

export function ProjectionModePage({ token, user }: ProjectionModePageProps) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const returnTo = searchParams.get("returnTo") || "/dashboard";
  const layoutPreference = useMemo(
    () => resolveProjectionLayoutPreference(searchParams),
    [searchParams],
  );
  const [theme, setTheme] = useState<ProjectionTheme>(() =>
    resolveProjectionTheme(searchParams),
  );
  const [layoutMode, setLayoutMode] = useState<ProjectionLayoutMode>(() => {
    if (typeof window === "undefined") return "classic";
    return resolveProjectionLayoutMode(
      resolveProjectionLayoutPreference(searchParams),
      window.innerWidth,
      window.innerHeight,
    );
  });
  const topStudentLimit =
    layoutMode === "desktop"
      ? PROJECTION_DESKTOP_TOP_STUDENT_LIMIT
      : PROJECTION_TOP_STUDENT_LIMIT;
  const topClassLimit =
    layoutMode === "desktop"
      ? PROJECTION_DESKTOP_TOP_CLASS_LIMIT
      : PROJECTION_TOP_CLASS_LIMIT;
  const progressLeaderLimit =
    layoutMode === "desktop"
      ? PROJECTION_DESKTOP_PROGRESS_LEADER_LIMIT
      : PROJECTION_PROGRESS_LEADER_LIMIT;
  const riskPreviewLimit =
    layoutMode === "desktop"
      ? PROJECTION_DESKTOP_RISK_PREVIEW_LIMIT
      : PROJECTION_RISK_PREVIEW_LIMIT;

  const switchTheme = useCallback(
    (next: ProjectionTheme) => {
      setTheme(next);
      persistProjectionTheme(next);
      const nextParams = new URLSearchParams(searchParams);
      if (next === "scifi") {
        nextParams.set("theme", "scifi");
      } else {
        nextParams.delete("theme");
      }
      setSearchParams(nextParams, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  const toggleTheme = useCallback(() => {
    switchTheme(theme === "outdoor" ? "scifi" : "outdoor");
  }, [theme, switchTheme]);
  const switchLayoutPreference = useCallback(
    (next: ProjectionLayoutPreference) => {
      const nextParams = new URLSearchParams(searchParams);
      if (next === "auto") {
        nextParams.delete("layout");
      } else {
        nextParams.set("layout", next);
      }
      setSearchParams(nextParams, { replace: true });
    },
    [searchParams, setSearchParams],
  );
  const [snapshot, setSnapshot] = useState<ProjectionSnapshot>(emptySnapshot);
  const currentSemesterName = snapshot.semesterName;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] =
    useState<ConnectionStatus>("connecting");
  const [pollingFallback, setPollingFallback] = useState(false);
  const [refreshCount, setRefreshCount] = useState(0);
  const [clock, setClock] = useState(() => formatClock(new Date()));
  const refreshTimerRef = useRef<number | null>(null);
  const pollingTimerRef = useRef<number | null>(null);
  const heartbeatTimerRef = useRef<number | null>(null);
  const inFlightRef = useRef(false);
  const socketRef = useRef<Socket | null>(null);

  const fetchSnapshot = useCallback(
    async (source: RefreshSource) => {
      if (!token || inFlightRef.current) return;
      inFlightRef.current = true;
      const maxAttempts = source === "initial" ? 3 : 1;

      try {
        const analyticsWeekRange = getProjectionWeekAnalyticsRange();
        let lastFailures: string[] = [];
        let loaded = false;

        for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
          if (attempt === 1) {
            setError(null);
          }

          const { snapshot: nextSnapshot, failures } =
            await loadProjectionSnapshot(token, analyticsWeekRange);
          lastFailures = failures;

          const hasCoreData =
            nextSnapshot.classes.length > 0 ||
            nextSnapshot.students.length > 0;

          if (hasCoreData || failures.length === 0) {
            setSnapshot(nextSnapshot);
            setLastUpdatedAt(formatClock(new Date()));
            setRefreshCount((value) => value + (source === "initial" ? 0 : 1));
            setError(null);
            loaded = true;
            break;
          }

          const primaryError = failures[0] ?? "投屏数据加载失败";
          const shouldRetry =
            attempt < maxAttempts && isTransientGatewayError(primaryError);

          if (!shouldRetry) {
            setError(primaryError);
            break;
          }

          await waitMs(700 * attempt);
        }

        if (!loaded && lastFailures.length > 0 && source !== "initial") {
          setError(lastFailures[0] ?? "投屏数据加载失败");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "投屏数据加载失败");
      } finally {
        setLoading(false);
        inFlightRef.current = false;
      }
    },
    [token],
  );

  const scheduleRefresh = useCallback(() => {
    if (refreshTimerRef.current) window.clearTimeout(refreshTimerRef.current);
    refreshTimerRef.current = window.setTimeout(() => {
      void fetchSnapshot("realtime");
    }, 800);
  }, [fetchSnapshot]);

  useEffect(() => {
    void fetchSnapshot("initial");
  }, [fetchSnapshot]);

  useEffect(() => {
    const syncLayoutMode = () => {
      setLayoutMode(
        resolveProjectionLayoutMode(
          layoutPreference,
          window.innerWidth,
          window.innerHeight,
        ),
      );
    };

    syncLayoutMode();
    window.addEventListener("resize", syncLayoutMode);
    return () => {
      window.removeEventListener("resize", syncLayoutMode);
    };
  }, [layoutPreference]);

  useEffect(() => {
    const timer = window.setInterval(
      () => setClock(formatClock(new Date())),
      1000,
    );
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") navigate(returnTo);
      if (event.key === "t" || event.key === "T") toggleTheme();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [navigate, returnTo, toggleTheme]);

  useEffect(
    () => () => {
      if (refreshTimerRef.current) window.clearTimeout(refreshTimerRef.current);
      if (pollingTimerRef.current)
        window.clearInterval(pollingTimerRef.current);
      if (heartbeatTimerRef.current)
        window.clearInterval(heartbeatTimerRef.current);
      socketRef.current?.disconnect();
    },
    [],
  );

  useEffect(() => {
    if (!snapshot.classes.length) return;
    const schoolId = snapshot.classes[0]?.schoolId;
    if (!schoolId) return;

    setConnectionStatus("connecting");
    const socket = io(`${WS_BASE_URL}/ws`, {
      transports: ["websocket"],
      reconnection: true,
      auth: { token },
    });
    socketRef.current = socket;

    const subscribeRooms = () => {
      socket.emit("subscribe.school", { schoolId });
      snapshot.classes.forEach((item) =>
        socket.emit("subscribe.class", { classId: item.id }),
      );
    };

    socket.on("auth.ready", (payload: { ok?: boolean }) => {
      if (payload?.ok === false) {
        setConnectionStatus("offline");
        return;
      }
      setConnectionStatus("online");
      subscribeRooms();
    });
    socket.on("disconnect", () => setConnectionStatus("offline"));
    socket.on("connect_error", () => setConnectionStatus("offline"));
    socket.on("class.score.changed", scheduleRefresh);
    socket.on("class.student.changed", scheduleRefresh);
    socket.on("class.group.changed", scheduleRefresh);
    socket.on("reward.order.created", scheduleRefresh);
    socket.on("ai.summary.generated", scheduleRefresh);
    socket.on("class.config.changed", scheduleRefresh);

    return () => {
      socket.off("class.score.changed", scheduleRefresh);
      socket.off("class.student.changed", scheduleRefresh);
      socket.off("class.group.changed", scheduleRefresh);
      socket.off("reward.order.created", scheduleRefresh);
      socket.off("ai.summary.generated", scheduleRefresh);
      socket.off("class.config.changed", scheduleRefresh);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [scheduleRefresh, snapshot.classes, token]);

  useEffect(() => {
    const shouldPoll = connectionStatus !== "online";
    setPollingFallback(shouldPoll);
    if (!shouldPoll) {
      if (pollingTimerRef.current) {
        window.clearInterval(pollingTimerRef.current);
        pollingTimerRef.current = null;
      }
      return;
    }
    pollingTimerRef.current = window.setInterval(() => {
      void fetchSnapshot("poll");
    }, 10_000);
    return () => {
      if (pollingTimerRef.current) {
        window.clearInterval(pollingTimerRef.current);
        pollingTimerRef.current = null;
      }
    };
  }, [connectionStatus, fetchSnapshot]);

  useEffect(() => {
    heartbeatTimerRef.current = window.setInterval(() => {
      void fetchSnapshot("heartbeat");
    }, 60_000);
    return () => {
      if (heartbeatTimerRef.current) {
        window.clearInterval(heartbeatTimerRef.current);
        heartbeatTimerRef.current = null;
      }
    };
  }, [fetchSnapshot]);

  useEffect(() => {
    if (!user || canViewSchoolPresentation(user.roleCode)) return;
    navigate("/dashboard", { replace: true });
  }, [navigate, user]);

  const {
    classes,
    students,
    rules,
    honors,
    rewards,
    analytics,
    scoreRecords,
    honorRecords,
    academicExams,
    academicScores,
    displayTerminals,
    weatherInfo,
    weatherLabel,
  } = snapshot;

  const riskStats = useMemo(
    () => resolveRiskStudentStats(analytics),
    [analytics],
  );

  const todayEvaluationCount =
    analytics?.todayScoreRecordCount ?? 0;
  const recent24hEvaluationCount =
    analytics?.recent24hScoreRecordCount ?? 0;
  const positiveToday = analytics?.todayPositiveCount ?? 0;
  const negativeToday = analytics?.todayNegativeCount ?? 0;
  const positiveRate = todayEvaluationCount
    ? Math.round((positiveToday / todayEvaluationCount) * 100)
    : 0;

  const dailySeries = useMemo(
    () => buildProjectionDailySeries(analytics, scoreRecords),
    [analytics, scoreRecords],
  );
  const recentRecords = useMemo(
    () => scoreRecords.slice(0, 28),
    [scoreRecords],
  );
  const academicGrowth = useMemo(
    () =>
      buildAcademicGrowthSummary(
        academicExams,
        academicScores,
        classes,
        students,
      ),
    [academicExams, academicScores, classes, students],
  );

  const totalScore =
    analytics?.totalScore ??
    students.reduce((sum, item) => sum + item.currentScore, 0);
  const activeStudents = students.filter(
    (item) => item.currentScore > 0 || item.currentPetLevel > 0,
  ).length;
  const onlineTerminals = displayTerminals.filter(
    (item) => item.onlineStatus === "online",
  ).length;
  const totalHonorsGranted = honors.reduce(
    (sum, item) => sum + item.grantedCount,
    0,
  );
  const petBoundCount = students.filter((item) => item.pet).length;
  const highRiskCount = riskStats.high;

  const metricCards = useMemo(() => {
    const recentScoreSeries = dailySeries.map((item) => item.score);
    const eventSeries = dailySeries.map((item) => item.total);
    return [
      {
        label: "总分",
        value: formatCompact(totalScore),
        sub: `7日${recentScoreSeries.reduce((s, v) => s + v, 0)}`,
        tone: "cyan",
        series: recentScoreSeries,
      },
      {
        label: "人均",
        value: `${Math.round(analytics?.averageScore ?? totalScore / Math.max(students.length, 1))}`,
        sub: `样本${students.length}`,
        tone: "green",
        series: eventSeries,
      },
      {
        label: "学生",
        value: `${activeStudents}/${students.length}`,
        sub: `活跃${clampPercent((activeStudents / Math.max(students.length, 1)) * 100)}%`,
        tone: "purple",
        series: [
          activeStudents,
          students.length * 0.6,
          activeStudents * 0.9,
          activeStudents,
        ],
      },
      {
        label: "今日",
        value: `${todayEvaluationCount}`,
        sub: `24h ${recent24hEvaluationCount}`,
        tone: "gold",
        series: eventSeries,
      },
      {
        label: "正向",
        value: `${positiveRate}%`,
        sub: `${positiveToday}/${todayEvaluationCount}`,
        tone: "green",
        series: dailySeries.map((item) => item.positive),
      },
      {
        label: "荣誉",
        value: formatCompact(totalHonorsGranted),
        sub: `记录${honorRecords.length}`,
        tone: "gold",
        series: honorRecords.slice(0, 7).map((_, index) => index + 1),
      },
    ];
  }, [
    activeStudents,
    analytics?.averageScore,
    dailySeries,
    honorRecords,
    positiveRate,
    positiveToday,
    recent24hEvaluationCount,
    students,
    todayEvaluationCount,
    totalHonorsGranted,
    totalScore,
  ]);

  const topClasses = useMemo(() => {
    // 投屏页已加载完整班级列表，直接本地排序可展示全部 TOP10，避免 analytics 历史 8 条上限
    return [...classes]
      .sort(
        (left, right) =>
          right.classScore - left.classScore ||
          left.gradeName.localeCompare(right.gradeName, "zh-CN") ||
          left.name.localeCompare(right.name, "zh-CN"),
      )
      .slice(0, topClassLimit)
      .map((item) => ({
        id: item.id,
        name: item.name,
        value: item.classScore,
      }));
  }, [classes, topClassLimit]);

  const topStudents = useMemo(() => {
    // 投屏页已加载完整学生列表，直接本地排序可展示完整 TOP，避免 analytics 15 条上限
    if (students.length) {
      const rows = [...students]
        .sort(
          (left, right) =>
            right.currentScore - left.currentScore ||
            left.className.localeCompare(right.className, "zh-CN") ||
            left.name.localeCompare(right.name, "zh-CN"),
        )
        .slice(0, topStudentLimit)
        .map((item) => ({
          id: item.id,
          name: item.name,
          className: item.className,
          value: item.currentScore,
          petLevel: item.currentPetLevel,
          petName: item.pet?.name ?? null,
        }));
      return withCompetitionRank(rows);
    }
    if (!analytics?.topStudents?.length) return [];
    const rows = analytics.topStudents
      .slice(0, topStudentLimit)
      .map((item) => ({
        id: item.studentId,
        name: item.studentName,
        className: item.className,
        value: item.currentScore,
        petLevel: 0,
        petName: null,
      }));
    return withCompetitionRank(rows);
  }, [analytics?.topStudents, students, topStudentLimit]);

  const progressLeaders = useMemo(() => {
    const source = academicGrowth.progressLeaders.slice(
      0,
      progressLeaderLimit,
    );
    if (!source.length) return [];
    return Array.from({ length: progressLeaderLimit }, (_, index) => {
      const item = source[index];
      if (item) {
        return {
          key: String(item.studentId),
          rank: index + 1,
          name: item.studentName,
          className: resolveProjectionClassLabel(
            item.classId,
            item.className,
            classes,
          ),
          rankDelta: item.rankDelta,
          placeholder: false,
        };
      }
      return {
        key: `progress-placeholder-${index}`,
        rank: index + 1,
        name: "虚位以待",
        className: "—",
        rankDelta: null as number | null,
        placeholder: true,
      };
    });
  }, [academicGrowth.progressLeaders, classes, progressLeaderLimit]);
  const totalEvaluationCount =
    analytics?.totalScoreRecordCount ?? scoreRecords.length;

  const ruleDistribution = useMemo(() => {
    const source = analytics?.ruleDistribution?.length
      ? analytics.ruleDistribution
      : Array.from(
          rules.reduce((map, item) => {
            const key = item.dimension || item.sceneCode || "其他";
            map.set(key, (map.get(key) ?? 0) + 1);
            return map;
          }, new Map<string, number>()),
        ).map(([name, value]) => ({ name, value }));
    return source.sort((left, right) => right.value - left.value).slice(0, 6);
  }, [analytics?.ruleDistribution, rules]);

  const subjectDistribution = useMemo(() => {
    const source = analytics?.subjectDistribution?.length
      ? analytics.subjectDistribution
      : Array.from(
          academicScores.reduce((map, item) => {
            if (!item.subjectName || item.subjectCode === "total") return map;
            map.set(item.subjectName, (map.get(item.subjectName) ?? 0) + 1);
            return map;
          }, new Map<string, number>()),
        ).map(([name, value]) => ({ name, value }));
    return source.sort((left, right) => right.value - left.value).slice(0, 6);
  }, [academicScores, analytics?.subjectDistribution]);

  const heatMap = useMemo(() => {
    const rows = analytics?.heatMap?.rows?.length
      ? analytics.heatMap.rows
      : ["早读", "上午", "午后", "晚辅"];
    const cols = analytics?.heatMap?.cols?.length
      ? analytics.heatMap.cols
      : ["一", "二", "三", "四", "五"];
    const matrix = rows.map((row) => {
      const found = analytics?.heatMap?.data?.find((item) => item.row === row);
      return {
        row,
        values: cols.map((_, index) => Number(found?.values?.[index] ?? 0)),
      };
    });
    const max = Math.max(...matrix.flatMap((item) => item.values), 1);
    const total = matrix.flatMap((item) => item.values).reduce((sum, value) => sum + value, 0);
    return { rows, cols, matrix, max, total };
  }, [analytics?.heatMap]);
  const heatMapPeriodLabel = useMemo(() => {
    const range = getProjectionWeekAnalyticsRange();
    return `${range.startDate} 至 ${range.endDate}`;
  }, [refreshCount, lastUpdatedAt]);

  const gradeRows = useMemo(() => {
    const grouped = classes.reduce((map, item) => {
      const current = map.get(item.gradeName) ?? {
        gradeName: item.gradeName,
        classCount: 0,
        studentCount: 0,
        score: 0,
        active: 0,
      };
      current.classCount += 1;
      current.studentCount += item.studentCount;
      current.score += item.classScore;
      if (item.displayStatus === "enabled") current.active += 1;
      map.set(item.gradeName, current);
      return map;
    }, new Map<string, { gradeName: string; classCount: number; studentCount: number; score: number; active: number }>());
    return Array.from(grouped.values())
      .sort((left, right) => right.score - left.score)
      .slice(0, 5);
  }, [classes]);

  const teacherCount = useMemo(
    () =>
      new Set(
        classes
          .map((item) => item.homeroomTeacher?.id)
          .filter((id): id is number => typeof id === "number"),
      ).size,
    [classes],
  );

  const classBubbles = useMemo(() => {
    const sorted = [...classes]
      .sort((left, right) => right.classScore - left.classScore)
      .slice(0, 12);
    const maxScore = Math.max(...sorted.map((item) => item.classScore), 1);
    const bubbleLayout = [
      { left: 17, top: 37, scale: 1.22 },
      { left: 43, top: 24, scale: 1.02 },
      { left: 67, top: 26, scale: 1.02 },
      { left: 84, top: 31, scale: 0.9 },
      { left: 20, top: 61, scale: 0.84 },
      { left: 39, top: 57, scale: 0.84 },
      { left: 60, top: 58, scale: 0.82 },
      { left: 78, top: 58, scale: 0.82 },
      { left: 24, top: 83, scale: 0.8 },
      { left: 46, top: 80, scale: 0.76 },
      { left: 66, top: 81, scale: 0.76 },
      { left: 84, top: 82, scale: 0.74 },
    ];
    const bubbleHues = [186, 198, 210, 224, 236, 248, 258, 270, 282, 292, 304, 316];
    return sorted.map((item, index) => ({
      ...bubbleLayout[index % bubbleLayout.length],
      id: item.id,
      label: item.name.replace("班", ""),
      value: item.classScore,
      rank: index + 1,
      size: Math.round((22 + (item.classScore / maxScore) * 28) * bubbleLayout[index % bubbleLayout.length].scale),
      hue: bubbleHues[index % bubbleHues.length],
      glow: index < 3 ? "strong" : index < 8 ? "mid" : "soft",
    }));
  }, [classes]);

  const terminalBlips = useMemo(() => {
    return displayTerminals.slice(0, 18).map((item, index) => {
      const angle =
        ((index * 360) / Math.max(displayTerminals.length, 1) - 90) *
        (Math.PI / 180);
      const radius = 24 + (index % 4) * 9;
      return {
        id: item.id,
        state: item.onlineStatus,
        x: 50 + Math.cos(angle) * radius,
        y: 50 + Math.sin(angle) * radius,
      };
    });
  }, [displayTerminals]);

  const riskSegments = useMemo(() => {
    const { high, medium, low } = riskStats;
    const total = Math.max(high + medium + low, 1);
    return [
      { label: "高", value: high, width: (high / total) * 100, tone: "red" },
      {
        label: "中",
        value: medium,
        width: (medium / total) * 100,
        tone: "gold",
      },
      { label: "低", value: low, width: (low / total) * 100, tone: "green" },
    ];
  }, [riskStats]);
  const riskRows = analytics?.riskStudents ?? [];
  const offlineTerminals = Math.max(
    displayTerminals.length - onlineTerminals,
    0,
  );

  const gaugeValue = clampPercent(academicGrowth.growthIndex);
  const tickerItems = useMemo(() => {
    const eventItems = recentRecords.slice(0, 8).map((item) => {
      const student = students.find((row) => row.id === item.studentId);
      return `${student?.name ?? "学生"} ${item.scoreDelta > 0 ? "+" : ""}${item.scoreDelta} · ${getRecordLabel(item)}`;
    });
    const honorItems = honorRecords
      .slice(0, 8)
      .map(
        (item) => `${item.honorName} · ${item.studentName ?? item.className}`,
      );
    const growthItems = academicGrowth.progressLeaders
      .slice(0, 8)
      .map(
        (item) =>
          `${item.studentName} 进步 ${item.rankDelta > 0 ? "+" : ""}${item.rankDelta}`,
      );
    const classItems = topClasses
      .slice(0, 3)
      .map((item) => `${item.name} ${item.value}分`);
    const items = [
      ...eventItems,
      ...honorItems,
      ...growthItems,
      ...honorItems,
      ...growthItems,
      ...classItems,
    ];
    return items.length
      ? [...items, ...items]
      : ["等待实时数据接入", "校园成长数据墙运行中", "班级与学生数据持续同步"];
  }, [
    academicGrowth.progressLeaders,
    honorRecords,
    recentRecords,
    students,
    topClasses,
  ]);

  const studentById = useMemo(
    () => new Map(students.map((item) => [item.id, item])),
    [students],
  );
  const classById = useMemo(
    () => new Map(classes.map((item) => [item.id, item])),
    [classes],
  );
  const trendPolyline = makeSparkline(
    dailySeries.map((item) => item.score),
    328,
    70,
  );
  const trendAxisStep =
    dailySeries.length > 1 ? 320 / (dailySeries.length - 1) : 0;
  const aiTrendAxisStep =
    dailySeries.length > 1 ? 168 / (dailySeries.length - 1) : 0;
  const scoreMax = Math.max(...topClasses.map((item) => item.value), 1);
  const studentMax = Math.max(...topStudents.map((item) => item.value), 1);
  const connectionLabel =
    connectionStatus === "online"
      ? "在线"
      : connectionStatus === "connecting"
        ? "连接中"
        : "离线";
  const clockParts = clock.split(":");
  const networkSpeed =
    connectionStatus === "online"
      ? 96 + (refreshCount % 12)
      : connectionStatus === "connecting"
        ? 72 + (refreshCount % 8)
        : 48 + (refreshCount % 6);
  const frameRate =
    connectionStatus === "online"
      ? 58 + (refreshCount % 3)
      : connectionStatus === "connecting"
        ? 46 + (refreshCount % 4)
        : 30 + (refreshCount % 6);

  const coreChips = [
    { label: "学生", value: `${students.length}`, tone: "cyan" },
    {
      label: "老师",
      value: `${teacherCount}`,
      tone: "green",
    },
    { label: "正向", value: `${positiveToday}`, tone: "green" },
    { label: "负向", value: `${negativeToday}`, tone: "red" },
    { label: "班级", value: `${classes.length}`, tone: "gold" },
    { label: "萌宠", value: `${petBoundCount}`, tone: "purple" },
    { label: "学业", value: `${academicGrowth.growthIndex}`, tone: "cyan" },
    { label: "刷新", value: `${refreshCount}`, tone: "gold" },
  ];

  return (
    <div
      className={`projection-page projection-theme-${theme} projection-layout-${layoutMode}`}
    >
      <div className="projection-stage">
        <div className="projection-bg-grid" />
        <div className="projection-scanline" />
        <div className="projection-topbar">
          <div className="projection-brand">
            <img src={presentationLogo} alt="育英星宠 Logo" />
            <div>
              <strong>育英星宠 · 投屏模式</strong>
              <span>为孩子一生奠基，对民族未来负责</span>
            </div>
          </div>
          <div className="projection-top-metrics">
            <span>{currentSemesterName ?? "当前学期"}</span>
            <span>
              {new Date().getMonth() + 1}月{new Date().getDate()}日 星期{["日", "一", "二", "三", "四", "五", "六"][new Date().getDay()]}&nbsp;&nbsp;&nbsp;&nbsp;{weatherLabel} {weatherInfo?.temperatureText ?? "--°C"} {weatherInfo?.conditionText ?? ""}
            </span>
            <span className={`projection-socket ${connectionStatus}`}>
              <i />
              {connectionLabel}
            </span>
            <span>{`网速 ${networkSpeed}Mbps / 帧率 ${frameRate}fps`}</span>
          </div>
          <div className="projection-topbar-right">
            <button
              type="button"
              className="projection-theme-toggle"
              aria-label={
                theme === "outdoor" ? "切换至室内暗色" : "切换至户外亮色"
              }
              title={theme === "outdoor" ? "室内暗色" : "户外亮色"}
              onClick={toggleTheme}
            >
              <PresentationGlyph
                name={theme === "outdoor" ? "moon" : "sun"}
              />
            </button>
            <PresentationFullscreenButton className="projection-theme-toggle" />
            <div className="projection-layout-group" role="group" aria-label="投屏布局切换">
              <button
                type="button"
                className={`projection-theme-toggle projection-layout-toggle${layoutPreference === "classic" ? " is-active" : ""}`}
                aria-label="16比9投屏布局"
                title="16比9投屏布局"
                onClick={() => switchLayoutPreference("classic")}
              >
                <PresentationGlyph name="monitor" />
              </button>
              <button
                type="button"
                className={`projection-theme-toggle projection-layout-toggle${layoutPreference === "desktop" ? " is-active" : ""}`}
                aria-label="电脑可读布局"
                title="电脑可读布局"
                onClick={() => switchLayoutPreference("desktop")}
              >
                <PresentationGlyph name="desktop" />
              </button>
              <button
                type="button"
                className={`projection-theme-toggle projection-layout-toggle${layoutPreference === "fluid" ? " is-active" : ""}`}
                aria-label="平板铺满布局"
                title="平板铺满布局"
                onClick={() => switchLayoutPreference("fluid")}
              >
                <PresentationGlyph name="tablet" />
              </button>
            </div>
            <div className="projection-clock">
              <b>
                {clockParts[0]}:{clockParts[1]}
              </b>
              <span>:{clockParts[2] ?? "00"}</span>
            </div>
          </div>
        </div>

        <main className="projection-main">
          <section className="projection-left">
            <div className="projection-metric-grid">
              {metricCards.map((item) => (
                <div
                  className={`projection-metric-card tone-${item.tone}`}
                  key={item.label}
                >
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                  <em>{item.sub}</em>
                  <svg viewBox="0 0 116 34" aria-hidden="true">
                    <polyline points={makeSparkline(item.series, 116, 34)} />
                  </svg>
                </div>
              ))}
            </div>
            <div className="projection-panel projection-panel-mini">
              <div className="projection-panel-title">积分脉冲</div>
              <svg
                className="projection-wide-line"
                viewBox="0 0 328 70"
                aria-hidden="true"
              >
                {[16, 34, 52].map((y) => (
                  <line
                    key={y}
                    x1="0"
                    y1={y}
                    x2="328"
                    y2={y}
                    className="projection-chart-grid"
                  />
                ))}
                <polyline
                  className="projection-line-area"
                  points={`${trendPolyline} 328,70 0,70`}
                />
                <polyline
                  className="projection-line-main"
                  points={trendPolyline}
                />
                {dailySeries.map((item, index) => (
                  <text
                    key={item.key}
                    x={index * trendAxisStep + 2}
                    y="68"
                    className="projection-axis-text"
                  >
                    {item.label}
                  </text>
                ))}
              </svg>
              <div className="projection-series-data">
                {dailySeries.map((item) => (
                  <span key={item.key}>{item.score}</span>
                ))}
              </div>
            </div>
            <div className="projection-panel projection-panel-mini projection-panel-ai">
              <div className="projection-panel-title">AI 决策核心</div>
              <div className="projection-ai-card">
                <div className="projection-ai-model" aria-hidden="true">
                  <i />
                  <em />
                  <b>AI</b>
                </div>
                <div className="projection-ai-body">
                  <div className="projection-ai-stats">
                    <span>
                      推理<b>{todayEvaluationCount}</b>
                    </span>
                    <span>
                      风险<b>{highRiskCount}</b>
                    </span>
                    <span>
                      成长<b>{academicGrowth.growthIndex}</b>
                    </span>
                    <span>
                      同步<b>{totalEvaluationCount}</b>
                    </span>
                  </div>
                  <div className="projection-ai-trend">
                    <div className="projection-ai-trend-head">
                      <span>近10日评价脉冲</span>
                      <b>
                        {todayEvaluationCount > 0
                          ? `今日 ${positiveRate}% 正向`
                          : "待同步"}
                      </b>
                    </div>
                    <svg
                      className="projection-ai-signal"
                      viewBox="0 0 176 52"
                      preserveAspectRatio="none"
                      aria-hidden="true"
                    >
                      {[10, 26, 42].map((y) => (
                        <line
                          key={y}
                          x1="0"
                          y1={y}
                          x2="176"
                          y2={y}
                          className="projection-chart-grid"
                        />
                      ))}
                      <polyline
                        className="projection-line-area gold"
                        points={`${makeSparkline(
                          dailySeries.map((item) => item.total),
                          176,
                          52,
                        )} 176,52 0,52`}
                      />
                      <polyline
                        className="projection-line-main gold"
                        points={makeSparkline(
                          dailySeries.map((item) => item.total),
                          176,
                          52,
                        )}
                      />
                      {dailySeries.map((item, index) => (
                        <text
                          key={item.key}
                          x={index * aiTrendAxisStep + 2}
                          y="50"
                          className="projection-axis-text"
                        >
                          {item.label}
                        </text>
                      ))}
                    </svg>
                    <div className="projection-ai-trend-data">
                      {dailySeries.map((item) => (
                        <span key={item.key}>
                          <i>{item.total}</i>
                          <em>{item.score >= 0 ? `+${item.score}` : item.score}</em>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="projection-panel projection-risk projection-left-risk">
              <div className="projection-panel-title">风险堆叠</div>
              <div className="projection-risk-metrics">
                {riskSegments.map((item) => (
                  <span key={item.label}>
                    {item.label}
                    <b>{item.value}</b>
                  </span>
                ))}
                <span>
                  总<b>{riskStats.total}</b>
                </span>
              </div>
              <div className="projection-stack">
                {riskSegments.map((item) => (
                  <i
                    className={`tone-${item.tone}`}
                    key={item.label}
                    style={{
                      width: `${Math.max(item.value > 0 ? 8 : 0, item.width)}%`,
                    }}
                  >
                    {item.value}
                  </i>
                ))}
              </div>
              <div className="projection-left-risk-list">
                {riskRows.slice(0, riskPreviewLimit).map((item) => (
                  <div className="projection-left-risk-row" key={item.studentId}>
                    <em title={item.studentName}>{item.studentName}</em>
                    <i title={item.className}>{item.className}</i>
                    <span className={`tone-${item.riskLevel}`}>
                      {formatRiskLevelShort(item.riskLevel)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="projection-center">
            <div className="projection-core">
              <ProjectionHeroThree theme={theme} />
              <div className="projection-core-chip-ring">
                {coreChips.map((item, index) => (
                  <div
                    className={`projection-core-chip tone-${item.tone}`}
                    key={item.label}
                    style={{ ["--chip-index" as string]: index }}
                  >
                    <span>{item.label}</span>
                    <b>{item.value}</b>
                  </div>
                ))}
              </div>
              <div className="projection-core-score">
                <span>总积分</span>
                <strong>{formatNumber(totalScore)}</strong>
              </div>
            </div>

            <div className="projection-center-grid">
              <div className="projection-panel projection-class-bubbles">
                <div className="projection-panel-title">班级势能</div>
                <div className="projection-bubble-layout">
                  <div className="projection-bubble-field">
                    {classBubbles.map((item) => {
                      const bubbleStyle = getBubbleBackground(theme, item.hue);
                      return (
                      <div
                        key={item.id}
                        className={`projection-bubble glow-${item.glow}`}
                        style={{
                          left: `${item.left}%`,
                          top: `${item.top}%`,
                          width: `${item.size}px`,
                          height: `${item.size}px`,
                          ["--bubble-hue" as string]: `${item.hue}`,
                          background: bubbleStyle.background,
                          ...(bubbleStyle.borderColor
                            ? {
                                borderColor: bubbleStyle.borderColor,
                                color: bubbleStyle.color,
                              }
                            : {}),
                        }}
                      >
                        <small>{item.rank}</small>
                        <span>{item.label}</span>
                        <b>{formatCompact(item.value)}</b>
                      </div>
                    );
                    })}
                  </div>
                  <div className="projection-grade-table">
                    {gradeRows.map((item) => (
                      <div key={item.gradeName}>
                        <span>{item.gradeName.replace("年级", "").replace(/[^一二三四五六七八九十]/g, "")}</span>
                        <em>{item.classCount}</em>
                        <b>{item.score}</b>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="projection-panel projection-heat">
                <div className="projection-panel-title">热力矩阵</div>
                <div
                  className="projection-heat-grid"
                  style={{
                    gridTemplateColumns: `42px repeat(${heatMap.cols.length}, 1fr)`,
                  }}
                >
                  <span />
                  {heatMap.cols.map((col) => (
                    <b key={col}>{col}</b>
                  ))}
                  {heatMap.matrix.map((row) => (
                    <Fragment key={row.row}>
                      <em key={`${row.row}-label`}>{row.row}</em>
                      {row.values.map((value, index) => {
                        const heatLevel = getHeatLevel(value, heatMap.max);
                        return (
                        <i
                          key={`${row.row}-${index}`}
                          className={
                            theme === "outdoor"
                              ? `proj-heat-${heatLevel}`
                              : undefined
                          }
                          style={
                            theme === "scifi"
                              ? {
                                  opacity:
                                    0.24 + (value / heatMap.max) * 0.76,
                                }
                              : undefined
                          }
                        >
                          {value}
                        </i>
                      );
                      })}
                    </Fragment>
                  ))}
                </div>
                <div className="projection-heat-footnote">
                  本周（一—五）· {heatMapPeriodLabel} · 共 {heatMap.total} 次
                </div>
              </div>
              <div className="projection-panel projection-bars">
                <div className="projection-panel-title">班级TOP</div>
                <div className="projection-bars-list">
                  {topClasses.map((item, index) => (
                      <div className="projection-bar-row" key={item.id}>
                        <span>{index + 1}</span>
                        <b>{item.name}</b>
                        <i>
                          <em
                            style={{
                              width: `${item.value > 0 ? Math.max(5, (item.value / scoreMax) * 100) : 0}%`,
                            }}
                          />
                        </i>
                        <strong>{item.value > 0 ? formatCompact(item.value) : "—"}</strong>
                      </div>
                  ))}
                </div>
              </div>
              <div className="projection-panel projection-progress">
                <div className="projection-panel-title">进步之星</div>
                {progressLeaders.length ? (
                  <div className="projection-progress-list">
                    {progressLeaders.map((item) => (
                      <div
                        className={`projection-progress-row${item.placeholder ? " is-placeholder" : ""}`}
                        key={item.key}
                      >
                        <span>{item.rank}</span>
                        <b>{item.name}</b>
                        <em>{item.className}</em>
                        <i>
                          {item.placeholder
                            ? "—"
                            : `${item.rankDelta! > 0 ? "+" : ""}${item.rankDelta}`}
                        </i>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="projection-progress-empty">暂无学业进步数据</div>
                )}
              </div>
              <div className="projection-panel projection-donuts">
                <div className="projection-panel-title">维度/学科</div>
                <div className="projection-donuts-body">
                  <MiniDonut
                    theme={theme}
                    title="评价"
                    items={ruleDistribution}
                    limit={4}
                  />
                  <MiniDonut
                    theme={theme}
                    title="学科"
                    items={subjectDistribution}
                    limit={4}
                  />
                </div>
              </div>
            </div>
          </section>

          <section className="projection-right">
            <div className="projection-panel projection-live-panel">
              <div className="projection-panel-title">实时流</div>
              <div className="projection-live-list">
                {[
                  ...recentRecords.slice(0, 14),
                  ...recentRecords.slice(0, 14),
                ].map((item, index) => {
                  const student = studentById.get(item.studentId);
                  const classInfo = classById.get(item.classId);
                  return (
                    <div
                      className={`projection-live-row ${item.scoreDelta >= 0 ? "up" : "down"}`}
                      key={`${item.id}-${index}`}
                    >
                      <span>
                        {new Date(item.createdAt)
                          .toLocaleTimeString("zh-CN", { hour12: false })
                          .slice(0, 8)}
                      </span>
                      <b>{student?.name ?? `#${item.studentId}`}</b>
                      <em>
                        {classInfo
                          ? `${classInfo.gradeName}${classInfo.name}`
                          : item.classId}
                      </em>
                      <i>{getRecordLabel(item)}</i>
                      <strong>
                        {item.scoreDelta > 0 ? "+" : ""}
                        {item.scoreDelta}
                      </strong>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="projection-panel projection-students">
              <div className="projection-panel-title">
                学生TOP · TOP{topStudentLimit}
              </div>
              <div className="projection-students-grid">
                {topStudents.map((item) => (
                  <div
                    className={`projection-student-row${
                      item.rank === 1
                        ? " rank-gold"
                        : item.rank === 2
                          ? " rank-silver"
                          : item.rank === 3
                            ? " rank-bronze"
                            : ""
                    }`}
                    key={item.id}
                  >
                    <em>{item.rank}</em>
                    <span>{item.name}</span>
                    <small>{item.className}</small>
                    {item.petLevel > 0 ? (
                      <u title={item.petName ?? undefined}>Lv.{item.petLevel}</u>
                    ) : (
                      <u className="muted">—</u>
                    )}
                    <i>
                      <em
                        style={{
                          width: `${Math.max(8, (item.value / studentMax) * 100)}%`,
                        }}
                      />
                    </i>
                    <b>{formatCompact(item.value)}</b>
                  </div>
                ))}
              </div>
            </div>

            <div className="projection-right-strip">
              <div className="projection-panel projection-radar projection-panel-strip">
                <div className="projection-panel-title">终端雷达</div>
                <div className="projection-radar-core">
                  <i className="projection-radar-ring r1" />
                  <i className="projection-radar-ring r2" />
                  <i className="projection-radar-sweep" />
                  {terminalBlips.map((item) => (
                    <span
                      key={item.id}
                      className={item.state}
                      style={{ left: `${item.x}%`, top: `${item.y}%` }}
                    />
                  ))}
                  <b>
                    {onlineTerminals}/{displayTerminals.length}
                  </b>
                </div>
                <div className="projection-radar-stats">
                  <span>
                    在线<b>{onlineTerminals}</b>
                  </span>
                  <span>
                    离线<b>{offlineTerminals}</b>
                  </span>
                  <span>
                    点位<b>{terminalBlips.length}</b>
                  </span>
                  <span>
                    保底<b>{pollingFallback ? "10s" : "60s"}</b>
                  </span>
                </div>
              </div>
              <div className="projection-panel projection-gauge projection-panel-strip">
                <div className="projection-panel-title">学业指数</div>
                <div
                  className="projection-gauge-ring"
                  style={{ ["--gauge" as string]: `${gaugeValue}%` }}
                >
                  <strong>{academicGrowth.growthIndex}</strong>
                  <span>{academicGrowth.latestExam?.name ?? "暂无考试"}</span>
                </div>
                <div className="projection-gauge-stats">
                  <span>
                    覆盖<b>{academicGrowth.coverageRate}%</b>
                  </span>
                  <span>
                    参与<b>{academicGrowth.participantCount}</b>
                  </span>
                  <span>
                    进步<b>{academicGrowth.progressCount}</b>
                  </span>
                  <span>
                    预警<b>{academicGrowth.riskCount}</b>
                  </span>
                </div>
              </div>
            </div>
          </section>
        </main>

        <footer className="projection-ticker">
          <div className="projection-ticker-track">
            {tickerItems.map((item, index) => (
              <span key={`${item}-${index}`}>
                <PresentationGlyph name="star" />
                {item}
              </span>
            ))}
          </div>
        </footer>

        {((loading && snapshot.classes.length === 0) ||
          (error && snapshot.classes.length === 0)) && (
          <div className="projection-status">
            {loading && snapshot.classes.length === 0 ? (
              <span>数据装载中</span>
            ) : null}
            {error && snapshot.classes.length === 0 ? (
              <strong>{error}</strong>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}

function MiniDonut({
  theme,
  title,
  items,
  limit = 3,
}: {
  theme: ProjectionTheme;
  title: string;
  items: Array<{ name: string; value: number }>;
  limit?: number;
}) {
  const total = Math.max(
    items.reduce((sum, item) => sum + item.value, 0),
    1,
  );
  const colors = PROJECTION_CHART_COLORS[theme];
  const conic = items.reduce(
    (result, item, index) => {
      const next = result.current + (item.value / total) * 100;
      result.parts.push(
        `${colors[index % colors.length]} ${result.current}% ${next}%`,
      );
      result.current = next;
      return result;
    },
    { current: 0, parts: [] as string[] },
  );
  return (
    <div className="projection-donut-block">
      <div
        className="projection-donut"
        style={{ background: `conic-gradient(${conic.parts.join(", ")})` }}
      >
        <span>{title}</span>
      </div>
      <div className="projection-donut-legend">
        {items.slice(0, limit).map((item) => (
          <span key={item.name}>
            <i>{resolveSubjectLabel(undefined, item.name)}</i>
            <b>{item.value}</b>
          </span>
        ))}
      </div>
    </div>
  );
}

/** 投屏模式显示主题 */
export type ProjectionTheme = "outdoor" | "scifi";

const STORAGE_KEY = "projectionTheme";

export function resolveProjectionTheme(
  searchParams: URLSearchParams,
): ProjectionTheme {
  const fromUrl = searchParams.get("theme");
  if (fromUrl === "scifi") return "scifi";
  if (fromUrl === "outdoor") return "outdoor";
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "scifi" || stored === "outdoor") return stored;
  } catch {
    // ignore
  }
  return "outdoor";
}

export function persistProjectionTheme(theme: ProjectionTheme) {
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // ignore
  }
}

/** 环形图色板 */
export const PROJECTION_CHART_COLORS: Record<
  ProjectionTheme,
  readonly string[]
> = {
  outdoor: [
    "#1268b8",
    "#18985c",
    "#d48500",
    "#6852c6",
    "#d43d2e",
    "#2b8cc4",
  ],
  scifi: [
    "#00e5ff",
    "#36f5a2",
    "#ffb300",
    "#8b7cff",
    "#ff5b6d",
    "#4fb8ff",
  ],
};

/** 热力矩阵档位 0–4（对齐驾驶舱 ck-heat） */
export function getHeatLevel(value: number, max: number): number {
  if (value <= 0 || max <= 0) return 0;
  const ratio = value / max;
  if (ratio <= 0.2) return 1;
  if (ratio <= 0.4) return 2;
  if (ratio <= 0.65) return 3;
  return 4;
}

/** 班级气泡背景（户外实心 / 室内霓虹渐变） */
export function getBubbleBackground(theme: ProjectionTheme, hue: number) {
  if (theme === "outdoor") {
    return {
      background: `radial-gradient(circle at 32% 28%, hsla(${hue}, 78%, 88%, 1), hsla(${hue}, 70%, 72%, 0.95) 55%, hsla(${hue}, 55%, 58%, 0.35) 100%)`,
      borderColor: `hsla(${hue}, 62%, 38%, 0.9)`,
      color: "#1a2f3d",
    };
  }
  return {
    background: `radial-gradient(circle at 32% 28%, hsla(${hue}, 100%, 78%, .95), hsla(${hue}, 98%, 56%, .55) 42%, hsla(${hue}, 92%, 26%, .22) 76%, rgba(0, 0, 0, 0) 100%)`,
    borderColor: undefined as string | undefined,
    color: undefined as string | undefined,
  };
}

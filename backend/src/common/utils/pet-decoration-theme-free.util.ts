/** 主题皮肤限时免费规则（存于 pet_decoration.theme_free_rule） */
export type ThemeFreeRule =
  | { kind: 'annual'; month: number; day: number }
  | { kind: 'range'; start: string; end: string };

const CHINA_TIMEZONE = 'Asia/Shanghai';

function parseYmd(value: string): { year: number; month: number; day: number } | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split('-').map(Number);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  return { year, month, day };
}

/** 按中国时区取 YYYY-MM-DD */
export function formatDateInChina(date: Date): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: CHINA_TIMEZONE }).format(date);
}

/** 按中国时区取月/日 */
export function getChinaMonthDay(date: Date): { month: number; day: number } {
  const ymd = formatDateInChina(date);
  const [, month, day] = ymd.split('-').map(Number);
  return { month, day };
}

export function normalizeThemeFreeRule(raw: unknown): ThemeFreeRule | null {
  if (!raw || typeof raw !== 'object') return null;
  const rule = raw as Record<string, unknown>;
  if (rule.kind === 'annual') {
    const month = Number(rule.month);
    const day = Number(rule.day);
    if (!Number.isInteger(month) || month < 1 || month > 12) return null;
    if (!Number.isInteger(day) || day < 1 || day > 31) return null;
    return { kind: 'annual', month, day };
  }
  if (rule.kind === 'range') {
    const start = typeof rule.start === 'string' ? rule.start : '';
    const end = typeof rule.end === 'string' ? rule.end : '';
    if (!parseYmd(start) || !parseYmd(end)) return null;
    if (start > end) return null;
    return { kind: 'range', start, end };
  }
  return null;
}

/** 判断指定日期是否处于主题限时免费时段 */
export function isThemeFreeActive(
  rawRule: unknown,
  evalDate: Date = new Date(),
): boolean {
  const rule = normalizeThemeFreeRule(rawRule);
  if (!rule) return false;

  if (rule.kind === 'annual') {
    const { month, day } = getChinaMonthDay(evalDate);
    return month === rule.month && day === rule.day;
  }

  const ymd = formatDateInChina(evalDate);
  return ymd >= rule.start && ymd <= rule.end;
}

/** 生成前端展示用文案 */
export function describeThemeFreeRule(rawRule: unknown): string | null {
  const rule = normalizeThemeFreeRule(rawRule);
  if (!rule) return null;
  if (rule.kind === 'annual') {
    return `每年 ${rule.month} 月 ${rule.day} 日限时免费`;
  }
  if (rule.start === rule.end) {
    return `${rule.start} 限时免费`;
  }
  return `${rule.start} 至 ${rule.end} 限时免费`;
}

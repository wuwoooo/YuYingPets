import { format, isValid, parse } from 'date-fns';

/** 将 yyyy-MM-dd 解析为本地日期 */
export function parseIsoDate(value: string | undefined): Date | undefined {
  if (!value) return undefined;
  const parsed = parse(value, 'yyyy-MM-dd', new Date());
  return isValid(parsed) ? parsed : undefined;
}

/** 将日期格式化为 yyyy-MM-dd */
export function formatIsoDate(date: Date | undefined): string {
  if (!date || !isValid(date)) return '';
  return format(date, 'yyyy-MM-dd');
}

/** 界面展示用 yyyy/MM/dd */
export function formatDisplayDate(value: string | undefined): string {
  const parsed = parseIsoDate(value);
  if (!parsed) return '';
  return format(parsed, 'yyyy/MM/dd');
}

/** 解析 datetime-local 格式 yyyy-MM-ddTHH:mm */
export function parseDateTimeLocal(value: string | undefined): { date: string; time: string } | undefined {
  if (!value) return undefined;
  const match = value.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/);
  if (!match) return undefined;
  const date = match[1];
  const time = match[2];
  if (!parseIsoDate(date)) return undefined;
  return { date, time };
}

/** 合并日期与时间，输出 datetime-local 格式 */
export function combineDateTimeLocal(date: string, time: string): string {
  if (!date || !time) return '';
  return `${date}T${time}`;
}

/** 界面展示用 yyyy/MM/dd HH:mm */
export function formatDisplayDateTime(value: string | undefined): string {
  const parsed = parseDateTimeLocal(value);
  if (!parsed) return '';
  return `${formatDisplayDate(parsed.date)} ${parsed.time}`;
}

/** 默认倒计时/截止时间常用时刻 */
export const DEFAULT_DATE_TIME = '09:00';

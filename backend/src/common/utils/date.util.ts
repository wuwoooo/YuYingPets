/**
 * 计算指定日期所在滚动周期（近 7 天 / 近 30 天）的起始时间。
 * @param periodType 'weekly' (近 7 天) | 'monthly' (近 30 天)
 * @param baseDate 基准时间，默认为当前时间
 */
export function getChinaPeriodStartLimit(periodType: 'weekly' | 'monthly', baseDate: Date = new Date()): Date {
  if (periodType === 'weekly') {
    // 往前 7 天
    return new Date(baseDate.getTime() - 7 * 24 * 3600 * 1000);
  } else {
    // 往前 30 天
    return new Date(baseDate.getTime() - 30 * 24 * 3600 * 1000);
  }
}

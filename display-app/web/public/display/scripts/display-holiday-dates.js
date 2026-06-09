/**
 * 农历节日 → 公历对照（中国时区 Asia/Shanghai）
 * 端午：默认按当年五月初五单日；可在 DRAGON_BOAT_FESTIVAL_RANGES 配置区间
 */
(function initDisplayHolidayDates(global) {
  /** 单日对照（非区间年份 fallback） */
  const DRAGON_BOAT_FESTIVAL_YMD_BY_YEAR = {
    2024: "2024-06-10",
    2025: "2025-05-31",
    2027: "2027-06-09",
    2028: "2028-05-28",
    2029: "2029-06-16",
    2030: "2030-06-06",
    2031: "2031-06-25",
    2032: "2032-06-14",
  };

  /**
   * 区间彩蛋：[start, end) 半开区间，按中国时区自然日
   * 例：2026-06-09 00:00 起至 2026-06-20 00:00 止 → 含 6/9～6/19
   */
  const DRAGON_BOAT_FESTIVAL_RANGES = {
    2026: { start: "2026-06-09", end: "2026-06-20" },
  };

  function formatChinaYmd(date) {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Shanghai",
    }).format(date);
  }

  function isYmdInHalfOpenRange(ymd, start, end) {
    return ymd >= start && ymd < end;
  }

  /** 判断日期是否处于端午节彩蛋时段 */
  function matchDragonBoatFestival(date) {
    const ymd = formatChinaYmd(date);
    const year = Number(ymd.slice(0, 4));
    const range = DRAGON_BOAT_FESTIVAL_RANGES[year];
    if (range) {
      return isYmdInHalfOpenRange(ymd, range.start, range.end);
    }
    return DRAGON_BOAT_FESTIVAL_YMD_BY_YEAR[year] === ymd;
  }

  global.DisplayHolidayDates = {
    DRAGON_BOAT_FESTIVAL_YMD_BY_YEAR,
    DRAGON_BOAT_FESTIVAL_RANGES,
    formatChinaYmd,
    matchDragonBoatFestival,
  };
})(window);

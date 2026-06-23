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

  const DISPLAY_HOLIDAY_PRESENTATION = {
    "children-day": {
      enableTransition: true,
      transition: {
        kicker: "儿童节彩蛋已开启",
        title: "六一儿童节快乐",
        copy: "愿每一颗星宠都和同学们一起闪闪发光",
      },
      badge: { kicker: "6.1 儿童节", title: "童心闪闪 快乐成长" },
      classroomTitle: { number: "6.1", main: "儿童节快乐", em: "今天的大屏有彩蛋" },
      sloganMain: "六一儿童节快乐",
      sloganTag: "星宠同庆",
      cardBadge: "6.1",
      pointModalBadge: "6.1 儿童节限定",
    },
    "dragon-boat-festival": {
      enableTransition: true,
      transition: {
        kicker: "端午节彩蛋已开启",
        title: "端午安康",
        copy: "愿每一位同学与星宠共度龙舟竞渡好时光",
      },
      badge: { kicker: "端午佳节", title: "粽叶飘香 龙舟竞渡" },
      classroomTitle: { number: "端午", main: "端午安康", em: "今天的大屏有彩蛋" },
      sloganMain: "端午安康",
      sloganTag: "星宠同庆",
      cardBadge: "端午",
      pointModalBadge: "端午限定",
    },
  };

  const DISPLAY_HOLIDAY_CONFIGS = [
    {
      key: "children-day",
      className: "display-holiday-children-day",
      matchDate(date) {
        const [, month, day] = formatChinaYmd(date).split("-").map(Number);
        return month === 6 && day === 1;
      },
    },
    {
      key: "dragon-boat-festival",
      className: "display-holiday-dragon-boat",
      matchDate(date) {
        return matchDragonBoatFestival(date) === true;
      },
    },
  ];

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

  function parseDisplayHolidayDate(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value || "")) return null;
    const [year, month, day] = value.split("-").map(Number);
    const date = new Date(year, month - 1, day);
    if (
      date.getFullYear() !== year ||
      date.getMonth() !== month - 1 ||
      date.getDate() !== day
    ) {
      return null;
    }
    return date;
  }

  function getDisplayHolidayEvaluationDate(url = global.location?.href) {
    const params = new URL(url).searchParams;
    return parseDisplayHolidayDate(params.get("holidayDate")) || new Date();
  }

  function resolveDisplayHoliday(date = getDisplayHolidayEvaluationDate(), url = global.location?.href) {
    const params = new URL(url).searchParams;
    const override = (params.get("holiday") || "").trim().toLowerCase();
    if (override === "none" || override === "off" || override === "0") return null;
    if (override) {
      return DISPLAY_HOLIDAY_CONFIGS.find((item) => item.key === override) || null;
    }
    return DISPLAY_HOLIDAY_CONFIGS.find((item) => item.matchDate(date)) || null;
  }

  function getDisplayHolidayPresentation(holiday) {
    return holiday ? DISPLAY_HOLIDAY_PRESENTATION[holiday.key] || null : null;
  }

  function setHolidayText(id, text) {
    const el = document.getElementById(id);
    if (el && text != null) el.textContent = text;
  }

  function applyHolidayPresentation(holiday) {
    const layer = document.getElementById("classroomHolidayLayer");
    DISPLAY_HOLIDAY_CONFIGS.forEach((item) => {
      layer?.classList.toggle(`is-${item.key}`, !!holiday && holiday.key === item.key);
    });
    const presentation = getDisplayHolidayPresentation(holiday);
    if (!presentation) return;

    setHolidayText("transHolidayKicker", presentation.transition?.kicker);
    setHolidayText("transHolidayTitle", presentation.transition?.title);
    setHolidayText("transHolidayCopy", presentation.transition?.copy);
    setHolidayText("holidayBadgeKicker", presentation.badge?.kicker);
    setHolidayText("holidayBadgeTitle", presentation.badge?.title);
    setHolidayText("holidayClassroomTitleNumber", presentation.classroomTitle?.number);
    setHolidayText("holidayClassroomTitleMain", presentation.classroomTitle?.main);
    setHolidayText("holidayClassroomTitleEm", presentation.classroomTitle?.em);
  }

  global.DisplayHolidayDates = {
    DRAGON_BOAT_FESTIVAL_YMD_BY_YEAR,
    DRAGON_BOAT_FESTIVAL_RANGES,
    DISPLAY_HOLIDAY_PRESENTATION,
    DISPLAY_HOLIDAY_CONFIGS,
    formatChinaYmd,
    matchDragonBoatFestival,
    parseDisplayHolidayDate,
    getDisplayHolidayEvaluationDate,
    resolveDisplayHoliday,
    getDisplayHolidayPresentation,
    applyHolidayPresentation,
  };
})(window);

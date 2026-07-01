(function initDisplayTermRecap(global) {
  const TERM_RECAP_SCENES = ["race"];
  const THEME_AUDIO_SRC = "audio/term-recap/BreathandLife.mp3";
  const SCORE_RACE_DAY_COUNT = 30;
  const SCORE_RACE_REFRESH_MS = 60 * 1000;
  const SCORE_RACE_AUDIO_MS = 108 * 1000;
  const SCORE_RACE_AUDIO_TAIL_MS = 18 * 1000;
  const SCORE_RACE_MAX_PLAY_MS = SCORE_RACE_AUDIO_MS - SCORE_RACE_AUDIO_TAIL_MS;
  const SCORE_RACE_MIN_FRAME_MS = 800;
  const SCORE_RACE_MAX_FRAME_MS = 2000;
  const SCORE_RACE_QUERY_LIMIT = 10000;

  const state = {
    provider: null,
    model: null,
    sceneOrder: [...TERM_RECAP_SCENES],
    sceneIndex: 0,
    timer: null,
    raceTimer: null,
    raceFrameIndex: 0,
    raceChart: null,
    raceChartReady: false,
    refreshTimer: null,
    pendingModel: null,
    applyingPendingModel: false,
    audio: null,
    audioFadeTimer: null,
    loading: false,
    initialized: false,
  };

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function toNumber(value, fallback = 0) {
    const number = Number(value);
    return Number.isFinite(number) ? number : fallback;
  }

  function getRecordTime(record) {
    const raw = record?.occurredAt || record?.createdAt;
    const time = raw ? new Date(raw).getTime() : NaN;
    return Number.isFinite(time) ? time : Date.now();
  }

  function formatNumber(value) {
    return new Intl.NumberFormat("zh-CN").format(Math.round(toNumber(value)));
  }

  function formatDateLabel(time) {
    const date = new Date(time);
    return `${date.getMonth() + 1}.${date.getDate()}`;
  }

  function formatRaceDateLabel(time) {
    const date = new Date(time);
    return `${date.getMonth() + 1}月${date.getDate()}日`;
  }

  function formatQueryDate(time) {
    const date = new Date(time);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function parseDateAtStart(value) {
    if (!value) return null;
    const date = new Date(value);
    const time = date.getTime();
    if (!Number.isFinite(time)) return null;
    date.setHours(0, 0, 0, 0);
    return date.getTime();
  }

  function resolveFallbackSemesterStart(now = Date.now()) {
    const date = new Date(now);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    if (month >= 8) return new Date(year, 8, 1).getTime();
    if (month >= 2) return new Date(year, 1, 20).getTime();
    return new Date(year - 1, 8, 1).getTime();
  }

  function resolveScoreRaceTermRange() {
    const rs = runtimeState();
    const now = Date.now();
    const start =
      parseDateAtStart(global.__SCORE_RACE_TERM_START_DATE__) ||
      parseDateAtStart(rs.termStartDate) ||
      parseDateAtStart(rs.semesterStartDate) ||
      parseDateAtStart(rs.currentSemester?.startDate) ||
      parseDateAtStart(rs.semester?.startDate) ||
      parseDateAtStart(rs.home?.termStartDate) ||
      parseDateAtStart(rs.home?.semesterStartDate) ||
      resolveFallbackSemesterStart(now);
    const end = now;
    return {
      start: Math.min(start, end),
      end,
    };
  }

  function inclusiveDayCount(start, end) {
    const dayMs = 24 * 60 * 60 * 1000;
    const startDate = new Date(start);
    const endDate = new Date(end);
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);
    return Math.max(1, Math.floor((endDate.getTime() - startDate.getTime()) / dayMs) + 1);
  }

  function resolveRaceFrameStep(dayCount) {
    if (dayCount <= 1) return 1;
    const maxFrameCount = Math.max(2, Math.floor(SCORE_RACE_MAX_PLAY_MS / SCORE_RACE_MIN_FRAME_MS));
    return Math.max(1, Math.ceil(dayCount / maxFrameCount));
  }

  function normalizeListResponse(value) {
    if (Array.isArray(value)) return value;
    if (Array.isArray(value?.data)) return value.data;
    if (Array.isArray(value?.rows)) return value.rows;
    if (Array.isArray(value?.items)) return value.items;
    if (Array.isArray(value?.data?.rows)) return value.data.rows;
    if (Array.isArray(value?.data?.items)) return value.data.items;
    return [];
  }

  function recordDayCoverage(records) {
    const byDay = new Map();
    records.forEach((record) => {
      const time = getRecordTime(record);
      if (!Number.isFinite(time)) return;
      const date = new Date(time);
      const key = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
      byDay.set(key, (byDay.get(key) || 0) + 1);
    });
    const counts = Array.from(byDay.values());
    return {
      dayCount: byDay.size,
      minRecordsPerDay: counts.length ? Math.min(...counts) : 0,
      maxRecordsPerDay: counts.length ? Math.max(...counts) : 0,
    };
  }

  function shouldUseGeneratedRaceRecords(students, records) {
    if (!students.length) return false;
    const rs = runtimeState();
    const className = rs.home?.className || "";
    if (isDemoMode() || !rs.classId) return !records.length;
    const isSixtyOneClass = className.includes("61班") || className.includes("六") || className.includes("6");
    if (!isSixtyOneClass) return !records.length;
    const coverage = recordDayCoverage(records);
    return records.length < students.length * 8 || coverage.dayCount < 16 || coverage.minRecordsPerDay < 6;
  }

  function isDemoMode() {
    try {
      return (
        global.__DISPLAY_DEMO_MODE__ === true ||
        new URLSearchParams(global.location.search).get("demo") === "1"
      );
    } catch {
      return false;
    }
  }

  function localStudents() {
    const rows = state.provider?.getStudents?.() || [];
    return Array.isArray(rows) ? rows : [];
  }

  function runtimeState() {
    return state.provider?.getRuntimeState?.() || {};
  }

  function petImage(row) {
    return state.provider?.petImg?.(row, 400) || row.petImageUrl || row.avatarUrl || "images/logo.svg";
  }

  function normalizeStudentRows(leaderboardRows = []) {
    const local = localStudents();
    const localById = new Map(local.map((row) => [String(row.id), row]));
    const source = leaderboardRows.length
      ? leaderboardRows
      : local.map((row, index) => ({
          rank: index + 1,
          id: row.id,
          name: row.name,
          currentScore: row.currentScore ?? row.pts,
          currentPetLevel: row.currentPetLevel ?? row.lv,
          petName: row.petName,
          petNickname: row.petNickname,
          petImageUrl: row.petImageUrl,
          avatarUrl: row.avatarUrl,
          hasPet: row.hasPet,
        }));

    return source
      .map((row, index) => {
        const localRow = localById.get(String(row.id)) || {};
        const merged = { ...localRow, ...row };
        const score = toNumber(merged.currentScore ?? merged.pts ?? merged.score, 0);
        return {
          id: merged.id ?? `student-${index}`,
          name: merged.name || "同学",
          rank: toNumber(merged.rank, index + 1),
          score,
          level: toNumber(merged.currentPetLevel ?? merged.lv, 1),
          petName: merged.petNickname || merged.petName || localRow.petNickname || localRow.petName || "星宠伙伴",
          hasPet: merged.hasPet !== false,
          petImageUrl: merged.petImageUrl || localRow.petImageUrl || null,
          avatarUrl: merged.avatarUrl || localRow.avatarUrl || null,
          raw: merged,
        };
      })
      .sort((left, right) => right.score - left.score || left.name.localeCompare(right.name, "zh-CN"));
  }

  function buildDemoRecords(students, termRange = resolveScoreRaceTermRange()) {
    const dayMs = 24 * 60 * 60 * 1000;
    const dayCount = Math.max(SCORE_RACE_DAY_COUNT, inclusiveDayCount(termRange.start, termRange.end));
    const startDate = new Date(termRange.start);
    startDate.setHours(0, 0, 0, 0);
    const start = startDate.getTime();
    const records = [];
    students.forEach((student, studentIndex) => {
      const target = Math.max(0, student.score);
      const patterns = [
        [1, 1, 1, 1, 2, 2, 3, 4, 5, 7, 9, 12, 15, 18, 20, 23, 26, 30, 34, 38, 44, 50, 58, 66, 76, 88, 102, 118, 135, 154, 176, 200],
        [160, 142, 126, 110, 96, 84, 73, 63, 54, 46, 39, 33, 28, 24, 20, 17, 15, 13, 11, 10, 9, 8, 8, 7, 7, 7, 6, 6, 6, 6, 6, 6],
        [8, 9, 11, 13, 16, 20, 26, 34, 45, 58, 72, 84, 92, 86, 74, 60, 46, 34, 26, 20, 16, 13, 11, 10, 9, 8, 8, 8, 7, 7, 7, 7],
        [3, 4, 5, 6, 8, 10, 13, 17, 22, 29, 38, 50, 64, 78, 88, 82, 68, 52, 38, 28, 21, 16, 13, 11, 10, 9, 8, 8, 7, 7, 7, 7],
        [14, 9, 7, 6, 5, 5, 6, 8, 11, 16, 24, 36, 52, 70, 86, 92, 78, 58, 38, 26, 20, 18, 20, 26, 36, 50, 68, 88, 108, 130, 154, 180],
        [5, 6, 7, 8, 10, 12, 15, 19, 24, 31, 40, 52, 66, 82, 96, 88, 72, 56, 44, 35, 28, 23, 19, 16, 14, 12, 11, 10, 9, 9, 8, 8],
        [76, 88, 104, 124, 142, 132, 105, 78, 54, 38, 28, 22, 18, 16, 16, 18, 22, 28, 36, 46, 58, 70, 64, 52, 40, 30, 23, 18, 15, 13, 11, 10],
        [6, 7, 8, 10, 12, 15, 18, 22, 28, 34, 42, 52, 64, 78, 92, 104, 96, 78, 58, 40, 28, 22, 18, 15, 13, 11, 10, 9, 8, 8, 7, 7],
      ];
      const sourceWeights = patterns[studentIndex % patterns.length];
      const weights = Array.from({ length: dayCount }, (_, index) => {
        const sourceIndex = Math.round((index / Math.max(1, dayCount - 1)) * (sourceWeights.length - 1));
        return sourceWeights[sourceIndex] || 1;
      });
      const weightTotal = weights.reduce((sum, item) => sum + item, 0);
      const dailyFloor = target >= dayCount ? 1 : 0;
      const remainingTarget = Math.max(0, target - dailyFloor * dayCount);
      const rawChunks = weights.map((weight) => (remainingTarget * weight) / weightTotal);
      const chunks = rawChunks.map((value) => dailyFloor + Math.floor(value));
      let rest = target - chunks.reduce((sum, item) => sum + item, 0);
      rawChunks
        .map((value, index) => ({ index, fraction: value - Math.floor(value) }))
        .sort((left, right) => right.fraction - left.fraction || ((left.index + studentIndex) % dayCount) - ((right.index + studentIndex) % dayCount))
        .forEach((item) => {
          if (rest <= 0) return;
          chunks[item.index] += 1;
          rest -= 1;
        });
      chunks.forEach((delta, sliceIndex) => {
        if (delta <= 0) return;
        const parts = delta > 24 ? 3 : delta > 12 ? 2 : 1;
        for (let part = 0; part < parts; part += 1) {
          const occurredAt = new Date(
            start + sliceIndex * dayMs + (8.2 + ((studentIndex + part) % 7) * 1.35) * 60 * 60 * 1000,
          ).toISOString();
          records.push({
            id: `demo-${student.id}-${sliceIndex}-${part}`,
            studentId: student.id,
            studentName: student.name,
            scoreDelta: Math.max(1, Math.round(delta / parts)),
            ruleName: ["课堂专注", "作业优秀", "积极表达", "互助合作"][
              (studentIndex + sliceIndex + part) % 4
            ],
            occurredAt,
            createdAt: occurredAt,
          });
        }
      });
    });
    return records.sort((left, right) => getRecordTime(left) - getRecordTime(right));
  }

  async function fetchData() {
    const rs = runtimeState();
    const apiFetch = state.provider?.apiFetch;
    const termRange = resolveScoreRaceTermRange();
    let leaderboardRows = [];
    let scoreRecords = [];

    if (rs.classId && typeof apiFetch === "function") {
      try {
        const leaderboard = await apiFetch(`/display/classes/${rs.classId}/leaderboard?type=score`);
        leaderboardRows = normalizeListResponse(leaderboard);
      } catch (error) {
        console.warn("[term-recap] leaderboard load failed", error);
      }
      try {
        const query = `classId=${encodeURIComponent(rs.classId)}&startDate=${formatQueryDate(termRange.start)}&endDate=${formatQueryDate(termRange.end)}&limit=${SCORE_RACE_QUERY_LIMIT}`;
        scoreRecords = normalizeListResponse(await apiFetch(`/score-records?${query}`));
      } catch (error) {
        console.warn("[term-recap] score records load failed", error);
      }
    }

    const students = normalizeStudentRows(leaderboardRows);
    const generatedRecords = shouldUseGeneratedRaceRecords(students, scoreRecords);
    if (generatedRecords) {
      scoreRecords = buildDemoRecords(students, termRange);
    }

    return buildModel(students, Array.isArray(scoreRecords) ? scoreRecords : [], {
      generatedRecords,
      termRange,
    });
  }

  function resolveFirstRecordDayStart(records) {
    if (!records.length) return null;
    const times = records.map(getRecordTime).filter(Number.isFinite);
    if (!times.length) return null;
    const date = new Date(Math.min(...times));
    date.setHours(0, 0, 0, 0);
    return date.getTime();
  }

  function resolveDateRange(records, fallbackRange = null) {
    const termEnd = fallbackRange?.end ?? null;
    const termStart = fallbackRange?.start ?? null;
    const firstRecordStart = resolveFirstRecordDayStart(records);

    if (termStart != null && termEnd != null) {
      const start =
        firstRecordStart != null ? Math.max(termStart, firstRecordStart) : termStart;
      return {
        start: Math.min(start, termEnd),
        end: Math.max(start, termEnd),
      };
    }
    if (!records.length) {
      const end = Date.now();
      return { start: end - 27 * 24 * 60 * 60 * 1000, end };
    }
    const times = records.map(getRecordTime);
    const min = Math.min(...times);
    const max = Math.max(...times);
    const span = Math.max(max - min, 27 * 24 * 60 * 60 * 1000);
    return { start: max - span, end: max };
  }

  function buildWeeklySeries(students, records, rangeOverride = null) {
    const range = resolveDateRange(records, rangeOverride);
    const weekMs = Math.max(1, (range.end - range.start) / 4);
    const byStudent = new Map(students.map((student) => [String(student.id), { totalDelta: 0, weeks: [0, 0, 0, 0] }]));
    const weeks = [0, 1, 2, 3].map((index) => ({
      index,
      label: `阶段 ${index + 1}`,
      dateLabel: `${formatDateLabel(range.start + index * weekMs)}-${formatDateLabel(range.start + (index + 1) * weekMs)}`,
      score: 0,
      positiveScore: 0,
      activeStudentIds: new Set(),
      recordCount: 0,
    }));

    records.forEach((record) => {
      const studentId = String(record.studentId ?? "");
      const bucket = byStudent.get(studentId);
      if (!bucket) return;
      const delta = toNumber(record.scoreDelta, 0);
      const index = clamp(Math.floor((getRecordTime(record) - range.start) / weekMs), 0, 3);
      bucket.totalDelta += delta;
      bucket.weeks[index] += delta;
      weeks[index].score += delta;
      weeks[index].recordCount += 1;
      if (delta > 0) {
        weeks[index].positiveScore += delta;
        weeks[index].activeStudentIds.add(studentId);
      }
    });

    return {
      weeks: weeks.map((week) => ({
        ...week,
        activeCount: week.activeStudentIds.size,
        activeStudentIds: undefined,
      })),
      byStudent,
      range,
    };
  }

  function pickUnique(candidates, usedIds) {
    const list = candidates.filter((item) => item?.student && item.value > 0);
    return list.find((item) => !usedIds.has(String(item.student.id))) || list[0] || null;
  }

  function buildHighlightCards(students, records, weekly) {
    const stats = new Map(
      students.map((student) => [
        String(student.id),
        {
          student,
          growth: 0,
          positiveScore: 0,
          positiveCount: 0,
          recentScore: 0,
          activeWeeks: 0,
        },
      ]),
    );
    const recentCut = weekly.range.end - 7 * 24 * 60 * 60 * 1000;

    records.forEach((record) => {
      const item = stats.get(String(record.studentId ?? ""));
      if (!item) return;
      const delta = toNumber(record.scoreDelta, 0);
      item.growth += delta;
      if (delta > 0) {
        item.positiveScore += delta;
        item.positiveCount += 1;
        if (getRecordTime(record) >= recentCut) item.recentScore += delta;
      }
    });

    weekly.byStudent.forEach((bucket, id) => {
      const item = stats.get(id);
      if (item) {
        item.activeWeeks = bucket.weeks.filter((value) => value > 0).length;
      }
    });

    const rows = Array.from(stats.values());
    const used = new Set();
    const cards = [];
    const scoreStar = students[0]?.score > 0 ? { student: students[0], value: students[0].score } : null;
    if (scoreStar) {
      used.add(String(scoreStar.student.id));
      cards.push({
        key: "score",
        title: "积分之星",
        student: scoreStar.student,
        metric: `${formatNumber(scoreStar.value)} 分`,
        copy: "把每一次努力都攒成了闪亮的星光",
        icon: "fa-star",
      });
    }

    const definitions = [
      {
        key: "growth",
        title: "进步之星",
        icon: "fa-arrow-trend-up",
        candidates: rows.map((row) => ({ student: row.student, value: row.growth })),
        metric: (value) => `成长 +${formatNumber(value)}`,
        copy: "一路向前的脚步，值得被全班看见",
      },
      {
        key: "active",
        title: "活跃之星",
        icon: "fa-bolt",
        candidates: rows.map((row) => ({ student: row.student, value: row.positiveCount })),
        metric: (value) => `${formatNumber(value)} 次记录`,
        copy: "课堂里的每一次参与，都让星宠更有能量",
      },
      {
        key: "steady",
        title: "稳定之星",
        icon: "fa-seedling",
        candidates: rows.map((row) => ({ student: row.student, value: row.activeWeeks })),
        metric: (value) => `${formatNumber(value)} 段持续发光`,
        copy: "稳定不是停在原地，而是每天都不放弃",
      },
      {
        key: "sprint",
        title: "冲刺之星",
        icon: "fa-rocket",
        candidates: rows.map((row) => ({ student: row.student, value: row.recentScore })),
        metric: (value) => `冲刺段 +${formatNumber(value)}`,
        copy: "最近一段时间的加速，让努力有了回响",
      },
    ];

    definitions.forEach((definition) => {
      const picked = pickUnique(
        definition.candidates.sort((left, right) => right.value - left.value),
        used,
      );
      if (!picked) return;
      used.add(String(picked.student.id));
      cards.push({
        key: definition.key,
        title: definition.title,
        student: picked.student,
        metric: definition.metric(picked.value),
        copy: definition.copy,
        icon: definition.icon,
      });
    });

    return cards;
  }

  function buildRaceFrames(students, records, weekly) {
    if (!students.length) return [];
    const dayMs = 24 * 60 * 60 * 1000;
    const baseScores = new Map(
      students.map((student) => [String(student.id), 0]),
    );
    const sortedRecords = [...records].sort((left, right) => getRecordTime(left) - getRecordTime(right));
    const rangeStart = new Date(weekly.range.start);
    const rangeEnd = new Date(weekly.range.end);
    rangeStart.setHours(0, 0, 0, 0);
    rangeEnd.setHours(0, 0, 0, 0);
    const rawDayCount = Math.floor((rangeEnd.getTime() - rangeStart.getTime()) / dayMs) + 1;
    const dayCount = Math.max(2, rawDayCount);
    const sampleStep = resolveRaceFrameStep(dayCount);
    const startTime = rangeStart.getTime();
    const endTime = rangeEnd.getTime();
    const snapshotTimes = [];
    for (let dayIndex = 0; dayIndex < dayCount; dayIndex += sampleStep) {
      snapshotTimes.push(startTime + dayIndex * dayMs);
    }
    if (snapshotTimes[snapshotTimes.length - 1] !== endTime) {
      snapshotTimes.push(endTime);
    }
    const snapshots = [];
    const runningScores = new Map(baseScores);
    let recordIndex = 0;
    snapshots.push({
      time: startTime,
      label: formatRaceDateLabel(startTime),
      scores: new Map(runningScores),
    });

    snapshotTimes.forEach((dayTime) => {
      const dayEnd = dayTime + dayMs - 1;
      while (recordIndex < sortedRecords.length && getRecordTime(sortedRecords[recordIndex]) <= dayEnd) {
        const record = sortedRecords[recordIndex];
        const id = String(record.studentId ?? "");
        if (runningScores.has(id)) {
          runningScores.set(id, Math.max(0, runningScores.get(id) + toNumber(record.scoreDelta, 0)));
        }
        recordIndex += 1;
      }
      snapshots.push({
        time: dayTime,
        label: formatRaceDateLabel(dayTime),
        scores: new Map(runningScores),
      });
    });

    const makeRows = (scores) => {
      const maxScore = Math.max(...students.map((student) => scores.get(String(student.id)) || 0), 1);
      return students
        .map((student) => {
          const score = scores.get(String(student.id)) || 0;
          return {
            ...student,
            score,
            finalScore: student.score,
            progress: clamp((score / maxScore) * 76 + 12, 12, 94),
          };
        })
        .sort((left, right) => right.score - left.score || right.finalScore - left.finalScore || left.name.localeCompare(right.name, "zh-CN"))
        .map((student, index) => ({
          ...student,
          rank: index + 1,
        }));
    };

    return snapshots.map((snapshot, index) => ({
      index,
      ratio: index / Math.max(1, snapshots.length - 1),
      label: snapshot.label,
      time: snapshot.time,
      sampleStep,
      sourceDayCount: dayCount,
      rows: makeRows(snapshot.scores),
    }));
  }

  function buildRaceRows(students, raceFrames) {
    const maxScore = Math.max(...students.map((student) => student.score), 1);
    return students.map((student, index) => {
      const finalProgress = clamp((student.score / maxScore) * 76 + 12, 12, 94);
      return {
        ...student,
        lane: index,
        finalProgress,
        delay: index * 0.1,
        boostDelay: (index % 4) * 0.24,
      };
    });
  }

  function buildModel(students, records, options = {}) {
    const weekly = buildWeeklySeries(students, records, options.termRange);
    const positiveRecords = records.filter((record) => toNumber(record.scoreDelta, 0) > 0);
    const highlights = buildHighlightCards(students, records, weekly);
    const raceFrames = buildRaceFrames(students, records, weekly);
    return {
      students,
      records,
      weekly,
      highlights,
      raceFrames,
      raceRows: buildRaceRows(students, raceFrames),
      summary: {
        className: runtimeState().home?.className || (isDemoMode() ? "61班" : "我们的班级"),
        studentCount: students.length,
        totalScore: students.reduce((sum, student) => sum + student.score, 0),
        recordCount: records.length,
        positiveRecordCount: positiveRecords.length,
        rangeDayCount: inclusiveDayCount(weekly.range.start, weekly.range.end),
        raceRangeStart: weekly.range.start,
        firstRecordDayStart: resolveFirstRecordDayStart(records),
        frameCount: raceFrames.length,
        frameStep: raceFrames[0]?.sampleStep || 1,
      },
      hasRecords: records.length > 0,
      dataSource: options.generatedRecords ? "generated" : "real",
    };
  }

  function renderStatCards(model) {
    const stats = [
      { label: "参与同学", value: `${formatNumber(model.summary.studentCount)} 位` },
      { label: "累计星光", value: `${formatNumber(model.summary.totalScore)} 分` },
      { label: "成长记录", value: `${formatNumber(model.summary.recordCount)} 次` },
      { label: "正向点亮", value: `${formatNumber(model.summary.positiveRecordCount)} 次` },
    ];
    return stats
      .map(
        (item) => `
          <div class="term-stat-card term-credit-item">
            <span>${escapeHtml(item.label)}</span>
            <strong>${escapeHtml(item.value)}</strong>
          </div>`,
      )
      .join("");
  }

  function renderTrail(model) {
    const max = Math.max(...model.weekly.weeks.map((week) => Math.abs(week.score)), 1);
    return model.weekly.weeks
      .map((week) => {
        const height = clamp((Math.max(0, week.positiveScore) / max) * 64 + 14, 18, 78);
        return `
          <div class="term-week-card" style="--beam:${height}%">
            <div class="term-week-orbit"></div>
            <div class="term-week-beam"></div>
            <div class="term-week-label">${escapeHtml(week.label)}</div>
            <strong>+${formatNumber(week.positiveScore)}</strong>
            <span>成长片段</span>
            <em>${formatNumber(week.activeCount)} 位同学发光</em>
          </div>`;
      })
      .join("");
  }

  function renderRace(model) {
    if (!model.raceRows.length) {
      return '<div class="term-empty-inline">还没有足够的学生数据生成追赶赛道</div>';
    }
    const firstFrame = model.raceFrames[0];
    return `
      <div class="term-race-stage">
        <div class="term-race-sequence-label">
          <span class="term-race-sequence-kicker">TIME FRAME</span>
          <strong data-race-frame-label>${escapeHtml(firstFrame?.label || "起跑")}</strong>
        </div>
        <div class="term-race-chart-shell">
          <div class="term-race-chart-frame">
            <span class="term-race-chart-corner term-race-chart-corner-tl" aria-hidden="true"></span>
            <span class="term-race-chart-corner term-race-chart-corner-tr" aria-hidden="true"></span>
            <span class="term-race-chart-corner term-race-chart-corner-bl" aria-hidden="true"></span>
            <span class="term-race-chart-corner term-race-chart-corner-br" aria-hidden="true"></span>
            <div class="term-race-chart" data-race-chart></div>
          </div>
        </div>
        <div class="term-race-sprint-marker">
          <span>FINAL SPRINT</span>
          <strong>冲刺中</strong>
        </div>
      </div>`;
  }

  function renderHighlights(model) {
    if (!model.highlights.length) {
      return "";
    }
    return model.highlights
      .map(
        (card) => `
          <article class="term-highlight-card ${escapeHtml(card.key)}">
            <div class="term-highlight-glow"></div>
            <div class="term-highlight-icon"><i class="fa-solid ${escapeHtml(card.icon)}" aria-hidden="true"></i></div>
            <img src="${escapeHtml(petImage(card.student.raw || card.student))}" alt="${escapeHtml(card.student.name)}" onerror="this.src='images/logo.svg'">
            <span>${escapeHtml(card.title)}</span>
            <strong>${escapeHtml(card.student.name)}</strong>
            <em>${escapeHtml(card.metric)}</em>
            <p>${escapeHtml(card.copy)}</p>
          </article>`,
      )
      .join("");
  }

  function renderFinaleWall(model) {
    const topRows = model.students.slice(0, 8);
    const wallRows = model.students.slice(0, 30);
    return `
      <div class="term-finale-rank">
        ${topRows
          .map(
            (student, index) => `
              <div class="term-finale-row ${index < 3 ? "top" : ""}">
                <span>${index + 1}</span>
                <img src="${escapeHtml(petImage(student.raw || student))}" alt="${escapeHtml(student.name)}" onerror="this.src='images/logo.svg'">
                <strong>${escapeHtml(student.name)}</strong>
                <em>${formatNumber(student.score)} 分</em>
              </div>`,
          )
          .join("")}
      </div>
      <div class="term-pet-wall">
        ${wallRows
          .map(
            (student, index) => `
              <div class="term-pet-dot" style="--dot:${index}">
                <img src="${escapeHtml(petImage(student.raw || student))}" alt="${escapeHtml(student.name)}" onerror="this.src='images/logo.svg'">
                <span>${escapeHtml(student.name)}</span>
              </div>`,
          )
          .join("")}
      </div>`;
  }

  function renderEmpty(model) {
    return `
      <div class="term-recap-stage term-recap-empty">
        <div class="term-empty-card">
          <span class="term-kicker">STAR PET GROWTH SEASON</span>
          <h2>积分竞速正在等待数据</h2>
          <p>导入学生积分或等待课堂积分产生后，这里会实时播放班级追赶动态。</p>
          <div class="term-empty-wall">${renderFinaleWall(model)}</div>
        </div>
      </div>`;
  }

  function renderModel(model) {
    const root = document.getElementById("termRecapRoot");
    if (!root) return;
    disposeRaceChart();
    if (!model.students.length) {
      root.innerHTML = `
        <div class="term-recap-stage term-recap-empty">
          <div class="term-empty-card">
            <span class="term-kicker">SCORE RACE</span>
            <h2>暂无班级学生数据</h2>
            <p>绑定班级或导入学生后，就可以播放积分竞速看板。</p>
          </div>
        </div>`;
      return;
    }

    state.sceneOrder = [...TERM_RECAP_SCENES];
    root.innerHTML = `
      <div class="term-recap-bg" aria-hidden="true">
        <span class="term-bg-layer term-bg-opening"></span>
        <span class="term-bg-layer term-bg-trail"></span>
        <span class="term-bg-layer term-bg-race"></span>
        <span class="term-bg-layer term-bg-finale"></span>
        <span class="term-star-noise"></span>
        <span class="term-cinema-vignette"></span>
        <span class="term-film-grain"></span>
      </div>
      <div class="term-cinema-letterbox top" aria-hidden="true"></div>
      <div class="term-cinema-letterbox bottom" aria-hidden="true"></div>
      <div class="term-recap-actions term-cinema-controls">
        <button type="button" onclick="replayScoreRace()" aria-label="重新播放"><i class="fa-solid fa-rotate-right" aria-hidden="true"></i><span>重播</span></button>
        <button type="button" onclick="finishScoreRace()" aria-label="结束播放"><i class="fa-solid fa-flag-checkered" aria-hidden="true"></i><span>结束</span></button>
        <button type="button" onclick="backScoreRaceHome()" aria-label="返回主页"><i class="fa-solid fa-house" aria-hidden="true"></i><span>返回</span></button>
      </div>
      <main class="term-recap-stage-wrap">
        ${model.hasRecords ? renderScenes(model) : renderEmpty(model)}
      </main>
      <nav class="term-scene-dots" aria-label="积分竞速状态">
        <button type="button" data-term-dot="race" class="active" onclick="setScoreRaceScene('race')"><span>1</span></button>
      </nav>`;
    setScene("race", { restartTimer: false });
  }

  function renderScenes(model) {
    const summary = model.summary || {};
    return `
      <section class="term-scene term-scene-race" data-term-scene="race">
        <div class="term-race-ambient" aria-hidden="true">
          <span class="term-race-ambient-orb term-race-ambient-orb-a"></span>
          <span class="term-race-ambient-orb term-race-ambient-orb-b"></span>
          <span class="term-race-ambient-scan"></span>
        </div>
        <div class="term-section-head compact term-cinema-copy">
          <div class="term-race-title-row">
            <span class="term-race-title-badge" aria-hidden="true"><i class="fa-solid fa-gauge-high"></i></span>
            <h1>积分竞赛</h1>
          </div>
          <div class="term-race-meta">
            <span class="term-race-meta-chip">${escapeHtml(summary.className || "我们的班级")}</span>
            <span class="term-race-meta-chip">${formatNumber(summary.studentCount)} 位选手</span>
            <span class="term-race-meta-chip term-race-meta-live"><i class="fa-solid fa-circle" aria-hidden="true"></i> LIVE</span>
          </div>
        </div>
        <div class="term-race-track">${renderRace(model)}</div>
      </section>`;
  }

  function clearTimer() {
    if (state.timer) {
      global.clearTimeout(state.timer);
      state.timer = null;
    }
  }

  function clearRaceTimer() {
    if (state.raceTimer) {
      global.clearInterval(state.raceTimer);
      state.raceTimer = null;
    }
  }

  function clearRefreshTimer() {
    if (state.refreshTimer) {
      global.clearInterval(state.refreshTimer);
      state.refreshTimer = null;
    }
  }

  function disposeRaceChart() {
    if (state.raceChart) {
      state.raceChart.dispose();
      state.raceChart = null;
    }
    state.raceChartReady = false;
    currentRaceDisplayRows = [];
  }

  function clearAudioFade() {
    if (state.audioFadeTimer) {
      global.clearInterval(state.audioFadeTimer);
      state.audioFadeTimer = null;
    }
  }

  function ensureAudioElement() {
    if (global.__TERM_RECAP_DISABLE_AUDIO__) return null;
    if (state.audio) return state.audio;
    const audio = new Audio(THEME_AUDIO_SRC);
    audio.id = "termRecapAudio";
    audio.loop = false;
    audio.preload = "auto";
    audio.volume = 0;
    audio.dataset.state = "idle";
    state.audio = audio;
    return audio;
  }

  function fadeAudioTo(targetVolume, options = {}) {
    const audio = ensureAudioElement();
    if (!audio) return;
    clearAudioFade();
    const start = audio.volume;
    const target = clamp(targetVolume, 0, 0.55);
    const duration = options.duration || 1200;
    const startedAt = Date.now();
    state.audioFadeTimer = global.setInterval(() => {
      const progress = clamp((Date.now() - startedAt) / duration, 0, 1);
      audio.volume = start + (target - start) * progress;
      if (progress >= 1) {
        clearAudioFade();
        if (options.pauseWhenDone) {
          audio.pause();
          audio.currentTime = 0;
          audio.dataset.state = "stopped";
        }
      }
    }, 80);
  }

  function playThemeAudio(options = {}) {
    const audio = ensureAudioElement();
    if (!audio) return;
    clearAudioFade();
    if (options.restart) {
      audio.pause();
      try {
        audio.currentTime = 0;
      } catch (error) {
        console.warn("[term-recap] audio restart seek failed", error);
      }
      audio.volume = 0;
    }
    audio.dataset.state = "starting";
    if (audio.paused) {
      const playPromise = audio.play();
      if (playPromise?.catch) {
        playPromise
          .then(() => {
            audio.dataset.state = "playing";
            fadeAudioTo(0.34, { duration: 1600 });
          })
          .catch((error) => {
            audio.dataset.state = "blocked";
            console.warn("[term-recap] audio autoplay blocked", error);
          });
        return;
      }
    }
    audio.dataset.state = "playing";
    fadeAudioTo(0.34, { duration: 1600 });
  }

  function stopThemeAudio() {
    const audio = state.audio;
    clearAudioFade();
    if (!audio) return;
    audio.dataset.state = "stopping";
    fadeAudioTo(0, { duration: 600, pauseWhenDone: true });
  }

  function sceneAudioVolume(scene) {
    if (scene === "race") return 0.46;
    if (scene === "highlights") return 0.4;
    return 0.34;
  }

  function raceFrameInterval(frameCount = SCORE_RACE_DAY_COUNT, options = {}) {
    if (global.__TERM_RECAP_TEST_FAST__ && !options.production) return 700;
    const maxInterval = Math.floor(SCORE_RACE_MAX_PLAY_MS / Math.max(1, frameCount));
    return Math.min(SCORE_RACE_MAX_FRAME_MS, Math.max(SCORE_RACE_MIN_FRAME_MS, maxInterval));
  }

  function raceUpdateDuration() {
    if (global.__TERM_RECAP_TEST_FAST__) return 650;
    const frameCount = state.model?.raceFrames?.length || SCORE_RACE_DAY_COUNT;
    return Math.max(650, Math.min(2100, raceFrameInterval(frameCount) - 120));
  }

  function ensureRaceChart() {
    const container = document.querySelector("[data-race-chart]");
    if (!container) return null;
    if (!global.echarts) {
      container.innerHTML = '<div class="term-empty-inline">ECharts 图表组件未加载</div>';
      return null;
    }
    if (state.raceChart) return state.raceChart;
    state.raceChart = global.echarts.init(container, null, { renderer: "canvas" });
    return state.raceChart;
  }

  function raceColor(index) {
    const palette = ["#ffe49a", "#7ee6ff", "#ff9f6e", "#a9ffcb", "#cbb8ff", "#ffcf7a", "#7db9ff", "#f2f7ff"];
    return palette[index % palette.length];
  }

  let currentRaceDisplayRows = [];

  function resolveRaceRank(name) {
    const selfScore = toNumber(currentRaceDisplayRows.find((row) => row.name === name)?.frameScore, 0);
    if (selfScore <= 0) return -1;
    return currentRaceDisplayRows
      .map((row) => ({ name: row.name, value: toNumber(row.frameScore, 0) }))
      .filter((row) => row.value > 0)
      .sort((left, right) => right.value - left.value || left.name.localeCompare(right.name, "zh-CN"))
      .findIndex((row) => row.name === name);
  }

  function raceBarGradient(params) {
    const rank = resolveRaceRank(params.name);
    const medalStops = {
      0: ["rgba(255, 214, 90, 0.18)", "#ffd76a", "#fff8dc"],
      1: ["rgba(198, 220, 255, 0.16)", "#b8d4ff", "#eef4ff"],
      2: ["rgba(255, 180, 120, 0.18)", "#ffab6b", "#ffe9d8"],
    };
    const stops =
      medalStops[rank] || [
        "rgba(255, 255, 255, 0.08)",
        raceColor(currentRaceDisplayRows.findIndex((row) => row.name === params.name)),
        "#ffffff",
      ];
    return {
      type: "linear",
      x: 0,
      y: 0,
      x2: 1,
      y2: 0,
      colorStops: [
        { offset: 0, color: stops[0] },
        { offset: 0.58, color: stops[1] },
        { offset: 1, color: stops[2] },
      ],
    };
  }

  function raceBarShadowColor(name) {
    const rank = resolveRaceRank(name);
    if (rank === 0) return "rgba(255, 214, 90, 0.72)";
    if (rank === 1) return "rgba(184, 212, 255, 0.56)";
    if (rank === 2) return "rgba(255, 171, 107, 0.58)";
    return "rgba(255, 226, 128, 0.34)";
  }

  function raceScoreLabel(params) {
    const rank = resolveRaceRank(params.name);
    const medal = rank === 0 ? "🥇 " : rank === 1 ? "🥈 " : rank === 2 ? "🥉 " : "";
    return `${medal}${formatNumber(params.value)} 分`;
  }

  function raceNameLabel(name) {
    const rank = resolveRaceRank(name);
    if (rank === 0) return `{gold|${name}}`;
    if (rank === 1) return `{silver|${name}}`;
    if (rank === 2) return `{bronze|${name}}`;
    return name;
  }

  function raceChartOption(rows, frame) {
    const updateDuration = raceUpdateDuration();
    const showCount = Math.min(14, Math.max(rows.length, 1));
    return {
      animationDuration: 0,
      animationDurationUpdate: updateDuration,
      animationEasing: "linear",
      animationEasingUpdate: "linear",
      grid: {
        left: 156,
        right: 188,
        top: 12,
        bottom: 12,
        containLabel: true,
      },
      xAxis: {
        type: "value",
        max: "dataMax",
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { show: false },
        splitLine: { show: false },
      },
      yAxis: {
        type: "category",
        inverse: true,
        max: showCount - 1,
        data: rows.map((row) => row.name),
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: {
          show: true,
          color: "#fff8e8",
          fontSize: 19,
          fontWeight: 900,
          margin: 16,
          overflow: "truncate",
          width: 124,
          hideOverlap: true,
          formatter(value) {
            return raceNameLabel(value);
          },
          rich: {
            gold: { color: "#ffe49a", fontWeight: 900, textShadowBlur: 8, textShadowColor: "rgba(255, 214, 90, 0.72)" },
            silver: { color: "#d4e4ff", fontWeight: 900, textShadowBlur: 8, textShadowColor: "rgba(184, 212, 255, 0.56)" },
            bronze: { color: "#ffbc82", fontWeight: 900, textShadowBlur: 8, textShadowColor: "rgba(255, 171, 107, 0.58)" },
          },
        },
        splitLine: { show: false },
        animationDuration: updateDuration,
        animationDurationUpdate: updateDuration,
        animationEasing: "linear",
        animationEasingUpdate: "linear",
      },
      series: [
        {
          type: "bar",
          realtimeSort: true,
          name: frame.label,
          animationDuration: 0,
          animationDurationUpdate: updateDuration,
          animationEasing: "linear",
          animationEasingUpdate: "linear",
          barWidth: 26,
          barCategoryGap: "38%",
          itemStyle: {
            borderRadius: [0, 999, 999, 0],
            color(params) {
              return raceBarGradient(params);
            },
            shadowBlur: 28,
            shadowColor(params) {
              return raceBarShadowColor(params.name);
            },
          },
          emphasis: { disabled: true },
          labelLayout: {
            hideOverlap: false,
            moveOverlap: "shiftY",
          },
          label: {
            show: true,
            position: "right",
            color: "#ffe49a",
            fontSize: 20,
            fontWeight: 950,
            distance: 10,
            overflow: "none",
            valueAnimation: true,
            formatter(params) {
              return raceScoreLabel(params);
            },
          },
          data: rows.map((row) => ({
            id: String(row.id),
            name: row.name,
            value: row.frameScore,
          })),
        },
      ],
      graphic: {
        elements: [
          {
            type: "text",
            right: 84,
            bottom: 52,
            z: 100,
            style: {
              text: frame.label,
              fill: "rgba(255, 238, 176, 0.22)",
              font: "900 128px sans-serif",
              textAlign: "right",
              textShadowBlur: 28,
              textShadowColor: "rgba(255, 226, 128, 0.28)",
            },
          },
        ],
      },
    };
  }

  function raceChartUpdateOption(rows, frame) {
    const updateDuration = raceUpdateDuration();
    return {
      series: [
        {
          name: frame.label,
          animationDurationUpdate: updateDuration,
          animationEasingUpdate: "linear",
          data: rows.map((row) => ({
            id: String(row.id),
            name: row.name,
            value: row.frameScore,
          })),
        },
      ],
      graphic: {
        elements: [
          {
            type: "text",
            right: 72,
            bottom: 44,
            z: 100,
            style: {
              text: frame.label,
            },
          },
        ],
      },
    };
  }

  function applyRaceFrame(frameIndex) {
    const model = state.model;
    const frames = model?.raceFrames || [];
    if (!frames.length) return;
    const frame = frames[frameIndex % frames.length];
    state.raceFrameIndex = frame.index;
    const rowsById = new Map(frame.rows.map((row) => [String(row.id), row]));
    const displayed = model.raceRows
      .map((student) => {
        const row = rowsById.get(String(student.id));
        return {
          ...student,
          frameScore: row?.score ?? 0,
          frameRank: row?.rank ?? 999,
          progress: row?.progress ?? student.finalProgress ?? 12,
        };
      })
      .sort((left, right) => left.name.localeCompare(right.name, "zh-CN"));

    currentRaceDisplayRows = displayed;
    const root = document.getElementById("page-term-recap");
    if (!root) return;
    const chart = ensureRaceChart();
    if (chart) {
      if (!state.raceChartReady) {
        chart.setOption(raceChartOption(displayed, frame), { notMerge: true, lazyUpdate: false });
        state.raceChartReady = true;
      } else {
        chart.setOption(raceChartUpdateOption(displayed, frame), { notMerge: false, lazyUpdate: false });
      }
    }

    const label = root.querySelector("[data-race-frame-label]");
    if (label) label.textContent = frame.label;
  }

  function startRaceSequence() {
    clearRaceTimer();
    applyRaceFrame(0);
    const frames = state.model?.raceFrames || [];
    if (frames.length <= 1) return;
    state.raceTimer = global.setInterval(() => {
      const currentFrames = state.model?.raceFrames || [];
      const nextIndex = state.raceFrameIndex + 1;
      if (nextIndex >= currentFrames.length) {
        clearRaceTimer();
        return;
      }
      applyRaceFrame(nextIndex);
    }, raceFrameInterval(frames.length));
  }

  function setScene(scene, options = {}) {
    const root = document.getElementById("page-term-recap");
    if (!root) return;
    const index = state.sceneOrder.indexOf(scene);
    state.sceneIndex = index >= 0 ? index : 0;
    const active = state.sceneOrder[state.sceneIndex] || "race";
    root.dataset.termScene = active;
    root.querySelectorAll("[data-term-scene]").forEach((section) => {
      section.classList.toggle("active", section.dataset.termScene === active);
    });
    root.querySelectorAll("[data-term-dot]").forEach((button) => {
      button.classList.toggle("active", button.dataset.termDot === active);
    });
    if (state.audio?.dataset.state === "playing") {
      fadeAudioTo(sceneAudioVolume(active), { duration: 1200 });
    }
    if (active === "race" && !state.applyingPendingModel) {
      startRaceSequence();
    }
  }

  async function refreshDataForNextLoop() {
    if (state.loading) return;
    try {
      const nextModel = await fetchData();
      if (nextModel?.students?.length) {
        state.pendingModel = nextModel;
      }
    } catch (error) {
      console.warn("[score-race] refresh failed", error);
    }
  }

  function startRefreshTimer() {
    clearRefreshTimer();
    state.refreshTimer = global.setInterval(refreshDataForNextLoop, SCORE_RACE_REFRESH_MS);
  }

  async function init(provider = {}) {
    state.provider = provider;
    if (state.loading) return;
    state.loading = true;
    clearTimer();
    clearRefreshTimer();
    const root = document.getElementById("termRecapRoot");
    if (root) {
      root.innerHTML = '<div class="term-recap-loading">正在加载积分竞速...</div>';
    }
    try {
      state.model = await fetchData();
      renderModel(state.model);
      state.initialized = true;
      if (state.model?.hasRecords) {
        playThemeAudio({ restart: true });
        startRefreshTimer();
      }
    } catch (error) {
      console.error("[term-recap] init failed", error);
      if (root) {
        root.innerHTML = `
          <div class="term-recap-stage term-recap-empty">
            <div class="term-empty-card">
              <span class="term-kicker">STAR PET GROWTH SEASON</span>
              <h2>积分竞速暂时无法加载</h2>
              <p>${escapeHtml(error?.message || "请稍后重试，其他大屏栏目不受影响。")}</p>
            </div>
          </div>`;
      }
    } finally {
      state.loading = false;
    }
  }

  function replay() {
    if (!state.model) return;
    if (state.pendingModel?.students?.length) {
      state.model = state.pendingModel;
      state.pendingModel = null;
      disposeRaceChart();
      renderModel(state.model);
    }
    playThemeAudio({ restart: true });
    state.pendingModel = null;
    setScene("race");
  }

  function jumpFinale() {
    finish();
  }

  function finish() {
    if (!state.model) return;
    clearTimer();
    clearRaceTimer();
    const frames = state.model?.raceFrames || [];
    if (frames.length) applyRaceFrame(frames.length - 1);
    stopThemeAudio();
  }

  function backHome() {
    clearTimer();
    clearRaceTimer();
    clearRefreshTimer();
    disposeRaceChart();
    stopThemeAudio();
    global.navigateTo?.("classroom");
  }

  const api = {
    init,
    replay,
    jumpFinale,
    finish,
    backHome,
    setScene,
    raceFrameInterval,
    cleanup() {
      clearTimer();
      clearRaceTimer();
      clearRefreshTimer();
      disposeRaceChart();
      stopThemeAudio();
    },
    state,
  };
  global.DisplayScoreRace = api;
  global.DisplayTermRecap = api;
  global.replayScoreRace = replay;
  global.finishScoreRace = finish;
  global.backScoreRaceHome = backHome;
  global.setScoreRaceScene = setScene;
  global.replayTermRecap = replay;
  global.jumpTermRecapFinale = jumpFinale;
  global.finishTermRecap = finish;
  global.backTermRecapHome = backHome;
  global.setTermRecapScene = setScene;
})(window);

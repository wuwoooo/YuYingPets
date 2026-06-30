(function initDisplayToolbox(global) {
  const TOOLBOX_CONFIG = {
    home: {
      bg: "toolbox-bg-home",
      title: "教室工具箱",
      kicker: "CLASSROOM RITUAL DIRECTOR",
    },
    energy: {
      bg: "toolbox-bg-energy",
      title: "点燃课堂",
      kicker: "VOICE ENERGY RITUAL",
      primary: "开始点亮",
      running: "正在点亮",
    },
    garden: {
      bg: "toolbox-bg-garden",
      title: "安静下来",
      kicker: "QUIET GARDEN RITUAL",
      primary: "开始守护",
      running: "守护中",
    },
    breath: {
      bg: "toolbox-bg-breath",
      title: "呼吸练习",
      kicker: "BREATH FOCUS RITUAL",
      primary: "开始呼吸",
      running: "呼吸中",
    },
    meditation: {
      bg: "toolbox-bg-meditation",
      title: "静心冥想",
      kicker: "MINDFUL PAUSE RITUAL",
      primary: "开始冥想",
      running: "冥想中",
    },
    lucky: {
      bg: "toolbox-bg-lucky",
      title: "随机抽取",
      kicker: "RANDOM SELECT RITUAL",
      primary: "开始抽取",
      running: "停止抽取",
    },
    timer: {
      bg: "toolbox-bg-timer",
      title: "倒计时",
      kicker: "COUNTDOWN RITUAL",
      primary: "开始倒计时",
      running: "倒计时中",
    },
  };

  const TOOLBOX_MODE_ASSETS = {
    home: {
      backgrounds: ["images/toolbox/toolbox-energy-bg.webp"],
      decos: [
        ".toolbox-deco-orb",
        ".toolbox-deco-sparkles",
        ".toolbox-deco-flower",
        ".toolbox-deco-butterfly",
        ".toolbox-deco-breath-orb",
        ".toolbox-deco-breath-ripple",
        ".toolbox-deco-meditation-lantern",
        ".toolbox-deco-ticket",
        ".toolbox-deco-ribbon",
        ".toolbox-deco-hourglass",
        ".toolbox-deco-timer-stars",
      ],
    },
    energy: {
      backgrounds: ["images/toolbox/toolbox-energy-bg.webp"],
      decos: [".toolbox-deco-orb", ".toolbox-deco-sparkles"],
    },
    garden: {
      backgrounds: ["images/toolbox/toolbox-garden-bg.webp"],
      decos: [".toolbox-deco-flower", ".toolbox-deco-butterfly"],
    },
    breath: {
      backgrounds: ["images/toolbox/toolbox-breath-bg.webp"],
      decos: [".toolbox-deco-breath-orb", ".toolbox-deco-breath-ripple"],
    },
    meditation: {
      backgrounds: ["images/toolbox/toolbox-meditation-bg.webp"],
      decos: [".toolbox-deco-meditation-lantern"],
    },
    lucky: {
      backgrounds: ["images/toolbox/toolbox-lucky-bg.webp"],
      decos: [".toolbox-deco-ticket", ".toolbox-deco-ribbon"],
    },
    timer: {
      backgrounds: ["images/toolbox/toolbox-timer-bg.webp"],
      decos: [".toolbox-deco-hourglass", ".toolbox-deco-timer-stars"],
    },
  };

  const preloadedToolboxAssets = new Set();

  const BREATH_PATTERNS = {
    relax: {
      id: "relax",
      label: "放松",
      description: "4 吸 / 6 呼",
      phases: [
        { type: "inhale", seconds: 4 },
        { type: "exhale", seconds: 6 },
      ],
    },
    focus: {
      id: "focus",
      label: "专注",
      description: "4-4-4-4",
      phases: [
        { type: "inhale", seconds: 4 },
        { type: "hold", seconds: 4, holdAt: "peak" },
        { type: "exhale", seconds: 4 },
        { type: "hold", seconds: 4, holdAt: "valley" },
      ],
    },
  };

  function normalizeBreathPattern(value) {
    return value === "focus" ? "focus" : "relax";
  }

  function getBreathPattern(patternId) {
    return BREATH_PATTERNS[normalizeBreathPattern(patternId)];
  }

  function resolveBreathCyclePhase(elapsedMs, patternId) {
    const pattern = getBreathPattern(patternId);
    const phases = pattern.phases;
    const cycleMs = phases.reduce((sum, segment) => sum + segment.seconds * 1000, 0);
    const cycleElapsed = cycleMs > 0 ? elapsedMs % cycleMs : 0;
    let cursor = 0;
    for (const segment of phases) {
      const segmentMs = segment.seconds * 1000;
      if (cycleElapsed < cursor + segmentMs) {
        return {
          phase: segment.type,
          holdAt: segment.holdAt || "",
          phaseProgress: Math.max(0, Math.min(1, (cycleElapsed - cursor) / segmentMs)),
          cycleMs,
        };
      }
      cursor += segmentMs;
    }
    const last = phases[phases.length - 1];
    return {
      phase: last.type,
      holdAt: last.holdAt || "",
      phaseProgress: 0,
      cycleMs,
    };
  }

  function getBreathPhaseLabel(phase) {
    if (phase === "inhale") return "吸气";
    if (phase === "exhale") return "呼气";
    if (phase === "hold") return "停";
    return "";
  }

  function getBreathVisualScale(phase, holdAt, phaseProgress) {
    const minScale = 0.78;
    const maxScale = 1.08;
    if (phase === "inhale") return minScale + phaseProgress * (maxScale - minScale);
    if (phase === "exhale") return maxScale - phaseProgress * (maxScale - minScale);
    if (phase === "hold") return holdAt === "peak" ? maxScale : minScale;
    return 0.88;
  }

  function createDefaultSettings(defaultTargetSeconds = 0) {
    return {
      energyMode: "reading",
      energyTarget: 90,
      energyDuration: 0,
      gardenTarget: defaultTargetSeconds,
      gardenThreshold: 34,
      luckyScope: "class",
      luckyGroupNo: "",
      luckyRepeat: false,
      luckyExcludedIds: [],
      timerDuration: 300,
      breathDuration: 60,
      breathPattern: "relax",
      meditationDuration: 120,
    };
  }

  function preloadToolboxModeAssets(mode, doc = global.document) {
    const assets = TOOLBOX_MODE_ASSETS[mode] || TOOLBOX_MODE_ASSETS.home;
    assets.backgrounds.forEach((src) => {
      if (!src || preloadedToolboxAssets.has(src)) return;
      preloadedToolboxAssets.add(src);
      const image = new global.Image();
      image.decoding = "async";
      image.src = src;
    });
    assets.decos.forEach((selector) => {
      doc.querySelectorAll(selector).forEach((img) => {
        if (!(img instanceof global.HTMLImageElement)) return;
        const src = img.dataset.src;
        if (src && !img.src) {
          img.src = src;
        }
      });
    });
  }

  function setText(id, value, doc = global.document) {
    const el = doc.getElementById(id);
    if (el) el.textContent = value == null ? "" : String(value);
  }

  function setBackground(mode, doc = global.document) {
    const page = doc.getElementById("page-toolbox");
    const bg = doc.getElementById("toolboxBg");
    const config = TOOLBOX_CONFIG[mode] || TOOLBOX_CONFIG.home;
    preloadToolboxModeAssets(mode, doc);
    if (page) {
      page.dataset.toolboxMode = mode;
      page.dataset.toolboxView = mode === "home" ? "home" : "immersive";
    }
    if (bg) {
      bg.className = `toolbox-bg ${config.bg}`;
    }
  }

  function isAudioTool(tool) {
    return tool === "energy" || tool === "garden";
  }

  function isAudioRunning(state = {}) {
    return (
      isAudioTool(state.activeTool) &&
      (state.energyRunning || state.gardenRunning || state.paused)
    );
  }

  function getGroupOptions(groups = [], students = []) {
    const byNo = new Map();
    groups.forEach((group) => {
      const groupNo = Number(group.groupNo ?? group.id);
      if (!Number.isFinite(groupNo) || groupNo <= 0) return;
      byNo.set(groupNo, {
        groupNo,
        name: group.name || `第${groupNo}组`,
      });
    });
    students.forEach((student) => {
      const groupNo = Number(student.group);
      if (!Number.isFinite(groupNo) || groupNo <= 0) return;
      if (!byNo.has(groupNo)) {
        byNo.set(groupNo, {
          groupNo,
          name: student.groupName || `第${groupNo}组`,
        });
      }
    });
    return [...byNo.values()].sort((a, b) => a.groupNo - b.groupNo);
  }

  function getStudentsByScope(students = [], scope, groupNo) {
    if (scope === "group") {
      const target = Number(groupNo);
      return students.filter((student) => Number(student.group) === target);
    }
    return students.slice();
  }

  function luckyStudentKey(student) {
    if (!student) return "";
    const raw = student.id !== undefined && student.id !== null ? student.id : student.name;
    return String(raw || "");
  }

  function luckyStudentKeyForInlineHandler(student) {
    return encodeURIComponent(luckyStudentKey(student));
  }

  function isLuckyStudentExcluded(student, excludedIds) {
    return excludedIds instanceof Set && excludedIds.has(luckyStudentKey(student));
  }

  function getLuckyExcludedCountInScope(students = [], excludedIds, scope, groupNo) {
    return getStudentsByScope(students, scope, groupNo).filter((student) =>
      isLuckyStudentExcluded(student, excludedIds),
    ).length;
  }

  function formatStatsTime(seconds) {
    if (seconds < 60) return `${Math.round(seconds)}秒`;
    const m = Math.floor(seconds / 60);
    const s = Math.round(seconds % 60);
    if (s === 0) return `${m}分钟`;
    return `${m}分${s}秒`;
  }

  function resolveEnergyLevel(score) {
    if (score >= 95) return "星光爆发";
    if (score >= 85) return "全班共振";
    if (score >= 70) return "能量升起";
    return score > 0 ? "正在聚光" : "等待点亮";
  }

  function getGardenThresholdLabel(threshold) {
    const val = Number(threshold);
    if (val === 45) return "要求：宽松 (45dB)";
    if (val === 34) return "要求：标准 (34dB)";
    if (val === 22) return "要求：严格 (22dB)";
    if (val === 12) return "要求：极严 (12dB)";
    return `要求：${val}dB`;
  }

  function resolveGardenLevel(score) {
    if (score >= 95) return "完美守护";
    if (score >= 80) return "静心守望";
    if (score >= 60) return "渐入佳境";
    return "等待萌芽";
  }

  function formatTimerMs(ms) {
    const totalSeconds = Math.ceil(Math.max(0, ms) / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }

  function setResult(id, message, isError = false, doc = global.document) {
    const el = doc.getElementById(id);
    if (!el) return;
    el.textContent = message || "";
    el.classList.toggle("error", Boolean(isError));
  }

  global.DisplayToolbox = {
    TOOLBOX_CONFIG,
    TOOLBOX_MODE_ASSETS,
    BREATH_PATTERNS,
    createDefaultSettings,
    preloadToolboxModeAssets,
    setText,
    setBackground,
    isAudioTool,
    isAudioRunning,
    getGroupOptions,
    getStudentsByScope,
    luckyStudentKey,
    luckyStudentKeyForInlineHandler,
    isLuckyStudentExcluded,
    getLuckyExcludedCountInScope,
    formatStatsTime,
    resolveEnergyLevel,
    getGardenThresholdLabel,
    resolveGardenLevel,
    formatTimerMs,
    setResult,
    normalizeBreathPattern,
    getBreathPattern,
    resolveBreathCyclePhase,
    getBreathPhaseLabel,
    getBreathVisualScale,
  };
})(window);

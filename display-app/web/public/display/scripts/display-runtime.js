(function initDisplayRuntime(global) {
  const TERMINAL_CODE_KEY = "yuyingpets_display_terminal";
  const TERMINAL_NAME_KEY = "yuyingpets_display_terminal_name";
  const LOGIN_CREDENTIALS_KEY = "yuyingpets_display_login_credentials";
  const LOGIN_ACCOUNTS_KEY = "yuyingpets_display_login_accounts";
  const SETUP_LAST_USERNAME_KEY = "yuyingpets_display_setup_last_username";
  const DISPLAY_TOKEN_KEY = "yuyingpets_display_token";
  const DISPLAY_CLASS_ID_KEY = "yuyingpets_display_class_id";
  const HOLIDAY_EXPERIENCE_PLAYED_KEY = "yuying_holiday_splash_played";
  const LOW_SPEC_MODE_KEY = "yuyingpets_low_spec_mode";
  const GRID_DENSITY_KEY = "yuyingpets_grid_density";
  const SIDEBAR_COLLAPSED_KEY = "yuyingpets_sidebar_collapsed";
  const DISPLAY_EFFECT_BUDGETS = {
    "low-spec": {
      upgradeBurstParticles: 48,
      upgradeDriftParticles: 24,
      upgradeCanvasScale: 0.72,
      upgradeEnergyLines: 0,
      transitionParticles: 38,
      realtimeRefreshDelay: 1200,
      academicParticles: 35,
      academicConnectionDist: 110,
      remoteScoreAnimCap: 3,
      scoreAnimStaggerMs: 200,
      scoreFloatDurationMs: 800,
      scoreFloatTailMs: 120,
      upgradeOverlayDurationMs: 3000,
      gridRenderDebounce: 120,
    },
    standard: {
      upgradeBurstParticles: 48,
      upgradeDriftParticles: 24,
      upgradeCanvasScale: 0.72,
      upgradeEnergyLines: 10,
      transitionParticles: 38,
      realtimeRefreshDelay: 500,
      academicParticles: 35,
      academicConnectionDist: 110,
      remoteScoreAnimCap: 3,
      scoreAnimStaggerMs: 120,
      scoreFloatDurationMs: 1400,
      scoreFloatTailMs: 180,
      upgradeOverlayDurationMs: 5600,
      gridRenderDebounce: 80,
    },
    high: {
      upgradeBurstParticles: 90,
      upgradeDriftParticles: 60,
      upgradeCanvasScale: 1,
      upgradeEnergyLines: 16,
      transitionParticles: 70,
      realtimeRefreshDelay: 100,
      academicParticles: 55,
      academicConnectionDist: 140,
      remoteScoreAnimCap: 8,
      scoreAnimStaggerMs: 120,
      scoreFloatDurationMs: 1400,
      scoreFloatTailMs: 180,
      upgradeOverlayDurationMs: 5600,
      gridRenderDebounce: 80,
    },
  };

  function stripTrailingSlash(value) {
    return String(value || "").replace(/\/$/, "");
  }

  function isAbsoluteUrl(url) {
    return (
      /^(https?:)?\/\//i.test(url) ||
      String(url || "").startsWith("data:") ||
      String(url || "").startsWith("blob:")
    );
  }

  function isDesktopRuntime() {
    return global.displayDesktop?.isDesktop === true;
  }

  function getStorageItem(key) {
    try {
      return global.localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  function setStorageItem(key, value) {
    try {
      global.localStorage.setItem(key, value);
    } catch {
      // localStorage 可能在特殊浏览器策略下不可用，调用方仍可使用返回值继续运行。
    }
  }

  function removeStorageItem(key) {
    try {
      global.localStorage.removeItem(key);
    } catch {
      // localStorage 可能在特殊浏览器策略下不可用，调用方仍可使用默认值继续运行。
    }
  }

  function getSessionStorageItem(key) {
    try {
      return global.sessionStorage.getItem(key);
    } catch {
      return null;
    }
  }

  function setSessionStorageItem(key, value) {
    try {
      global.sessionStorage.setItem(key, value);
    } catch {
      // sessionStorage 可能在特殊浏览器策略下不可用，调用方仍可使用内存态继续运行。
    }
  }

  function removeSessionStorageItem(key) {
    try {
      global.sessionStorage.removeItem(key);
    } catch {
      // sessionStorage 可能在特殊浏览器策略下不可用，调用方仍可使用默认值继续运行。
    }
  }

  function readLowSpecModeEnabled() {
    return getStorageItem(LOW_SPEC_MODE_KEY) === "true";
  }

  function writeLowSpecModeEnabled(enabled) {
    if (enabled) {
      setStorageItem(LOW_SPEC_MODE_KEY, "true");
    } else {
      removeStorageItem(LOW_SPEC_MODE_KEY);
    }
  }

  // 视图密度仅保存在当前浏览器会话，不再写入 localStorage。
  removeStorageItem(GRID_DENSITY_KEY);

  function readGridDensity(validModes, fallback = "panorama") {
    const value = getSessionStorageItem(GRID_DENSITY_KEY);
    const valid = Array.isArray(validModes)
      ? validModes
      : Array.from(validModes || []);
    return valid.includes(value) ? value : fallback;
  }

  function writeGridDensity(mode) {
    setSessionStorageItem(GRID_DENSITY_KEY, mode);
  }

  function clearGridDensity() {
    removeSessionStorageItem(GRID_DENSITY_KEY);
  }

  function readSidebarCollapsed() {
    return getStorageItem(SIDEBAR_COLLAPSED_KEY) === "true";
  }

  function writeSidebarCollapsed(collapsed) {
    if (collapsed) {
      setStorageItem(SIDEBAR_COLLAPSED_KEY, "true");
    } else {
      removeStorageItem(SIDEBAR_COLLAPSED_KEY);
    }
  }

  function getDisplayPerformanceTier(options = {}) {
    if (readLowSpecModeEnabled()) {
      return "low-spec";
    }
    const params = new URL(global.location.href).searchParams;
    if (params.get("highQuality") === "1" || params.get("quality") === "high") {
      return "high";
    }
    if (params.get("lowMemory") === "1" || params.get("quality") === "standard") {
      return "standard";
    }
    if (options.coarsePointer) {
      return "standard";
    }
    return "high";
  }

  function isStandardDisplay(tier = getDisplayPerformanceTier()) {
    return tier === "standard" || tier === "low-spec";
  }

  function isHighQualityDisplay(tier = getDisplayPerformanceTier()) {
    return tier === "high";
  }

  function isLowSpecMode(tier = getDisplayPerformanceTier()) {
    return tier === "low-spec";
  }

  function getDisplayEffectBudget(tier = getDisplayPerformanceTier()) {
    return {
      ...(DISPLAY_EFFECT_BUDGETS[tier] || DISPLAY_EFFECT_BUDGETS.high),
    };
  }

  function parseJsonStorage(key, fallback) {
    const raw = getStorageItem(key);
    if (!raw) return fallback;
    try {
      return JSON.parse(raw);
    } catch {
      return fallback;
    }
  }

  function getStoredLoginCredentials() {
    const parsed = parseJsonStorage(LOGIN_CREDENTIALS_KEY, null);
    if (typeof parsed?.username !== "string") {
      return null;
    }
    const sanitized = {
      username: parsed.username,
      displayName:
        typeof parsed?.displayName === "string" ? parsed.displayName : "",
    };
    if (
      typeof parsed?.password === "string" ||
      parsed.displayName !== sanitized.displayName
    ) {
      setStorageItem(LOGIN_CREDENTIALS_KEY, JSON.stringify(sanitized));
    }
    return sanitized;
  }

  function getStoredLoginAccounts() {
    const parsed = parseJsonStorage(LOGIN_ACCOUNTS_KEY, []);
    let accounts = [];
    let shouldRewrite = false;
    if (Array.isArray(parsed)) {
      accounts = parsed.filter(
        (item) => typeof item?.username === "string" && item.username.trim(),
      );
      shouldRewrite = parsed.some(
        (item) =>
          typeof item?.password === "string" ||
          typeof item?.displayName !== "string" ||
          item?.username !== item?.username?.trim(),
      );
      accounts = accounts.map((item) => ({
        username: item.username.trim(),
        displayName:
          typeof item.displayName === "string" && item.displayName.trim()
            ? item.displayName.trim()
            : item.username.trim(),
        updatedAt:
          typeof item.updatedAt === "number" ? item.updatedAt : Date.now(),
      }));
    }
    const legacy = getStoredLoginCredentials();
    if (legacy && !accounts.some((item) => item.username === legacy.username)) {
      accounts.unshift(legacy);
      shouldRewrite = true;
    }
    if (shouldRewrite) {
      setStorageItem(LOGIN_ACCOUNTS_KEY, JSON.stringify(accounts.slice(0, 12)));
    }
    return accounts;
  }

  function setStoredLoginCredentials(username, displayName = "") {
    const normalizedUsername = String(username || "").trim();
    if (!normalizedUsername) return "";
    const normalizedDisplayName = displayName || normalizedUsername;
    setStorageItem(
      LOGIN_CREDENTIALS_KEY,
      JSON.stringify({
        username: normalizedUsername,
        displayName: normalizedDisplayName,
      }),
    );
    const accounts = getStoredLoginAccounts().filter(
      (item) => item.username !== normalizedUsername,
    );
    accounts.unshift({
      username: normalizedUsername,
      displayName: normalizedDisplayName,
      updatedAt: Date.now(),
    });
    setStorageItem(LOGIN_ACCOUNTS_KEY, JSON.stringify(accounts.slice(0, 12)));
    return normalizedUsername;
  }

  function removeStoredLoginAccount(username) {
    const normalizedUsername = String(username || "").trim();
    if (!normalizedUsername) return false;
    const accounts = getStoredLoginAccounts().filter(
      (item) => item.username !== normalizedUsername,
    );
    setStorageItem(LOGIN_ACCOUNTS_KEY, JSON.stringify(accounts.slice(0, 12)));
    const legacy = getStoredLoginCredentials();
    if (legacy?.username === normalizedUsername) {
      removeStorageItem(LOGIN_CREDENTIALS_KEY);
    }
    return true;
  }

  function getStoredSetupUsername() {
    return getStorageItem(SETUP_LAST_USERNAME_KEY)?.trim() || "";
  }

  function setStoredSetupUsername(username) {
    const normalizedUsername = String(username || "").trim();
    if (!normalizedUsername) return "";
    setStorageItem(SETUP_LAST_USERNAME_KEY, normalizedUsername);
    return normalizedUsername;
  }

  function getPersistentToken() {
    return getStorageItem(DISPLAY_TOKEN_KEY) || "";
  }

  function setPersistentToken(token) {
    if (token) {
      setStorageItem(DISPLAY_TOKEN_KEY, token);
    } else {
      removeStorageItem(DISPLAY_TOKEN_KEY);
    }
  }

  function setDisplayClassId(classId) {
    if (classId == null || classId === "") {
      removeStorageItem(DISPLAY_CLASS_ID_KEY);
      return;
    }
    setStorageItem(DISPLAY_CLASS_ID_KEY, String(classId));
  }

  function clearDisplayClassId() {
    removeStorageItem(DISPLAY_CLASS_ID_KEY);
  }

  function createTerminalCode() {
    const stored = getStorageItem(TERMINAL_CODE_KEY);
    if (stored) return stored;
    const generated = `display-${Math.random().toString(36).slice(2, 10)}`;
    setStorageItem(TERMINAL_CODE_KEY, generated);
    return generated;
  }

  function resolveRuntimeParams() {
    const shellUrl = new URL(global.location.href);
    const storedTerminalCode = getStorageItem(TERMINAL_CODE_KEY);
    const requestedTerminalCode =
      shellUrl.searchParams.get("terminal") ||
      shellUrl.searchParams.get("displayTerminalCode");
    const allowTerminalOverride =
      shellUrl.searchParams.get("terminalOverride") === "1";
    const terminalCode =
      (allowTerminalOverride && requestedTerminalCode) ||
      storedTerminalCode ||
      requestedTerminalCode ||
      createTerminalCode();
    setStorageItem(TERMINAL_CODE_KEY, terminalCode);
    const terminalName =
      getStorageItem(TERMINAL_NAME_KEY) ||
      `育英星宠终端-${terminalCode.slice(-6).toUpperCase()}`;
    return {
      terminalCode,
      terminalName,
    };
  }

  function setTerminalName(terminalName) {
    const normalizedName = String(terminalName || "").trim();
    if (!normalizedName) return "";
    setStorageItem(TERMINAL_NAME_KEY, normalizedName);
    return normalizedName;
  }

  function hasHolidayExperiencePlayed(dateText) {
    return Boolean(dateText) && getStorageItem(HOLIDAY_EXPERIENCE_PLAYED_KEY) === dateText;
  }

  function markHolidayExperiencePlayed(dateText) {
    if (!dateText) return;
    setStorageItem(HOLIDAY_EXPERIENCE_PLAYED_KEY, dateText);
  }

  function getApiBase() {
    if (global.__DISPLAY_API_BASE_URL__) {
      return stripTrailingSlash(global.__DISPLAY_API_BASE_URL__);
    }
    if (isDesktopRuntime() && global.location.protocol === "file:") {
      return "";
    }
    return `${global.location.origin}/api/v1`;
  }

  function getAssetBase() {
    const apiBase = getApiBase();
    return apiBase ? apiBase.replace(/\/api\/v1$/, "") : "";
  }

  function resolveAssetUrl(url) {
    if (!url) return "";
    if (isAbsoluteUrl(url)) {
      return url;
    }
    return url.startsWith("/")
      ? `${getAssetBase()}${url}`
      : `${getAssetBase()}/${url}`;
  }

  function giftImageVariant(url, size = 480) {
    if (!url || isAbsoluteUrl(url) || url.startsWith("/")) {
      return url || "";
    }
    return url.replace("images/gifts/", `images/gifts/${size}/`);
  }

  function resolveDisplayImageUrl(url) {
    if (!url) return "";
    return url.startsWith("images/") ? url : resolveAssetUrl(url);
  }

  function resolveDecoAssetUrl(deco, size = 400) {
    if (!deco) return "";
    const requestedSize = Number(size || 400);
    const preferPreview = requestedSize <= 400;
    const rawUrl = preferPreview
      ? deco.previewUrl || deco.imageUrl
      : deco.imageUrl || deco.previewUrl;
    if (!rawUrl) return "";
    let url = rawUrl;
    if (url.includes("/pet-decorations/")) {
      url = preferPreview
        ? url.replace("/pet-decorations/1024/", "/pet-decorations/400/")
        : url.replace("/pet-decorations/400/", "/pet-decorations/1024/");
    }
    return resolveAssetUrl(url);
  }

  function resolvePetAssetVariantUrl(url, size = 400, highQuality = false) {
    if (!url) return "";
    const requestedSize = Number(size || 400);
    const effectiveSize = requestedSize > 400 && highQuality ? requestedSize : 400;
    if (effectiveSize === 400 || isAbsoluteUrl(url)) {
      return resolveAssetUrl(url);
    }
    return resolveAssetUrl(
      url.replace("/assets/pets/400/", "/assets/pets/1024/"),
    );
  }

  function getSocketBase() {
    if (global.__DISPLAY_REALTIME_URL__) {
      return stripTrailingSlash(global.__DISPLAY_REALTIME_URL__);
    }
    const apiBase = getApiBase();
    if (apiBase) {
      return apiBase.replace(/\/api\/v1$/, "");
    }
    if (isDesktopRuntime() && global.location.protocol === "file:") {
      return "";
    }
    return global.location.origin;
  }

  async function fetchApiJson(path, token = "", options = {}) {
    const apiBase = getApiBase();
    if (!apiBase) {
      throw new Error("未配置后端服务地址，请在 display.config.json 配置 apiBaseUrl，或通过桌面端注入默认线上地址");
    }

    const headers = {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(options.headers || {}),
    };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    let response;
    try {
      response = await fetch(`${apiBase}${path}`, {
        ...options,
        headers,
      });
    } catch (error) {
      throw new Error(
        `无法连接后端服务：${apiBase}（${error?.message || "网络请求失败"}）`,
      );
    }

    const renewedToken = response.headers.get("X-Yuyingpets-Renewed-Token");
    const payload = await response.json().catch(() => null);
    if (!response.ok || !payload || payload.code !== 0) {
      const message =
        payload && payload.message
          ? payload.message
          : response.status === 404
            ? `接口不存在（${response.status}），请确认后端已更新并重启`
            : `请求失败（${response.status}）`;
      throw new Error(message);
    }
    return {
      data: payload.data,
      renewedToken,
    };
  }

  function getFullscreenElement() {
    return (
      document.fullscreenElement ||
      document.webkitFullscreenElement ||
      document.msFullscreenElement ||
      null
    );
  }

  function syncFullscreenButton() {
    const button = document.getElementById("displayFullscreenBtn");
    if (!button) return;
    button.hidden = Boolean(getFullscreenElement());
  }

  function requestFullscreen() {
    const root = document.documentElement;
    if (getFullscreenElement() || !root) {
      syncFullscreenButton();
      return;
    }
    const request =
      root.requestFullscreen ||
      root.webkitRequestFullscreen ||
      root.msRequestFullscreen;
    if (typeof request !== "function") return;
    try {
      const result = request.call(root);
      if (result && typeof result.catch === "function") {
        result
          .then(() => syncFullscreenButton())
          .catch(() => syncFullscreenButton());
      }
    } catch {
      syncFullscreenButton();
    }
  }

  async function exitFullscreen() {
    if (!getFullscreenElement()) {
      return;
    }
    const exit =
      document.exitFullscreen ||
      document.webkitExitFullscreen ||
      document.msExitFullscreen;
    if (typeof exit !== "function") {
      return;
    }
    try {
      await exit.call(document);
    } catch {
      // 部分环境在用户手势外退出全屏会失败，忽略即可。
    }
  }

  async function minimizeDesktopWindow() {
    if (!isDesktopRuntime()) {
      return;
    }
    await exitFullscreen();
    syncFullscreenButton();
    await global.displayDesktop.minimizeWindow();
  }

  global.DisplayRuntime = {
    getStorageItem,
    setStorageItem,
    removeStorageItem,
    getStoredLoginCredentials,
    getStoredLoginAccounts,
    setStoredLoginCredentials,
    removeStoredLoginAccount,
    getStoredSetupUsername,
    setStoredSetupUsername,
    getPersistentToken,
    setPersistentToken,
    setDisplayClassId,
    clearDisplayClassId,
    setTerminalName,
    hasHolidayExperiencePlayed,
    markHolidayExperiencePlayed,
    readLowSpecModeEnabled,
    writeLowSpecModeEnabled,
    readGridDensity,
    writeGridDensity,
    clearGridDensity,
    readSidebarCollapsed,
    writeSidebarCollapsed,
    getDisplayPerformanceTier,
    isStandardDisplay,
    isHighQualityDisplay,
    isLowSpecMode,
    getDisplayEffectBudget,
    createTerminalCode,
    resolveRuntimeParams,
    getApiBase,
    getAssetBase,
    resolveAssetUrl,
    giftImageVariant,
    resolveDisplayImageUrl,
    resolveDecoAssetUrl,
    resolvePetAssetVariantUrl,
    getSocketBase,
    fetchApiJson,
    requestFullscreen,
    getFullscreenElement,
    syncFullscreenButton,
    exitFullscreen,
    isDesktopRuntime,
    minimizeDesktopWindow,
  };
})(window);

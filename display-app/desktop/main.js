const { app, BrowserWindow, dialog, ipcMain, screen } = require('electron');
const { autoUpdater } = require('electron-updater');
const fs = require('fs');
const path = require('path');

const DEFAULT_BACKGROUND = '#0f3d74';
const DEFAULT_WINDOW_MIN_WIDTH = 960;
const DEFAULT_WINDOW_MIN_HEIGHT = 540;
const DEFAULT_FLOATING_BALL_SIZE = 72;
const DEFAULT_FLOATING_BALL_MARGIN = 18;
const DEFAULT_PRODUCTION_SERVICE_ORIGIN = 'https://www.dlbfyy.cn';
const DEFAULT_PRODUCTION_START_URL = `${DEFAULT_PRODUCTION_SERVICE_ORIGIN}/display/display.html`;
const DEFAULT_AUTO_UPDATE_URL = `${DEFAULT_PRODUCTION_SERVICE_ORIGIN}/download/display-app/win/`;
const DEFAULT_AUTO_UPDATE_CHECK_DELAY_MS = 15 * 1000;
const DEFAULT_AUTO_UPDATE_CHECK_INTERVAL_MS = 6 * 60 * 60 * 1000;

let mainWindow = null;
let floatingBallWindow = null;
let appConfig = {};
let logFilePath = null;
let autoUpdateConfigured = false;
let autoUpdateCheckInProgress = false;
let autoUpdateDownloadedInfo = null;
let autoUpdatePromptInProgress = false;
let autoUpdateLastProgressLogAt = 0;
const configuredPermissionSessions = new WeakSet();

function ensureLogFile() {
  if (logFilePath) {
    return logFilePath;
  }
  const logDir = path.join(app.getPath('userData'), 'logs');
  fs.mkdirSync(logDir, { recursive: true });
  logFilePath = path.join(logDir, 'main.log');
  return logFilePath;
}

function writeLog(level, message, meta = {}) {
  try {
    const line = JSON.stringify({
      time: new Date().toISOString(),
      level,
      message,
      ...meta,
    });
    fs.appendFileSync(ensureLogFile(), `${line}\n`, 'utf8');
    if (app.isPackaged) {
      try {
        fs.appendFileSync(path.join(path.dirname(process.execPath), 'display-main.log'), `${line}\n`, 'utf8');
      } catch {
        // Program Files 等目录可能不可写，保留 userData 日志即可。
      }
    }
  } catch {
    // 日志写入失败不应影响桌面端启动。
  }
}

function isAutoUpdateEnabled(config) {
  if (process.env.DISPLAY_AUTO_UPDATE) {
    return process.env.DISPLAY_AUTO_UPDATE !== 'false';
  }
  if (typeof config.autoUpdate === 'boolean') {
    return config.autoUpdate;
  }
  return true;
}

function resolveAutoUpdateUrl(config) {
  return String(
    process.env.DISPLAY_UPDATE_URL ||
      config.updateUrl ||
      config.autoUpdateUrl ||
      DEFAULT_AUTO_UPDATE_URL,
  ).replace(/\/?$/, '/');
}

function resolveAutoUpdateCheckIntervalMs(config) {
  const configuredMinutes = Number(
    process.env.DISPLAY_AUTO_UPDATE_INTERVAL_MINUTES ||
      config.autoUpdateCheckIntervalMinutes,
  );
  if (Number.isFinite(configuredMinutes) && configuredMinutes > 0) {
    return Math.max(10 * 60 * 1000, Math.round(configuredMinutes * 60 * 1000));
  }
  return DEFAULT_AUTO_UPDATE_CHECK_INTERVAL_MS;
}

function promptInstallDownloadedUpdate(info) {
  if (autoUpdatePromptInProgress) {
    return;
  }
  autoUpdatePromptInProgress = true;
  autoUpdateDownloadedInfo = info;

  const targetWindow =
    mainWindow && !mainWindow.isDestroyed() && mainWindow.isVisible()
      ? mainWindow
      : undefined;
  const options = {
    type: 'info',
    title: '育英星宠 Display 更新已下载',
    message: `新版本 ${info?.version || ''} 已下载完成`,
    detail: '建议下课后再重启更新。选择“立即重启更新”后，应用会关闭并安装新版本。',
    buttons: ['立即重启更新', '稍后'],
    defaultId: 1,
    cancelId: 1,
    noLink: true,
  };

  const promptPromise = targetWindow
    ? dialog.showMessageBox(targetWindow, options)
    : dialog.showMessageBox(options);

  promptPromise
    .then(({ response }) => {
      writeLog('info', 'auto update install prompt answered', {
        response,
        version: info?.version,
      });
      if (response === 0) {
        autoUpdater.quitAndInstall(false, true);
      }
    })
    .catch((error) => {
      writeLog('error', 'auto update install prompt failed', {
        error: error.message,
      });
    })
    .finally(() => {
      autoUpdatePromptInProgress = false;
    });
}

async function checkForDesktopUpdates(reason = 'manual') {
  if (!app.isPackaged || !isAutoUpdateEnabled(appConfig)) {
    return;
  }
  if (autoUpdateCheckInProgress) {
    writeLog('info', 'auto update check skipped: in progress', { reason });
    return;
  }

  autoUpdateCheckInProgress = true;
  writeLog('info', 'auto update check start', { reason });
  try {
    await autoUpdater.checkForUpdates();
  } catch (error) {
    writeLog('error', 'auto update check failed', {
      reason,
      error: error.message,
      stack: error.stack,
    });
  } finally {
    autoUpdateCheckInProgress = false;
  }
}

function configureAutoUpdater(config) {
  if (!app.isPackaged) {
    writeLog('info', 'auto update skipped in development');
    return;
  }
  if (!isAutoUpdateEnabled(config)) {
    writeLog('info', 'auto update disabled by config');
    return;
  }
  if (autoUpdateConfigured) {
    return;
  }

  autoUpdateConfigured = true;
  const updateUrl = resolveAutoUpdateUrl(config);
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = false;
  autoUpdater.setFeedURL({
    provider: 'generic',
    url: updateUrl,
  });

  autoUpdater.on('checking-for-update', () => {
    writeLog('info', 'auto update checking', { updateUrl });
  });
  autoUpdater.on('update-available', (info) => {
    writeLog('info', 'auto update available', {
      version: info?.version,
      releaseDate: info?.releaseDate,
    });
  });
  autoUpdater.on('update-not-available', (info) => {
    writeLog('info', 'auto update not available', {
      version: info?.version,
    });
  });
  autoUpdater.on('download-progress', (progress) => {
    const now = Date.now();
    if (now - autoUpdateLastProgressLogAt < 10 * 1000) {
      return;
    }
    autoUpdateLastProgressLogAt = now;
    writeLog('info', 'auto update download progress', {
      percent: Math.round(progress?.percent || 0),
      transferred: progress?.transferred,
      total: progress?.total,
    });
  });
  autoUpdater.on('update-downloaded', (info) => {
    writeLog('info', 'auto update downloaded', {
      version: info?.version,
      downloadedFile: info?.downloadedFile,
    });
    promptInstallDownloadedUpdate(info);
  });
  autoUpdater.on('error', (error) => {
    writeLog('error', 'auto update error', {
      error: error?.message || String(error),
      stack: error?.stack,
    });
  });

  const startupDelay = Number(config.autoUpdateCheckDelayMs) || DEFAULT_AUTO_UPDATE_CHECK_DELAY_MS;
  setTimeout(() => {
    checkForDesktopUpdates('startup');
  }, Math.max(0, startupDelay));
  setInterval(() => {
    checkForDesktopUpdates('interval');
  }, resolveAutoUpdateCheckIntervalMs(config));

  writeLog('info', 'auto update configured', { updateUrl });
}

function isFullscreenEnabled(config) {
  if (process.env.DISPLAY_FULLSCREEN) {
    return process.env.DISPLAY_FULLSCREEN !== 'false';
  }
  if (typeof config.fullscreen === 'boolean') {
    return config.fullscreen;
  }
  return true;
}

function isFloatingBallEnabled(config) {
  if (process.env.DISPLAY_FLOATING_BALL) {
    return process.env.DISPLAY_FLOATING_BALL !== 'false';
  }
  if (typeof config.floatingBall === 'boolean') {
    return config.floatingBall;
  }
  return process.platform === 'win32';
}

function shouldSummonedWindowStayOnTop(config) {
  if (process.env.DISPLAY_SUMMONED_WINDOW_ALWAYS_ON_TOP) {
    return process.env.DISPLAY_SUMMONED_WINDOW_ALWAYS_ON_TOP !== 'false';
  }
  if (typeof config.summonedWindowAlwaysOnTop === 'boolean') {
    return config.summonedWindowAlwaysOnTop;
  }
  return process.platform === 'win32';
}

function getFloatingBallSize(config) {
  const configuredSize = Number(config.floatingBallSize);
  if (Number.isFinite(configuredSize)) {
    return Math.max(48, Math.min(120, Math.round(configuredSize)));
  }
  return DEFAULT_FLOATING_BALL_SIZE;
}

function getConfigFileCandidates() {
  const candidates = [];
  if (process.env.DISPLAY_CONFIG_PATH) {
    candidates.push(process.env.DISPLAY_CONFIG_PATH);
  }

  if (app.isPackaged) {
    candidates.push(path.join(path.dirname(process.execPath), 'display.config.json'));
    candidates.push(path.join(process.resourcesPath, 'display.config.json'));
  }

  candidates.push(path.join(__dirname, 'display.config.json'));
  return candidates;
}

function loadAppConfig() {
  for (const filePath of getConfigFileCandidates()) {
    try {
      if (!fs.existsSync(filePath)) {
        continue;
      }
      const raw = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(raw);
    } catch (error) {
      dialog.showErrorBox(
        '育英星宠 Display 配置读取失败',
        `配置文件无效：${filePath}\n\n${error.message}`,
      );
      break;
    }
  }
  return {};
}

function resolveApiBaseUrl(config) {
  const urlFrom = (baseUrl) => {
    if (!baseUrl) {
      return null;
    }
    try {
      return new URL('/api/v1', baseUrl).toString().replace(/\/$/, '');
    } catch {
      return null;
    }
  };
  const configuredUrl =
    process.env.DISPLAY_API_BASE_URL ||
    config.apiBaseUrl ||
    config.apiUrl ||
    config.backendUrl ||
    urlFrom(config.startUrl) ||
    urlFrom(config.webUrl);

  if (configuredUrl) {
    return String(configuredUrl).replace(/\/$/, '');
  }
  if (app.isPackaged) {
    return `${DEFAULT_PRODUCTION_SERVICE_ORIGIN}/api/v1`;
  }
  return null;
}

function resolveRealtimeUrl(config) {
  const configuredUrl =
    process.env.DISPLAY_REALTIME_URL ||
    config.realtimeUrl ||
    config.socketUrl;
  if (configuredUrl) {
    return String(configuredUrl).replace(/\/$/, '');
  }

  const apiBaseUrl = resolveApiBaseUrl(config);
  return apiBaseUrl ? apiBaseUrl.replace(/\/api\/v1$/, '') : null;
}

function resolveLocalBundlePath() {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'web', 'dist', 'display', 'display.html');
  }

  return path.resolve(__dirname, '../web/dist/display/display.html');
}

function resolveStartupTarget(config) {
  const configuredUrl = process.env.DISPLAY_START_URL || process.env.DISPLAY_WEB_URL || config.startUrl || config.webUrl;
  if (configuredUrl) {
    return {
      type: 'remote',
      value: configuredUrl,
      fallbackLocal: resolveLocalBundlePath(),
    };
  }

  if (app.isPackaged) {
    return {
      type: 'remote',
      value: DEFAULT_PRODUCTION_START_URL,
      fallbackLocal: resolveLocalBundlePath(),
    };
  }

  return {
    type: 'local',
    value: resolveLocalBundlePath(),
  };
}

function setInlineBubbleVisible(visible) {
  if (!mainWindow || mainWindow.isDestroyed() || mainWindow.webContents.isDestroyed()) {
    return;
  }
  mainWindow.webContents.send('display-app:inline-bubble-visible', Boolean(visible));
}

function ensureWindowResizable(window) {
  if (!window || window.isDestroyed()) {
    return;
  }
  window.setResizable(true);
  window.setMaximizable(true);
  window.setMinimizable(true);
}

function clearWindowAlwaysOnTop(window) {
  if (!window || window.isDestroyed()) {
    return;
  }
  if (window.isAlwaysOnTop()) {
    window.setAlwaysOnTop(false);
  }
}

function temporarilyBringWindowAboveFullscreenApps(window, config) {
  if (!window || window.isDestroyed() || !shouldSummonedWindowStayOnTop(config)) {
    return;
  }
  window.setAlwaysOnTop(true, config.summonedWindowAlwaysOnTopLevel || 'screen-saver');
  setTimeout(() => {
    if (!window.isDestroyed() && window.isVisible() && !window.isMinimized()) {
      clearWindowAlwaysOnTop(window);
    }
  }, Number(config.summonedWindowAlwaysOnTopMs) || 1200);
}

function isMainWindowWebContents(webContents) {
  return Boolean(
    mainWindow &&
      !mainWindow.isDestroyed() &&
      webContents &&
      webContents.id === mainWindow.webContents.id,
  );
}

function isAudioMediaRequest(details = {}) {
  if (Array.isArray(details.mediaTypes)) {
    return details.mediaTypes.includes('audio');
  }
  if (details.mediaType) {
    return details.mediaType === 'audio';
  }
  return true;
}

function configureDisplaySessionPermissions(session) {
  if (!session || configuredPermissionSessions.has(session)) {
    return;
  }
  configuredPermissionSessions.add(session);

  session.setPermissionRequestHandler((webContents, permission, callback, details) => {
    const allowed =
      permission === 'media' &&
      isMainWindowWebContents(webContents) &&
      isAudioMediaRequest(details);
    writeLog('info', 'permission request', {
      permission,
      allowed,
      mediaTypes: details?.mediaTypes,
      requestingUrl: details?.requestingUrl,
    });
    callback(allowed);
  });

  session.setPermissionCheckHandler((webContents, permission, requestingOrigin, details) => {
    const allowed =
      permission === 'media' &&
      isMainWindowWebContents(webContents) &&
      isAudioMediaRequest(details);
    writeLog('info', 'permission check', {
      permission,
      allowed,
      requestingOrigin,
      mediaType: details?.mediaType,
    });
    return allowed;
  });
}

async function clearRuntimeCaches(session, config) {
  const clearCacheOnLaunch = process.env.DISPLAY_CLEAR_CACHE_ON_LAUNCH
    ? process.env.DISPLAY_CLEAR_CACHE_ON_LAUNCH !== 'false'
    : config.clearCacheOnLaunch !== false;

  if (!clearCacheOnLaunch) {
    return;
  }

  await session.clearCache();
  await session.clearStorageData({
    storages: ['serviceworkers', 'cachestorage'],
  });
}

function buildPlaceholderUrl(params = {}) {
  const placeholderPath = path.join(__dirname, 'placeholder.html');
  const placeholderUrl = new URL(`file://${placeholderPath}`);
  for (const [key, value] of Object.entries(params)) {
    if (value) {
      placeholderUrl.searchParams.set(key, value);
    }
  }
  return placeholderUrl.toString();
}

async function showPlaceholder(window, options = {}) {
  const { title, message, detail, retryUrl } = options;
  await window.loadURL(
    buildPlaceholderUrl({
      title,
      message,
      detail,
      retryUrl,
    }),
  );
}

async function loadRemoteWithFallback(window, remoteUrl, fallbackEntryFile) {
  writeLog('info', 'load remote display target', { remoteUrl, fallbackEntryFile });
  return new Promise((resolve) => {
    let settled = false;

    const cleanup = () => {
      window.webContents.removeListener('did-fail-load', handleFail);
      window.webContents.removeListener('did-finish-load', handleSuccess);
    };

    const finish = async (handler) => {
      if (settled) {
        return;
      }
      settled = true;
      cleanup();
      await handler();
      resolve();
    };

    const handleFail = async (_event, errorCode, errorDescription, validatedURL, isMainFrame) => {
      if (!isMainFrame) {
        return;
      }
      await finish(async () => {
        writeLog('error', 'remote display load failed', {
          errorCode,
          errorDescription,
          validatedURL,
          remoteUrl,
        });
        if (fallbackEntryFile) {
          writeLog('info', 'fallback to local display bundle after remote load failed', {
            remoteUrl,
            fallbackEntryFile,
          });
          await loadLocalBundle(window, fallbackEntryFile);
          return;
        }
        await showPlaceholder(window, {
          title: '育英星宠 Display 暂时无法连接',
          message: '线上展示页当前无法访问，已切换到本地提示页。',
          detail: `地址：${validatedURL || remoteUrl}\n错误：${errorDescription} (${errorCode})`,
          retryUrl: remoteUrl,
        });
      });
    };

    const handleSuccess = async () => {
      await finish(async () => {});
    };

    window.webContents.once('did-fail-load', handleFail);
    window.webContents.once('did-finish-load', handleSuccess);

    window.loadURL(remoteUrl).catch(async (error) => {
      await finish(async () => {
        writeLog('error', 'remote display load rejected', {
          remoteUrl,
          error: error.message,
        });
        if (fallbackEntryFile) {
          writeLog('info', 'fallback to local display bundle after remote load rejected', {
            remoteUrl,
            fallbackEntryFile,
          });
          await loadLocalBundle(window, fallbackEntryFile);
          return;
        }
        await showPlaceholder(window, {
          title: '育英星宠 Display 启动失败',
          message: '线上展示页未能成功打开。',
          detail: `${remoteUrl}\n${error.message}`,
          retryUrl: remoteUrl,
        });
      });
    });
  });
}

async function loadLocalBundle(window, entryFile) {
  try {
    writeLog('info', 'load local display bundle', {
      entryFile,
      exists: fs.existsSync(entryFile),
    });
    await window.loadFile(entryFile);
  } catch (error) {
    writeLog('error', 'local display bundle load failed', {
      entryFile,
      error: error.message,
    });
    await showPlaceholder(window, {
      title: '育英星宠 Display 启动失败',
      message: '没有找到本地 Display Web 构建产物。',
      detail: [
        '请先在 display-app/web 目录执行 npm run build，',
        '或通过 DISPLAY_START_URL / display.config.json 指向线上地址。',
        '',
        `错误信息：${error.message}`,
      ].join('\n'),
    });
  }
}

async function createWindow(config) {
  const fullscreen = isFullscreenEnabled(config);
  const apiBaseUrl = resolveApiBaseUrl(config);
  const realtimeUrl = resolveRealtimeUrl(config);
  let didShowMainWindow = false;
  mainWindow = new BrowserWindow({
    width: 1600,
    height: 900,
    minWidth: DEFAULT_WINDOW_MIN_WIDTH,
    minHeight: DEFAULT_WINDOW_MIN_HEIGHT,
    resizable: true,
    maximizable: true,
    minimizable: true,
    fullscreenable: true,
    // 不在构造阶段进入全屏，避免 macOS 原生全屏空间下 minimize() 失效
    fullscreen: false,
    autoHideMenuBar: true,
    backgroundColor: DEFAULT_BACKGROUND,
    show: false,
    webPreferences: {
      contextIsolation: true,
      sandbox: true,
      backgroundThrottling: false,
      additionalArguments: [
        ...(apiBaseUrl ? [`--display-api-base-url=${apiBaseUrl}`] : []),
        ...(realtimeUrl ? [`--display-realtime-url=${realtimeUrl}`] : []),
      ],
      preload: path.join(__dirname, 'preload.js'),
    },
  });
  configureDisplaySessionPermissions(mainWindow.webContents.session);

  const showMainWindow = () => {
    if (didShowMainWindow || !mainWindow || mainWindow.isDestroyed()) {
      return;
    }
    didShowMainWindow = true;
    writeLog('info', 'main window show', {
      fullscreen,
      logFilePath: ensureLogFile(),
    });
    if (fullscreen) {
      mainWindow.setFullScreen(true);
    }
    mainWindow.show();
    setInlineBubbleVisible(true);
    hideFloatingBall();
  };

  mainWindow.on('closed', () => {
    writeLog('info', 'main window closed');
    mainWindow = null;
  });
  mainWindow.on('focus', () => {
    writeLog('info', 'main window focus');
    setInlineBubbleVisible(true);
    hideFloatingBall();
  });
  mainWindow.on('show', () => {
    writeLog('info', 'main window show event');
    if (mainWindow.isFocused()) {
      setInlineBubbleVisible(true);
      hideFloatingBall();
    }
  });
  mainWindow.on('blur', () => {
    writeLog('info', 'main window blur');
    clearWindowAlwaysOnTop(mainWindow);
    setInlineBubbleVisible(false);
    showFloatingBall(config);
  });
  mainWindow.on('minimize', () => {
    writeLog('info', 'main window minimize');
    clearWindowAlwaysOnTop(mainWindow);
    setInlineBubbleVisible(false);
    showFloatingBall(config);
  });

  mainWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription, validatedURL, isMainFrame) => {
    writeLog('error', 'web contents did-fail-load', {
      errorCode,
      errorDescription,
      validatedURL,
      isMainFrame,
    });
  });

  mainWindow.webContents.on('render-process-gone', (_event, details) => {
    writeLog('error', 'renderer process gone', details);
  });

  mainWindow.webContents.on('console-message', (_event, level, message, line, sourceId) => {
    writeLog('renderer', message, {
      level,
      line,
      sourceId,
    });
  });
  registerWindowKeyboardShortcuts(mainWindow);
  mainWindow.once('ready-to-show', showMainWindow);

  await clearRuntimeCaches(mainWindow.webContents.session, config);

  const startupTarget = resolveStartupTarget(config);
  if (startupTarget.type === 'remote') {
    await loadRemoteWithFallback(mainWindow, startupTarget.value, startupTarget.fallbackLocal);
  } else {
    await loadLocalBundle(mainWindow, startupTarget.value);
  }

  setTimeout(showMainWindow, 100);

  return mainWindow;
}

function resolveFloatingBallBounds(config) {
  const size = getFloatingBallSize(config);
  const width = size;
  const margin = DEFAULT_FLOATING_BALL_MARGIN;
  const display = screen.getPrimaryDisplay();
  const bounds = display.workArea || display.bounds;
  const configuredPosition = config.floatingBallPosition;

  if (
    configuredPosition &&
    typeof configuredPosition === 'object' &&
    Number.isFinite(Number(configuredPosition.x)) &&
    Number.isFinite(Number(configuredPosition.y))
  ) {
    const x = Math.round(Number(configuredPosition.x));
    const y = Math.round(Number(configuredPosition.y));
    return {
      width,
      height: size,
      x: Math.max(bounds.x, Math.min(x, bounds.x + bounds.width - width)),
      y: Math.max(bounds.y, Math.min(y, bounds.y + bounds.height - size)),
    };
  }

  const position = typeof configuredPosition === 'string' ? configuredPosition : 'right-bottom';
  const x = position.includes('left')
    ? bounds.x + margin
    : bounds.x + bounds.width - width - margin;
  const y = position.includes('top')
    ? bounds.y + margin
    : bounds.y + bounds.height - size - margin;

  return {
    width,
    height: size,
    x,
    y,
  };
}

function applyFloatingBallTopLevel(config) {
  if (!floatingBallWindow || floatingBallWindow.isDestroyed()) {
    return;
  }

  const level = config.floatingBallAlwaysOnTopLevel || 'screen-saver';
  floatingBallWindow.setAlwaysOnTop(true, level);
  floatingBallWindow.moveTop();
}

function syncFloatingBallBounds(config) {
  if (!floatingBallWindow || floatingBallWindow.isDestroyed()) {
    return;
  }
  const bounds = resolveFloatingBallBounds(config);
  floatingBallWindow.setBounds(bounds);
}

function createFloatingBallWindow(config) {
  if (!isFloatingBallEnabled(config)) {
    return null;
  }
  if (floatingBallWindow && !floatingBallWindow.isDestroyed()) {
    return floatingBallWindow;
  }

  const bounds = resolveFloatingBallBounds(config);
  floatingBallWindow = new BrowserWindow({
    ...bounds,
    frame: false,
    resizable: false,
    maximizable: false,
    minimizable: false,
    fullscreenable: false,
    transparent: true,
    hasShadow: false,
    skipTaskbar: true,
    alwaysOnTop: true,
    show: false,
    title: '育英星宠 Display 悬浮唤醒',
    backgroundColor: '#00000000',
    webPreferences: {
      contextIsolation: true,
      sandbox: true,
      preload: path.join(__dirname, 'floating-ball-preload.js'),
    },
  });

  floatingBallWindow.setMenuBarVisibility(false);
  applyFloatingBallTopLevel(config);
  if (typeof floatingBallWindow.setVisibleOnAllWorkspaces === 'function') {
    floatingBallWindow.setVisibleOnAllWorkspaces(true, {
      visibleOnFullScreen: true,
    });
  }

  floatingBallWindow.on('closed', () => {
    writeLog('info', 'floating ball closed');
    floatingBallWindow = null;
  });

  floatingBallWindow.loadFile(path.join(__dirname, 'floating-ball.html'));
  return floatingBallWindow;
}

function showFloatingBall(config) {
  if (
    mainWindow &&
    !mainWindow.isDestroyed() &&
    mainWindow.isVisible() &&
    !mainWindow.isMinimized() &&
    mainWindow.isFocused()
  ) {
    hideFloatingBall();
    return;
  }

  const window = createFloatingBallWindow(config);
  if (!window || window.isDestroyed()) {
    return;
  }

  syncFloatingBallBounds(config);
  window.showInactive();
  applyFloatingBallTopLevel(config);
}

function hideFloatingBall() {
  if (!floatingBallWindow || floatingBallWindow.isDestroyed()) {
    return;
  }
  floatingBallWindow.hide();
}

function bringMainWindowToFront(window, config) {
  if (!window || window.isDestroyed()) {
    return;
  }

  ensureWindowResizable(window);
  if (window.isMinimized()) {
    window.restore();
  }
  if (!window.isVisible()) {
    window.show();
  }
  if (isFullscreenEnabled(config) && !window.isFullScreen()) {
    window.setFullScreen(true);
  }

  temporarilyBringWindowAboveFullscreenApps(window, config);
  window.moveTop();
  window.focus();
  setInlineBubbleVisible(true);
  hideFloatingBall();
}

function toggleDisplayFullScreen(window) {
  if (!window || window.isDestroyed()) {
    return;
  }
  const nextFullScreen = !window.isFullScreen();
  if (!nextFullScreen) {
    clearWindowAlwaysOnTop(window);
  }
  window.setFullScreen(nextFullScreen);
  if (!nextFullScreen) {
    ensureWindowResizable(window);
  }
}

function toggleMaximizeDisplayWindow(window) {
  if (!window || window.isDestroyed()) {
    return;
  }

  let didToggle = false;
  const toggleMaximize = () => {
    if (didToggle || window.isDestroyed()) {
      return;
    }
    didToggle = true;
    clearWindowAlwaysOnTop(window);
    ensureWindowResizable(window);
    if (window.isMaximized()) {
      window.unmaximize();
    } else {
      window.maximize();
    }
  };

  if (window.isFullScreen()) {
    window.once('leave-full-screen', toggleMaximize);
    window.setFullScreen(false);
    setTimeout(toggleMaximize, process.platform === 'darwin' ? 1500 : 500);
    return;
  }

  toggleMaximize();
}

function minimizeDisplayWindow(window) {
  if (!window || window.isDestroyed()) {
    return;
  }
  if (window.__displayMinimizePending) {
    return;
  }
  window.__displayMinimizePending = true;
  clearWindowAlwaysOnTop(window);
  ensureWindowResizable(window);
  setInlineBubbleVisible(false);

  let minimized = false;
  const doMinimize = () => {
    if (minimized || window.isDestroyed()) {
      return;
    }
    minimized = true;
    window.__displayMinimizePending = false;
    clearWindowAlwaysOnTop(window);
    ensureWindowResizable(window);
    setInlineBubbleVisible(false);
    window.minimize();
    showFloatingBall(appConfig);
  };
  const releaseMinimizePending = () => {
    if (!minimized && !window.isDestroyed()) {
      window.__displayMinimizePending = false;
    }
  };

  if (!window.isFullScreen()) {
    doMinimize();
    return;
  }

  // macOS 原生全屏需等动画结束后再最小化，过早调用会被系统忽略
  window.once('leave-full-screen', doMinimize);
  window.setFullScreen(false);
  setTimeout(doMinimize, process.platform === 'darwin' ? 2500 : 180);
  setTimeout(releaseMinimizePending, process.platform === 'darwin' ? 3200 : 1200);
}

function registerWindowKeyboardShortcuts(window) {
  if (!window || window.isDestroyed()) {
    return;
  }

  window.webContents.on('before-input-event', (event, input) => {
    if (input.type !== 'keyDown') {
      return;
    }

    const key = input.key.toLowerCase();
    if (key === 'f11') {
      event.preventDefault();
      writeLog('info', 'keyboard shortcut: toggle fullscreen');
      toggleDisplayFullScreen(window);
      return;
    }

    if (input.control && !input.alt && key === 'm') {
      event.preventDefault();
      if (input.shift) {
        writeLog('info', 'keyboard shortcut: toggle maximize');
        toggleMaximizeDisplayWindow(window);
      } else {
        writeLog('info', 'keyboard shortcut: minimize');
        minimizeDisplayWindow(window);
      }
    }
  });
}

function registerDesktopIpcHandlers() {
  ipcMain.handle('display-app:minimize', (event) => {
    const senderWindow = BrowserWindow.fromWebContents(event.sender);
    const window = senderWindow === floatingBallWindow ? mainWindow : senderWindow;
    minimizeDisplayWindow(window);
  });

  ipcMain.handle('display-app:toggle-maximize', (event) => {
    const senderWindow = BrowserWindow.fromWebContents(event.sender);
    const window = senderWindow === floatingBallWindow ? mainWindow : senderWindow;
    toggleMaximizeDisplayWindow(window);
  });

  ipcMain.handle('display-app:toggle-fullscreen', (event) => {
    const senderWindow = BrowserWindow.fromWebContents(event.sender);
    const window = senderWindow === floatingBallWindow ? mainWindow : senderWindow;
    toggleDisplayFullScreen(window);
  });

  ipcMain.handle('display-app:quit', () => {
    app.quit();
  });

  ipcMain.handle('display-app:restore-main-window', async () => {
    if (!mainWindow || mainWindow.isDestroyed()) {
      await createWindow(appConfig);
      return;
    }
    bringMainWindowToFront(mainWindow, appConfig);
  });

  ipcMain.handle('display-app:is-main-window-active', () => {
    return Boolean(
      mainWindow &&
        !mainWindow.isDestroyed() &&
        mainWindow.isVisible() &&
        !mainWindow.isMinimized() &&
        mainWindow.isFocused(),
    );
  });

  ipcMain.handle('display-app:hide-floating-ball', () => {
    hideFloatingBall();
  });
}

app.whenReady().then(() => {
  writeLog('info', 'app ready', {
    appVersion: app.getVersion(),
    isPackaged: app.isPackaged,
    resourcesPath: process.resourcesPath,
    userData: app.getPath('userData'),
    logFilePath: ensureLogFile(),
  });
  registerDesktopIpcHandlers();
  appConfig = loadAppConfig();
  writeLog('info', 'app config loaded', appConfig);
  configureAutoUpdater(appConfig);
  createWindow(appConfig);

  screen.on('display-metrics-changed', () => {
    syncFloatingBallBounds(appConfig);
  });

  app.on('activate', () => {
    if (!mainWindow || mainWindow.isDestroyed()) {
      createWindow(appConfig);
    } else {
      bringMainWindowToFront(mainWindow, appConfig);
    }
  });
});

app.on('window-all-closed', () => {
  writeLog('info', 'window all closed');
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

process.on('uncaughtException', (error) => {
  writeLog('error', 'uncaught exception', {
    error: error.message,
    stack: error.stack,
  });
});

process.on('unhandledRejection', (reason) => {
  writeLog('error', 'unhandled rejection', {
    reason: reason instanceof Error ? reason.message : String(reason),
    stack: reason instanceof Error ? reason.stack : undefined,
  });
});

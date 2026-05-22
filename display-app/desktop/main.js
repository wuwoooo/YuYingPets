const { app, BrowserWindow, dialog } = require('electron');
const fs = require('fs');
const path = require('path');

const DEFAULT_BACKGROUND = '#0f3d74';

function isFullscreenEnabled(config) {
  if (process.env.DISPLAY_FULLSCREEN) {
    return process.env.DISPLAY_FULLSCREEN !== 'false';
  }
  if (typeof config.fullscreen === 'boolean') {
    return config.fullscreen;
  }
  return true;
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

function resolveStartupTarget(config) {
  const configuredUrl = process.env.DISPLAY_START_URL || process.env.DISPLAY_WEB_URL || config.startUrl || config.webUrl;
  if (configuredUrl) {
    return { type: 'remote', value: configuredUrl };
  }

  return {
    type: 'local',
    value: path.resolve(__dirname, '../web/dist/index.html'),
  };
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

async function loadRemoteWithFallback(window, remoteUrl) {
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
    await window.loadFile(entryFile);
  } catch (error) {
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
  const window = new BrowserWindow({
    width: 1600,
    height: 900,
    minWidth: 1280,
    minHeight: 720,
    fullscreen,
    autoHideMenuBar: true,
    backgroundColor: DEFAULT_BACKGROUND,
    show: false,
    webPreferences: {
      contextIsolation: true,
      sandbox: true,
      backgroundThrottling: false,
    },
  });

  await clearRuntimeCaches(window.webContents.session, config);

  const startupTarget = resolveStartupTarget(config);
  if (startupTarget.type === 'remote') {
    await loadRemoteWithFallback(window, startupTarget.value);
  } else {
    await loadLocalBundle(window, startupTarget.value);
  }

  window.once('ready-to-show', () => {
    if (fullscreen) {
      window.setFullScreen(true);
    }
    window.show();
  });
}

app.whenReady().then(() => {
  const config = loadAppConfig();
  createWindow(config);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow(config);
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

const { app, BrowserWindow, dialog } = require('electron');
const path = require('path');

function createWindow() {
  const window = new BrowserWindow({
    width: 1600,
    height: 900,
    minWidth: 1280,
    minHeight: 720,
    autoHideMenuBar: true,
    backgroundColor: '#0f3d74',
    show: false,
    webPreferences: {
      contextIsolation: true,
      sandbox: true,
    },
  });

  const devUrl = process.env.DISPLAY_WEB_URL;
  if (devUrl) {
    window.loadURL(devUrl);
  } else {
    const productionEntry = path.resolve(__dirname, '../web/dist/index.html');
    window.loadFile(productionEntry).catch(async (error) => {
      await dialog.showErrorBox(
        '育英星宠 Display 启动失败',
        [
          '没有找到 Display Web 构建产物。',
          '请先在 display-app/web 目录执行 npm run build，',
          '或者在开发模式下传入 DISPLAY_WEB_URL。',
          '',
          `错误信息: ${error.message}`,
        ].join('\n'),
      );
      app.quit();
    });
  }

  window.once('ready-to-show', () => {
    if (process.env.DISPLAY_FULLSCREEN === 'true') {
      window.setFullScreen(true);
    }
    window.show();
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

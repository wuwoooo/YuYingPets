const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('floatingDisplayBall', {
  restoreMainWindow() {
    return ipcRenderer.invoke('display-app:restore-main-window');
  },
  hideFloatingBall() {
    return ipcRenderer.invoke('display-app:hide-floating-ball');
  },
});

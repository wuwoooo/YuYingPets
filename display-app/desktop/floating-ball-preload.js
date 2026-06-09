const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('floatingDisplayBall', {
  onStateChange(callback) {
    if (typeof callback !== 'function') {
      return () => {};
    }
    const handler = (_event, payload) => {
      callback(payload || null);
    };
    ipcRenderer.on('display-app:floating-ball-state', handler);
    return () => {
      ipcRenderer.removeListener('display-app:floating-ball-state', handler);
    };
  },
  restoreMainWindow() {
    return ipcRenderer.invoke('display-app:restore-main-window');
  },
  hideFloatingBall() {
    return ipcRenderer.invoke('display-app:hide-floating-ball');
  },
  moveByDrag(payload) {
    return ipcRenderer.invoke('display-app:move-floating-ball', payload);
  },
});

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('displayDesktop', {
  isDesktop: true,
  minimizeWindow() {
    return ipcRenderer.invoke('display-app:minimize');
  },
  quitApp() {
    return ipcRenderer.invoke('display-app:quit');
  },
});

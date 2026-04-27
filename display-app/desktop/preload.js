const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('displayDesktop', {
  quitApp() {
    return ipcRenderer.invoke('display-app:quit');
  },
});

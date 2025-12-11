// electron/preload.js
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getTemplates: () => ipcRenderer.invoke('get-templates'),
  createProject: (data) => ipcRenderer.invoke('create-project', data),
});


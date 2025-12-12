// electron/preload.js
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getTemplates: () => ipcRenderer.invoke('get-templates'),
  createProject: (data) => ipcRenderer.invoke('create-project', data),
  addShot: (data) => ipcRenderer.invoke('add-shot', data),
  addFolder: (data) => ipcRenderer.invoke('add-folder', data),
  openFolder: () => ipcRenderer.invoke('open-folder-dialog'),
  readProjectStructure: (path) => ipcRenderer.invoke('read-project-structure', path),
});


// electron/main.js
import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createProjectFolders, addShot, readProjectStructure, addFolder, renameFolder } from "./fs/createProjectFolders.js";


// Get __dirname in ES module style
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'), // preload script
      nodeIntegration: false,    // ❌ keep false
      contextIsolation: true,    // ✅ must be true for contextBridge
    },
  });

  win.loadURL('http://localhost:5173'); // Vite dev server
}

// Load templates from JSON
function loadTemplates() {
  const configPath = path.join(__dirname, '../config/templates.json');
  try {
    const data = fs.readFileSync(configPath, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error loading templates:', err);
    return null;
  }
}

// IPC handler for renderer
ipcMain.handle('get-templates', () => {
  return loadTemplates();
});

ipcMain.handle("create-project", (event, data) => {
  console.log("📦 IPC received create-project:", data);
  return createProjectFolders(data);
});

ipcMain.handle("add-shot", (event, data) => {
  console.log("📦 IPC received add-shot:", data);
  return addShot(data);
});

ipcMain.handle('open-folder-dialog', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory']
  });
  return result.filePaths[0] || null;
});

ipcMain.handle('read-project-structure', (event, projectPath) => {
  console.log("📦 IPC received read-project-structure:", projectPath);
  return readProjectStructure(projectPath);
});

ipcMain.handle('add-folder', (event, data) => {
  console.log('📦 IPC received add-folder:', data);
  return addFolder(data);
});

ipcMain.handle('rename-folder', (event, data) => {
  console.log('📦 IPC received rename-folder:', data);
  return renameFolder(data);
});




app.whenReady().then(createWindow);

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

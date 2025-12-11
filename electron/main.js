// electron/main.js
import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

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

app.whenReady().then(createWindow);

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

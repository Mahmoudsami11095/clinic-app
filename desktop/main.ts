import { app, BrowserWindow, ipcMain, Menu, Tray, globalShortcut, dialog, nativeImage } from 'electron';
import * as path from 'path';
import * as fs from 'fs';

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let isQuitting = false;

// Enforce single instance lock
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.show();
      mainWindow.focus();
    }
  });
}

function createMainWindow(): BrowserWindow {
  const isDev = process.env['NODE_ENV'] === 'development' || process.argv.includes('--dev');

  const win = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    frame: false, // Frameless custom titlebar
    backgroundColor: '#020617', // Match Tailwind slate-950
    show: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  // Graceful show on ready-to-show
  win.once('ready-to-show', () => {
    win.show();
  });

  // Track maximize state and notify renderer
  win.on('maximize', () => {
    win.webContents.send('desktop:maximize-changed', true);
  });

  win.on('unmaximize', () => {
    win.webContents.send('desktop:maximize-changed', false);
  });

  // HIPAA Workstation Privacy Veil: Trigger shield on window blur or minimize
  win.on('blur', () => {
    win.webContents.send('desktop:privacy-veil-toggle', true);
  });

  win.on('focus', () => {
    // Renderer UI retains veil until user interacts or dismisses it
  });

  win.on('minimize', () => {
    win.webContents.send('desktop:privacy-veil-toggle', true);
  });

  // Minimize to tray on close if not quitting
  win.on('close', (event: Electron.Event) => {
    if (!isQuitting) {
      event.preventDefault();
      win.hide();
    }
  });

  // Load Angular App
  if (isDev && process.env['DEV_SERVER_URL']) {
    win.loadURL(process.env['DEV_SERVER_URL']);
  } else {
    const indexPath = path.join(__dirname, '../../dist/clinic-app/browser/index.html');
    win.loadFile(indexPath).catch(() => {
      // Fallback relative path for packaged distributions
      const altPath = path.join(__dirname, '../dist/clinic-app/browser/index.html');
      win.loadFile(altPath).catch((err) => {
        console.error('Failed to load Angular index.html:', err);
      });
    });
  }

  return win;
}

function setupTray(): void {
  // Create simple procedural 16x16 icon buffer if asset not yet bundled
  const iconBuffer = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAA6SURBVDhPY/wPBAwUACZGBgaG/0h8ZACmAAYGhv9I/A9jY2MDUmE8agAYGBiYGEgAmBgZGBgGqBsGAPiHBAxS47aHAAAAAElFTkSuQmCC',
    'base64'
  );
  const trayIcon = nativeImage.createFromBuffer(iconBuffer);

  tray = new Tray(trayIcon);
  tray.setToolTip('Smart Clinic Management System');

  const updateMenu = (chairsAvailable = 4, waitingQueue = 2) => {
    const contextMenu = Menu.buildFromTemplate([
      { label: 'Smart Clinic Management Suite', enabled: false },
      { type: 'separator' },
      { label: `🏥 Operatory Chairs Available: ${chairsAvailable}`, enabled: false },
      { label: `⏱ Waiting Queue: ${waitingQueue} Patients`, enabled: false },
      { type: 'separator' },
      {
        label: 'Open Application',
        click: () => {
          if (mainWindow) {
            mainWindow.show();
            mainWindow.focus();
          }
        }
      },
      {
        label: 'Trigger Spotlight (Ctrl+Alt+K)',
        click: () => {
          if (mainWindow) {
            mainWindow.show();
            mainWindow.focus();
            mainWindow.webContents.send('desktop:trigger-spotlight');
          }
        }
      },
      {
        label: 'Toggle Voice Scribe (Ctrl+Alt+S)',
        click: () => {
          if (mainWindow) {
            mainWindow.webContents.send('desktop:trigger-voice-scribe');
          }
        }
      },
      { type: 'separator' },
      {
        label: 'Quit',
        click: () => {
          isQuitting = true;
          app.quit();
        }
      }
    ]);
    tray?.setContextMenu(contextMenu);
  };

  updateMenu();

  tray.on('double-click', () => {
    if (mainWindow) {
      if (mainWindow.isVisible()) {
        mainWindow.hide();
      } else {
        mainWindow.show();
        mainWindow.focus();
      }
    }
  });

  // Handle live tray updates from renderer SignalR events
  ipcMain.handle('desktop:update-tray-status', (_, payload: { availableChairs: number; waitingQueue: number }) => {
    updateMenu(payload.availableChairs, payload.waitingQueue);
  });
}

function registerGlobalShortcuts(): void {
  // Global shortcut for Spotlight: CommandOrControl+Alt+K
  globalShortcut.register('CommandOrControl+Alt+K', () => {
    if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
      mainWindow.webContents.send('desktop:trigger-spotlight');
    }
  });

  // Global shortcut for Ambient Voice Scribe: CommandOrControl+Alt+S
  globalShortcut.register('CommandOrControl+Alt+S', () => {
    if (mainWindow) {
      mainWindow.webContents.send('desktop:trigger-voice-scribe');
    }
  });
}

function registerIpcHandlers(): void {
  // Window Controls
  ipcMain.handle('desktop:window-minimize', () => {
    mainWindow?.minimize();
  });

  ipcMain.handle('desktop:window-maximize', () => {
    if (!mainWindow) return;
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  });

  ipcMain.handle('desktop:window-close', () => {
    mainWindow?.close();
  });

  ipcMain.handle('desktop:is-maximized', () => {
    return mainWindow ? mainWindow.isMaximized() : false;
  });

  // System Info
  ipcMain.handle('desktop:get-system-info', () => {
    return {
      platform: process.platform,
      arch: process.arch,
      appVersion: app.getVersion(),
      electronVersion: process.versions.electron,
      nodeVersion: process.versions.node
    };
  });

  // Printer Enumeration
  ipcMain.handle('desktop:get-printers', async () => {
    if (!mainWindow) return [];
    return await mainWindow.webContents.getPrintersAsync();
  });

  // Silent Thermal Receipt Printing (POS 80mm ESC/POS)
  ipcMain.handle('desktop:print-receipt', async (_, options: { htmlContent: string; printerName?: string }) => {
    try {
      const printWin = new BrowserWindow({
        show: false,
        webPreferences: { nodeIntegration: false, contextIsolation: true }
      });

      await printWin.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(options.htmlContent)}`);

      return new Promise((resolve) => {
        printWin.webContents.print(
          {
            silent: true,
            printBackground: true,
            deviceName: options.printerName || '',
            margins: { marginType: 'none' }
          },
          (success, failureReason) => {
            printWin.close();
            if (success) {
              resolve({ success: true });
            } else {
              resolve({ success: false, error: failureReason });
            }
          }
        );
      });
    } catch (err: any) {
      return { success: false, error: err?.message || 'Print error' };
    }
  });

  // Direct File System Bridge (STL, DICOM, PDF Export)
  ipcMain.handle(
    'desktop:save-clinical-file',
    async (_, options: { fileName: string; mimeType: string; base64Data: string; defaultPath?: string }) => {
      try {
        if (!mainWindow) return { success: false, error: 'No active window' };

        const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
          title: `Export Clinical Asset: ${options.fileName}`,
          defaultPath: options.defaultPath || options.fileName
        });

        if (canceled || !filePath) {
          return { success: false, error: 'User cancelled export' };
        }

        const buffer = Buffer.from(options.base64Data, 'base64');
        await fs.promises.writeFile(filePath, buffer);

        return { success: true, filePath };
      } catch (err: any) {
        return { success: false, error: err?.message || 'File save error' };
      }
    }
  );
}

// App Lifecycle
app.whenReady().then(() => {
  mainWindow = createMainWindow();
  setupTray();
  registerGlobalShortcuts();
  registerIpcHandlers();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      mainWindow = createMainWindow();
    } else {
      mainWindow?.show();
    }
  });
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
  if (tray) {
    tray.destroy();
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

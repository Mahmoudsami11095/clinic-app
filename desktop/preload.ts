import { contextBridge, ipcRenderer } from 'electron';

export interface SystemInfo {
  platform: string;
  arch: string;
  appVersion: string;
  electronVersion: string;
  nodeVersion: string;
}

export interface PrinterDevice {
  name: string;
  displayName: string;
  description: string;
  status: number;
  isDefault: boolean;
}

export interface ThermalPrintOptions {
  htmlContent: string;
  printerName?: string;
  copies?: number;
}

export interface SaveClinicalFileOptions {
  fileName: string;
  mimeType: string;
  base64Data: string;
  defaultPath?: string;
}

export interface TrayStatusPayload {
  availableChairs: number;
  occupiedChairs: number;
  waitingQueue: number;
}

const desktopAPI = {
  isDesktop: true,
  platform: process.platform,

  window: {
    minimize: (): Promise<void> => ipcRenderer.invoke('desktop:window-minimize'),
    maximize: (): Promise<void> => ipcRenderer.invoke('desktop:window-maximize'),
    close: (): Promise<void> => ipcRenderer.invoke('desktop:window-close'),
    isMaximized: (): Promise<boolean> => ipcRenderer.invoke('desktop:is-maximized'),
    onMaximizeChange: (callback: (isMaximized: boolean) => void) => {
      const listener = (_: any, isMax: boolean) => callback(isMax);
      ipcRenderer.on('desktop:maximize-changed', listener);
      return () => ipcRenderer.removeListener('desktop:maximize-changed', listener);
    }
  },

  privacy: {
    onPrivacyVeilChange: (callback: (active: boolean) => void) => {
      const listener = (_: any, active: boolean) => callback(active);
      ipcRenderer.on('desktop:privacy-veil-toggle', listener);
      return () => ipcRenderer.removeListener('desktop:privacy-veil-toggle', listener);
    }
  },

  shortcuts: {
    onSpotlightTrigger: (callback: () => void) => {
      const listener = () => callback();
      ipcRenderer.on('desktop:trigger-spotlight', listener);
      return () => ipcRenderer.removeListener('desktop:trigger-spotlight', listener);
    },
    onVoiceScribeTrigger: (callback: () => void) => {
      const listener = () => callback();
      ipcRenderer.on('desktop:trigger-voice-scribe', listener);
      return () => ipcRenderer.removeListener('desktop:trigger-voice-scribe', listener);
    }
  },

  printing: {
    getPrinters: (): Promise<PrinterDevice[]> => ipcRenderer.invoke('desktop:get-printers'),
    printThermalReceipt: (options: ThermalPrintOptions): Promise<{ success: boolean; error?: string }> =>
      ipcRenderer.invoke('desktop:print-receipt', options)
  },

  fileSystem: {
    saveClinicalFile: (options: SaveClinicalFileOptions): Promise<{ success: boolean; filePath?: string; error?: string }> =>
      ipcRenderer.invoke('desktop:save-clinical-file', options)
  },

  tray: {
    updateStatus: (payload: TrayStatusPayload): Promise<void> =>
      ipcRenderer.invoke('desktop:update-tray-status', payload)
  },

  system: {
    getSystemInfo: (): Promise<SystemInfo> => ipcRenderer.invoke('desktop:get-system-info')
  }
};

contextBridge.exposeInMainWorld('desktopAPI', desktopAPI);

export type DesktopBridgeAPI = typeof desktopAPI;

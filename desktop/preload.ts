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

export interface UpdateCheckResult {
  updateAvailable: boolean;
  version?: string;
  releaseNotes?: string;
  mandatory?: boolean;
}

export interface UpdateProgressPayload {
  percent: number;
  transferredBytes?: number;
  totalBytes?: number;
}

export interface ScannerDeviceInfo {
  id: string;
  brand: 'Medit' | '3Shape' | 'Carestream' | 'Shining3D';
  model: string;
  vendorId: string;
  productId: string;
  serialNumber: string;
  firmwareVersion: string;
  isConnected: boolean;
  temperatureCelsius: number;
  calibrationDaysRemaining: number;
}

export interface ScannerPointFrame {
  arch: 'maxillary' | 'mandibular' | 'bite';
  timestamp: number;
  pointsCount: number;
  positions: number[];
  densityPtsPerMm2?: number;
  completenessPercent?: number;
}

const desktopAPI = {
  isDesktop: true,
  platform: process.platform,

  scanner: {
    listDevices: (): Promise<ScannerDeviceInfo[]> => ipcRenderer.invoke('desktop:scanner-list'),
    connect: (deviceId: string): Promise<{ success: boolean; device?: ScannerDeviceInfo; error?: string }> =>
      ipcRenderer.invoke('desktop:scanner-connect', deviceId),
    disconnect: (): Promise<{ success: boolean }> => ipcRenderer.invoke('desktop:scanner-disconnect'),
    startStream: (arch: 'maxillary' | 'mandibular' | 'bite'): Promise<{ success: boolean }> =>
      ipcRenderer.invoke('desktop:scanner-start-stream', arch),
    stopStream: (): Promise<{ success: boolean }> => ipcRenderer.invoke('desktop:scanner-stop-stream'),
    onPointCloudFrame: (callback: (frame: ScannerPointFrame) => void) => {
      const listener = (_: any, frame: ScannerPointFrame) => callback(frame);
      ipcRenderer.on('desktop:scanner-point-frame', listener);
      return () => ipcRenderer.removeListener('desktop:scanner-point-frame', listener);
    }
  },

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

  storage: {
    saveSnapshot: (key: string, data: string): Promise<{ success: boolean; error?: string }> =>
      ipcRenderer.invoke('desktop:save-snapshot', { key, data }),
    loadSnapshot: (key: string): Promise<string | null> =>
      ipcRenderer.invoke('desktop:load-snapshot', key),
    clearSnapshot: (key: string): Promise<{ success: boolean; error?: string }> =>
      ipcRenderer.invoke('desktop:clear-snapshot', key),
    getStorageInfo: (): Promise<{ dir: string; fileCount: number; totalBytes: number }> =>
      ipcRenderer.invoke('desktop:storage-info')
  },

  system: {
    getSystemInfo: (): Promise<SystemInfo> => ipcRenderer.invoke('desktop:get-system-info')
  },

  updater: {
    checkForUpdates: (): Promise<UpdateCheckResult> => ipcRenderer.invoke('desktop:check-updates'),
    downloadUpdate: (): Promise<{ success: boolean; error?: string }> => ipcRenderer.invoke('desktop:download-update'),
    installUpdate: (): Promise<void> => ipcRenderer.invoke('desktop:install-update'),
    onUpdateProgress: (callback: (progress: UpdateProgressPayload) => void) => {
      const listener = (_: any, progress: UpdateProgressPayload) => callback(progress);
      ipcRenderer.on('desktop:update-progress', listener);
      return () => ipcRenderer.removeListener('desktop:update-progress', listener);
    },
    onUpdateDownloaded: (callback: (info: { version: string }) => void) => {
      const listener = (_: any, info: { version: string }) => callback(info);
      ipcRenderer.on('desktop:update-downloaded', listener);
      return () => ipcRenderer.removeListener('desktop:update-downloaded', listener);
    }
  }
};

contextBridge.exposeInMainWorld('desktopAPI', desktopAPI);

export type DesktopBridgeAPI = typeof desktopAPI;

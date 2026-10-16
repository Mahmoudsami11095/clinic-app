import { Injectable, signal, computed, NgZone } from '@angular/core';

export type DesktopPlatform = 'windows' | 'macos' | 'linux' | 'web';

export interface DesktopPrinterDevice {
  name: string;
  displayName: string;
  description: string;
  status: number;
  isDefault: boolean;
}

export interface DesktopThermalPrintOptions {
  htmlContent: string;
  printerName?: string;
  copies?: number;
}

export interface DesktopSaveFileOptions {
  fileName: string;
  mimeType: string;
  base64Data: string;
  defaultPath?: string;
}

export interface DesktopSystemInfo {
  platform: string;
  arch: string;
  appVersion: string;
  electronVersion: string;
  nodeVersion: string;
}

export interface DesktopStorageInfo {
  dir: string;
  fileCount: number;
  totalBytes: number;
}

@Injectable({
  providedIn: 'root'
})
export class NativeDesktopService {
  private readonly bridge = typeof window !== 'undefined' ? (window as any).desktopAPI : undefined;

  readonly isDesktop = signal<boolean>(!!this.bridge?.isDesktop);
  readonly platform = signal<DesktopPlatform>(this.detectPlatform());
  readonly isMaximized = signal<boolean>(false);
  readonly isPrivacyVeilActive = signal<boolean>(false);

  // Reactive counters for global hotkey triggers
  readonly spotlightTriggerCounter = signal<number>(0);
  readonly voiceScribeTriggerCounter = signal<number>(0);

  readonly isWindows = computed(() => this.platform() === 'windows');
  readonly isMacOS = computed(() => this.platform() === 'macos');
  readonly isLinux = computed(() => this.platform() === 'linux');

  constructor(private ngZone: NgZone) {
    this.initializeBridgeListeners();
  }

  private detectPlatform(): DesktopPlatform {
    if (!this.bridge) {
      if (typeof navigator !== 'undefined') {
        const ua = navigator.userAgent.toLowerCase();
        if (ua.includes('win')) return 'windows';
        if (ua.includes('mac')) return 'macos';
        if (ua.includes('linux')) return 'linux';
      }
      return 'web';
    }

    const p = this.bridge.platform;
    if (p === 'win32') return 'windows';
    if (p === 'darwin') return 'macos';
    if (p === 'linux') return 'linux';
    return 'web';
  }

  private initializeBridgeListeners(): void {
    if (!this.bridge) return;

    // Window maximize listener
    this.bridge.window?.onMaximizeChange?.((isMax: boolean) => {
      this.ngZone.run(() => {
        this.isMaximized.set(isMax);
      });
    });

    // Initial check for maximize state
    this.bridge.window?.isMaximized?.().then((isMax: boolean) => {
      this.ngZone.run(() => {
        this.isMaximized.set(isMax);
      });
    }).catch(() => {});

    // HIPAA Privacy Veil listener
    this.bridge.privacy?.onPrivacyVeilChange?.((active: boolean) => {
      this.ngZone.run(() => {
        this.isPrivacyVeilActive.set(active);
      });
    });

    // Global Shortcuts listeners
    this.bridge.shortcuts?.onSpotlightTrigger?.(() => {
      this.ngZone.run(() => {
        this.spotlightTriggerCounter.update((n) => n + 1);
      });
    });

    this.bridge.shortcuts?.onVoiceScribeTrigger?.(() => {
      this.ngZone.run(() => {
        this.voiceScribeTriggerCounter.update((n) => n + 1);
      });
    });
  }

  async minimize(): Promise<void> {
    if (this.bridge?.window?.minimize) {
      await this.bridge.window.minimize();
    }
  }

  async maximize(): Promise<void> {
    if (this.bridge?.window?.maximize) {
      await this.bridge.window.maximize();
    }
  }

  async close(): Promise<void> {
    if (this.bridge?.window?.close) {
      await this.bridge.window.close();
    }
  }

  dismissPrivacyVeil(): void {
    this.isPrivacyVeilActive.set(false);
  }

  async getPrinters(): Promise<DesktopPrinterDevice[]> {
    if (this.bridge?.printing?.getPrinters) {
      return await this.bridge.printing.getPrinters();
    }
    return [];
  }

  async printThermalReceipt(options: DesktopThermalPrintOptions): Promise<{ success: boolean; error?: string }> {
    if (this.bridge?.printing?.printThermalReceipt) {
      return await this.bridge.printing.printThermalReceipt(options);
    }

    // Web Fallback: open print window
    if (typeof window !== 'undefined') {
      const printWin = window.open('', '_blank', 'width=400,height=600');
      if (printWin) {
        printWin.document.write(options.htmlContent);
        printWin.document.close();
        printWin.focus();
        printWin.print();
        printWin.close();
        return { success: true };
      }
    }
    return { success: false, error: 'Web print window blocked' };
  }

  async saveClinicalFile(options: DesktopSaveFileOptions): Promise<{ success: boolean; filePath?: string; error?: string }> {
    if (this.bridge?.fileSystem?.saveClinicalFile) {
      return await this.bridge.fileSystem.saveClinicalFile(options);
    }

    // Web Fallback: standard blob download
    if (typeof window !== 'undefined') {
      try {
        const byteCharacters = atob(options.base64Data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: options.mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = options.fileName;
        a.click();
        URL.revokeObjectURL(url);
        return { success: true, filePath: options.fileName };
      } catch (err: any) {
        return { success: false, error: err?.message || 'Download failed' };
      }
    }
    return { success: false, error: 'No browser context' };
  }

  async updateTrayStatus(availableChairs: number, waitingQueue: number): Promise<void> {
    if (this.bridge?.tray?.updateStatus) {
      await this.bridge.tray.updateStatus({
        availableChairs,
        occupiedChairs: Math.max(0, 10 - availableChairs),
        waitingQueue
      });
    }
  }

  async getSystemInfo(): Promise<DesktopSystemInfo | null> {
    if (this.bridge?.system?.getSystemInfo) {
      return await this.bridge.system.getSystemInfo();
    }
    return null;
  }

  async saveOfflineSnapshot<T>(key: string, data: T): Promise<boolean> {
    const serialized = JSON.stringify(data);
    if (this.bridge?.storage?.saveSnapshot) {
      const res = await this.bridge.storage.saveSnapshot(key, serialized);
      return res?.success ?? false;
    }
    // Web Fallback: localStorage
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(`desktop_offline_${key}`, serialized);
        return true;
      } catch (e) {
        console.warn('Fallback offline save failed', e);
        return false;
      }
    }
    return false;
  }

  async loadOfflineSnapshot<T>(key: string): Promise<T | null> {
    if (this.bridge?.storage?.loadSnapshot) {
      const raw = await this.bridge.storage.loadSnapshot(key);
      if (raw) {
        try {
          return JSON.parse(raw) as T;
        } catch {
          return null;
        }
      }
      return null;
    }
    // Web Fallback: localStorage
    if (typeof localStorage !== 'undefined') {
      try {
        const raw = localStorage.getItem(`desktop_offline_${key}`);
        return raw ? (JSON.parse(raw) as T) : null;
      } catch {
        return null;
      }
    }
    return null;
  }

  async clearOfflineSnapshot(key: string): Promise<boolean> {
    if (this.bridge?.storage?.clearSnapshot) {
      const res = await this.bridge.storage.clearSnapshot(key);
      return res?.success ?? false;
    }
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(`desktop_offline_${key}`);
      return true;
    }
    return false;
  }

  async getOfflineStorageInfo(): Promise<DesktopStorageInfo | null> {
    if (this.bridge?.storage?.getStorageInfo) {
      return await this.bridge.storage.getStorageInfo();
    }
    return null;
  }
}

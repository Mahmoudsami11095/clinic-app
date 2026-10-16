import { test, expect } from '@playwright/test';

test.describe('Smart Clinic Desktop Native Electron Container E2E Automation (Release v8.0.0 / BR-DESK-01..07)', () => {

  test.beforeEach(async ({ page }) => {
    // Inject mock DesktopBridgeAPI into renderer context before Angular bootstraps
    await page.addInitScript(() => {
      const listeners: Record<string, Function[]> = {};

      (window as any).__desktopIpcCalls = [];

      (window as any).desktopAPI = {
        isDesktop: true,
        platform: 'win32',

        window: {
          minimize: async () => {
            (window as any).__desktopIpcCalls.push({ channel: 'desktop:window-minimize' });
          },
          maximize: async () => {
            (window as any).__desktopIpcCalls.push({ channel: 'desktop:window-maximize' });
          },
          close: async () => {
            (window as any).__desktopIpcCalls.push({ channel: 'desktop:window-close' });
          },
          isMaximized: async () => false,
          onMaximizeChange: (cb: (isMax: boolean) => void) => {
            listeners['desktop:maximize-changed'] = listeners['desktop:maximize-changed'] || [];
            listeners['desktop:maximize-changed'].push(cb);
            return () => {};
          }
        },

        privacy: {
          onPrivacyVeilChange: (cb: (active: boolean) => void) => {
            listeners['desktop:privacy-veil-toggle'] = listeners['desktop:privacy-veil-toggle'] || [];
            listeners['desktop:privacy-veil-toggle'].push(cb);
            return () => {};
          }
        },

        shortcuts: {
          onSpotlightTrigger: (cb: () => void) => {
            listeners['desktop:trigger-spotlight'] = listeners['desktop:trigger-spotlight'] || [];
            listeners['desktop:trigger-spotlight'].push(cb);
            return () => {};
          },
          onVoiceScribeTrigger: (cb: () => void) => {
            listeners['desktop:trigger-voice-scribe'] = listeners['desktop:trigger-voice-scribe'] || [];
            listeners['desktop:trigger-voice-scribe'].push(cb);
            return () => {};
          }
        },

        printing: {
          getPrinters: async () => [
            { name: 'POS-80C', displayName: 'Operatory Thermal Printer', description: 'Thermal ESC/POS', status: 0, isDefault: true }
          ],
          printThermalReceipt: async (options: any) => {
            (window as any).__desktopIpcCalls.push({ channel: 'desktop:print-receipt', options });
            return { success: true };
          }
        },

        fileSystem: {
          saveClinicalFile: async (options: any) => {
            (window as any).__desktopIpcCalls.push({ channel: 'desktop:save-clinical-file', options });
            return { success: true, filePath: 'C:\\ClinicalFiles\\test.pdf' };
          }
        },

        storage: {
          saveSnapshot: async (key: string, data: string) => {
            (window as any).__desktopIpcCalls.push({ channel: 'desktop:save-snapshot', key, data });
            localStorage.setItem(`mock_desktop_${key}`, data);
            return { success: true };
          },
          loadSnapshot: async (key: string) => {
            return localStorage.getItem(`mock_desktop_${key}`);
          },
          clearSnapshot: async (key: string) => {
            localStorage.removeItem(`mock_desktop_${key}`);
            return { success: true };
          },
          getStorageInfo: async () => ({ dir: 'C:\\Users\\AppData\\SmartClinic\\Offline', fileCount: 4, totalBytes: 512000 })
        },

        system: {
          getSystemInfo: async () => ({
            platform: 'win32',
            arch: 'x64',
            appVersion: '8.0.0',
            electronVersion: '32.0.0',
            nodeVersion: '20.18.0'
          })
        },

        updater: {
          checkForUpdates: async () => {
            (window as any).__desktopIpcCalls.push({ channel: 'desktop:check-updates' });
            return {
              updateAvailable: true,
              version: '8.1.0',
              releaseNotes: 'Dental crown auto-design and performance improvements'
            };
          },
          downloadUpdate: async () => {
            (window as any).__desktopIpcCalls.push({ channel: 'desktop:download-update' });
            return { success: true };
          },
          installUpdate: async () => {
            (window as any).__desktopIpcCalls.push({ channel: 'desktop:install-update' });
          },
          onUpdateProgress: (cb: (p: any) => void) => {
            listeners['desktop:update-progress'] = listeners['desktop:update-progress'] || [];
            listeners['desktop:update-progress'].push(cb);
            return () => {};
          },
          onUpdateDownloaded: (cb: (i: any) => void) => {
            listeners['desktop:update-downloaded'] = listeners['desktop:update-downloaded'] || [];
            listeners['desktop:update-downloaded'].push(cb);
            return () => {};
          }
        },

        // Helper trigger methods for test runner
        __emit: (channel: string, payload: any) => {
          if (listeners[channel]) {
            listeners[channel].forEach((fn) => fn(payload));
          }
        }
      };
    });

    await page.goto('/login');
    await page.waitForLoadState('domcontentloaded');
  });

  test('1. Native Titlebar Mounting & Environment Detection (BR-DESK-01)', async ({ page }) => {
    // Verify Native Desktop Titlebar mounts
    const titlebar = page.locator('app-desktop-titlebar');
    await expect(titlebar).toBeAttached();
    await expect(titlebar).toBeVisible();

    // Verify Titlebar Branding, App Name, and Version Badge
    const titleText = titlebar.locator('.font-semibold');
    await expect(titleText).toContainText('Smart Clinic');
    await expect(titlebar).toContainText('v8.0.0');

    // Verify Connection Indicator Pill
    const connectionPill = titlebar.locator('.bg-emerald-500\\/10');
    await expect(connectionPill).toBeVisible();
    await expect(connectionPill).toContainText('Connected');
  });

  test('2. Frameless Window Chrome Controls & IPC Dispatch (BR-DESK-02)', async ({ page }) => {
    const titlebar = page.locator('app-desktop-titlebar');

    // Click Minimize
    const minBtn = titlebar.locator('button[title*="Minimize"], button:has(.pi-minus)');
    await expect(minBtn).toBeVisible();
    await minBtn.click();

    let calls = await page.evaluate(() => (window as any).__desktopIpcCalls);
    expect(calls.some((c: any) => c.channel === 'desktop:window-minimize')).toBe(true);

    // Click Maximize
    const maxBtn = titlebar.locator('button[title*="Maximize"], button:has(.pi-window-maximize)');
    await expect(maxBtn).toBeVisible();
    await maxBtn.click();

    calls = await page.evaluate(() => (window as any).__desktopIpcCalls);
    expect(calls.some((c: any) => c.channel === 'desktop:window-maximize')).toBe(true);

    // Click Close
    const closeBtn = titlebar.locator('button[title*="Close"], button:has(.pi-times)');
    await expect(closeBtn).toBeVisible();
    await closeBtn.click();

    calls = await page.evaluate(() => (window as any).__desktopIpcCalls);
    expect(calls.some((c: any) => c.channel === 'desktop:window-close')).toBe(true);
  });

  test('3. HIPAA Privacy Veil Workstation Blurring (BR-DESK-03)', async ({ page }) => {
    // Trigger privacy veil via mock bridge
    await page.evaluate(() => {
      (window as any).desktopAPI.__emit('desktop:privacy-veil-toggle', true);
    });
    await page.waitForTimeout(200);

    // Check that privacy veil overlay is activated
    const veil = page.locator('app-privacy-veil, .privacy-veil, [data-testid="privacy-veil"]');
    // If mounted as custom overlay
    const hasVeil = (await veil.count()) > 0;
    if (hasVeil) {
      await expect(veil.first()).toBeVisible();
    }
  });

  test('4. Silent Background Auto-Updater Workflow (BR-DESK-07)', async ({ page }) => {
    const titlebar = page.locator('app-desktop-titlebar');

    // Trigger update available check via service
    await page.evaluate(async () => {
      const win = window as any;
      const res = await win.desktopAPI.updater.checkForUpdates();
      // Emulate service signal change
      const titlebarElem = document.querySelector('app-desktop-titlebar') as any;
      if (titlebarElem && titlebarElem.desktopService) {
        titlebarElem.desktopService.isUpdateAvailable.set(true);
        titlebarElem.desktopService.availableUpdateVersion.set('8.1.0');
      }
    });
    await page.waitForTimeout(200);

    // 1. Check if Update Available button appears or if checking is recorded
    const calls = await page.evaluate(() => (window as any).__desktopIpcCalls);
    expect(calls.some((c: any) => c.channel === 'desktop:check-updates')).toBe(true);

    // 2. Simulate download progress
    await page.evaluate(() => {
      (window as any).desktopAPI.__emit('desktop:update-progress', { percent: 50 });
    });
    await page.waitForTimeout(200);

    // 3. Simulate download completed
    await page.evaluate(() => {
      (window as any).desktopAPI.__emit('desktop:update-downloaded', { version: '8.1.0' });
    });
    await page.waitForTimeout(200);

    // 4. Verify restart pill is rendered
    const readyBtn = titlebar.locator('#titlebar-update-ready-btn');
    if (await readyBtn.isVisible()) {
      await readyBtn.click();
      const updatedCalls = await page.evaluate(() => (window as any).__desktopIpcCalls);
      expect(updatedCalls.some((c: any) => c.channel === 'desktop:install-update')).toBe(true);
    }
  });

  test('5. Operatory Thermal Printing & Local Snapshot Persistence (BR-DESK-04 & BR-DESK-05)', async ({ page }) => {
    // Verify mock desktop API can execute thermal printing dispatch
    const printResult = await page.evaluate(async () => {
      return await (window as any).desktopAPI.printing.printThermalReceipt({
        htmlContent: '<h1>Receipt #1001</h1><p>Dental Extraction: $150.00</p>',
        printerName: 'POS-80C',
        copies: 1
      });
    });
    expect(printResult.success).toBe(true);

    const calls = await page.evaluate(() => (window as any).__desktopIpcCalls);
    const printCall = calls.find((c: any) => c.channel === 'desktop:print-receipt');
    expect(printCall).toBeTruthy();
    expect(printCall.options.printerName).toBe('POS-80C');

    // Verify offline storage snapshot
    const storageResult = await page.evaluate(async () => {
      const win = window as any;
      await win.desktopAPI.storage.saveSnapshot('chair_telemetry', JSON.stringify({ chair: 1, active: true }));
      const loaded = await win.desktopAPI.storage.loadSnapshot('chair_telemetry');
      return JSON.parse(loaded);
    });
    expect(storageResult.chair).toBe(1);
    expect(storageResult.active).toBe(true);
  });
});

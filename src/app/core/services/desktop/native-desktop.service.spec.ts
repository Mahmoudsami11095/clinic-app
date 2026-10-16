import { TestBed } from '@angular/core/testing';
import { NativeDesktopService } from './native-desktop.service';

describe('NativeDesktopService', () => {
  let service: NativeDesktopService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [NativeDesktopService]
    });
    service = TestBed.inject(NativeDesktopService);
  });

  it('should be created successfully', () => {
    expect(service).toBeTruthy();
  });

  it('should have initial reactive signals defined', () => {
    expect(service.isDesktop).toBeDefined();
    expect(service.platform).toBeDefined();
    expect(service.isMaximized()).toBeFalse();
    expect(service.isPrivacyVeilActive()).toBeFalse();
    expect(service.spotlightTriggerCounter()).toBe(0);
    expect(service.voiceScribeTriggerCounter()).toBe(0);
  });

  it('should dismiss privacy veil when requested', () => {
    service.isPrivacyVeilActive.set(true);
    expect(service.isPrivacyVeilActive()).toBeTrue();

    service.dismissPrivacyVeil();
    expect(service.isPrivacyVeilActive()).toBeFalse();
  });

  it('should execute window minimize, maximize, close gracefully without bridge', async () => {
    await expectAsync(service.minimize()).toBeResolved();
    await expectAsync(service.maximize()).toBeResolved();
    await expectAsync(service.close()).toBeResolved();
  });

  it('should return empty printer list gracefully in web browser context', async () => {
    const printers = await service.getPrinters();
    expect(Array.isArray(printers)).toBeTrue();
  });

  it('should return system info gracefully when bridge is not attached', async () => {
    const info = await service.getSystemInfo();
    expect(info).toBeNull();
  });

  it('should save and load offline snapshot in browser fallback mode', async () => {
    const key = 'test_operatory_snapshot';
    const data = { chairId: 'ch-1', patientName: 'Nour El-Din', status: 'occupied' };

    const saveSuccess = await service.saveOfflineSnapshot(key, data);
    expect(saveSuccess).toBeTrue();

    const loaded = await service.loadOfflineSnapshot<typeof data>(key);
    expect(loaded).toEqual(data);

    const clearSuccess = await service.clearOfflineSnapshot(key);
    expect(clearSuccess).toBeTrue();

    const afterClear = await service.loadOfflineSnapshot(key);
    expect(afterClear).toBeNull();
  });

  it('should return null for getOfflineStorageInfo when bridge is absent', async () => {
    const info = await service.getOfflineStorageInfo();
    expect(info).toBeNull();
  });

  // --- Silent Background Auto-Updater (BR-DESK-07) Tests ---

  it('should initialize updater signals with default values', () => {
    expect(service.isUpdateChecking()).toBeFalse();
    expect(service.isUpdateAvailable()).toBeFalse();
    expect(service.isUpdateDownloading()).toBeFalse();
    expect(service.isUpdateDownloaded()).toBeFalse();
    expect(service.updateProgressPercent()).toBe(0);
    expect(service.availableUpdateVersion()).toBeNull();
  });

  it('should return false for checkForUpdates and downloadUpdate in browser fallback context', async () => {
    const checkRes = await service.checkForUpdates();
    expect(checkRes).toBeFalse();
    expect(service.isUpdateChecking()).toBeFalse();

    const dlRes = await service.downloadUpdate();
    expect(dlRes).toBeFalse();
    expect(service.isUpdateDownloading()).toBeFalse();

    await expectAsync(service.installUpdate()).toBeResolved();
  });

  it('should handle updater bridge interactions when bridge is provided', async () => {
    let progressCb: ((p: { percent: number }) => void) | undefined;
    let downloadedCb: ((i: { version: string }) => void) | undefined;

    const mockBridge = {
      isDesktop: true,
      platform: 'win32',
      updater: {
        checkForUpdates: jasmine.createSpy('checkForUpdates').and.resolveTo({
          updateAvailable: true,
          version: '8.1.0',
          releaseNotes: 'Performance enhancements'
        }),
        downloadUpdate: jasmine.createSpy('downloadUpdate').and.resolveTo({ success: true }),
        installUpdate: jasmine.createSpy('installUpdate').and.resolveTo(),
        onUpdateProgress: jasmine.createSpy('onUpdateProgress').and.callFake((cb) => {
          progressCb = cb;
          return () => {};
        }),
        onUpdateDownloaded: jasmine.createSpy('onUpdateDownloaded').and.callFake((cb) => {
          downloadedCb = cb;
          return () => {};
        })
      }
    };

    (service as any).bridge = mockBridge;
    (service as any).initializeBridgeListeners();

    const hasUpdate = await service.checkForUpdates();
    expect(hasUpdate).toBeTrue();
    expect(service.isUpdateAvailable()).toBeTrue();
    expect(service.availableUpdateVersion()).toBe('8.1.0');

    const downloadSuccess = await service.downloadUpdate();
    expect(downloadSuccess).toBeTrue();

    // Trigger simulated progress
    progressCb?.({ percent: 45 });
    expect(service.isUpdateDownloading()).toBeTrue();
    expect(service.updateProgressPercent()).toBe(45);

    // Trigger simulated download complete
    downloadedCb?.({ version: '8.1.0' });
    expect(service.isUpdateDownloading()).toBeFalse();
    expect(service.isUpdateDownloaded()).toBeTrue();
    expect(service.updateProgressPercent()).toBe(100);

    await service.installUpdate();
    expect(mockBridge.updater.installUpdate).toHaveBeenCalled();
  });
});

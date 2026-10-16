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
});

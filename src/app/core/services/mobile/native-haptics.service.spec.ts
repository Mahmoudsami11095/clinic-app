import { TestBed } from '@angular/core/testing';
import { NativeHapticsService } from './native-haptics.service';

describe('NativeHapticsService', () => {
  let service: NativeHapticsService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [NativeHapticsService]
    });
    service = TestBed.inject(NativeHapticsService);
  });

  it('should be created and verify availability', () => {
    expect(service).toBeTruthy();
    expect(typeof service.isAvailable()).toBe('boolean');
  });

  it('should trigger impact without throwing errors', async () => {
    await expectAsync(service.impact('light')).toBeResolved();
    await expectAsync(service.impact('medium')).toBeResolved();
    await expectAsync(service.impact('heavy')).toBeResolved();
  });

  it('should trigger notification without throwing errors', async () => {
    await expectAsync(service.notification('success')).toBeResolved();
    await expectAsync(service.notification('warning')).toBeResolved();
    await expectAsync(service.notification('error')).toBeResolved();
  });

  it('should trigger selectionChanged without throwing errors', async () => {
    await expectAsync(service.selectionChanged()).toBeResolved();
  });
});

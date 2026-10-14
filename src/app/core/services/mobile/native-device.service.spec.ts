import { TestBed } from '@angular/core/testing';
import { NativeDeviceService } from './native-device.service';

describe('NativeDeviceService', () => {
  let service: NativeDeviceService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [NativeDeviceService]
    });
    service = TestBed.inject(NativeDeviceService);
  });

  it('should be created and default to web platform in test runner', () => {
    expect(service).toBeTruthy();
    expect(service.isNative()).toBeFalse();
    expect(service.platform()).toBe('web');
    expect(service.isIOS()).toBeFalse();
    expect(service.isAndroid()).toBeFalse();
  });

  it('should toggle and dismiss HIPAA privacy veil', () => {
    expect(service.isPrivacyVeilActive()).toBeFalse();
    service.isPrivacyVeilActive.set(true);
    expect(service.isPrivacyVeilActive()).toBeTrue();
    service.dismissPrivacyVeil();
    expect(service.isPrivacyVeilActive()).toBeFalse();
  });
});

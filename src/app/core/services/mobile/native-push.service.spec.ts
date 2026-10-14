import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { NativePushService } from './native-push.service';

describe('NativePushService', () => {
  let service: NativePushService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [NativePushService]
    });
    service = TestBed.inject(NativePushService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created and check plugin availability', () => {
    expect(service).toBeTruthy();
    expect(typeof service.isAvailable()).toBe('boolean');
    expect(service.deviceToken()).toBeNull();
  });

  it('should handle requestPermissionsAndRegister gracefully on web', async () => {
    service.isAvailable.set(false);
    spyOn<any>(service, 'fallbackWebNotificationPermission').and.returnValue(Promise.resolve(true));

    const result = await service.requestPermissionsAndRegister();
    expect(result).toBeTrue();
  });

  it('should synchronize device token with backend', () => {
    service['syncTokenWithBackend']('test-token-123');

    const req = httpMock.expectOne(r => r.url.includes('/mobile/devices/register'));
    expect(req.request.method).toBe('POST');
    expect(req.request.body.deviceToken).toBe('test-token-123');
    req.flush({ success: true });
  });
});

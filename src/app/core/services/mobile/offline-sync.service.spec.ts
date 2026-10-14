import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { OfflineSyncService } from './offline-sync.service';
import * as localForage from 'localforage';

describe('OfflineSyncService', () => {
  let service: OfflineSyncService;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    // Clear mock DB before each test
    const store = localForage.createInstance({ name: 'smartClinicDB', storeName: 'syncQueue' });
    await store.clear();

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [OfflineSyncService]
    });
    
    service = TestBed.inject(OfflineSyncService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should initialize and detect online status', () => {
    expect(service).toBeTruthy();
    expect(service.isOnline()).toBeTrue(); // defaults to true in test runner unless mocked
  });

  it('should queue a POST request when offline', fakeAsync(async () => {
    service.isOnline.set(false);
    
    await service.queueRequest('/api/test', 'POST', { data: 123 });
    tick(100);

    expect(service.pendingQueueSize()).toBe(1);
    
    // No HTTP request should be made
    httpMock.expectNone('/api/test');
  }));

  it('should process queue when coming back online', fakeAsync(async () => {
    service.isOnline.set(false);
    await service.queueRequest('/api/sync-me', 'PUT', { status: 'completed' });
    tick(100);
    expect(service.pendingQueueSize()).toBe(1);

    // Simulate coming online
    service.isOnline.set(true);
    service.processQueue();
    tick(100);

    const req = httpMock.expectOne('/api/sync-me');
    expect(req.request.method).toBe('PUT');
    expect(req.request.headers.get('X-Offline-Synced')).toBe('true');
    req.flush({ success: true });

    tick(100);
    expect(service.pendingQueueSize()).toBe(0);
  }));
});

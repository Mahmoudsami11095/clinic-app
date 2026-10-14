import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { offlineSyncInterceptor } from './offline-sync.interceptor';
import { OfflineSyncService } from '../services/mobile/offline-sync.service';

describe('offlineSyncInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let mockSyncService: any;

  beforeEach(() => {
    mockSyncService = {
      isOnline: signal(true),
      queueRequest: jasmine.createSpy('queueRequest')
    };

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([offlineSyncInterceptor])),
        provideHttpClientTesting(),
        { provide: OfflineSyncService, useValue: mockSyncService }
      ]
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should pass through GET requests untouched', () => {
    http.get('/api/materials').subscribe();

    const req = httpMock.expectOne('/api/materials');
    expect(req.request.method).toBe('GET');
    req.flush([]);
    expect(mockSyncService.queueRequest).not.toHaveBeenCalled();
  });

  it('should queue request immediately and return 200 when already offline', (done) => {
    mockSyncService.isOnline.set(false);

    http.post('/api/materials', { name: 'Latex Gloves' }).subscribe(res => {
      expect(res).toBeTruthy();
      expect(mockSyncService.queueRequest).toHaveBeenCalledWith('/api/materials', 'POST', { name: 'Latex Gloves' });
      done();
    });

    httpMock.expectNone('/api/materials');
  });

  it('should catch network disconnection (status 0) and queue for sync', (done) => {
    mockSyncService.isOnline.set(true);

    http.put('/api/appointments/1', { status: 'completed' }).subscribe(res => {
      expect(res).toBeTruthy();
      expect(mockSyncService.queueRequest).toHaveBeenCalled();
      done();
    });

    const req = httpMock.expectOne('/api/appointments/1');
    req.error(new ProgressEvent('error'), { status: 0, statusText: 'Unknown Error' });
  });
});

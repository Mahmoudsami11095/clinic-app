import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { ToastrService } from 'ngx-toastr';
import { OfflineService, PendingAction } from './offline.service';

describe('OfflineService - Level 1 (SW/Unit)', () => {
  let service: OfflineService;
  let httpTesting: HttpTestingController;
  let toastrSpy: jasmine.SpyObj<ToastrService>;

  beforeEach(() => {
    toastrSpy = jasmine.createSpyObj('ToastrService', ['success', 'warning', 'info', 'error']);

    TestBed.configureTestingModule({
      providers: [
        OfflineService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ToastrService, useValue: toastrSpy }
      ]
    });

    service = TestBed.inject(OfflineService);
    httpTesting = TestBed.inject(HttpTestingController);
    localStorage.clear();
  });

  afterEach(() => {
    httpTesting.verify();
    localStorage.clear();
  });

  it('1. should initialize with online state', () => {
    expect(service.isOnline()).toBeTrue();
    expect(service.isReconnected()).toBeFalse();
  });

  it('2. should save and retrieve cache snapshots', () => {
    const testData = [{ id: 'p1', name: 'Nourhan Tarek' }];
    service.saveSnapshot('patients', testData);

    const retrieved = service.getSnapshot<any[]>('patients');
    expect(retrieved).toEqual(testData);
  });

  it('3. should return null for non-existent snapshot', () => {
    const nonExistent = service.getSnapshot('unknown_key');
    expect(nonExistent).toBeNull();
  });

  it('4. should queue offline actions and store in localStorage', () => {
    service.queueAction({
      url: '/api/patients',
      method: 'POST',
      body: { name: 'Offline Patient' },
      label: 'Create Patient'
    });

    const pending = service.pendingActions();
    expect(pending.length).toBe(1);
    expect(pending[0].url).toBe('/api/patients');
    expect(pending[0].method).toBe('POST');
    expect(toastrSpy.info).toHaveBeenCalled();
  });

  it('5. should flush pending action queue when online', async () => {
    service.queueAction({
      url: '/api/appointments',
      method: 'POST',
      body: { patientId: 'p123' }
    });

    expect(service.pendingActions().length).toBe(1);

    const flushPromise = service.flushPendingQueue();

    const req = httpTesting.expectOne('/api/appointments');
    expect(req.request.method).toBe('POST');
    req.flush({ message: 'Created' });

    await flushPromise;

    expect(service.pendingActions().length).toBe(0);
    expect(toastrSpy.success).toHaveBeenCalledWith('All offline changes synchronized successfully!', 'Sync Complete');
  });
});

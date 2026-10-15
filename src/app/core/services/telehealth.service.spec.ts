import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { TelehealthService, TelehealthSessionDto } from './telehealth.service';
import { AuthService } from '../auth/auth.service';
import { environment } from '../../../environments/environment';

describe('TelehealthService - Level 1 (SW/Unit)', () => {
  let service: TelehealthService;
  let httpTesting: HttpTestingController;
  let authSpy: jasmine.SpyObj<AuthService>;

  beforeEach(() => {
    authSpy = jasmine.createSpyObj('AuthService', ['getToken', 'isAuthenticated']);
    authSpy.getToken.and.returnValue('mock-token-xyz');
    authSpy.isAuthenticated.and.returnValue(true);

    TestBed.configureTestingModule({
      providers: [
        TelehealthService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: authSpy }
      ]
    });

    service = TestBed.inject(TelehealthService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should initialize with default states', () => {
    expect(service.connectionStatus()).toBe('idle');
    expect(service.roomToken()).toBe('');
    expect(service.activeSession()).toBeNull();
    expect(service.isAudioMuted()).toBeFalse();
    expect(service.isVideoOff()).toBeFalse();
    expect(service.isOdontogramVisible()).toBeTrue();
    expect(service.callDurationSeconds()).toBe(0);
  });

  it('should toggle media controls and return new values', () => {
    expect(service.toggleAudio()).toBeTrue();
    expect(service.isAudioMuted()).toBeTrue();

    expect(service.toggleVideo()).toBeTrue();
    expect(service.isVideoOff()).toBeTrue();

    expect(service.toggleOdontogram()).toBeFalse();
    expect(service.isOdontogramVisible()).toBeFalse();
  });

  it('should format a valid WhatsApp invitation deep link', () => {
    const link = service.generateWhatsAppInvite(
      '+20 100 987 6543',
      'abc123token',
      'Ahmed Hassan',
      'Dr. Sarah'
    );

    expect(link).toContain('https://wa.me/201009876543?text=');
    expect(link).toContain('Ahmed%20Hassan');
    expect(link).toContain('abc123token');
    expect(link).toContain('Dr.%20Sarah');
  });

  it('should create session and set room token on API success', fakeAsync(() => {
    const mockSession: TelehealthSessionDto = {
      id: 'sess-101',
      clinicId: 'clinic-1',
      appointmentId: 'apt-1',
      doctorId: 'doc-1',
      doctorName: 'Dr. Sarah',
      patientId: 'pat-1',
      patientName: 'Ahmed Hassan',
      roomToken: 'token-999',
      status: 'WaitingForPatient',
      durationSeconds: 0,
      createdAtUtc: new Date().toISOString()
    };

    let resolvedSession: TelehealthSessionDto | null = null;
    service.createSession('pat-1', 'Ahmed Hassan', 'apt-1').then(res => {
      resolvedSession = res;
    });

    const req = httpTesting.expectOne(`${environment.apiUrl}/telehealth/sessions`);
    expect(req.request.method).toBe('POST');
    req.flush(mockSession);
    tick();

    expect(resolvedSession as TelehealthSessionDto | null).toEqual(mockSession);
    expect(service.roomToken()).toBe('token-999');
    expect(service.connectionStatus()).toBe('waiting');
  }));

  it('should track call duration interval accurately', fakeAsync(() => {
    service.startDurationTimer();
    expect(service.callDurationSeconds()).toBe(0);

    tick(3000);
    expect(service.callDurationSeconds()).toBe(3);

    service.endConsultation('Call completed.');
    expect(service.connectionStatus()).toBe('completed');
  }));
});

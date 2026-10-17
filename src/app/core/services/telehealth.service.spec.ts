import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import {
  TelehealthService,
  TelehealthSessionDto,
  SpecialistOption,
  ViewportSyncDto,
  SharedAnnotationDto,
  TelehealthMedicationItem,
  TelehealthPrescriptionRecord,
  TelehealthAuditDossier,
  VerifyAuditSealResponse
} from './telehealth.service';
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
    expect(service.activeViewType()).toBe('none');
    expect(service.activeAnnotations().length).toBe(0);
    expect(service.issuedPrescriptions().length).toBe(0);
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

  it('should create session with invited specialist (BR-TELE-01)', fakeAsync(() => {
    const specialist: SpecialistOption = {
      id: 'spec-ortho-01',
      name: 'Dr. Mona Fikry',
      specialty: 'Orthodontics',
      clinicBranch: 'Downtown Heliopolis'
    };

    const mockSession: TelehealthSessionDto = {
      id: 'sess-spec-102',
      clinicId: 'clinic-1',
      appointmentId: 'apt-2',
      doctorId: 'doc-1',
      doctorName: 'Dr. Attending',
      patientId: 'pat-2',
      patientName: 'Laila Mahmoud',
      roomToken: 'token-ortho-888',
      status: 'WaitingForPatient',
      durationSeconds: 0,
      invitedSpecialistId: 'spec-ortho-01',
      invitedSpecialistName: 'Dr. Mona Fikry',
      invitedSpecialty: 'Orthodontics',
      createdAtUtc: new Date().toISOString()
    };

    let resolvedSession: TelehealthSessionDto | null = null;
    service.createSession('pat-2', 'Laila Mahmoud', 'apt-2', specialist).then(res => {
      resolvedSession = res;
    });

    const req = httpTesting.expectOne(`${environment.apiUrl}/telehealth/sessions`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body.invitedSpecialistName).toBe('Dr. Mona Fikry');
    req.flush(mockSession);
    tick();

    expect(resolvedSession as TelehealthSessionDto | null).toEqual(mockSession);
    expect(service.selectedSpecialist()).toEqual(specialist);
  }));

  it('should broadcast viewport synchronization and record active state (BR-TELE-02)', fakeAsync(() => {
    service.roomToken.set('token-view-sync');
    const sync: ViewportSyncDto = {
      roomToken: 'token-view-sync',
      viewType: 'Mesh3D',
      cameraX: 12.0,
      cameraY: -5.0,
      cameraZ: 25.0,
      rotationPitch: 0.1,
      rotationYaw: -0.4,
      zoomFactor: 1.5,
      activeAssetId: 'STL-CROWN-36'
    };

    service.broadcastViewportSync(sync);
    expect(service.lastViewportSync()).toEqual(sync);

    const req = httpTesting.expectOne(`${environment.apiUrl}/telehealth/sessions/token-view-sync/sync-viewport`);
    expect(req.request.method).toBe('POST');
    req.flush({ status: 'Synchronized' });
    tick();
  }));

  it('should broadcast shared annotations and update signal list (BR-TELE-02)', () => {
    const ann: SharedAnnotationDto = {
      roomToken: 'token-ann-1',
      annotationId: 'ann-1',
      senderRole: 'Doctor',
      toolType: 'caliper',
      coordinates: [40, 60],
      textLabel: 'Marginal gap',
      measurementValueMm: 1.8
    };

    service.broadcastSharedAnnotation(ann);
    expect(service.activeAnnotations().length).toBe(1);
    expect(service.activeAnnotations()[0].textLabel).toBe('Marginal gap');
    expect(service.activeAnnotations()[0].measurementValueMm).toBe(1.8);
  });

  it('should issue in-call electronic prescription via API (BR-TELE-04)', fakeAsync(() => {
    service.roomToken.set('token-rx-test');

    const medications: TelehealthMedicationItem[] = [
      { drugName: 'Augmentin 1g', dosage: '1 tablet', frequency: 'BID', duration: '7 days', instructions: 'With meals' }
    ];

    const mockRx: TelehealthPrescriptionRecord = {
      id: 'rx-saved-01',
      rxNumber: 'RX-TELE-202610-001',
      doctorId: 'doc-1',
      doctorName: 'Dr. Attending Doctor',
      patientId: 'pat-1',
      patientName: 'Ahmed Hassan',
      issuedAtUtc: new Date().toISOString(),
      medications,
      digitalSignature: 'SIG-DR-DOC1-ABC',
      verificationUrl: '/portal/prescriptions/verify?rx=RX-TELE-202610-001',
      dispatchChannel: 'WhatsApp',
      sha256Digest: 'urn:rx:sha256:abc12345'
    };

    let resultRx: TelehealthPrescriptionRecord | null = null;
    service.issueTelePrescription('pat-1', 'Ahmed Hassan', medications, 'Take after food', 'WhatsApp').subscribe(rx => {
      resultRx = rx;
    });

    const req = httpTesting.expectOne(`${environment.apiUrl}/telehealth/sessions/token-rx-test/tele-prescription`);
    expect(req.request.method).toBe('POST');
    req.flush(mockRx);
    tick();

    expect(resultRx as TelehealthPrescriptionRecord | null).toEqual(mockRx);
    expect(service.issuedPrescriptions().length).toBe(1);
    expect(service.issuedPrescriptions()[0].rxNumber).toBe('RX-TELE-202610-001');
  }));

  it('should fetch audit dossier and verify cryptographic seal (BR-TELE-03)', fakeAsync(() => {
    const mockDossier: TelehealthAuditDossier = {
      roomToken: 'token-audit-123',
      doctorName: 'Dr. Attending Doctor',
      patientName: 'Ahmed Hassan',
      status: 'Completed',
      durationSeconds: 900,
      sha256AuditSeal: 'urn:telehealth:sha256:4b91f03d6e1a90c418728b7fe658ac37',
      isSha256Verified: true,
      totalEventsLogged: 3,
      events: [
        { timestampUtc: new Date().toISOString(), participantId: 'doc-1', participantName: 'Dr. Attending', role: 'Doctor', eventType: 'RoomCreated' }
      ],
      prescriptions: []
    };

    let loadedDossier: TelehealthAuditDossier | null = null;
    service.fetchAuditDossier('token-audit-123').subscribe(d => {
      loadedDossier = d;
    });

    const req1 = httpTesting.expectOne(`${environment.apiUrl}/telehealth/sessions/token-audit-123/audit-dossier`);
    req1.flush(mockDossier);
    tick();

    expect(loadedDossier as TelehealthAuditDossier | null).toEqual(mockDossier);
    expect(service.auditDossier()).toEqual(mockDossier);

    const mockVerify: VerifyAuditSealResponse = {
      roomToken: 'token-audit-123',
      currentSeal: 'urn:telehealth:sha256:4b91f03d6e1a90c418728b7fe658ac37',
      calculatedSeal: 'urn:telehealth:sha256:4b91f03d6e1a90c418728b7fe658ac37',
      isValid: true,
      verifiedAtUtc: new Date().toISOString()
    };

    let verifyResult: VerifyAuditSealResponse | null = null;
    service.verifyAuditSeal('token-audit-123').subscribe(v => {
      verifyResult = v;
    });

    const req2 = httpTesting.expectOne(`${environment.apiUrl}/telehealth/sessions/token-audit-123/verify-audit`);
    req2.flush(mockVerify);
    tick();

    expect(verifyResult as VerifyAuditSealResponse | null).toEqual(mockVerify);
    expect(verifyResult!.isValid).toBeTrue();
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

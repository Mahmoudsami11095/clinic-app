import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { TelehealthRoomComponent } from './telehealth-room.component';
import { TelehealthService, SpecialistOption, TelehealthPrescriptionRecord } from '../../core/services/telehealth.service';
import { provideTranslateService } from '@ngx-translate/core';

describe('TelehealthRoomComponent - Level 1 (SW/Unit)', () => {
  let component: TelehealthRoomComponent;
  let fixture: ComponentFixture<TelehealthRoomComponent>;
  let telehealthService: TelehealthService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TelehealthRoomComponent],
      providers: [
        TelehealthService,
        provideHttpClient(),
        provideHttpClientTesting(),
        provideTranslateService(),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParamMap: {
                get: (key: string) => key === 'token' ? 'test-room-token-123' : null
              }
            }
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(TelehealthRoomComponent);
    component = fixture.componentInstance;
    telehealthService = TestBed.inject(TelehealthService);
    fixture.detectChanges();
  });

  it('should create component with query param token initialized', () => {
    expect(component).toBeTruthy();
    expect(telehealthService.roomToken()).toBe('test-room-token-123');
  });

  it('should toggle audio and video via service', () => {
    expect(telehealthService.isAudioMuted()).toBeFalse();
    component.toggleAudio();
    expect(telehealthService.isAudioMuted()).toBeTrue();

    expect(telehealthService.isVideoOff()).toBeFalse();
    component.toggleVideo();
    expect(telehealthService.isVideoOff()).toBeTrue();
  });

  it('should toggle odontogram dual-view', () => {
    expect(component.showOdontogram()).toBeTrue();
    component.toggleOdontogramOverlay();
    expect(component.showOdontogram()).toBeFalse();
  });

  it('should format duration as MM:SS', () => {
    telehealthService.callDurationSeconds.set(0);
    expect(component.formattedDuration()).toBe('00:00');

    telehealthService.callDurationSeconds.set(65);
    expect(component.formattedDuration()).toBe('01:05');

    telehealthService.callDurationSeconds.set(360);
    expect(component.formattedDuration()).toBe('06:00');
  });

  it('should generate WhatsApp invite and open window', () => {
    spyOn(window, 'open');
    component.patientName.set('Omar Farooq');
    component.patientPhone.set('+201112223334');

    component.inviteViaWhatsApp();

    expect(window.open).toHaveBeenCalledWith(
      jasmine.stringMatching(/https:\/\/wa\.me\/201112223334\?text=/),
      '_blank'
    );
  });

  it('should conclude consultation on endConsultation', () => {
    component.endConsultation();
    expect(telehealthService.connectionStatus()).toBe('completed');
  });

  // ── Release v12.0.0 Feature Tests (BR-TELE-01..04) ──

  it('should invite multi-clinic specialist (BR-TELE-01)', () => {
    const spec: SpecialistOption = {
      id: 'spec-ortho-01',
      name: 'Dr. Mona Fikry',
      specialty: 'Orthodontics',
      clinicBranch: 'Downtown Heliopolis'
    };

    component.isSpecialistMenuOpen.set(true);
    component.inviteSpecialist(spec);

    expect(telehealthService.selectedSpecialist()).toEqual(spec);
    expect(component.isSpecialistMenuOpen()).toBeFalse();
  });

  it('should switch collaborative co-viewer mode (BR-TELE-02)', () => {
    spyOn(telehealthService, 'setCoViewerMode').and.callThrough();

    component.setCoViewerMode('mesh3d');
    expect(telehealthService.setCoViewerMode).toHaveBeenCalledWith('mesh3d');
    expect(telehealthService.activeViewType()).toBe('mesh3d');

    component.setCoViewerMode('radiograph');
    expect(telehealthService.activeViewType()).toBe('radiograph');

    component.setCoViewerMode('none');
    expect(telehealthService.activeViewType()).toBe('none');
  });

  it('should broadcast caliper measurement and shared annotation pin (BR-TELE-02)', () => {
    spyOn(telehealthService, 'broadcastSharedAnnotation').and.callThrough();

    component.broadcastCaliperMeasurement();
    expect(telehealthService.broadcastSharedAnnotation).toHaveBeenCalled();
    expect(telehealthService.activeAnnotations().length).toBe(1);
    expect(telehealthService.activeAnnotations()[0].toolType).toBe('caliper');

    component.addAnnotationPin();
    expect(telehealthService.activeAnnotations().length).toBe(2);
    expect(telehealthService.activeAnnotations()[1].toolType).toBe('probe');
  });

  it('should manage staged medications and submit in-call e-prescription (BR-TELE-04)', fakeAsync(() => {
    const mockRx: TelehealthPrescriptionRecord = {
      id: 'rx-test-01',
      rxNumber: 'RX-TELE-202610-099',
      doctorId: 'doc-1',
      doctorName: 'Dr. Attending Doctor',
      patientId: 'pat-505',
      patientName: 'Ahmed Hassan',
      issuedAtUtc: new Date().toISOString(),
      medications: [
        { drugName: 'Ibuprofen 400mg', dosage: '1 tablet', frequency: 'TDS PRN', duration: '3 days', instructions: 'Take after meals' }
      ],
      digitalSignature: 'SIG-DR-TEST',
      verificationUrl: '/portal/prescriptions/verify?rx=RX-TELE-202610-099',
      dispatchChannel: 'WhatsApp',
      sha256Digest: 'urn:rx:sha256:abc'
    };
    spyOn(telehealthService, 'issueTelePrescription').and.returnValue(of(mockRx));

    component.togglePrescriptionDrawer();
    expect(component.isPrescriptionModalOpen()).toBeTrue();

    component.addMedicationPreset(component.medicationPresets[2]); // Ibuprofen
    expect(component.stagedMedications().length).toBe(2);

    component.removeStagedMedication(0);
    expect(component.stagedMedications().length).toBe(1);

    component.submitTelePrescription();
    tick();

    expect(telehealthService.issueTelePrescription).toHaveBeenCalled();
    expect(component.isPrescriptionModalOpen()).toBeFalse();
  }));

  it('should verify cryptographic audit seal and display verified status (BR-TELE-03)', fakeAsync(() => {
    spyOn(telehealthService, 'verifyAuditSeal').and.returnValue(of({
      roomToken: 'test-room-token-123',
      currentSeal: 'urn:telehealth:sha256:mock',
      calculatedSeal: 'urn:telehealth:sha256:mock',
      isValid: true,
      verifiedAtUtc: new Date().toISOString()
    }));

    component.toggleAuditDossier();
    expect(component.isAuditModalOpen()).toBeTrue();
    expect(component.isSealVerified()).toBeFalse();

    component.verifyAuditIntegrity();
    tick();

    expect(telehealthService.verifyAuditSeal).toHaveBeenCalled();
    expect(component.isSealVerified()).toBeTrue();
  }));
});

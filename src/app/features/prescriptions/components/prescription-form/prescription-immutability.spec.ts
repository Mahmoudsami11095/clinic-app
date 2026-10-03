import { TestBed, ComponentFixture } from '@angular/core/testing';
import { PrescriptionFormComponent } from './prescription-form.component';
import { PrescriptionService } from '../../services/prescription.service';
import { PatientService } from '../../../patients/services/patient.service';
import { AllergyConflictService } from '../../../../core/services/allergy-conflict.service';
import { PediatricSafetyService } from '../../../../core/services/pediatric-safety.service';
import { LanguageService } from '../../../../core/i18n/language.service';
import { ToastrService } from 'ngx-toastr';
import { of } from 'rxjs';
import { signal } from '@angular/core';
import { AppointmentWithDetails } from '../../../appointments/models/appointment.model';
import { Prescription } from '../../models/prescription.model';

describe('BR-RX-02: Prescription Immutability & Audit Lock', () => {
  let component: PrescriptionFormComponent;
  let mockPrescriptionService: any;
  let mockToastr: any;

  const mockAppointment: AppointmentWithDetails = {
    id: 'appt-100',
    patientId: 'pat-100',
    patientName: 'Kareem Ahmed',
    doctorId: 'doc-100',
    doctorName: 'Dr. Mahmoud Samy',
    date: '2026-10-03T10:00:00Z',
    type: 'Dental Consultation',
    status: 'completed',
    notes: 'Checkup'
  };

  const mockFinalizedPrescription: Prescription = {
    id: 'rx-final-001',
    appointmentId: 'appt-100',
    patientId: 'pat-100',
    doctorId: 'doc-100',
    date: '2026-10-03T10:30:00Z',
    isFinalized: true,
    status: 'finalized',
    finalizedAt: '2026-10-03T10:30:00Z',
    digitalSignature: 'Digitally Signed by Dr. Mahmoud Samy on 2026-10-03 (Verified)',
    medications: [
      { name: 'Amoxicillin 500mg', dosage: '1 cap', frequency: 'TID', duration: '7 days' }
    ],
    notes: 'Take after meals.'
  };

  const mockSupersededPrescription: Prescription = {
    id: 'rx-super-001',
    appointmentId: 'appt-100',
    patientId: 'pat-100',
    doctorId: 'doc-100',
    date: '2026-10-01T09:00:00Z',
    isFinalized: true,
    status: 'superseded',
    finalizedAt: '2026-10-01T09:00:00Z',
    digitalSignature: 'Digitally Signed by Dr. Mahmoud Samy',
    supersededById: 'rx-final-001',
    supersedeReason: 'Patient allergic intolerance to Penicillin class',
    medications: [
      { name: 'Augmentin 1g', dosage: '1 tab', frequency: 'BID', duration: '7 days' }
    ]
  };

  beforeEach(() => {
    mockToastr = {
      success: jasmine.createSpy('success'),
      error: jasmine.createSpy('error'),
      warning: jasmine.createSpy('warning')
    };

    mockPrescriptionService = {
      create: jasmine.createSpy('create').and.callFake((rx: any) => of({ message: 'Success', data: rx })),
      update: jasmine.createSpy('update').and.callFake((rx: any) => of({ message: 'Success', data: rx })),
      finalize: jasmine.createSpy('finalize').and.callFake((id: string) => of({
        ...mockFinalizedPrescription,
        id,
        isFinalized: true,
        status: 'finalized'
      })),
      supersede: jasmine.createSpy('supersede').and.callFake((id: string, payload: any) => of({
        message: 'Prescription superseded',
        data: {
          id: 'rx-revision-new',
          appointmentId: 'appt-100',
          patientId: 'pat-100',
          doctorId: 'doc-100',
          date: '2026-10-03T11:00:00Z',
          isFinalized: true,
          status: 'finalized',
          supersedesPrescriptionId: id,
          medications: payload.newMedications
        },
        original: {
          ...mockFinalizedPrescription,
          id,
          status: 'superseded',
          supersededById: 'rx-revision-new',
          supersedeReason: payload.reason
        }
      }))
    };

    TestBed.configureTestingModule({
      providers: [
        PrescriptionFormComponent,
        AllergyConflictService,
        PediatricSafetyService,
        { provide: PrescriptionService, useValue: mockPrescriptionService },
        { provide: PatientService, useValue: { getById: () => of(null) } },
        { provide: LanguageService, useValue: { translate: (k: string) => k, isLoaded: signal(true) } },
        { provide: ToastrService, useValue: mockToastr }
      ]
    });

    component = TestBed.inject(PrescriptionFormComponent);
    component.appointment = mockAppointment;
  });

  describe('Audit Lock State & Read-Only Enforcement', () => {
    it('should correctly detect finalized prescription as locked and read-only', () => {
      component.prescription = mockFinalizedPrescription;
      expect(component.isRxFinalized).toBeTrue();
      expect(component.isRxSuperseded).toBeFalse();
      expect(component.effectiveReadOnly).toBeTrue();
    });

    it('should correctly detect superseded prescription as archived', () => {
      component.prescription = mockSupersededPrescription;
      expect(component.isRxFinalized).toBeTrue();
      expect(component.isRxSuperseded).toBeTrue();
      expect(component.effectiveReadOnly).toBeTrue();
    });

    it('should allow editing when prescription is draft', () => {
      component.prescription = null; // New draft prescription
      expect(component.isRxFinalized).toBeFalse();
      expect(component.effectiveReadOnly).toBeFalse();
    });
  });

  describe('Superseding Revision Workflow', () => {
    beforeEach(() => {
      component.prescription = mockFinalizedPrescription;
      component.ngOnInit();
    });

    it('should open supersede modal and clone existing medications', () => {
      component.openSupersedeModal();

      expect(component.isSupersedeModalOpen()).toBeTrue();
      expect(component.supersedeMeds.length).toBe(1);
      expect(component.supersedeMeds[0].name).toBe('Amoxicillin 500mg');
      expect(component.supersedeReason).toBe('');
    });

    it('should reject supersede submission if clinical reason is shorter than 5 chars', () => {
      component.openSupersedeModal();
      component.supersedeReason = 'No';
      component.confirmSupersede();

      expect(mockToastr.warning).toHaveBeenCalled();
      expect(mockPrescriptionService.supersede).not.toHaveBeenCalled();
    });

    it('should reject supersede submission if no medications are specified', () => {
      component.openSupersedeModal();
      component.supersedeReason = 'Patient has nausea; switching medication';
      component.supersedeMeds = [{ name: '  ', dosage: '', frequency: '', duration: '' }];
      component.confirmSupersede();

      expect(mockToastr.warning).toHaveBeenCalled();
      expect(mockPrescriptionService.supersede).not.toHaveBeenCalled();
    });

    it('should successfully issue a superseding revision and emit saved event', () => {
      component.openSupersedeModal();
      component.supersedeReason = 'Patient developed mild skin rash; switched to Azithromycin';
      component.supersedeMeds = [
        { name: 'Azithromycin 500mg', dosage: '1 tab', frequency: 'Daily', duration: '3 days' }
      ];

      let emittedResult: any = null;
      component.saved.subscribe((res: any) => {
        emittedResult = res;
      });

      component.confirmSupersede();

      expect(mockPrescriptionService.supersede).toHaveBeenCalledWith('rx-final-001', {
        reason: 'Patient developed mild skin rash; switched to Azithromycin',
        newMedications: [
          { name: 'Azithromycin 500mg', dosage: '1 tab', frequency: 'Daily', duration: '3 days' }
        ],
        notes: 'Take after meals.'
      });

      expect(component.isSupersedeModalOpen()).toBeFalse();
      expect(mockToastr.success).toHaveBeenCalled();
      expect(emittedResult).toBeDefined();
      expect(emittedResult.id).toBe('rx-revision-new');
      expect(emittedResult.supersedesPrescriptionId).toBe('rx-final-001');
    });

    it('should allow modifying medications in supersede modal list', () => {
      component.openSupersedeModal();
      expect(component.supersedeMeds.length).toBe(1);

      component.addSupersedeMedication();
      expect(component.supersedeMeds.length).toBe(2);

      component.removeSupersedeMedication(0);
      expect(component.supersedeMeds.length).toBe(1);
    });
  });

  describe('Prescription Creation & Legal Signature Stamping', () => {
    it('should stamp isFinalized, status, and digital signature on new prescription save', () => {
      component.prescription = null;
      component.ngOnInit();
      component.medications = [
        { name: 'Ibuprofen 400mg', dosage: '1 tab', frequency: 'TID', duration: '3 days' }
      ];

      component.submit();

      expect(mockPrescriptionService.create).toHaveBeenCalledWith(jasmine.objectContaining({
        isFinalized: true,
        status: 'finalized',
        digitalSignature: jasmine.stringMatching(/Digitally Signed by Dr\. Mahmoud Samy/)
      }));
    });
  });
});

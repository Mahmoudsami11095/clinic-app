import { TestBed } from '@angular/core/testing';
import { PrescriptionFormComponent } from './prescription-form.component';
import { PrescriptionService } from '../../services/prescription.service';
import { PatientService } from '../../../patients/services/patient.service';
import { AllergyConflictService } from '../../../../core/services/allergy-conflict.service';
import { LanguageService } from '../../../../core/i18n/language.service';
import { ToastrService } from 'ngx-toastr';
import { AppointmentWithDetails } from '../../../appointments/models/appointment.model';
import { Patient } from '../../../patients/models/patient.model';
import { Prescription } from '../../models/prescription.model';
import { of } from 'rxjs';
import { signal } from '@angular/core';

describe('PrescriptionFormComponent - Allergy Conflict Interceptor (BR-RX-01)', () => {
  let component: PrescriptionFormComponent;
  let mockPrescriptionService: any;
  let mockPatientService: any;
  let mockToastr: any;
  let mockLangService: any;

  const mockPatientWithAllergies: Patient = {
    id: 'pat-1',
    firstName: 'Sara',
    lastName: 'Ahmed',
    contactNumber: '+20 100 999 8888',
    email: 'sara@example.com',
    dateOfBirth: '1995-04-12',
    gender: 'female',
    bloodGroup: 'O+',
    clinicId: 'c1',
    address: 'Zamalek, Cairo',
    registrationDate: '2026-01-01',
    allergies: 'Penicillin, Aspirin'
  };

  const mockPatientWithoutAllergies: Patient = {
    id: 'pat-2',
    firstName: 'Karim',
    lastName: 'Hassan',
    contactNumber: '+20 100 777 6666',
    email: 'karim@example.com',
    dateOfBirth: '1988-08-20',
    gender: 'male',
    bloodGroup: 'A+',
    clinicId: 'c1',
    address: 'Maadi, Cairo',
    registrationDate: '2026-01-01',
    allergies: 'None'
  };

  const mockAppointment: AppointmentWithDetails = {
    id: 'appt-101',
    patientId: 'pat-1',
    doctorId: 'doc-1',
    patientName: 'Sara Ahmed',
    doctorName: 'Dr. Mahmoud Sami',
    date: '2026-09-28T10:00:00Z',
    status: 'scheduled',
    type: 'Dental Checkup',
    notes: ''
  };

  beforeEach(() => {
    mockPrescriptionService = {
      create: jasmine.createSpy('create').and.returnValue(of({})),
      update: jasmine.createSpy('update').and.returnValue(of({}))
    };

    mockPatientService = {
      getById: jasmine.createSpy('getById').and.returnValue(of(mockPatientWithAllergies))
    };

    mockToastr = {
      success: jasmine.createSpy('success'),
      warning: jasmine.createSpy('warning'),
      error: jasmine.createSpy('error')
    };

    mockLangService = {
      translate: (key: string) => key,
      isLoaded: signal(true)
    };

    TestBed.configureTestingModule({
      providers: [
        PrescriptionFormComponent,
        AllergyConflictService,
        { provide: PrescriptionService, useValue: mockPrescriptionService },
        { provide: PatientService, useValue: mockPatientService },
        { provide: ToastrService, useValue: mockToastr },
        { provide: LanguageService, useValue: mockLangService }
      ]
    });

    component = TestBed.inject(PrescriptionFormComponent);
    component.appointment = mockAppointment;
    component.patient = mockPatientWithAllergies;
  });

  it('should initialize with patient allergies banner when allergies exist', () => {
    component.ngOnInit();
    expect(component.hasRecordedAllergies()).toBeTrue();
    expect(component.patientAllergiesStr()).toBe('Penicillin, Aspirin');
  });

  it('should reflect NKDA when patient has no known allergies', () => {
    component.patient = mockPatientWithoutAllergies;
    component.ngOnInit();
    expect(component.hasRecordedAllergies()).toBeFalse();
  });

  it('should detect real-time conflict when prescribing a beta-lactam for penicillin-allergic patient', () => {
    component.ngOnInit();
    const conflict = component.getMedConflict('Amoxicillin 500mg');
    expect(conflict).not.toBeNull();
    expect(conflict?.drugClass).toBe('Penicillins & Beta-Lactam Antibiotics');
    expect(conflict?.severity).toBe('critical');
  });

  it('should detect real-time conflict when prescribing NSAID for aspirin-allergic patient', () => {
    component.ngOnInit();
    const conflict = component.getMedConflict('Ibuprofen 400mg');
    expect(conflict).not.toBeNull();
    expect(conflict?.drugClass).toBe('NSAIDs & Salicylates (Aspirin/Ibuprofen)');
  });

  it('should return null when medication is safe for patient allergies', () => {
    component.ngOnInit();
    const conflict = component.getMedConflict('Paracetamol 500mg');
    expect(conflict).toBeNull();
  });

  describe('Submit Interceptor & Modal Override Workflow', () => {
    it('should intercept submission and open override modal when conflict is present', () => {
      component.ngOnInit();
      component.medications = [
        { name: 'Amoxicillin 500mg', dosage: '1 tab', frequency: 'TID', duration: '7 days' }
      ];

      component.submit();

      expect(component.isOverrideModalOpen()).toBeTrue();
      expect(component.activeConflicts().length).toBe(1);
      expect(component.activeConflicts()[0].drugClass).toBe('Penicillins & Beta-Lactam Antibiotics');
      expect(mockPrescriptionService.create).not.toHaveBeenCalled();
    });

    it('should save immediately without modal when prescribed medications have no allergy conflicts', () => {
      component.ngOnInit();
      component.medications = [
        { name: 'Paracetamol 500mg', dosage: '1 tab', frequency: 'PRN', duration: '3 days' }
      ];

      component.submit();

      expect(component.isOverrideModalOpen()).toBeFalse();
      expect(mockPrescriptionService.create).toHaveBeenCalled();
    });

    it('should close modal and NOT save when doctor clicks cancelOverride', () => {
      component.ngOnInit();
      component.medications = [
        { name: 'Amoxicillin 500mg', dosage: '1 tab', frequency: 'TID', duration: '7 days' }
      ];

      component.submit();
      expect(component.isOverrideModalOpen()).toBeTrue();

      component.cancelOverride();
      expect(component.isOverrideModalOpen()).toBeFalse();
      expect(component.activeConflicts().length).toBe(0);
      expect(mockPrescriptionService.create).not.toHaveBeenCalled();
    });

    it('should reject override if justification is empty or shorter than 5 characters', () => {
      component.ngOnInit();
      component.medications = [
        { name: 'Amoxicillin 500mg', dosage: '1 tab', frequency: 'TID', duration: '7 days' }
      ];

      component.submit();
      component.overrideReason = 'No'; // Too short (< 5 chars)
      component.confirmOverride();

      expect(mockToastr.warning).toHaveBeenCalled();
      expect(mockPrescriptionService.create).not.toHaveBeenCalled();
      expect(component.isOverrideModalOpen()).toBeTrue();
    });

    it('should append legal audit clause to notes and save when valid override justification is provided', () => {
      component.ngOnInit();
      component.medications = [
        { name: 'Augmentin 1g', dosage: '1 tab', frequency: 'BID', duration: '5 days' }
      ];
      component.notes = 'Take after meals.';

      component.submit();
      expect(component.isOverrideModalOpen()).toBeTrue();

      // Enter clinical override justification via chip or text
      component.setOverrideReason('Skin / allergy testing verified negative for beta-lactams');
      component.confirmOverride();

      expect(component.isOverrideModalOpen()).toBeFalse();
      expect(component.overrideApproved).toBeTrue();
      expect(mockPrescriptionService.create).toHaveBeenCalled();

      // Verify legal audit trail in notes
      expect(component.notes).toContain('[ALLERGY OVERRIDE AUDIT - BR-RX-01]');
      expect(component.notes).toContain('Dr. Mahmoud Sami');
      expect(component.notes).toContain('Skin / allergy testing verified negative for beta-lactams');
      expect(component.notes).toContain('Augmentin 1g');
    });

    it('should re-arm safety validation if medications are modified after approval', () => {
      component.ngOnInit();
      component.overrideApproved = true;

      component.onMedicationChanged();
      expect(component.overrideApproved).toBeFalse();

      component.addMedication();
      expect(component.overrideApproved).toBeFalse();

      component.removeMedication(0);
      expect(component.overrideApproved).toBeFalse();
    });
  });
});

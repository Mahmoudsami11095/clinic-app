import { TestBed } from '@angular/core/testing';
import { PrescriptionFormComponent } from './prescription-form.component';
import { PrescriptionService } from '../../services/prescription.service';
import { PatientService } from '../../../patients/services/patient.service';
import { AllergyConflictService } from '../../../../core/services/allergy-conflict.service';
import { PediatricSafetyService } from '../../../../core/services/pediatric-safety.service';
import { LanguageService } from '../../../../core/i18n/language.service';
import { ToastrService } from 'ngx-toastr';
import { AppointmentWithDetails } from '../../../appointments/models/appointment.model';
import { Patient } from '../../../patients/models/patient.model';
import { Prescription } from '../../models/prescription.model';
import { of } from 'rxjs';
import { signal } from '@angular/core';

describe('PrescriptionFormComponent - Pediatric Safety Dosing Prerequisite (BR-RX-03)', () => {
  let component: PrescriptionFormComponent;
  let mockPrescriptionService: any;
  let mockPatientService: any;
  let mockToastr: any;
  let mockLangService: any;

  // 7-year-old child born in 2019
  const mockChildPatient: Patient = {
    id: 'pat-child-1',
    firstName: 'Youssef',
    lastName: 'Ali',
    contactNumber: '+20 100 123 4567',
    email: 'parent@example.com',
    dateOfBirth: '2019-06-15',
    gender: 'male',
    bloodGroup: 'B+',
    clinicId: 'c1',
    address: 'Nasr City, Cairo',
    registrationDate: '2026-01-01',
    allergies: 'None'
  };

  // 25-year-old adult patient
  const mockAdultPatient: Patient = {
    id: 'pat-adult-1',
    firstName: 'Omar',
    lastName: 'Tarek',
    contactNumber: '+20 100 888 9999',
    email: 'omar@example.com',
    dateOfBirth: '2001-03-20',
    gender: 'male',
    bloodGroup: 'A+',
    clinicId: 'c1',
    address: 'Dokki, Giza',
    registrationDate: '2026-01-01',
    allergies: 'None'
  };

  const mockAppointment: AppointmentWithDetails = {
    id: 'appt-201',
    patientId: 'pat-child-1',
    doctorId: 'doc-1',
    patientName: 'Youssef Ali',
    doctorName: 'Dr. Mahmoud Sami',
    date: '2026-09-28T10:00:00Z',
    status: 'scheduled',
    type: 'Pediatric Consultation',
    notes: ''
  };

  beforeEach(() => {
    mockPrescriptionService = {
      create: jasmine.createSpy('create').and.returnValue(of({})),
      update: jasmine.createSpy('update').and.returnValue(of({}))
    };

    mockPatientService = {
      getById: jasmine.createSpy('getById').and.returnValue(of(mockChildPatient))
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
        PediatricSafetyService,
        { provide: PrescriptionService, useValue: mockPrescriptionService },
        { provide: PatientService, useValue: mockPatientService },
        { provide: ToastrService, useValue: mockToastr },
        { provide: LanguageService, useValue: mockLangService }
      ]
    });

    component = TestBed.inject(PrescriptionFormComponent);
    component.appointment = mockAppointment;
    component.patient = mockChildPatient;
  });

  it('should identify child under 14 as pediatric patient (BR-RX-03)', () => {
    component.ngOnInit();
    expect(component.isPediatric).toBeTrue();
    expect(component.patientAge).toBeLessThan(14);
  });

  it('should identify patient 14 or older as non-pediatric', () => {
    component.patient = mockAdultPatient;
    component.ngOnInit();
    expect(component.isPediatric).toBeFalse();
    expect(component.patientAge).toBeGreaterThanOrEqual(14);
  });

  it('should block prescription submission for pediatric patient when body weight is missing', () => {
    component.ngOnInit();
    component.medications = [{ name: 'Amoxicillin Susp 250mg/5ml', dosage: '5ml', frequency: 'TID', duration: '7 days' }];
    component.patientWeightKg = null;

    component.submit();

    expect(mockToastr.error).toHaveBeenCalledWith('prescriptions.patient_weight_required', 'toast.error');
    expect(component.weightInputTouched).toBeTrue();
    expect(component.isWeightInvalid).toBeTrue();
    expect(mockPrescriptionService.create).not.toHaveBeenCalled();
  });

  it('should block prescription submission for pediatric patient when weight is zero or negative', () => {
    component.ngOnInit();
    component.medications = [{ name: 'Amoxicillin Susp 250mg/5ml', dosage: '5ml', frequency: 'TID', duration: '7 days' }];
    
    component.patientWeightKg = 0;
    component.submit();
    expect(component.isWeightInvalid).toBeTrue();
    expect(mockPrescriptionService.create).not.toHaveBeenCalled();

    component.patientWeightKg = -3;
    component.submit();
    expect(component.isWeightInvalid).toBeTrue();
    expect(mockPrescriptionService.create).not.toHaveBeenCalled();
  });

  it('should allow prescription submission for pediatric patient when valid weight is provided', () => {
    component.ngOnInit();
    component.medications = [{ name: 'Amoxicillin Susp 250mg/5ml', dosage: '5ml', frequency: 'TID', duration: '7 days' }];
    component.patientWeightKg = 22.5;

    let emittedRx: Prescription | undefined;
    component.saved.subscribe((rx) => {
      emittedRx = rx;
    });

    component.submit();

    expect(mockToastr.error).not.toHaveBeenCalled();
    expect(mockPrescriptionService.create).toHaveBeenCalled();
    expect(emittedRx).toBeDefined();
    expect(emittedRx?.patientWeightKg).toBe(22.5);
    expect(emittedRx?.isPediatric).toBeTrue();
    expect(emittedRx?.notes).toContain('[PEDIATRIC SAFETY DOSING - BR-RX-03]');
    expect(emittedRx?.notes).toContain('Current Body Weight: 22.5 kg');
  });

  it('should allow prescription submission for adult patient without requiring body weight', () => {
    component.patient = mockAdultPatient;
    component.ngOnInit();
    component.medications = [{ name: 'Augmentin 1g', dosage: '1 tab', frequency: 'BID', duration: '7 days' }];
    component.patientWeightKg = null;

    component.submit();

    expect(mockToastr.error).not.toHaveBeenCalled();
    expect(mockPrescriptionService.create).toHaveBeenCalled();
  });

  it('should extract weight from existing prescription notes or patientWeightKg in edit mode', () => {
    const existingPrescription: Prescription = {
      id: 'rx-prev-1',
      appointmentId: 'appt-201',
      patientId: 'pat-child-1',
      doctorId: 'doc-1',
      date: '2026-09-20T10:00:00Z',
      medications: [{ name: 'Paracetamol Susp', dosage: '7.5ml', frequency: 'PRN', duration: '3 days' }],
      notes: 'Take with food.\n\n[PEDIATRIC SAFETY DOSING - BR-RX-03]\nPatient Age: 7 years | Current Body Weight: 21.8 kg\nAttending Physician: Dr. Mahmoud Sami\nTimestamp: 2026-09-20 10:00:00'
    };

    component.prescription = existingPrescription;
    component.ngOnInit();

    expect(component.patientWeightKg).toBe(21.8);
  });
});

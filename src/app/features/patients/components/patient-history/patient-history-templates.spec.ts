import { TestBed } from '@angular/core/testing';
import { 
  PatientHistoryComponent, 
  DENTAL_TREATMENT_TEMPLATES, 
  TreatmentTemplate 
} from './patient-history.component';
import { PatientService } from '../../services/patient.service';
import { AppointmentService } from '../../../appointments/services/appointment.service';
import { PrescriptionService } from '../../../prescriptions/services/prescription.service';
import { BillingService } from '../../../billing/services/billing.service';
import { DentalService, DentalLog } from '../../../../core/services/dental.service';
import { AuthService } from '../../../../core/auth/auth.service';
import { ClinicService } from '../../../../core/services/clinic.service';
import { ToastrService } from 'ngx-toastr';
import { LanguageService } from '../../../../core/i18n/language.service';
import { MaterialsService } from '../../../inventory/services/materials.service';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import { Patient } from '../../models/patient.model';

describe('PatientHistoryComponent - Treatment Templates & Plan Engine', () => {
  let component: PatientHistoryComponent;

  const mockPatient: Patient = {
    id: 'pt-101',
    firstName: 'Ahmed',
    lastName: 'Mansour',
    contactNumber: '+20 100 123 4567',
    email: 'ahmed@example.com',
    dateOfBirth: '1990-05-15',
    gender: 'male',
    clinicId: 'c1',
    bloodGroup: 'A+',
    address: '123 Nile Corniche, Cairo',
    registrationDate: '2026-01-01'
  };

  const mockPlannedLogs: DentalLog[] = [
    {
      id: 'log-1',
      patientId: 'pt-101',
      doctorId: 'doc-1',
      toothNumber: 16,
      status: ['caries'],
      treatment: 'Composite Restoration (MOD Class II)',
      medication: 'Warm salt water rinses',
      painLevel: 2,
      isPlanned: true,
      date: '2026-09-28T10:00:00Z',
      doctorName: 'Dr. Mahmoud'
    },
    {
      id: 'log-2',
      patientId: 'pt-101',
      doctorId: 'doc-1',
      toothNumber: 36,
      status: ['root_canal'],
      treatment: 'Root Canal Treatment (Molar Multi-Canal)',
      painLevel: 6,
      isPlanned: true,
      date: '2026-09-28T11:00:00Z',
      doctorName: 'Dr. Mahmoud'
    },
    {
      id: 'log-3',
      patientId: 'pt-101',
      doctorId: 'doc-1',
      toothNumber: 11,
      status: ['filled'],
      treatment: 'Composite Restoration (Occlusal)',
      painLevel: 0,
      isPlanned: false, // Completed, not planned
      date: '2026-09-20T10:00:00Z',
      doctorName: 'Dr. Mahmoud'
    }
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        PatientHistoryComponent,
        { provide: PatientService, useValue: {} },
        { provide: AppointmentService, useValue: { getAllWithDetails: () => of([]) } },
        { provide: PrescriptionService, useValue: { getAllWithDetails: () => of([]) } },
        { provide: BillingService, useValue: { getAllWithDetails: () => of([]) } },
        { provide: DentalService, useValue: { getLogs: () => of(mockPlannedLogs) } },
        { provide: AuthService, useValue: { currentUser: signal({ id: 'doc-1', name: 'Dr. Mahmoud', role: 'doctor' }), isDoctor: () => true } },
        { 
          provide: ClinicService, 
          useValue: { 
            activeClinicId: signal('c1'), 
            activeClinicName: signal('Downtown Dental Center'),
            clinics: signal([{ id: 'c1', name: 'Downtown Dental Center', address: 'Tahrir Sq, Cairo', phone: '+20 2 2222 3333' }])
          } 
        },
        { provide: ToastrService, useValue: { success: jasmine.createSpy(), error: jasmine.createSpy() } },
        { provide: LanguageService, useValue: { translate: (k: string) => k, isLoaded: signal(true) } },
        { 
          provide: MaterialsService, 
          useValue: { 
            getByDoctor: () => of({ 
              data: [
                { id: 'm1', doctorId: 'doc-1', name: 'Composite Resin (A2)', quantity: 10, unit: 'Syringes' },
                { id: 'm2', doctorId: 'doc-1', name: 'Lidocaine Cartridges', quantity: 20, unit: 'Cartridges' }
              ] 
            }) 
          } 
        }
      ]
    });

    component = TestBed.inject(PatientHistoryComponent);
    component.patient = mockPatient;
    component.dentalLogs.set(mockPlannedLogs);
  });

  it('should have predefined treatment templates across clinical categories', () => {
    expect(DENTAL_TREATMENT_TEMPLATES.length).toBeGreaterThanOrEqual(10);
    const categories = DENTAL_TREATMENT_TEMPLATES.map(t => t.category);
    expect(categories).toContain('restorative');
    expect(categories).toContain('endodontics');
    expect(categories).toContain('preventive');
    expect(categories).toContain('prosthodontics');
    expect(categories).toContain('surgery');
  });

  it('should filter templates by category', () => {
    component.selectedTemplateCategory.set('all');
    expect(component.getFilteredTemplates().length).toBe(DENTAL_TREATMENT_TEMPLATES.length);

    component.selectedTemplateCategory.set('endodontics');
    const endoTemplates = component.getFilteredTemplates();
    expect(endoTemplates.length).toBeGreaterThan(0);
    expect(endoTemplates.every(t => t.category === 'endodontics')).toBeTrue();
  });

  it('should apply treatment template to form fields', () => {
    component.availableMaterials.set([
      { id: 'm1', doctorId: 'doc-1', name: 'Composite Resin (A2)', quantity: 10, unit: 'Syringes' }
    ]);
    component.isPlannedForm.set(false); // Completed log

    const template: TreatmentTemplate = {
      id: 't_comp',
      name: 'Composite Restoration (Occlusal)',
      category: 'restorative',
      status: 'filled',
      suggestedMedication: 'Normal post-op care',
      materialNameMatch: 'Composite'
    };

    component.applyTreatmentTemplate(template);

    expect(component.treatment()).toBe('Composite Restoration (Occlusal)');
    expect(component.medication()).toBe('Normal post-op care');
    expect(component.dentalStatus()).toContain('filled');
    // Consumed materials auto-populated with matching material
    expect(component.consumedMaterialsForm().length).toBe(1);
    expect(component.consumedMaterialsForm()[0].materialId).toBe('m1');
  });

  it('should extract and sort all planned treatments for treatment plan report', () => {
    const planned = component.getAllPlannedTreatments();
    // Only log-1 (tooth 16) and log-2 (tooth 36) are isPlanned = true
    expect(planned.length).toBe(2);
    expect(planned[0].toothNumber).toBe(16);
    expect(planned[1].toothNumber).toBe(36);
  });

  it('should correctly map FDI numbers to anatomical tooth names', () => {
    expect(component.getToothAnatomicalName(11)).toBe('Maxillary Right Central Incisor');
    expect(component.getToothAnatomicalName(16)).toBe('Maxillary Right First Molar');
    expect(component.getToothAnatomicalName(26)).toBe('Maxillary Left First Molar');
    expect(component.getToothAnatomicalName(36)).toBe('Mandibular Left First Molar');
    expect(component.getToothAnatomicalName(48)).toBe('Mandibular Right Third Molar (Wisdom)');
    expect(component.getToothAnatomicalName(99)).toBe('Tooth #99');
  });

  it('should calculate estimated visits for multi-visit vs single-visit procedures', () => {
    const singleVisitLog = mockPlannedLogs[0]; // Composite filling
    const multiVisitLog = mockPlannedLogs[1]; // Molar Root Canal

    expect(component.getEstimatedVisits(singleVisitLog)).toBe(1);
    expect(component.getEstimatedVisits(multiVisitLog)).toBe(2);
  });

  it('should toggle treatment plan modal open and close states', () => {
    expect(component.isTreatmentPlanPrintOpen()).toBeFalse();
    component.openTreatmentPlanModal();
    expect(component.isTreatmentPlanPrintOpen()).toBeTrue();
    component.closeTreatmentPlanModal();
    expect(component.isTreatmentPlanPrintOpen()).toBeFalse();
  });
});

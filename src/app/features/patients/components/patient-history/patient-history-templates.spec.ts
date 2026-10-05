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
import { ClinicalNotesService } from '../../../../core/services/clinical-notes.service';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import { Patient } from '../../models/patient.model';

describe('PatientHistoryComponent - Treatment Templates & Plan Engine', () => {
  let component: PatientHistoryComponent;
  let mockDentalService: any;
  let mockClinicalNotesService: any;

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
    mockDentalService = {
      getLogs: jasmine.createSpy('getLogs').and.returnValue(of(mockPlannedLogs)),
      addLog: jasmine.createSpy('addLog').and.callFake((log: any) => of({ ...log, id: 'new-log-1', date: new Date().toISOString() })),
      updateStage: jasmine.createSpy('updateStage').and.callFake((id: string, stage: string) => of({ ...mockPlannedLogs[0], id, stage })),
      pushToBilling: jasmine.createSpy('pushToBilling').and.callFake((id: string) => of({
        message: 'Success',
        data: { ...mockPlannedLogs[0], id, stage: 'invoiced', invoiceId: 'inv-999' },
        invoice: { id: 'inv-999', patientId: 'pt-101', totalAmount: 450, status: 'unpaid' }
      }))
    };

    mockClinicalNotesService = {
      getNotes: jasmine.createSpy('getNotes').and.returnValue(of([])),
      createNote: jasmine.createSpy('createNote').and.returnValue(of({})),
      amendNote: jasmine.createSpy('amendNote').and.returnValue(of({}))
    };

    TestBed.configureTestingModule({
      providers: [
        PatientHistoryComponent,
        { provide: PatientService, useValue: {} },
        { provide: AppointmentService, useValue: { getAllWithDetails: () => of([]) } },
        { provide: PrescriptionService, useValue: { getAllWithDetails: () => of([]) } },
        { provide: BillingService, useValue: { getAllWithDetails: () => of([]) } },
        { provide: DentalService, useValue: mockDentalService },
        { provide: ClinicalNotesService, useValue: mockClinicalNotesService },
        { provide: AuthService, useValue: { currentUser: signal({ id: 'doc-1', name: 'Dr. Mahmoud', role: 'doctor' }), isDoctor: () => true, isAdmin: () => false } },
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
      materialNameMatch: 'Composite',
      suggestedCost: 450
    };

    component.applyTreatmentTemplate(template);

    expect(component.treatment()).toBe('Composite Restoration (Occlusal)');
    expect(component.medication()).toBe('Normal post-op care');
    expect(component.dentalStatus()).toContain('filled');
    expect(component.cost()).toBe(450);
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

  // BR-DEN-02 Procedure Lifecycle State Machine Tests
  describe('BR-DEN-02: Procedure Lifecycle State Machine & Billing Guardrail', () => {
    it('should return appropriate badge classes and icons for each lifecycle stage', () => {
      expect(component.getStageBadgeClasses('proposed')).toContain('bg-slate-100');
      expect(component.getStageBadgeClasses('accepted')).toContain('bg-blue-50');
      expect(component.getStageBadgeClasses('in_progress')).toContain('bg-amber-50');
      expect(component.getStageBadgeClasses('completed')).toContain('bg-emerald-50');
      expect(component.getStageBadgeClasses('invoiced')).toContain('bg-purple-50');

      expect(component.getStageIcon('proposed')).toBe('pi pi-file-edit');
      expect(component.getStageIcon('accepted')).toBe('pi pi-check');
      expect(component.getStageIcon('in_progress')).toBe('pi pi-spin pi-sync');
      expect(component.getStageIcon('completed')).toBe('pi pi-check-circle');
      expect(component.getStageIcon('invoiced')).toBe('pi pi-receipt');
    });

    it('should advance procedure stage strictly through lifecycle', () => {
      const testLog: DentalLog = {
        id: 'log-adv-1',
        patientId: 'pt-101',
        doctorId: 'doc-1',
        doctorName: 'Dr. Mahmoud',
        toothNumber: 16,
        status: ['caries'],
        painLevel: 0,
        date: '2026-09-28T10:00:00Z',
        stage: 'proposed',
        isPlanned: true
      };
      component.dentalLogs.set([testLog]);

      // proposed -> accepted
      mockDentalService.updateStage.and.returnValue(of({ ...testLog, stage: 'accepted' }));
      component.advanceProcedureStage(testLog, 'accepted');

      expect(mockDentalService.updateStage).toHaveBeenCalledWith('log-adv-1', 'accepted');
      const updatedLog = component.dentalLogs().find(l => l.id === 'log-adv-1');
      expect(updatedLog?.stage).toBe('accepted');
    });

    it('should enforce billing guardrail: reject pushing non-completed procedure to billing', () => {
      const toastr = TestBed.inject(ToastrService);
      const proposedLog: DentalLog = {
        id: 'log-prop-1',
        patientId: 'pt-101',
        doctorId: 'doc-1',
        doctorName: 'Dr. Mahmoud',
        toothNumber: 16,
        status: ['caries'],
        painLevel: 0,
        date: '2026-09-28T10:00:00Z',
        stage: 'proposed',
        isPlanned: true
      };

      component.pushProcedureToBilling(proposedLog);

      // Must be rejected at guardrail: pushToBilling should NOT be called
      expect(mockDentalService.pushToBilling).not.toHaveBeenCalled();
      expect(toastr.error).toHaveBeenCalled();
    });

    it('should push completed procedure to billing module and record invoice', () => {
      spyOn(window, 'confirm').and.returnValue(true);
      const toastr = TestBed.inject(ToastrService);

      const completedLog: DentalLog = {
        id: 'log-comp-1',
        patientId: 'pt-101',
        doctorId: 'doc-1',
        doctorName: 'Dr. Mahmoud',
        toothNumber: 16,
        status: ['filled'],
        painLevel: 0,
        date: '2026-09-28T10:00:00Z',
        stage: 'completed',
        cost: 450,
        isPlanned: false
      };
      component.dentalLogs.set([completedLog]);

      component.pushProcedureToBilling(completedLog);

      expect(mockDentalService.pushToBilling).toHaveBeenCalledWith('log-comp-1');
      const invoicedLog = component.dentalLogs().find(l => l.id === 'log-comp-1');
      expect(invoicedLog?.stage).toBe('invoiced');
      expect(invoicedLog?.invoiceId).toBe('inv-999');
      // Verifies invoice added to billingRecords signal
      expect(component.billingRecords().length).toBeGreaterThan(0);
      expect(component.billingRecords()[0].id).toBe('inv-999');
      expect(toastr.success).toHaveBeenCalled();
    });

    it('should initialize stage to proposed for planned logs and completed for direct logs', () => {
      component.selectedTooth.set(16);
      component.cost.set(600);

      // 1. Planned procedure
      component.isPlannedForm.set(true);
      component.submitDentalLog();

      expect(mockDentalService.addLog).toHaveBeenCalledWith(jasmine.objectContaining({
        stage: 'proposed',
        isPlanned: true,
        cost: 600
      }));

      // Cost reset after submit
      expect(component.cost()).toBe(0);

      // 2. Direct completed procedure
      component.cost.set(350);
      component.isPlannedForm.set(false);
      component.submitDentalLog();

      expect(mockDentalService.addLog).toHaveBeenCalledWith(jasmine.objectContaining({
        stage: 'completed',
        isPlanned: false,
        cost: 350
      }));
    });

    it('should auto-match multi-item procedure recipe to available inventory consumables', () => {
      component.availableMaterials.set([
        { id: 'mat-comp', doctorId: 'doc-1', name: 'Composite Resin Shade A2', quantity: 15, minStockAlert: 5, unit: 'Syringe' },
        { id: 'mat-bond', doctorId: 'doc-1', name: 'Dental Bonding Adhesive Prime & Bond', quantity: 8, minStockAlert: 2, unit: 'Bottle' },
        { id: 'mat-etch', doctorId: 'doc-1', name: 'Phosphoric Acid Etchant Gel 37%', quantity: 1, minStockAlert: 3, unit: 'Syringe' } // Low stock!
      ]);
      component.isPlannedForm.set(false);

      const compositeTpl = DENTAL_TREATMENT_TEMPLATES.find(t => t.id === 't_comp_occ')!;
      component.applyTreatmentTemplate(compositeTpl);

      const consumed = component.consumedMaterialsForm();
      expect(consumed.length).toBe(3);
      expect(consumed.find(c => c.materialId === 'mat-comp')?.quantity).toBe(1);
      expect(consumed.find(c => c.materialId === 'mat-bond')?.quantity).toBe(1);
      expect(consumed.find(c => c.materialId === 'mat-etch')?.quantity).toBe(1);

      // Verify low-stock warning detection
      expect(component.isMaterialLowStock('mat-comp')).toBeFalse();
      expect(component.isMaterialLowStock('mat-etch')).toBeTrue();
      expect(component.getMaterialRemaining('mat-etch')).toBe(1);
    });

    it('should cap recipe requested quantity by available inventory stock', () => {
      component.availableMaterials.set([
        { id: 'mat-gp', doctorId: 'doc-1', name: 'Gutta Percha Points #25', quantity: 1, minStockAlert: 5, unit: 'Pack' }, // Only 1 available, recipe requests 2
        { id: 'mat-sealer', doctorId: 'doc-1', name: 'AH Plus Root Canal Sealer', quantity: 5, minStockAlert: 2, unit: 'Tube' },
        { id: 'mat-anes', doctorId: 'doc-1', name: 'بنج اسنان موضعي Articaine 4%', quantity: 20, minStockAlert: 5, unit: 'Ampoule' }
      ]);
      component.isPlannedForm.set(false);

      const rctMolarTpl = DENTAL_TREATMENT_TEMPLATES.find(t => t.id === 't_rct_molar')!;
      component.applyTreatmentTemplate(rctMolarTpl);

      const consumed = component.consumedMaterialsForm();
      expect(consumed.length).toBe(3);
      const gp = consumed.find(c => c.materialId === 'mat-gp');
      expect(gp).toBeDefined();
      expect(gp?.quantity).toBe(1); // Capped to 1 because only 1 in stock
      expect(gp?.maxQuantity).toBe(1);
    });
  });
});


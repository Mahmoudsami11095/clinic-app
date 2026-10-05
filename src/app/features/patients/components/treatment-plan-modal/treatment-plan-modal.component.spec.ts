import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideTranslateService } from '@ngx-translate/core';
import { TreatmentPlanModalComponent } from './treatment-plan-modal.component';
import { DentalLog } from '../../../../core/services/dental.service';
import { Patient } from '../../models/patient.model';

describe('TreatmentPlanModalComponent - Milestone 2 Level 1 (SW/Unit)', () => {
  let component: TreatmentPlanModalComponent;
  let fixture: ComponentFixture<TreatmentPlanModalComponent>;

  const mockPatient: Patient = {
    id: 'pt-alpha-1234',
    firstName: 'Mohamed',
    lastName: 'Ghanem',
    contactNumber: '+20 100 987 6543',
    email: 'm.ghanem@example.com',
    dateOfBirth: '1988-04-12',
    gender: 'male',
    bloodGroup: 'O+',
    clinicId: 'clinic-1',
    address: 'Zamalek, Cairo',
    registrationDate: '2026-01-10'
  };

  const mockLogs: DentalLog[] = [
    {
      id: 'log-1',
      patientId: 'pt-alpha-1234',
      toothNumber: 18,
      doctorName: 'Dr. Mahmoud',
      doctorId: 'doc-1',
      treatment: 'Surgical Extraction (Urgent Wisdom Tooth)',
      stage: 'proposed',
      cost: 1000,
      isPlanned: true,
      painLevel: 4,
      date: '2026-10-01T10:00:00Z',
      status: ['impacted']
    },
    {
      id: 'log-2',
      patientId: 'pt-alpha-1234',
      toothNumber: 16,
      doctorName: 'Dr. Mahmoud',
      doctorId: 'doc-1',
      treatment: 'Root Canal Treatment (Molar Multi-Canal)',
      stage: 'proposed',
      cost: 2000,
      isPlanned: true,
      painLevel: 2,
      date: '2026-10-01T10:00:00Z',
      status: ['root_canal']
    },
    {
      id: 'log-3',
      patientId: 'pt-alpha-1234',
      toothNumber: 16,
      doctorName: 'Dr. Mahmoud',
      doctorId: 'doc-1',
      treatment: 'Zirconia Full Ceramic Crown',
      stage: 'proposed',
      cost: 3000,
      isPlanned: true,
      painLevel: 0,
      date: '2026-10-01T10:00:00Z',
      status: ['crown']
    },
    {
      id: 'log-4',
      patientId: 'pt-alpha-1234',
      toothNumber: 'All',
      doctorName: 'Dr. Mahmoud',
      doctorId: 'doc-1',
      treatment: 'Topical Fluoride Varnish & Prophylaxis',
      stage: 'proposed',
      cost: 500,
      isPlanned: true,
      painLevel: 0,
      date: '2026-10-01T10:00:00Z',
      status: ['healthy']
    }
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TreatmentPlanModalComponent],
      providers: [
        provideHttpClient(),
        provideTranslateService({ fallbackLang: 'en' })
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(TreatmentPlanModalComponent);
    component = fixture.componentInstance;
    component.patient = mockPatient;
    component.clinicName = 'MedClinic Downtown';
    component.plannedLogs = mockLogs;
    component.isOpen = true;
    fixture.detectChanges();
  });

  it('1. should create TreatmentPlanModalComponent successfully', () => {
    expect(component).toBeTruthy();
    expect(component.totalProceduresCount()).toBe(4);
  });

  it('2. should automatically categorize procedures into 4 standard dental phases', () => {
    const items = component.items();
    
    // Urgent Phase
    const urgentItem = items.find(i => i.id === 'log-1');
    expect(urgentItem?.phase).toBe('urgent');

    // Restorative Phase
    const restorativeItem = items.find(i => i.id === 'log-2');
    expect(restorativeItem?.phase).toBe('restorative');

    // Prosthetics Phase
    const prostheticsItem = items.find(i => i.id === 'log-3');
    expect(prostheticsItem?.phase).toBe('prosthetics');

    // Maintenance Phase
    const maintenanceItem = items.find(i => i.id === 'log-4');
    expect(maintenanceItem?.phase).toBe('maintenance');
  });

  it('3. should calculate gross total and phase subtotals accurately', () => {
    // Gross: 1000 + 2000 + 3000 + 500 = 6500
    expect(component.estimate().grossTotal).toBe(6500);

    const groups = component.phaseGroups();
    expect(groups.length).toBe(4);
    
    const p1 = groups.find(g => g.config.type === 'urgent');
    expect(p1?.subtotal).toBe(1000);

    const p2 = groups.find(g => g.config.type === 'restorative');
    expect(p2?.subtotal).toBe(2000);

    const p3 = groups.find(g => g.config.type === 'prosthetics');
    expect(p3?.subtotal).toBe(3000);

    const p4 = groups.find(g => g.config.type === 'maintenance');
    expect(p4?.subtotal).toBe(500);
  });

  it('4. should dynamically compute discount, net total, and deposit requirements', () => {
    // Apply 10% discount and 20% deposit
    component.discountPercent.set(10);
    component.depositPercent.set(20);

    const est = component.estimate();
    // Gross: 6500, Discount (10%): 650, Net: 5850
    expect(est.grossTotal).toBe(6500);
    expect(est.discountAmount).toBe(650);
    expect(est.netTotal).toBe(5850);

    // Deposit (20% of 5850): 1170, Remaining: 4680
    expect(est.depositRequired).toBe(1170);
    expect(est.remainingBalance).toBe(4680);
  });

  it('5. should allow re-assigning procedure to a different phase', () => {
    const item = component.items()[0];
    expect(item.phase).toBe('urgent');

    component.moveItemPhase(item, 'prosthetics');
    const updated = component.items().find(i => i.id === item.id);
    expect(updated?.phase).toBe('prosthetics');
  });

  it('6. should allow updating procedure stage and emit updateItemStageEvent', () => {
    spyOn(component.updateItemStageEvent, 'emit');
    const item = component.items()[1]; // Root Canal

    component.changeItemStage(item, 'accepted');
    expect(component.updateItemStageEvent.emit).toHaveBeenCalledWith({
      item: jasmine.objectContaining({ stage: 'accepted' }),
      stage: 'accepted'
    });
  });

  it('7. should allow inline updating of procedure cost with real-time recalculation', () => {
    const item = component.items()[0]; // 1000 EGP
    component.updateItemCost(item, 1500);

    expect(component.estimate().grossTotal).toBe(7000);
  });

  it('8. should generate milestone installment breakdown for each active phase', () => {
    const est = component.estimate();
    expect(est.installments.length).toBe(4);
    expect(est.installments[0].phaseTitle).toContain('Phase 1: Urgent');
  });

  it('9. should emit generateDepositInvoice with proper description and amount', () => {
    spyOn(component.generateDepositInvoice, 'emit');
    component.discountPercent.set(0);
    component.depositPercent.set(25);

    // Gross: 6500, 25% Deposit = 1625
    component.handleGenerateDepositInvoice();

    expect(component.generateDepositInvoice.emit).toHaveBeenCalledWith(jasmine.objectContaining({
      amount: 1625,
      description: jasmine.stringMatching(/Treatment Plan Deposit \(DTP-PT-ALP\) - Initial Payment Required \(25%\)/)
    }));
  });

  it('10. should navigate between tabs: roadmap, estimator, and print', () => {
    expect(component.activeTab()).toBe('roadmap');

    component.activeTab.set('estimator');
    expect(component.activeTab()).toBe('estimator');

    component.activeTab.set('print');
    expect(component.activeTab()).toBe('print');
  });

  it('11. should emit close on backdrop click and trigger window.print on formal print', () => {
    spyOn(component.close, 'emit');
    const fakeBackdropEvent = {
      target: { getAttribute: (attr: string) => attr === 'role' ? 'dialog' : null }
    } as any;
    component.onBackdropClick(fakeBackdropEvent);
    expect(component.close.emit).toHaveBeenCalled();

    spyOn(window, 'print');
    component.triggerPrint();
    expect(window.print).toHaveBeenCalled();
  });
});

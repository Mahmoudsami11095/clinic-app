import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PaymentPlanManagerComponent } from './payment-plan-manager.component';
import { PaymentPlanService } from '../../../../core/services/payment-plan.service';
import { ClinicService } from '../../../../core/services/clinic.service';
import { PatientService } from '../../../patients/services/patient.service';
import { DoctorService } from '../../../doctors/services/doctor.service';
import { AuthService } from '../../../../core/auth/auth.service';
import { ToastrService } from 'ngx-toastr';
import { LanguageService } from '../../../../core/i18n/language.service';
import { of } from 'rxjs';
import { signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { PaymentPlan, PaymentPlanSummary } from '../../models/payment-plan.model';

describe('PaymentPlanManagerComponent', () => {
  let component: PaymentPlanManagerComponent;
  let fixture: ComponentFixture<PaymentPlanManagerComponent>;
  let mockPlanService: any;
  let mockClinicService: any;
  let mockPatientService: any;
  let mockDoctorService: any;
  let mockAuthService: any;
  let mockToastr: any;
  let mockLanguageService: any;

  const mockPlan: PaymentPlan = {
    id: 'plan-1',
    planNumber: 'PLAN-202610-0001',
    clinicId: 'c1',
    clinicName: 'Downtown Clinic',
    patientId: 'pat-1',
    patientName: 'Kareem Adel',
    patientPhone: '+201001234567',
    doctorId: 'doc-1',
    doctorName: 'Dr. Sarah Jenkins',
    title: 'Orthodontic Aligners Full Treatment',
    totalAmount: 30000,
    downPayment: 6000,
    financedAmount: 24000,
    interestRate: 0,
    totalPayable: 24000,
    totalPaid: 6000,
    remainingBalance: 24000,
    numberOfInstallments: 6,
    installmentFrequency: 'Monthly',
    startDate: '2026-11-01',
    status: 'Active',
    createdAt: new Date().toISOString(),
    installments: [
      {
        id: 'inst-1',
        paymentPlanId: 'plan-1',
        installmentNumber: 1,
        dueDate: '2026-11-01',
        amountDue: 4000,
        amountPaid: 0,
        status: 'Pending'
      },
      {
        id: 'inst-2',
        paymentPlanId: 'plan-1',
        installmentNumber: 2,
        dueDate: '2026-12-01',
        amountDue: 4000,
        amountPaid: 0,
        status: 'Pending'
      }
    ]
  };

  const mockSummary: PaymentPlanSummary = {
    totalPlans: 12,
    activePlans: 10,
    completedPlans: 2,
    atRiskPlans: 1,
    totalFinancedCapital: 180000,
    totalCollectedAmount: 95000,
    totalOutstandingReceivables: 85000,
    totalOverdueArrears: 12000,
    collectionRatePercentage: 52.8
  };

  beforeEach(async () => {
    mockPlanService = {
      getPlans: jasmine.createSpy('getPlans').and.returnValue(of([mockPlan])),
      getSummary: jasmine.createSpy('getSummary').and.returnValue(of(mockSummary)),
      createPlan: jasmine.createSpy('createPlan').and.returnValue(of(mockPlan)),
      recordPayment: jasmine.createSpy('recordPayment').and.returnValue(of({ ...mockPlan, totalPaid: 10000 })),
      sendReminder: jasmine.createSpy('sendReminder').and.returnValue(of({ message: 'Sent', reminderSentAt: new Date().toISOString() }))
    };

    mockClinicService = {
      activeClinicId: signal('c1'),
      clinics: signal([{ id: 'c1', name: 'Downtown Clinic' }])
    };

    mockPatientService = {
      getAll: jasmine.createSpy('getAll').and.returnValue(of([{ id: 'pat-1', firstName: 'Kareem', lastName: 'Adel', phoneNumber: '+201001234567' }]))
    };

    mockDoctorService = {
      getAll: jasmine.createSpy('getAll').and.returnValue(of([{ id: 'doc-1', firstName: 'Sarah', lastName: 'Jenkins', specialization: 'Orthodontics' }]))
    };

    mockAuthService = {
      currentUser: signal({ id: 'u1', role: 'admin', clinicId: 'c1' }),
      isPatient: jasmine.createSpy('isPatient').and.returnValue(false)
    };

    mockToastr = {
      success: jasmine.createSpy('success'),
      error: jasmine.createSpy('error'),
      warning: jasmine.createSpy('warning')
    };

    mockLanguageService = {
      translate: jasmine.createSpy('translate').and.callFake((k: string) => k),
      currentLang: signal('en'),
      dir: signal('ltr')
    };

    await TestBed.configureTestingModule({
      imports: [PaymentPlanManagerComponent],
      providers: [
        provideRouter([]),
        { provide: PaymentPlanService, useValue: mockPlanService },
        { provide: ClinicService, useValue: mockClinicService },
        { provide: PatientService, useValue: mockPatientService },
        { provide: DoctorService, useValue: mockDoctorService },
        { provide: AuthService, useValue: mockAuthService },
        { provide: ToastrService, useValue: mockToastr },
        { provide: LanguageService, useValue: mockLanguageService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(PaymentPlanManagerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should initialize and load financing plans and portfolio summary', () => {
    expect(component).toBeTruthy();
    expect(mockPlanService.getPlans).toHaveBeenCalled();
    expect(mockPlanService.getSummary).toHaveBeenCalled();
    expect(component.plans().length).toBe(1);
    expect(component.summary()?.totalFinancedCapital).toBe(180000);
    expect(component.loading()).toBeFalse();
  });

  it('should open create modal and compute live installment schedule preview', () => {
    component.openCreateModal();
    expect(component.isCreateModalOpen()).toBeTrue();

    const schedule = component.previewSchedule();
    expect(schedule.length).toBe(6);
    expect(schedule[0].amount).toBe(3333.33);
    expect(schedule[5].amount).toBe(3333.35);
  });

  it('should submit new financing plan', () => {
    component.openCreateModal();
    component.submitCreatePlan();

    expect(mockPlanService.createPlan).toHaveBeenCalled();
    expect(mockToastr.success).toHaveBeenCalledWith(jasmine.stringMatching(/created successfully/i), 'Success');
  });

  it('should open schedule modal and select plan', () => {
    component.openScheduleModal(mockPlan);
    expect(component.isScheduleModalOpen()).toBeTrue();
    expect(component.selectedPlan()?.planNumber).toBe('PLAN-202610-0001');
  });

  it('should open payment modal and submit payment', () => {
    component.openPayModal(mockPlan, mockPlan.installments[0]);
    expect(component.isPayModalOpen()).toBeTrue();
    expect(component.payForm().amount).toBe(4000);

    component.submitPayment();
    expect(mockPlanService.recordPayment).toHaveBeenCalledWith('plan-1', 'inst-1', jasmine.objectContaining({ amount: 4000 }));
    expect(mockToastr.success).toHaveBeenCalledWith(jasmine.stringMatching(/Payment of 4000 recorded/i), 'Success');
  });

  it('should dispatch WhatsApp reminder for an installment', () => {
    component.sendWhatsAppReminder(mockPlan, mockPlan.installments[0]);
    expect(mockPlanService.sendReminder).toHaveBeenCalledWith('plan-1', 'inst-1');
    expect(mockToastr.success).toHaveBeenCalledWith(jasmine.stringMatching(/WhatsApp reminder sent/i), 'Success');
  });
});

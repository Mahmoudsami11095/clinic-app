import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { DoctorCommissionsComponent } from './doctor-commissions.component';
import { CommissionService } from '../../services/commission.service';
import { DoctorService } from '../../../doctors/services/doctor.service';
import { ClinicService } from '../../../../core/services/clinic.service';
import { AuthService } from '../../../../core/auth/auth.service';
import { CommissionAnalytics, DoctorCommissionSummary, CommissionPayout } from '../../models/commission.model';

describe('DoctorCommissionsComponent - Milestone 10 Level 1 & Level 2 (System/Component)', () => {
  let component: DoctorCommissionsComponent;
  let fixture: ComponentFixture<DoctorCommissionsComponent>;
  let commissionService: jasmine.SpyObj<CommissionService>;
  let toastrService: jasmine.SpyObj<ToastrService>;

  const mockAnalytics: CommissionAnalytics = {
    periodStart: '2026-10-01T00:00:00Z',
    periodEnd: '2026-10-31T23:59:59Z',
    totalGrossRevenue: 48500,
    totalLabFeesDeducted: 7200,
    totalNetCommission: 14455,
    totalClinicRetainedRevenue: 26845,
    doctorCount: 3,
    procedureCount: 28,
    doctors: [
      {
        doctorId: 'doc-1',
        doctorName: 'Dr. Hassan Adel',
        specialization: 'Endodontics',
        grossRevenue: 22000,
        labFeesDeducted: 2500,
        netCommission: 7800,
        clinicShare: 11700,
        effectiveRate: 35.5,
        totalProcedures: 12,
        hasActivePlan: true
      },
      {
        doctorId: 'doc-2',
        doctorName: 'Dr. Nour ElDin',
        specialization: 'Orthodontics',
        grossRevenue: 15500,
        labFeesDeducted: 3200,
        netCommission: 4305,
        clinicShare: 7995,
        effectiveRate: 27.8,
        totalProcedures: 8,
        hasActivePlan: true
      }
    ],
    encounterItems: [
      {
        id: 'enc-1',
        billingRecordId: 'inv-101',
        doctorId: 'doc-1',
        doctorName: 'Dr. Hassan Adel',
        patientName: 'Ahmed Mahmoud',
        serviceCategory: 'Endodontics',
        description: 'Molar Root Canal Treatment',
        serviceDate: '2026-10-02T10:00:00Z',
        grossAmount: 2500,
        labFee: 0,
        commissionRate: 40,
        commissionAmount: 1000,
        clinicAmount: 1500
      }
    ]
  };

  const mockPayouts: CommissionPayout[] = [
    {
      id: 'payout-1',
      doctorId: 'doc-1',
      doctorName: 'Dr. Hassan Adel',
      periodStart: '2026-10-01T00:00:00Z',
      periodEnd: '2026-10-31T23:59:59Z',
      totalGrossRevenue: 22000,
      totalLabFeesDeducted: 2500,
      totalNetCommission: 7800,
      clinicRetainedRevenue: 11700,
      status: 'Draft',
      createdAt: '2026-10-05T12:00:00Z',
      items: []
    }
  ];

  beforeEach(async () => {
    const commSpy = jasmine.createSpyObj('CommissionService', [
      'getAnalytics',
      'getDoctorPlan',
      'upsertPlan',
      'getPayouts',
      'createPayout',
      'settlePayout',
      'calculateCommission'
    ], {
      analytics: jasmine.createSpy('analytics').and.returnValue(mockAnalytics),
      payouts: jasmine.createSpy('payouts').and.returnValue(mockPayouts),
      loading: jasmine.createSpy('loading').and.returnValue(false)
    });

    commSpy.getAnalytics.and.returnValue(of(mockAnalytics));
    commSpy.getPayouts.and.returnValue(of(mockPayouts));
    commSpy.getDoctorPlan.and.returnValue(of(null));
    commSpy.upsertPlan.and.returnValue(of({} as any));
    commSpy.createPayout.and.returnValue(of(mockPayouts[0]));
    commSpy.settlePayout.and.returnValue(of(mockPayouts[0]));
    commSpy.calculateCommission.and.callFake((gross: number, lab: number, rate: number, _type: string) => {
      const net = Math.max(0, gross - lab);
      return Math.round(net * (rate / 100));
    });

    const docSpy = jasmine.createSpyObj('DoctorService', ['getAll']);
    docSpy.getAll.and.returnValue(of([]));

    const clinicSpy = jasmine.createSpyObj('ClinicService', [], {
      activeClinicId: jasmine.createSpy('activeClinicId').and.returnValue('c-1')
    });

    const authSpy = jasmine.createSpyObj('AuthService', ['isAdmin', 'isDoctor', 'isPatient', 'getCurrentUser']);
    authSpy.isAdmin.and.returnValue(true);
    authSpy.isDoctor.and.returnValue(false);
    authSpy.isPatient.and.returnValue(false);

    const toastrSpy = jasmine.createSpyObj('ToastrService', ['success', 'error', 'info', 'warning']);

    await TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, RouterTestingModule, DoctorCommissionsComponent],
      providers: [
        { provide: CommissionService, useValue: commSpy },
        { provide: DoctorService, useValue: docSpy },
        { provide: ClinicService, useValue: clinicSpy },
        { provide: AuthService, useValue: authSpy },
        { provide: ToastrService, useValue: toastrSpy },
        provideTranslateService({ fallbackLang: 'en' })
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(DoctorCommissionsComponent);
    component = fixture.componentInstance;
    commissionService = TestBed.inject(CommissionService) as jasmine.SpyObj<CommissionService>;
    toastrService = TestBed.inject(ToastrService) as jasmine.SpyObj<ToastrService>;
    fixture.detectChanges();
  });

  it('1. should create and initialize with default state and load analytics', () => {
    expect(component).toBeTruthy();
    expect(component.activeTab()).toBe('doctors');
    expect(component.period()).toBe('this_month');
    expect(commissionService.getAnalytics).toHaveBeenCalled();
    expect(commissionService.getPayouts).toHaveBeenCalled();
  });

  it('2. should switch view tabs between doctors, encounters, and payouts', () => {
    component.activeTab.set('encounters');
    fixture.detectChanges();
    expect(component.activeTab()).toBe('encounters');

    component.activeTab.set('payouts');
    fixture.detectChanges();
    expect(component.activeTab()).toBe('payouts');
  });

  it('3. should open Plan modal and initialize real-time simulator correctly', () => {
    const doc = mockAnalytics.doctors[0];
    component.openPlanModal(doc);

    expect(component.isPlanModalOpen()).toBeTrue();
    expect(component.editingDoctor()).toEqual(doc);
    expect(component.simGross()).toBe(2000);
    expect(component.simLab()).toBe(400);

    // Live formula calculation
    expect(component.simDoctorNet()).toBeGreaterThan(0);
    expect(component.simClinicShare()).toBeGreaterThan(0);
  });

  it('4. should save updated commission plan and invoke toastr notification', () => {
    const doc = mockAnalytics.doctors[0];
    component.openPlanModal(doc);
    component.planBaseRate.set(40);
    component.planDeductionType.set('AfterCommission');

    commissionService.upsertPlan.and.returnValue(of({
      id: 'plan-1',
      doctorId: doc.doctorId,
      defaultCommissionRate: 40,
      labFeeDeductionType: 'AfterCommission',
      specialtyRates: {},
      isActive: true,
      createdAt: '2026-10-01'
    }));

    component.savePlan();

    expect(commissionService.upsertPlan).toHaveBeenCalled();
    expect(toastrService.success).toHaveBeenCalled();
    expect(component.isPlanModalOpen()).toBeFalse();
  });

  it('5. should open Settle modal, populate transaction reference, and confirm settlement', () => {
    const payout = mockPayouts[0];
    component.openSettleModal(payout);

    expect(component.isSettleModalOpen()).toBeTrue();
    expect(component.selectedPayout()).toEqual(payout);
    expect(component.settlePaymentRef()).toContain('TRX-');

    commissionService.settlePayout.and.returnValue(of({
      ...payout,
      status: 'Paid',
      paymentReference: 'TRX-123456',
      paidAt: '2026-10-05T12:30:00Z'
    }));

    component.confirmSettle();

    expect(commissionService.settlePayout).toHaveBeenCalled();
    expect(toastrService.success).toHaveBeenCalled();
    expect(component.isSettleModalOpen()).toBeFalse();
  });

  it('6. should generate payout draft for doctor and switch to payouts tab', () => {
    const doc = mockAnalytics.doctors[0];
    commissionService.createPayout.and.returnValue(of(mockPayouts[0]));

    component.generatePayout(doc);

    expect(commissionService.createPayout).toHaveBeenCalled();
    expect(toastrService.success).toHaveBeenCalled();
    expect(component.activeTab()).toBe('payouts');
  });
});

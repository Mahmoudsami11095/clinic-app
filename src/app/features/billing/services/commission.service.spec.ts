import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { CommissionService } from './commission.service';
import { CommissionAnalytics, DoctorCommissionPlan } from '../models/commission.model';

describe('CommissionService - Milestone 10 Level 1 (SW/Unit)', () => {
  let service: CommissionService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [CommissionService]
    });

    service = TestBed.inject(CommissionService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('1. should initialize with default reactive signals', () => {
    expect(service).toBeTruthy();
    expect(service.analytics()).toBeNull();
    expect(service.loading()).toBeFalse();
    expect(service.selectedDoctorId()).toBe('all');
    expect(service.selectedPeriod()).toBe('this_month');
  });

  it('2. should calculate BeforeCommission deduction accurately (Net Revenue * Rate)', () => {
    // Gross: 1000, Lab: 200, Rate: 30% => Net Revenue 800 * 30% = 240
    const result = service.calculateCommission(1000, 200, 30, 'BeforeCommission');
    expect(result).toBe(240);
  });

  it('3. should calculate AfterCommission deduction accurately ((Gross * Rate) - Lab)', () => {
    // Gross: 1000, Lab: 100, Rate: 30% => Gross Comm 300 - 100 = 200
    const result = service.calculateCommission(1000, 100, 30, 'AfterCommission');
    expect(result).toBe(200);
  });

  it('4. should calculate None deduction accurately (Clinic absorbs lab fee)', () => {
    // Gross: 1000, Lab: 250, Rate: 35% => 1000 * 35% = 350
    const result = service.calculateCommission(1000, 250, 35, 'None');
    expect(result).toBe(350);
  });

  it('5. should prevent negative commission when lab fee exceeds gross or commission', () => {
    const beforeResult = service.calculateCommission(100, 200, 30, 'BeforeCommission');
    const afterResult = service.calculateCommission(100, 200, 30, 'AfterCommission');

    expect(beforeResult).toBe(0);
    expect(afterResult).toBe(0);
  });

  it('6. should fetch commission analytics via GET /api/commission/analytics and update signal', () => {
    const mockData: CommissionAnalytics = {
      periodStart: '2026-10-01T00:00:00Z',
      periodEnd: '2026-10-31T23:59:59Z',
      totalGrossRevenue: 50000,
      totalLabFeesDeducted: 8000,
      totalNetCommission: 15000,
      totalClinicRetainedRevenue: 27000,
      doctorCount: 3,
      procedureCount: 30,
      doctors: [
        {
          doctorId: 'doc-1',
          doctorName: 'Dr. Hassan Adel',
          specialization: 'Endodontics',
          grossRevenue: 30000,
          labFeesDeducted: 3000,
          netCommission: 10800,
          clinicShare: 16200,
          effectiveRate: 36.0,
          totalProcedures: 18,
          hasActivePlan: true
        }
      ],
      encounterItems: []
    };

    service.getAnalytics('clinic-1', 'doc-1', '2026-10-01', '2026-10-31').subscribe((res) => {
      expect(res.totalGrossRevenue).toBe(50000);
      expect(service.analytics()).toEqual(mockData);
    });

    const req = httpMock.expectOne((r) => r.url === '/api/commission/analytics');
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('clinicId')).toBe('clinic-1');
    expect(req.request.params.get('doctorId')).toBe('doc-1');
    req.flush(mockData);
  });

  it('7. should upsert doctor commission plan via POST /api/commission/plans', () => {
    const payload = {
      doctorId: 'doc-1',
      defaultCommissionRate: 35,
      labFeeDeductionType: 'BeforeCommission' as const,
      specialtyRates: { Endodontics: 40 },
      isActive: true
    };

    const mockPlan: DoctorCommissionPlan = {
      id: 'plan-1',
      doctorId: 'doc-1',
      defaultCommissionRate: 35,
      labFeeDeductionType: 'BeforeCommission',
      specialtyRates: { Endodontics: 40 },
      isActive: true,
      createdAt: '2026-10-01T00:00:00Z'
    };

    service.upsertPlan(payload).subscribe((res) => {
      expect(res.id).toBe('plan-1');
      expect(res.defaultCommissionRate).toBe(35);
    });

    const req = httpMock.expectOne('/api/commission/plans');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    req.flush(mockPlan);
  });

  it('8. should settle commission payout via PUT /api/commission/payouts/:id/settle', () => {
    const payoutId = 'payout-123';
    const settleDto = { paymentReference: 'CIB-TRX-998877', notes: 'Wire transfer confirmed' };

    service.settlePayout(payoutId, settleDto).subscribe((res) => {
      expect(res.status).toBe('Paid');
    });

    const req = httpMock.expectOne(`/api/commission/payouts/${payoutId}/settle`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(settleDto);
    req.flush({ id: payoutId, status: 'Paid', paymentReference: 'CIB-TRX-998877' });
  });
});

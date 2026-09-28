import { TestBed } from '@angular/core/testing';
import { PatientDebtService } from './patient-debt.service';
import { BillingService } from '../../features/billing/services/billing.service';
import { BillingRecord } from '../../features/billing/models/billing.model';
import { of } from 'rxjs';

describe('PatientDebtService (BR-FIN-02)', () => {
  let service: PatientDebtService;
  let mockBillingService: any;

  const mockRecords: BillingRecord[] = [
    // Patient 1: Paid invoice
    {
      id: 'inv-1',
      patientId: 'pat-1',
      amount: 500,
      paidAmount: 500,
      status: 'paid',
      dateIssued: '2026-09-01',
      paymentMethod: 'Cash'
    },
    // Patient 1: Partially paid invoice
    {
      id: 'inv-2',
      patientId: 'pat-1',
      amount: 1200,
      paidAmount: 400,
      status: 'pending',
      dateIssued: '2026-09-10',
      paymentMethod: 'Cash'
    },
    // Patient 1: Completely unpaid overdue invoice
    {
      id: 'inv-3',
      patientId: 'pat-1',
      amount: 300,
      paidAmount: 0,
      status: 'overdue',
      dateIssued: '2026-09-15',
      paymentMethod: null
    },
    // Patient 2: All paid
    {
      id: 'inv-4',
      patientId: 'pat-2',
      amount: 450,
      paidAmount: 450,
      status: 'paid',
      dateIssued: '2026-09-12',
      paymentMethod: 'Credit Card'
    },
    // Patient 3: Pending invoice with undefined paidAmount (defaults to unpaid full amount)
    {
      id: 'inv-5',
      patientId: 'pat-3',
      amount: 800,
      status: 'pending',
      dateIssued: '2026-09-20',
      paymentMethod: null
    }
  ];

  beforeEach(() => {
    mockBillingService = {
      getAll: jasmine.createSpy('getAll').and.returnValue(of(mockRecords))
    };

    TestBed.configureTestingModule({
      providers: [
        PatientDebtService,
        { provide: BillingService, useValue: mockBillingService }
      ]
    });

    service = TestBed.inject(PatientDebtService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('calculatePatientDebt', () => {
    it('should return 0 debt when patient has no records', () => {
      const debt = service.calculatePatientDebt('pat-unknown', mockRecords);
      expect(debt.totalDebt).toBe(0);
      expect(debt.unpaidCount).toBe(0);
      expect(debt.unpaidInvoices.length).toBe(0);
    });

    it('should return 0 debt when all records for the patient are fully paid', () => {
      const debt = service.calculatePatientDebt('pat-2', mockRecords);
      expect(debt.totalDebt).toBe(0);
      expect(debt.unpaidCount).toBe(0);
      expect(debt.unpaidInvoices.length).toBe(0);
    });

    it('should calculate total debt combining partial payment and unpaid invoices for patient 1', () => {
      // inv-1: 500 paid -> 0 debt
      // inv-2: 1200 - 400 = 800 debt
      // inv-3: 300 - 0 = 300 debt
      // Total debt = 800 + 300 = 1100
      const debt = service.calculatePatientDebt('pat-1', mockRecords);
      expect(debt.totalDebt).toBe(1100);
      expect(debt.unpaidCount).toBe(2);
      expect(debt.unpaidInvoices.length).toBe(2);

      const inv2Detail = debt.unpaidInvoices.find(i => i.invoice.id === 'inv-2');
      expect(inv2Detail?.balanceDue).toBe(800);

      const inv3Detail = debt.unpaidInvoices.find(i => i.invoice.id === 'inv-3');
      expect(inv3Detail?.balanceDue).toBe(300);
    });

    it('should calculate full amount as debt when paidAmount is undefined and status is not paid', () => {
      const debt = service.calculatePatientDebt('pat-3', mockRecords);
      expect(debt.totalDebt).toBe(800);
      expect(debt.unpaidCount).toBe(1);
      expect(debt.unpaidInvoices[0].balanceDue).toBe(800);
    });

    it('should return 0 when patientId or records are null/empty', () => {
      expect(service.calculatePatientDebt('', mockRecords).totalDebt).toBe(0);
      expect(service.calculatePatientDebt('pat-1', []).totalDebt).toBe(0);
    });
  });

  describe('buildDebtMap', () => {
    it('should build a lookup map of debts for all patients', () => {
      const debtMap = service.buildDebtMap(mockRecords);
      expect(debtMap.has('pat-1')).toBeTrue();
      expect(debtMap.has('pat-2')).toBeTrue();
      expect(debtMap.has('pat-3')).toBeTrue();

      expect(debtMap.get('pat-1')?.totalDebt).toBe(1100);
      expect(debtMap.get('pat-2')?.totalDebt).toBe(0);
      expect(debtMap.get('pat-3')?.totalDebt).toBe(800);
    });
  });

  describe('loadAllPatientDebts & getDebtForPatient', () => {
    it('should load records via billingService and return the map of debts', (done) => {
      service.loadAllPatientDebts().subscribe(map => {
        expect(map.get('pat-1')?.totalDebt).toBe(1100);
        expect(mockBillingService.getAll).toHaveBeenCalled();
        done();
      });
    });

    it('should load records and return debt for specific patient', (done) => {
      service.getDebtForPatient('pat-1').subscribe(debt => {
        expect(debt.totalDebt).toBe(1100);
        expect(debt.unpaidCount).toBe(2);
        done();
      });
    });
  });
});

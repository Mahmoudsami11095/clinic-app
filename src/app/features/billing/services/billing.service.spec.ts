import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { BillingService } from './billing.service';
import { PatientService } from '../../patients/services/patient.service';
import { AppointmentService } from '../../appointments/services/appointment.service';
import { BillingRecord } from '../models/billing.model';

describe('BillingService (including BR-FIN-03)', () => {
  let service: BillingService;
  let httpMock: HttpTestingController;
  let mockPatientService: jasmine.SpyObj<PatientService>;
  let mockAppointmentService: jasmine.SpyObj<AppointmentService>;

  beforeEach(() => {
    mockPatientService = jasmine.createSpyObj('PatientService', ['getAll']);
    mockAppointmentService = jasmine.createSpyObj('AppointmentService', ['getAll']);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        BillingService,
        { provide: PatientService, useValue: mockPatientService },
        { provide: AppointmentService, useValue: mockAppointmentService }
      ]
    });

    service = TestBed.inject(BillingService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should fetch all billing records via GET /api/billing', () => {
    const mockData: BillingRecord[] = [
      {
        id: '1',
        patientId: 'pat-1',
        invoiceNumber: 'INV-2026-00001',
        amount: 200,
        status: 'paid',
        dateIssued: '2026-10-01',
        paymentMethod: 'Cash'
      }
    ];

    service.getAll().subscribe(records => {
      expect(records).toEqual(mockData);
    });

    const req = httpMock.expectOne('/api/billing');
    expect(req.request.method).toBe('GET');
    req.flush({ data: mockData });
  });

  it('should create billing record via POST /api/billing and receive sequential invoiceNumber (BR-FIN-03)', () => {
    const newRecord: BillingRecord = {
      id: '2',
      patientId: 'pat-2',
      amount: 450,
      status: 'pending',
      dateIssued: '2026-10-02',
      paymentMethod: 'Credit Card'
    };

    const serverResponse = {
      message: 'Created',
      data: {
        ...newRecord,
        invoiceNumber: 'INV-2026-00002'
      }
    };

    service.create(newRecord).subscribe(res => {
      expect(res.data.invoiceNumber).toBe('INV-2026-00002');
    });

    const req = httpMock.expectOne('/api/billing');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(newRecord);
    req.flush(serverResponse);
  });

  it('should void an invoice with mandatory reason via PUT /api/billing/:id/void (BR-FIN-03)', () => {
    const invoiceId = 'inv-101';
    const reason = 'Incorrect clinical treatment billed; corrected on re-issue.';

    const voidResponse = {
      message: 'Invoice voided successfully.',
      data: {
        id: invoiceId,
        patientId: 'pat-1',
        invoiceNumber: 'INV-2026-00005',
        amount: 300,
        paidAmount: 0,
        status: 'voided',
        dateIssued: '2026-10-01',
        paymentMethod: null,
        voidReason: reason,
        voidedAt: '2026-10-03T14:00:00Z'
      }
    };

    service.void(invoiceId, reason).subscribe(res => {
      expect(res.data.status).toBe('voided');
      expect(res.data.voidReason).toBe(reason);
      expect(res.data.paidAmount).toBe(0);
    });

    const req = httpMock.expectOne(`/api/billing/${invoiceId}/void`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ reason });
    req.flush(voidResponse);
  });
});

import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { RecallService } from './recall.service';
import { PatientRecall, RecallSummary } from '../models/recall.model';

describe('RecallService', () => {
  let service: RecallService;
  let httpMock: HttpTestingController;

  const mockRecall: PatientRecall = {
    id: 'rcl-1',
    recallNumber: 'RCL-202610-0001',
    clinicId: 'c1',
    clinicName: 'Downtown Clinic',
    patientId: 'pat1',
    patientName: 'Kareem Adel',
    patientPhone: '+201001234567',
    doctorId: 'doc1',
    doctorName: 'Dr. Sarah',
    recallType: 'PeriodontalMaintenance',
    recallIntervalMonths: 6,
    dueDate: new Date().toISOString(),
    isOverdue: false,
    status: 'Due',
    notificationChannel: 'WhatsApp',
    reminderCount: 0,
    createdAt: new Date().toISOString()
  };

  const mockSummary: RecallSummary = {
    totalDue: 10,
    overdueCount: 2,
    dispatchedCount: 15,
    bookedCount: 5,
    completedCount: 3,
    conversionRatePercentage: 34.8
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        RecallService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });

    service = TestBed.inject(RecallService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should fetch recalls by clinic', () => {
    service.getRecalls('c1', 'Due').subscribe(data => {
      expect(data.length).toBe(1);
      expect(data[0].recallNumber).toBe('RCL-202610-0001');
    });

    const req = httpMock.expectOne('/api/recalls?clinicId=c1&status=Due&');
    expect(req.request.method).toBe('GET');
    req.flush({ data: [mockRecall] });
  });

  it('should fetch recall summary metrics', () => {
    service.getSummary('c1').subscribe(res => {
      expect(res.totalDue).toBe(10);
      expect(res.conversionRatePercentage).toBe(34.8);
    });

    const req = httpMock.expectOne('/api/recalls/summary?clinicId=c1');
    expect(req.request.method).toBe('GET');
    req.flush({ data: mockSummary });
  });

  it('should dispatch WhatsApp reminder', () => {
    service.dispatchRecall('rcl-1', { channel: 'WhatsApp' }).subscribe();

    const req = httpMock.expectOne('/api/recalls/rcl-1/dispatch');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ channel: 'WhatsApp' });
    req.flush({ message: 'Dispatched' });
  });

  it('should trigger batch dispatch', () => {
    service.batchDispatch('c1').subscribe(res => {
      expect(res.count).toBe(5);
    });

    const req = httpMock.expectOne('/api/recalls/batch-dispatch?clinicId=c1');
    expect(req.request.method).toBe('POST');
    req.flush({ count: 5, message: 'Queued' });
  });
});

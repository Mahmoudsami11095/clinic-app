import { TestBed } from '@angular/core/testing';
import { DentalService, DentalLog, RawDentalLog } from './dental.service';
import { AuthService } from '../auth/auth.service';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';

describe('DentalService (Odontogram Logs & Procedure Sync)', () => {
  let service: DentalService;
  let httpTesting: HttpTestingController;

  const mockUser = {
    id: 'u-dentist-1',
    name: 'Dr. Tarek Dentist',
    email: 'dentist@clinic.com',
    role: 'doctor' as const,
    doctorId: 'doc-dental-1',
    title: 'Dr.'
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        DentalService,
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: AuthService,
          useValue: {
            currentUser: signal(mockUser),
            isAuthenticated: () => true
          }
        }
      ]
    });

    service = TestBed.inject(DentalService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  describe('getLogs', () => {
    it('should fetch dental logs and filter by patientId', () => {
      const mockRawLogs: RawDentalLog[] = [
        {
          id: 'log-1',
          patientId: 'pat-100',
          toothNumber: 16,
          doctorId: 'doc-1',
          doctorName: 'Dr. Test',
          date: '2026-10-04',
          status: 'caries',
          painLevel: 2,
          cost: 250,
          stage: 'proposed'
        },
        {
          id: 'log-2',
          patientId: 'pat-999', // Different patient
          toothNumber: 21,
          doctorId: 'doc-1',
          doctorName: 'Dr. Test',
          date: '2026-10-04',
          status: 'healthy',
          painLevel: 0
        }
      ];

      service.getLogs('pat-100').subscribe(logs => {
        expect(logs.length).toBe(1);
        expect(logs[0].id).toBe('log-1');
        expect(logs[0].toothNumber).toBe(16);
        expect(logs[0].status).toEqual(['caries']);
      });

      const req = httpTesting.expectOne('/api/dental');
      expect(req.request.method).toBe('GET');
      req.flush({ data: mockRawLogs });
    });
  });

  describe('addLog', () => {
    it('should enrich payload with doctor metadata and post to /api/dental', () => {
      service.addLog({
        patientId: 'pat-100',
        toothNumber: 16,
        status: ['caries'],
        painLevel: 3,
        treatment: 'Composite Restoration',
        cost: 350
      }).subscribe(created => {
        expect(created.id).toBeDefined();
        expect(created.doctorName).toBe('Dr. Tarek Dentist');
      });

      const req = httpTesting.expectOne('/api/dental');
      expect(req.request.method).toBe('POST');
      expect(req.request.body.patientId).toBe('pat-100');
      expect(req.request.body.doctorId).toBe('doc-dental-1');

      req.flush({
        message: 'Created',
        data: {
          id: 'new-log-id',
          patientId: 'pat-100',
          toothNumber: 16,
          doctorId: 'doc-dental-1',
          doctorName: 'Dr. Tarek Dentist',
          date: '2026-10-04',
          status: ['caries'],
          painLevel: 3,
          cost: 350,
          stage: 'completed'
        }
      });
    });
  });

  describe('updateStage', () => {
    it('should put stage update to /api/dental/{id}/stage', () => {
      service.updateStage('log-1', 'in_progress').subscribe(updated => {
        expect(updated.stage).toBe('in_progress');
      });

      const req = httpTesting.expectOne('/api/dental/log-1/stage');
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual({ stage: 'in_progress' });

      req.flush({
        message: 'Updated',
        data: {
          id: 'log-1',
          patientId: 'pat-100',
          toothNumber: 16,
          doctorId: 'doc-1',
          doctorName: 'Dr. Test',
          date: '2026-10-04',
          status: ['caries'],
          painLevel: 2,
          stage: 'in_progress'
        }
      });
    });
  });

  describe('pushToBilling', () => {
    it('should post to /api/dental/{id}/push-to-billing and return invoice', () => {
      service.pushToBilling('log-1').subscribe(res => {
        expect(res.invoice.invoiceNumber).toBe('INV-2026-0001');
      });

      const req = httpTesting.expectOne('/api/dental/log-1/push-to-billing');
      expect(req.request.method).toBe('POST');

      req.flush({
        message: 'Invoice created',
        data: {
          id: 'log-1',
          patientId: 'pat-100',
          toothNumber: 16,
          doctorId: 'doc-1',
          doctorName: 'Dr. Test',
          date: '2026-10-04',
          status: ['caries'],
          painLevel: 0,
          stage: 'invoiced'
        },
        invoice: { id: 'inv-1', invoiceNumber: 'INV-2026-0001', amount: 350 }
      });
    });
  });
});

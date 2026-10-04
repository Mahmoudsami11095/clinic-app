import { TestBed } from '@angular/core/testing';
import { RadiologyService, RadiologyCenter, RadiologyRecord } from './radiology.service';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from '../../../../environments/environment';

describe('RadiologyService (Imaging Orders & Scan Centers)', () => {
  let service: RadiologyService;
  let httpTesting: HttpTestingController;
  const baseUrl = `${environment.apiUrl}/Radiology`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        RadiologyService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });

    service = TestBed.inject(RadiologyService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  describe('Centers API', () => {
    it('should fetch list of radiology diagnostic centers', () => {
      const mockCenters: RadiologyCenter[] = [
        { id: 'center-1', name: 'Alpha Scan', contactNumber: '+201019998888', city: 'Cairo' }
      ];

      service.getCenters().subscribe(centers => {
        expect(centers.length).toBe(1);
        expect(centers[0].name).toBe('Alpha Scan');
      });

      const req = httpTesting.expectOne(`${baseUrl}/centers`);
      expect(req.request.method).toBe('GET');
      req.flush({ data: mockCenters });
    });

    it('should create new radiology center', () => {
      service.createCenter({
        name: 'TechnoScan',
        contactNumber: '+201020001111',
        city: 'Giza'
      }).subscribe(created => {
        expect(created.id).toBe('new-center-id');
      });

      const req = httpTesting.expectOne(`${baseUrl}/centers`);
      expect(req.request.method).toBe('POST');
      req.flush({ data: { id: 'new-center-id', name: 'TechnoScan' } });
    });
  });

  describe('Records API', () => {
    it('should fetch records by doctorId', () => {
      const mockRecords: RadiologyRecord[] = [
        {
          id: 'rec-1',
          doctorId: 'doc-10',
          patientId: 'pat-1',
          patientName: 'Ahmed Omar',
          radiologyCenterId: 'center-1',
          radiologyCenterName: 'Alpha Scan',
          procedureName: 'Panoramic Dental Radiograph',
          amountPaid: 200,
          date: '2026-10-04'
        }
      ];

      service.getRecords('doc-10').subscribe(records => {
        expect(records.length).toBe(1);
        expect(records[0].procedureName).toBe('Panoramic Dental Radiograph');
      });

      const req = httpTesting.expectOne(`${baseUrl}/records?doctorId=doc-10`);
      expect(req.request.method).toBe('GET');
      req.flush({ data: mockRecords });
    });

    it('should create new radiology order record', () => {
      service.createRecord({
        doctorId: 'doc-10',
        patientId: 'pat-1',
        radiologyCenterId: 'center-1',
        procedureName: 'CBCT 3D Scan',
        amountPaid: 450,
        date: '2026-10-04'
      }).subscribe(rec => {
        expect(rec.id).toBe('rec-new');
      });

      const req = httpTesting.expectOne(`${baseUrl}/records`);
      expect(req.request.method).toBe('POST');
      req.flush({ data: { id: 'rec-new', procedureName: 'CBCT 3D Scan' } });
    });
  });
});

import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { EquipmentService } from './equipment.service';
import { Equipment, EquipmentMaintenanceLogRequest } from '../models/equipment.model';
import { environment } from '../../../../environments/environment';

describe('EquipmentService', () => {
  let service: EquipmentService;
  let httpMock: HttpTestingController;
  const apiUrl = `${environment.apiUrl}/equipment`;

  const mockEquipment: Equipment = {
    id: 'eq-1',
    clinicId: 'clinic-1',
    name: 'Midmark M11 UltraClave',
    category: 'Sterilization',
    serialNumber: 'SN-001',
    modelNumber: 'M11',
    manufacturer: 'Midmark',
    roomOrChair: 'Sterilization Room',
    status: 'Operational',
    purchaseCost: 7500,
    maintenanceIntervalDays: 90
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [EquipmentService]
    });
    service = TestBed.inject(EquipmentService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getEquipment', () => {
    it('should query all equipment without clinicId param when clinicId is "all" or omitted', () => {
      service.getEquipment('all').subscribe((res) => {
        expect(res.data.length).toBe(1);
        expect(res.data[0].name).toBe('Midmark M11 UltraClave');
      });

      const req = httpMock.expectOne(apiUrl);
      expect(req.request.method).toBe('GET');
      req.flush({ data: [mockEquipment] });
    });

    it('should append clinicId query parameter when a specific clinic is selected', () => {
      service.getEquipment('clinic-1').subscribe((res) => {
        expect(res.data.length).toBe(1);
      });

      const req = httpMock.expectOne(`${apiUrl}?clinicId=clinic-1`);
      expect(req.request.method).toBe('GET');
      req.flush({ data: [mockEquipment] });
    });
  });

  describe('getById', () => {
    it('should query specific equipment item by ID', () => {
      service.getById('eq-1').subscribe((res) => {
        expect(res.data.id).toBe('eq-1');
        expect(res.data.serialNumber).toBe('SN-001');
      });

      const req = httpMock.expectOne(`${apiUrl}/eq-1`);
      expect(req.request.method).toBe('GET');
      req.flush({ data: mockEquipment });
    });
  });

  describe('create', () => {
    it('should POST new equipment payload to API', () => {
      const newDevice: Equipment = {
        name: 'Cavitron Scaler',
        clinicId: 'clinic-1',
        category: 'Operatory',
        status: 'Operational'
      };

      service.create(newDevice).subscribe((res) => {
        expect(res.message).toBe('Created');
        expect(res.data.name).toBe('Cavitron Scaler');
      });

      const req = httpMock.expectOne(apiUrl);
      expect(req.request.method).toBe('POST');
      expect(req.request.body.name).toBe('Cavitron Scaler');
      req.flush({ message: 'Created', data: { ...newDevice, id: 'eq-new' } });
    });
  });

  describe('update', () => {
    it('should PUT updated equipment payload', () => {
      const updated = { ...mockEquipment, status: 'Maintenance Due' as const };

      service.update('eq-1', updated).subscribe((res) => {
        expect(res.data.status).toBe('Maintenance Due');
      });

      const req = httpMock.expectOne(`${apiUrl}/eq-1`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body.status).toBe('Maintenance Due');
      req.flush({ message: 'Updated', data: updated });
    });
  });

  describe('delete', () => {
    it('should DELETE equipment by ID', () => {
      service.delete('eq-1').subscribe((res) => {
        expect(res.message).toBe('Deleted');
      });

      const req = httpMock.expectOne(`${apiUrl}/eq-1`);
      expect(req.request.method).toBe('DELETE');
      req.flush({ message: 'Deleted' });
    });
  });

  describe('logMaintenance', () => {
    it('should POST maintenance log to equipment maintenance sub-resource', () => {
      const reqPayload: EquipmentMaintenanceLogRequest = {
        serviceDate: '2026-10-05',
        nextDueDate: '2027-01-05',
        notes: 'Annual inspection and calibration.',
        status: 'Operational',
        serviceProvider: 'Authorized Tech',
        serviceContactPhone: '+1 555-1234'
      };

      service.logMaintenance('eq-1', reqPayload).subscribe((res) => {
        expect(res.message).toBe('Maintenance logged');
        expect(res.data.status).toBe('Operational');
      });

      const req = httpMock.expectOne(`${apiUrl}/eq-1/maintenance`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body.notes).toBe('Annual inspection and calibration.');
      req.flush({ message: 'Maintenance logged', data: { ...mockEquipment, status: 'Operational' } });
    });
  });

  describe('seedDefaults', () => {
    it('should POST to seed-defaults endpoint with encoded clinicId', () => {
      service.seedDefaults('clinic-abc').subscribe((res) => {
        expect(res.message).toBe('Seeded 5 devices');
        expect(res.data.length).toBe(5);
      });

      const req = httpMock.expectOne(`${apiUrl}/seed-defaults?clinicId=clinic-abc`);
      expect(req.request.method).toBe('POST');
      req.flush({ message: 'Seeded 5 devices', data: [mockEquipment, mockEquipment, mockEquipment, mockEquipment, mockEquipment] });
    });
  });
});

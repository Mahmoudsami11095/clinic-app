import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { MaterialsService } from './materials.service';
import { Material } from '../models/material.model';

describe('MaterialsService (BR-INV-02 Low-Stock Threshold Trigger)', () => {
  let service: MaterialsService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [MaterialsService]
    });
    service = TestBed.inject(MaterialsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('Low-Stock Threshold Detection (isLowStock / isOutOfStock)', () => {
    it('should identify material as low-stock when quantity is below configured threshold', () => {
      const material: Material = {
        doctorId: 'doc-1',
        name: 'Surgical Gauze',
        quantity: 3,
        minStockAlert: 10
      };
      expect(service.isLowStock(material)).toBeTrue();
      expect(service.isOutOfStock(material)).toBeFalse();
    });

    it('should identify material as low-stock when quantity exactly equals configured threshold', () => {
      const material: Material = {
        doctorId: 'doc-1',
        name: 'Dental Needles 30G',
        quantity: 5,
        minStockAlert: 5
      };
      expect(service.isLowStock(material)).toBeTrue();
      expect(service.isOutOfStock(material)).toBeFalse();
    });

    it('should fallback to default threshold of 5 when minStockAlert is undefined', () => {
      const atDefaultThreshold: Material = {
        doctorId: 'doc-1',
        name: 'Suction Tips',
        quantity: 5
      };
      const aboveDefaultThreshold: Material = {
        doctorId: 'doc-1',
        name: 'Suction Tips',
        quantity: 6
      };
      expect(service.isLowStock(atDefaultThreshold)).toBeTrue();
      expect(service.isLowStock(aboveDefaultThreshold)).toBeFalse();
    });

    it('should return false for isLowStock when quantity is strictly greater than threshold', () => {
      const material: Material = {
        doctorId: 'doc-1',
        name: 'Prophy Paste',
        quantity: 25,
        minStockAlert: 10
      };
      expect(service.isLowStock(material)).toBeFalse();
    });

    it('should identify material as out-of-stock when quantity is 0 or negative', () => {
      const zeroQty: Material = {
        doctorId: 'doc-1',
        name: 'Etching Gel',
        quantity: 0,
        minStockAlert: 5
      };
      const negQty: Material = {
        doctorId: 'doc-1',
        name: 'Bonding Agent',
        quantity: -1,
        minStockAlert: 5
      };
      expect(service.isOutOfStock(zeroQty)).toBeTrue();
      expect(service.isOutOfStock(negQty)).toBeTrue();
    });
  });

  describe('getLowStock API query execution', () => {
    it('should call /api/materials/low-stock without parameters when neither clinic nor doctor is provided', () => {
      service.getLowStock().subscribe(res => {
        expect(res.data.length).toBe(1);
      });

      const req = httpMock.expectOne('/api/materials/low-stock');
      expect(req.request.method).toBe('GET');
      req.flush({ data: [{ id: 'm-1', name: 'Masks', quantity: 2, minStockAlert: 10 }] });
    });

    it('should append clinicId and doctorId parameters when specified', () => {
      service.getLowStock('clinic-123', 'doc-456').subscribe(res => {
        expect(res.data.length).toBe(0);
      });

      const req = httpMock.expectOne('/api/materials/low-stock?clinicId=clinic-123&doctorId=doc-456');
      expect(req.request.method).toBe('GET');
      req.flush({ data: [] });
    });
  });

  describe('seedDefaults API execution', () => {
    it('should call /api/materials/seed-defaults with clinicId parameter', () => {
      service.seedDefaults('clinic-789').subscribe(res => {
        expect(res.message).toBe('Seeded');
        expect(res.data.length).toBe(1);
      });

      const req = httpMock.expectOne('/api/materials/seed-defaults?clinicId=clinic-789');
      expect(req.request.method).toBe('POST');
      req.flush({ message: 'Seeded', data: [{ id: 'm-default-1', name: 'Sili Kit BMS', quantity: 0, isDefault: true }] });
    });
  });
});

import { TestBed } from '@angular/core/testing';
import { InventoryListComponent } from './inventory-list.component';
import { MaterialsService } from '../../services/materials.service';
import { AuthService } from '../../../../core/auth/auth.service';
import { ClinicService } from '../../../../core/services/clinic.service';
import { ToastrService } from 'ngx-toastr';
import { LanguageService } from '../../../../core/i18n/language.service';
import { of } from 'rxjs';
import { signal } from '@angular/core';
import { Material } from '../../models/material.model';

describe('REQ-INV-02: Supplier & Inward Shipment Workflow', () => {
  let component: InventoryListComponent;
  let mockMaterialsService: any;
  let mockToastr: any;

  const mockMaterials: Material[] = [
    {
      id: 'mat-1',
      name: 'Composite Resin Syringes',
      quantity: 12,
      unit: 'Boxes',
      doctorId: 'doc-1',
      clinicId: 'c1',
      minStockAlert: 5,
      supplierName: 'Dental Direct Med',
      purchaseOrderRef: 'PO-2026-901'
    }
  ];

  beforeEach(() => {
    mockToastr = {
      success: jasmine.createSpy('success'),
      error: jasmine.createSpy('error'),
      warning: jasmine.createSpy('warning')
    };

    mockMaterialsService = {
      getAll: jasmine.createSpy('getAll').and.returnValue(of(mockMaterials)),
      getByDoctor: jasmine.createSpy('getByDoctor').and.returnValue(of({ data: mockMaterials })),
      getByDoctorAndClinic: jasmine.createSpy('getByDoctorAndClinic').and.returnValue(of(mockMaterials)),
      isExpired: () => false,
      isLowStock: () => false,
      isOutOfStock: () => false,
      receiveShipment: jasmine.createSpy('receiveShipment').and.callFake((id: string, payload: any) => of({
        message: 'Received',
        data: {
          ...mockMaterials[0],
          quantity: mockMaterials[0].quantity + payload.quantityReceived,
          supplierName: payload.supplierName,
          purchaseOrderRef: payload.purchaseOrderRef
        }
      }))
    };

    TestBed.configureTestingModule({
      providers: [
        InventoryListComponent,
        { provide: MaterialsService, useValue: mockMaterialsService },
        { provide: AuthService, useValue: { currentUser: signal({ id: 'u1', role: 'doctor' }), isDoctor: () => true, isAssistant: () => false } },
        { provide: ClinicService, useValue: { activeClinicId: signal('c1'), allowedClinics: signal([{ id: 'c1' }]), setActiveClinicId: () => {} } },
        { provide: LanguageService, useValue: { translate: (k: string) => k, isLoaded: signal(true) } },
        { provide: ToastrService, useValue: mockToastr }
      ]
    });

    component = TestBed.inject(InventoryListComponent);
    component.materials = [...mockMaterials];
  });

  describe('Inward Shipment Modal Controls', () => {
    it('should open receive shipment modal with pre-filled material data', () => {
      const mat = mockMaterials[0];
      component.openReceiveShipmentModal(mat);

      expect(component.isReceiveModalOpen()).toBeTrue();
      expect(component.shipmentMaterialId).toBe('mat-1');
      expect(component.shipmentSupplier).toBe('Dental Direct Med');
      expect(component.shipmentPORef).toBe('PO-2026-901');
    });

    it('should close receive shipment modal and reset selection', () => {
      component.openReceiveShipmentModal(mockMaterials[0]);
      component.closeReceiveShipmentModal();

      expect(component.isReceiveModalOpen()).toBeFalse();
      expect(component.selectedMaterialForShipment()).toBeNull();
    });
  });

  describe('Shipment Inward Processing', () => {
    it('should show warning if shipment quantity is zero or material missing', () => {
      component.shipmentMaterialId = '';
      component.shipmentQty = 0;

      component.confirmInwardShipment();

      expect(mockToastr.warning).toHaveBeenCalled();
      expect(mockMaterialsService.receiveShipment).not.toHaveBeenCalled();
    });

    it('should dispatch receiveShipment and reload materials on confirmation', () => {
      component.shipmentMaterialId = 'mat-1';
      component.shipmentQty = 50;
      component.shipmentSupplier = '3M Oral Care Egypt';
      component.shipmentPORef = 'PO-2026-991';
      component.shipmentBatch = 'LOT-3M-X';
      component.shipmentExpiry = '2028-12-31';
      component.shipmentUnitCost = 45.0;

      component.confirmInwardShipment();

      expect(mockMaterialsService.receiveShipment).toHaveBeenCalledWith('mat-1', {
        quantityReceived: 50,
        supplierName: '3M Oral Care Egypt',
        purchaseOrderRef: 'PO-2026-991',
        batchNumber: 'LOT-3M-X',
        expirationDate: '2028-12-31',
        unitCost: 45.0
      });

      expect(component.isReceiveModalOpen()).toBeFalse();
      expect(mockToastr.success).toHaveBeenCalledWith(
        jasmine.stringMatching(/Received 50 units for Composite Resin Syringes/),
        jasmine.any(String)
      );
      expect(mockMaterialsService.getByDoctor).toHaveBeenCalled();
    });
  });
});

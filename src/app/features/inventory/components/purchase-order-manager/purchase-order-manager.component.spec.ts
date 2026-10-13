import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PurchaseOrderManagerComponent } from './purchase-order-manager.component';
import { ProcurementService } from '../../../../core/services/procurement/procurement.service';
import { MaterialsService } from '../../services/materials.service';
import { of } from 'rxjs';

describe('PurchaseOrderManagerComponent', () => {
  let component: PurchaseOrderManagerComponent;
  let fixture: ComponentFixture<PurchaseOrderManagerComponent>;
  let mockProcurementService: jasmine.SpyObj<ProcurementService>;
  let mockMaterialsService: jasmine.SpyObj<MaterialsService>;

  beforeEach(async () => {
    mockProcurementService = jasmine.createSpyObj('ProcurementService', ['getOrders', 'getSuppliers', 'createDraftPO', 'dispatchOrder', 'receiveOrder']);
    mockMaterialsService = jasmine.createSpyObj('MaterialsService', ['getMaterials']);

    mockProcurementService.getOrders.and.returnValue(of({ data: [] }));
    mockProcurementService.getSuppliers.and.returnValue(of({ data: [] }));
    mockMaterialsService.getMaterials.and.returnValue(of({ data: [] }));

    await TestBed.configureTestingModule({
      imports: [PurchaseOrderManagerComponent],
      providers: [
        { provide: ProcurementService, useValue: mockProcurementService },
        { provide: MaterialsService, useValue: mockMaterialsService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(PurchaseOrderManagerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load data on init', () => {
    expect(mockProcurementService.getOrders).toHaveBeenCalled();
    expect(mockProcurementService.getSuppliers).toHaveBeenCalled();
    expect(mockMaterialsService.getMaterials).toHaveBeenCalled();
  });

  it('should add item to new PO', () => {
    component.newPo.set({ supplierId: 'sup1', items: [] });
    component.addItem();
    expect(component.newPo().items.length).toBe(1);
    expect(component.newPo().items[0].quantity).toBe(1);
  });

  it('should remove item from new PO', () => {
    component.newPo.set({ supplierId: 'sup1', items: [{ materialId: 'm1', quantity: 1, unitPrice: 10 }] });
    component.removeItem(0);
    expect(component.newPo().items.length).toBe(0);
  });

  it('should dispatch order', () => {
    mockProcurementService.dispatchOrder.and.returnValue(of({ message: 'Success', data: {} as any }));
    component.dispatchOrder('po-123');
    expect(mockProcurementService.dispatchOrder).toHaveBeenCalledWith('po-123');
  });

  it('should receive order', () => {
    mockProcurementService.receiveOrder.and.returnValue(of({ message: 'Success', data: {} as any }));
    component.receiveOrder('po-123');
    expect(mockProcurementService.receiveOrder).toHaveBeenCalledWith('po-123');
  });
});

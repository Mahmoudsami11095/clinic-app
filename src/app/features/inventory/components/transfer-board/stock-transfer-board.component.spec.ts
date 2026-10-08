import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StockTransferBoardComponent } from './stock-transfer-board.component';
import { StockTransferService } from '../../services/stock-transfer.service';
import { ClinicService } from '../../../../core/services/clinic.service';
import { MaterialsService } from '../../services/materials.service';
import { LanguageService } from '../../../../core/i18n/language.service';
import { of } from 'rxjs';
import { signal } from '@angular/core';
import { StockTransferRequisition } from '../../models/stock-transfer.model';

describe('StockTransferBoardComponent', () => {
  let component: StockTransferBoardComponent;
  let fixture: ComponentFixture<StockTransferBoardComponent>;
  let mockTransferService: any;
  let mockClinicService: any;
  let mockMaterialsService: any;
  let mockLanguageService: any;

  const mockTransfers: StockTransferRequisition[] = [
    {
      id: 'trf-101',
      requisitionNumber: 'TRF-202610-0010',
      sourceClinicId: 'c1',
      sourceClinicName: 'Downtown Clinic',
      destinationClinicId: 'c2',
      destinationClinicName: 'Westside Clinic',
      materialId: 'm1',
      materialName: 'Bio-Oss Bone Graft 0.5g',
      quantityRequested: 5,
      quantityDamaged: 0,
      priority: 'Urgent',
      status: 'Requested',
      requestedByUserId: 'u1',
      requestedAt: new Date().toISOString()
    }
  ];

  beforeEach(async () => {
    mockTransferService = {
      getTransfers: jasmine.createSpy('getTransfers').and.returnValue(of(mockTransfers)),
      requestTransfer: jasmine.createSpy('requestTransfer').and.returnValue(of(mockTransfers[0])),
      dispatchTransfer: jasmine.createSpy('dispatchTransfer').and.returnValue(of({ message: 'Dispatched' })),
      receiveTransfer: jasmine.createSpy('receiveTransfer').and.returnValue(of({ message: 'Received' }))
    };

    mockClinicService = {
      activeClinicId: signal('c1'),
      clinics: signal([
        { id: 'c1', name: 'Downtown Clinic' },
        { id: 'c2', name: 'Westside Clinic' }
      ])
    };

    mockMaterialsService = {
      getMaterials: jasmine.createSpy('getMaterials').and.returnValue(of({
        data: [{ id: 'm1', name: 'Bio-Oss Bone Graft 0.5g', quantity: 20 }]
      }))
    };

    mockLanguageService = {
      translate: jasmine.createSpy('translate').and.callFake((k: string) => k),
      currentLang: signal('en'),
      dir: signal('ltr')
    };

    await TestBed.configureTestingModule({
      imports: [StockTransferBoardComponent],
      providers: [
        { provide: StockTransferService, useValue: mockTransferService },
        { provide: ClinicService, useValue: mockClinicService },
        { provide: MaterialsService, useValue: mockMaterialsService },
        { provide: LanguageService, useValue: mockLanguageService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(StockTransferBoardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should initialize and load transfers and materials', () => {
    expect(component).toBeTruthy();
    expect(mockTransferService.getTransfers).toHaveBeenCalledWith('c1');
    expect(component.transfers().length).toBe(1);
    expect(component.materialsList().length).toBe(1);
  });

  it('should calculate outbound and inbound counts based on active clinic', () => {
    expect(component.outboundCount()).toBe(1); // sourceClinicId === 'c1' and Requested
    expect(component.inboundCount()).toBe(0); // destinationClinicId !== 'c1'
  });

  it('should open request modal and validate form', () => {
    component.openRequestModal();
    expect(component.isRequestModalOpen()).toBeTrue();
    expect(component.reqModel.sourceClinicId).toBe('c1');
    expect(component.reqModel.destinationClinicId).toBe('c2');
    expect(component.isRequestValid()).toBeTrue();
  });

  it('should submit transfer request and refresh list', () => {
    component.openRequestModal();
    component.submitTransferRequest();

    expect(mockTransferService.requestTransfer).toHaveBeenCalled();
    expect(component.isRequestModalOpen()).toBeFalse();
    expect(mockTransferService.getTransfers).toHaveBeenCalledTimes(2);
  });

  it('should dispatch transfer with default courier payload', () => {
    component.openDispatchModal(mockTransfers[0]);

    expect(mockTransferService.dispatchTransfer).toHaveBeenCalledWith('trf-101', jasmine.objectContaining({
      quantityDispatched: 5
    }));
  });

  it('should open receive modal and submit physical inspection reconciliation', () => {
    const transitTransfer: StockTransferRequisition = {
      ...mockTransfers[0],
      status: 'InTransit',
      quantityDispatched: 5
    };

    component.openReceiveModal(transitTransfer);
    expect(component.isReceiveModalOpen()).toBeTrue();
    expect(component.receiveModel.quantityReceived).toBe(5);

    // Simulate 1 damaged unit
    component.receiveModel.quantityDamaged = 1;
    component.receiveModel.damageReason = 'BrokenSeal';
    component.submitReceiveShipment();

    expect(mockTransferService.receiveTransfer).toHaveBeenCalledWith('trf-101', jasmine.objectContaining({
      quantityReceived: 5,
      quantityDamaged: 1,
      damageReason: 'BrokenSeal'
    }));
    expect(component.isReceiveModalOpen()).toBeFalse();
  });
});

import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { StockTransferService } from './stock-transfer.service';
import { StockTransferRequisition, CreateStockTransferRequest } from '../models/stock-transfer.model';

describe('StockTransferService', () => {
  let service: StockTransferService;
  let httpMock: HttpTestingController;

  const mockTransfers: StockTransferRequisition[] = [
    {
      id: 'trf-1',
      requisitionNumber: 'TRF-202610-0001',
      sourceClinicId: 'c1',
      sourceClinicName: 'Downtown Clinic',
      destinationClinicId: 'c2',
      destinationClinicName: 'Westside Clinic',
      materialId: 'm1',
      materialName: 'Composite Shade A2',
      quantityRequested: 10,
      quantityDamaged: 0,
      priority: 'Normal',
      status: 'Requested',
      requestedByUserId: 'u1',
      requestedAt: new Date().toISOString()
    }
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        StockTransferService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });

    service = TestBed.inject(StockTransferService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should fetch stock transfers with direction query parameters', () => {
    service.getTransfers('c1', 'Requested', 'outbound').subscribe(data => {
      expect(data.length).toBe(1);
      expect(data[0].requisitionNumber).toBe('TRF-202610-0001');
    });

    const req = httpMock.expectOne('/api/inventory/transfers?direction=outbound&clinicId=c1&status=Requested');
    expect(req.request.method).toBe('GET');
    req.flush({ data: mockTransfers });
  });

  it('should post a new transfer request', () => {
    const requestPayload: CreateStockTransferRequest = {
      sourceClinicId: 'c1',
      destinationClinicId: 'c2',
      materialId: 'm1',
      quantityRequested: 10,
      priority: 'Urgent'
    };

    service.requestTransfer(requestPayload).subscribe(res => {
      expect(res.requisitionNumber).toBe('TRF-202610-0001');
    });

    const req = httpMock.expectOne('/api/inventory/transfers/request');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(requestPayload);
    req.flush(mockTransfers[0]);
  });

  it('should dispatch transfer and update status to InTransit', () => {
    const dispatchPayload = {
      quantityDispatched: 10,
      batchNumber: 'LOT-9988'
    };

    service.dispatchTransfer('trf-1', dispatchPayload).subscribe();

    const req = httpMock.expectOne('/api/inventory/transfers/trf-1/dispatch');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(dispatchPayload);
    req.flush({ message: 'Dispatched' });
  });

  it('should receive transfer with physical inspection check', () => {
    const receivePayload = {
      quantityReceived: 10,
      quantityDamaged: 1,
      damageReason: 'BrokenSeal'
    };

    service.receiveTransfer('trf-1', receivePayload).subscribe();

    const req = httpMock.expectOne('/api/inventory/transfers/trf-1/receive');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(receivePayload);
    req.flush({ message: 'Received' });
  });
});

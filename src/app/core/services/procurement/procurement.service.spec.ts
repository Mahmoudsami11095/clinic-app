import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ProcurementService } from './procurement.service';
import { environment } from '../../../../environments/environment';

describe('ProcurementService', () => {
  let service: ProcurementService;
  let httpMock: HttpTestingController;
  const apiUrl = `${environment.apiUrl}/procurement`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ProcurementService]
    });
    service = TestBed.inject(ProcurementService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should get suppliers', () => {
    service.getSuppliers().subscribe();
    const req = httpMock.expectOne(`${apiUrl}/suppliers`);
    expect(req.request.method).toBe('GET');
    req.flush({ data: [] });
  });

  it('should get orders with clinicId', () => {
    service.getOrders('clinic-123').subscribe();
    const req = httpMock.expectOne(`${apiUrl}/orders?clinicId=clinic-123`);
    expect(req.request.method).toBe('GET');
    req.flush({ data: [] });
  });

  it('should create a draft PO', () => {
    const dto = { clinicId: 'c1', supplierId: 's1', items: [] };
    service.createDraftPO(dto).subscribe();
    const req = httpMock.expectOne(`${apiUrl}/orders`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(dto);
    req.flush({ data: { id: 'po1' } });
  });

  it('should dispatch order', () => {
    service.dispatchOrder('po1').subscribe();
    const req = httpMock.expectOne(`${apiUrl}/orders/po1/dispatch`);
    expect(req.request.method).toBe('POST');
    req.flush({ message: 'Dispatched', data: {} });
  });

  it('should receive order', () => {
    service.receiveOrder('po1').subscribe();
    const req = httpMock.expectOne(`${apiUrl}/orders/po1/receive`);
    expect(req.request.method).toBe('POST');
    req.flush({ message: 'Received', data: {} });
  });
});

import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AiNoShowService } from './ai-no-show.service';
import { environment } from '../../../../environments/environment';

describe('AiNoShowService', () => {
  let service: AiNoShowService;
  let httpMock: HttpTestingController;
  const apiUrl = `${environment.apiUrl}/ai-no-show`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AiNoShowService]
    });
    service = TestBed.inject(AiNoShowService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should predict no show', () => {
    service.predictNoShow('app1').subscribe();
    const req = httpMock.expectOne(`${apiUrl}/predict/app1`);
    expect(req.request.method).toBe('POST');
    req.flush({ riskScore: 80, isHighRisk: true, details: '' });
  });

  it('should get standby queue', () => {
    service.getStandbyQueue('c1').subscribe();
    const req = httpMock.expectOne(`${apiUrl}/standby/c1`);
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('should join standby queue', () => {
    service.joinStandbyQueue({ doctorId: 'd1', patientId: 'p1', requestedDate: '2026-10-15' }).subscribe();
    const req = httpMock.expectOne(`${apiUrl}/standby`);
    expect(req.request.method).toBe('POST');
    req.flush({ id: '1' });
  });

  it('should trigger standby alerts', () => {
    service.triggerStandbyAlerts('app1').subscribe();
    const req = httpMock.expectOne(`${apiUrl}/trigger-standby/app1`);
    expect(req.request.method).toBe('POST');
    req.flush({ message: 'Success', notifiedCount: 1 });
  });
});

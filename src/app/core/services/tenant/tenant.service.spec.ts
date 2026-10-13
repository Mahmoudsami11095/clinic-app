import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TenantService } from './tenant.service';
import { environment } from '../../../../environments/environment';

describe('TenantService', () => {
  let service: TenantService;
  let httpMock: HttpTestingController;
  const apiUrl = `${environment.apiUrl}/tenants`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [TenantService]
    });
    service = TestBed.inject(TenantService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should onboard tenant', () => {
    const data: any = { organizationName: 'Org', subdomain: 'org', subscriptionTier: 'Starter', adminName: 'A', adminEmail: 'a@a', adminPassword: '1' };
    service.onboardTenant(data).subscribe();
    const req = httpMock.expectOne(`${apiUrl}/onboard`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(data);
    req.flush({ message: 'Success', tenantId: 't1', subdomain: 'org', loginUrl: '' });
  });

  it('should resolve tenant', () => {
    service.resolveTenant('org').subscribe();
    const req = httpMock.expectOne(`${apiUrl}/resolve/org`);
    expect(req.request.method).toBe('GET');
    req.flush({ tenantId: 't1', organizationName: 'Org', tier: 'Starter' });
  });
});

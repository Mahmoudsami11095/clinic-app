import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { WebAuthnService } from './webauthn.service';
import { environment } from '../../../environments/environment';

describe('WebAuthnService', () => {
  let service: WebAuthnService;
  let httpMock: HttpTestingController;
  const apiUrl = `${environment.apiUrl}/webauthn`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [WebAuthnService]
    });
    service = TestBed.inject(WebAuthnService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should register biometrics', () => {
    service.registerBiometrics().subscribe();
    
    const reqOptions = httpMock.expectOne(`${apiUrl}/register/options`);
    expect(reqOptions.request.method).toBe('POST');
    reqOptions.flush({ challenge: 'test' });

    const reqRegister = httpMock.expectOne(`${apiUrl}/register`);
    expect(reqRegister.request.method).toBe('POST');
    reqRegister.flush({ message: 'Success' });
  });

  it('should login with biometrics', () => {
    service.loginWithBiometrics().subscribe();
    
    const reqOptions = httpMock.expectOne(`${apiUrl}/authenticate/options`);
    expect(reqOptions.request.method).toBe('POST');
    reqOptions.flush({ challenge: 'test' });

    const reqAuth = httpMock.expectOne(`${apiUrl}/authenticate`);
    expect(reqAuth.request.method).toBe('POST');
    reqAuth.flush({ token: 'jwt', user: {} });
  });
});

import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { PatientPortalService } from './patient-portal.service';
import { environment } from '../../../environments/environment';

describe('PatientPortalService', () => {
  let service: PatientPortalService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [PatientPortalService]
    });
    service = TestBed.inject(PatientPortalService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created with initial empty signals', () => {
    expect(service).toBeTruthy();
    expect(service.currentUser()).toBeNull();
    expect(service.availableSlots().length).toBe(0);
  });

  it('should post phone number to send-otp endpoint', () => {
    service.sendOtp('+201012345678').subscribe((res) => {
      expect(res.success).toBeTrue();
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/portal/auth/send-otp`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ phoneNumber: '+201012345678' });
    req.flush({ success: true, message: 'Dispatched' });
  });

  it('should verify OTP and store token and patient user', () => {
    const mockUser = { id: 'p-1', name: 'Ahmed', phone: '+201012345678' };
    service.verifyOtp('+201012345678', '123456').subscribe((res) => {
      expect(res.token).toBe('jwt-token-xyz');
      expect(service.authToken()).toBe('jwt-token-xyz');
      expect(service.currentUser()?.name).toBe('Ahmed');
      expect(localStorage.getItem('portal_token')).toBe('jwt-token-xyz');
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/portal/auth/verify-otp`);
    expect(req.request.method).toBe('POST');
    req.flush({ token: 'jwt-token-xyz', patient: mockUser });
  });

  it('should fetch available slots and update availableSlots signal', () => {
    service.getAvailableSlots('doc-1', '2026-10-06').subscribe();

    const req = httpMock.expectOne(`${environment.apiUrl}/portal/doctors/available-slots?doctorId=doc-1&date=2026-10-06`);
    expect(req.request.method).toBe('GET');
    req.flush({ slots: ['09:00', '09:30', '10:00'] });

    expect(service.availableSlots().length).toBe(3);
    expect(service.availableSlots()).toContain('09:30');
  });

  it('should clear signals and local storage on logout', () => {
    service.authToken.set('token');
    service.currentUser.set({ id: '1', name: 'Patient', phone: '123' });
    localStorage.setItem('portal_token', 'token');

    service.logout();

    expect(service.authToken()).toBeNull();
    expect(service.currentUser()).toBeNull();
    expect(localStorage.getItem('portal_token')).toBeNull();
  });
});

import { TestBed } from '@angular/core/testing';
import { AuthService, User } from './auth.service';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

describe('AuthService (Authentication & Session State)', () => {
  let service: AuthService;
  let httpTesting: HttpTestingController;

  const mockDoctorUser: User = {
    id: 'u-1',
    name: 'Dr. Tarek Zaki',
    email: 'tarek.zaki@clinic.com',
    role: 'doctor',
    doctorId: 'doc-1',
    title: 'Dr.'
  };

  const mockAdminUser: User = {
    id: 'u-admin',
    name: 'Admin Sarah',
    email: 'admin@clinic.com',
    role: 'admin',
    title: 'Administrator'
  };

  beforeEach(() => {
    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [
        AuthService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });

    service = TestBed.inject(AuthService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
    localStorage.clear();
  });

  describe('Initial State & Storage Recovery', () => {
    it('should initialize with null user when storage is empty', () => {
      expect(service.currentUser()).toBeNull();
      expect(service.isAuthenticated()).toBeFalse();
    });

    it('should set current user and update isAuthenticated signal', () => {
      service.setCurrentUser(mockDoctorUser, 'sample-jwt-token');

      expect(service.currentUser()).toEqual(mockDoctorUser);
      expect(service.isAuthenticated()).toBeTrue();
      expect(service.isDoctor()).toBeTrue();
      expect(service.isAdmin()).toBeFalse();
      expect(service.getToken()).toBe('sample-jwt-token');
    });
  });

  describe('RBAC Role Detection', () => {
    it('should accurately identify admin role', () => {
      service.setCurrentUser(mockAdminUser);

      expect(service.isAdmin()).toBeTrue();
      expect(service.isDoctor()).toBeFalse();
      expect(service.isAssistant()).toBeFalse();
      expect(service.isPatient()).toBeFalse();
    });

    it('should accurately identify assistant and patient roles', () => {
      service.setCurrentUser({ id: 'u-asst', name: 'Assistant Mona', email: 'mona@clinic.com', role: 'assistant', title: 'Assistant' });
      expect(service.isAssistant()).toBeTrue();

      service.setCurrentUser({ id: 'u-pat', name: 'Patient Ali', email: 'ali@example.com', role: 'patient', title: 'Mr.' });
      expect(service.isPatient()).toBeTrue();
    });
  });

  describe('Session Lifecycle & Logout', () => {
    it('should clear user state and storage on logout', () => {
      service.setCurrentUser(mockDoctorUser, 'sample-jwt-token');
      expect(service.getToken()).toBe('sample-jwt-token');

      service.logout();

      expect(service.currentUser()).toBeNull();
      expect(service.isAuthenticated()).toBeFalse();
      expect(service.getToken()).toBeNull();
    });
  });

  describe('HTTP Authentication Endpoints', () => {
    it('should dispatch login HTTP request with credentials', () => {
      service.login({ email: 'doctor@test.com', password: 'Pass123!' }).subscribe(user => {
        expect(user.id).toBe('u-1');
        expect(user.name).toBe('Dr. Tarek Zaki');
      });

      const req = httpTesting.expectOne('/api/auth/login');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ email: 'doctor@test.com', password: 'Pass123!' });

      req.flush({ message: 'Success', token: 'jwt-token-xyz', data: mockDoctorUser });
    });

    it('should dispatch validatePromo request', () => {
      service.validatePromo('SPRING2026').subscribe(res => {
        expect(res.valid).toBeTrue();
      });

      const req = httpTesting.expectOne('/api/subscriptions/validate-promo');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ code: 'SPRING2026' });

      req.flush({ valid: true, code: 'SPRING2026' });
    });

    it('should dispatch upgradeTier request', () => {
      service.upgradeTier('Enterprise').subscribe(res => {
        expect(res.targetTier).toBe('Enterprise');
      });

      const req = httpTesting.expectOne('/api/subscriptions/upgrade-tier');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ targetTier: 'Enterprise' });

      req.flush({ message: 'Success', targetTier: 'Enterprise' });
    });
  });
});

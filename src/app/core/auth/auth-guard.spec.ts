import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { authGuard, unauthGuard } from './auth.guard';
import { roleGuard } from './role.guard';
import { AuthService } from './auth.service';
import { signal } from '@angular/core';

describe('Auth & Role Guards', () => {
  let mockAuthService: any;
  let mockRouter: any;

  beforeEach(() => {
    mockRouter = {
      navigate: jasmine.createSpy('navigate')
    };

    mockAuthService = {
      currentUser: signal<any>(null),
      isAuthenticated: () => !!mockAuthService.currentUser()
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: Router, useValue: mockRouter }
      ]
    });
  });

  describe('authGuard', () => {
    it('should allow access when user is authenticated', () => {
      mockAuthService.currentUser.set({ id: 'u1', role: 'doctor' });

      const result = TestBed.runInInjectionContext(() =>
        authGuard({} as any, { url: '/patients' } as any)
      );

      expect(result).toBeTrue();
      expect(mockRouter.navigate).not.toHaveBeenCalled();
    });

    it('should redirect to /login and return false when unauthenticated', () => {
      mockAuthService.currentUser.set(null);

      const result = TestBed.runInInjectionContext(() =>
        authGuard({} as any, { url: '/dashboard' } as any)
      );

      expect(result).toBeFalse();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/login'], {
        queryParams: { returnUrl: '/dashboard' }
      });
    });
  });

  describe('unauthGuard', () => {
    it('should allow access to login page when not authenticated', () => {
      mockAuthService.currentUser.set(null);

      const result = TestBed.runInInjectionContext(() =>
        unauthGuard({} as any, { url: '/login' } as any)
      );

      expect(result).toBeTrue();
      expect(mockRouter.navigate).not.toHaveBeenCalled();
    });

    it('should redirect authenticated doctor away from login to /dashboard', () => {
      mockAuthService.currentUser.set({ id: 'u1', role: 'doctor' });

      const result = TestBed.runInInjectionContext(() =>
        unauthGuard({} as any, { url: '/login' } as any)
      );

      expect(result).toBeFalse();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/dashboard']);
    });
  });

  describe('roleGuard', () => {
    it('should allow access when user has matching role', () => {
      mockAuthService.currentUser.set({ id: 'u1', role: 'doctor' });

      const routeSnapshot: any = {
        data: { roles: ['doctor', 'admin'] }
      };

      const result = TestBed.runInInjectionContext(() =>
        roleGuard(routeSnapshot, { url: '/prescriptions' } as any)
      );

      expect(result).toBeTrue();
    });

    it('should reject access and redirect when user lacks required role', () => {
      mockAuthService.currentUser.set({ id: 'u1', role: 'patient' });

      const routeSnapshot: any = {
        data: { roles: ['doctor', 'admin'] }
      };

      const result = TestBed.runInInjectionContext(() =>
        roleGuard(routeSnapshot, { url: '/admin/subscription-management' } as any)
      );

      expect(result).toBeFalse();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/appointments']);
    });
  });
});

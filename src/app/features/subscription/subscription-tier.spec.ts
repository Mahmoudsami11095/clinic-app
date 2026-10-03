import { TestBed } from '@angular/core/testing';
import { SubscriptionComponent } from './subscription.component';
import { AuthService } from '../../core/auth/auth.service';
import { ToastrService } from 'ngx-toastr';
import { Router } from '@angular/router';
import { FormBuilder } from '@angular/forms';
import { LanguageService } from '../../core/i18n/language.service';
import { of } from 'rxjs';
import { signal } from '@angular/core';

describe('REQ-SUB-01: Clinic Subscription Tier Visibility & Limit Enforcements', () => {
  let component: SubscriptionComponent;
  let mockAuthService: any;
  let mockToastr: any;
  let mockRouter: any;

  const mockActiveStatus = {
    subscriptionStatus: 'Active',
    subscriptionEndDate: new Date(Date.now() + 180 * 24 * 3600000).toISOString(),
    trialEndDate: new Date(Date.now() - 30 * 24 * 3600000).toISOString(),
    isInitialFeePaid: true,
    tierQuota: {
      tierName: 'Professional',
      billingCycle: 'Annual',
      maxDoctorSeats: 5,
      usedDoctorSeats: 1,
      maxStorageGb: 50.0,
      usedStorageGb: 0.42,
      maxSmsCredits: 1000,
      usedSmsCredits: 65,
      storagePercentage: 0.8,
      seatsPercentage: 20,
      isStorageThresholdWarning: false
    },
    pricing: {
      initialSetupFee: 100,
      annualSubscriptionFee: 300
    }
  };

  beforeEach(() => {
    mockToastr = {
      success: jasmine.createSpy('success'),
      error: jasmine.createSpy('error'),
      warning: jasmine.createSpy('warning'),
      info: jasmine.createSpy('info')
    };

    mockRouter = {
      navigate: jasmine.createSpy('navigate')
    };

    mockAuthService = {
      currentUser: signal({ id: 'doc-1', name: 'Dr. John Doe', role: 'doctor', subscriptionStatus: 'Active' }),
      getSubscriptionStatus: jasmine.createSpy('getSubscriptionStatus').and.returnValue(of(mockActiveStatus)),
      refreshSubscriptionStatus: jasmine.createSpy('refreshSubscriptionStatus').and.returnValue(of(mockActiveStatus)),
      upgradeTier: jasmine.createSpy('upgradeTier').and.returnValue(of({ message: 'Success', targetTier: 'Enterprise' }))
    };

    TestBed.configureTestingModule({
      providers: [
        SubscriptionComponent,
        FormBuilder,
        { provide: AuthService, useValue: mockAuthService },
        { provide: ToastrService, useValue: mockToastr },
        { provide: Router, useValue: mockRouter },
        { provide: LanguageService, useValue: { translate: (k: string) => k, isLoaded: signal(true) } }
      ]
    });

    component = TestBed.inject(SubscriptionComponent);
    component.ngOnInit();
  });

  describe('Active Subscription Status Detection', () => {
    it('should determine active subscription as unlocked', () => {
      const isLocked = component.checkLockedStatus(mockActiveStatus);
      expect(isLocked).toBeFalse();
      expect(component.isLocked()).toBeFalse();
    });

    it('should determine expired subscription as locked', () => {
      const expiredStatus = {
        subscriptionStatus: 'Expired',
        subscriptionEndDate: new Date(Date.now() - 1000).toISOString()
      };
      expect(component.checkLockedStatus(expiredStatus)).toBeTrue();
    });

    it('should determine suspended subscription as locked', () => {
      const suspendedStatus = {
        subscriptionStatus: 'Suspended'
      };
      expect(component.checkLockedStatus(suspendedStatus)).toBeTrue();
    });

    it('should determine active trial as unlocked', () => {
      const trialStatus = {
        subscriptionStatus: 'Trial',
        trialEndDate: new Date(Date.now() + 60 * 24 * 3600000).toISOString()
      };
      expect(component.checkLockedStatus(trialStatus)).toBeFalse();
    });
  });

  describe('Renewal Countdown & Quota Data', () => {
    it('should compute remaining days accurately', () => {
      const days = component.getRemainingDays();
      expect(days).toBeGreaterThanOrEqual(179);
      expect(days).toBeLessThanOrEqual(181);
    });

    it('should populate tierQuota signals from status response', () => {
      expect(component.tierQuota()).toBeDefined();
      expect(component.tierQuota().tierName).toBe('Professional');
      expect(component.tierQuota().maxDoctorSeats).toBe(5);
      expect(component.tierQuota().maxStorageGb).toBe(50.0);
    });
  });

  describe('Plan Upgrade Modal Workflow', () => {
    it('should open and close the upgrade modal', () => {
      expect(component.isUpgradeModalOpen()).toBeFalse();

      component.openUpgradeModal('Enterprise');
      expect(component.isUpgradeModalOpen()).toBeTrue();
      expect(component.selectedUpgradeTier()).toBe('Enterprise');

      component.closeUpgradeModal();
      expect(component.isUpgradeModalOpen()).toBeFalse();
    });

    it('should dispatch upgradeTier request and show confirmation toast', () => {
      component.openUpgradeModal('Enterprise');
      component.confirmUpgrade();

      expect(mockAuthService.upgradeTier).toHaveBeenCalledWith('Enterprise');
      expect(component.isUpgradeModalOpen()).toBeFalse();
      expect(mockToastr.success).toHaveBeenCalledWith(
        jasmine.stringMatching(/Upgrade request to Enterprise submitted successfully/),
        jasmine.any(String)
      );
    });
  });
});

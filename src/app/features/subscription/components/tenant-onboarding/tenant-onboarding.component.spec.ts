import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TenantOnboardingComponent } from './tenant-onboarding.component';
import { TenantService } from '../../../../core/services/tenant/tenant.service';
import { ToastrService } from 'ngx-toastr';
import { ReactiveFormsModule } from '@angular/forms';
import { of } from 'rxjs';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { InputFieldComponent } from '@clinic/ui/input-field/input-field.component';

import { LanguageService } from '../../../../core/i18n/language.service';
import { signal } from '@angular/core';

describe('TenantOnboardingComponent', () => {
  let component: TenantOnboardingComponent;
  let fixture: ComponentFixture<TenantOnboardingComponent>;
  let mockTenantService: jasmine.SpyObj<TenantService>;
  let mockToastr: jasmine.SpyObj<ToastrService>;

  beforeEach(async () => {
    mockTenantService = jasmine.createSpyObj('TenantService', ['onboardTenant']);
    mockToastr = jasmine.createSpyObj('ToastrService', ['success', 'error']);

    await TestBed.configureTestingModule({
      imports: [TenantOnboardingComponent, ReactiveFormsModule, BrowserAnimationsModule, InputFieldComponent],
      providers: [
        { provide: TenantService, useValue: mockTenantService },
        { provide: ToastrService, useValue: mockToastr },
        { provide: LanguageService, useValue: { translate: (k: string) => k, isLoaded: signal(true) } }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(TenantOnboardingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should require valid form to submit', () => {
    component.onSubmit();
    expect(mockTenantService.onboardTenant).not.toHaveBeenCalled();
    expect(component.onboardingForm.touched).toBeTrue();
  });

  it('should submit valid form and show success', () => {
    mockTenantService.onboardTenant.and.returnValue(of({ message: 'Success', tenantId: '1', subdomain: 'test', loginUrl: 'http://test' }));
    
    component.onboardingForm.patchValue({
      organizationName: 'Test Org',
      subdomain: 'test',
      subscriptionTier: 'Starter',
      adminName: 'Admin',
      adminEmail: 'admin@test.com',
      adminPassword: 'password123'
    });

    component.onSubmit();

    expect(mockTenantService.onboardTenant).toHaveBeenCalled();
    expect(component.successResult()?.message).toBe('Success');
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RegisterComponent } from './register.component';
import { AuthService } from '../../../core/auth/auth.service';
import { ClinicService } from '../../../core/services/clinic.service';
import { LanguageService } from '../../../core/i18n/language.service';
import { ThemeService } from '../../../core/services/theme.service';
import { SpecializationService } from '../../../core/services/specialization.service';
import { ToastrService } from 'ngx-toastr';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { of } from 'rxjs';

describe('RegisterComponent (Registration Wizard & Form Validation)', () => {
  let component: RegisterComponent;
  let fixture: ComponentFixture<RegisterComponent>;
  let mockToastr: any;
  let mockClinicService: any;
  let mockSpecService: any;

  beforeEach(async () => {
    mockToastr = {
      error: jasmine.createSpy('error'),
      success: jasmine.createSpy('success'),
      info: jasmine.createSpy('info'),
      warning: jasmine.createSpy('warning')
    };

    mockClinicService = {
      clinics: signal([
        { id: 'c1', name: 'Main Branch' },
        { id: 'c2', name: 'West Branch' }
      ]),
      activeClinicId: signal('all')
    };

    mockSpecService = {
      getGroupedSpecializations: jasmine.createSpy('getGroupedSpecializations').and.returnValue(of([]))
    };

    await TestBed.configureTestingModule({
      imports: [RegisterComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ToastrService, useValue: mockToastr },
        { provide: ClinicService, useValue: mockClinicService },
        { provide: SpecializationService, useValue: mockSpecService },
        {
          provide: LanguageService,
          useValue: {
            translate: (k: string) => k,
            isLoaded: signal(true),
            currentLang: signal('en'),
            dir: signal('ltr')
          }
        },
        {
          provide: ThemeService,
          useValue: {
            isDarkMode: signal(false),
            toggle: jasmine.createSpy('toggle')
          }
        },
        {
          provide: AuthService,
          useValue: {
            currentUser: signal(null),
            isAuthenticated: () => false,
            checkAvailability: jasmine.createSpy('checkAvailability').and.returnValue(of({ available: true }))
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(RegisterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('Form Initialization', () => {
    it('should initialize at Stage 1 with default patient role and Egyptian country code', () => {
      expect(component.currentStage()).toBe(1);
      expect(component.registerForm.get('role')?.value).toBe('patient');
      expect(component.registerForm.get('countryCode')?.value).toBe('+20');
      expect(component.showPassword()).toBeFalse();
    });

    it('should toggle password visibility on togglePassword()', () => {
      expect(component.showPassword()).toBeFalse();
      component.togglePassword();
      expect(component.showPassword()).toBeTrue();
      component.togglePassword();
      expect(component.showPassword()).toBeFalse();
    });
  });

  describe('Stage 1 Credentials Validation & Stepper Navigation', () => {
    it('should reject progression to Stage 2 if credentials are empty or invalid', () => {
      component.registerForm.patchValue({
        name: '',
        email: 'invalid-email-format',
        password: '123' // less than 6 chars
      });

      component.nextStage();

      expect(component.currentStage()).toBe(1);
      expect(mockToastr.error).toHaveBeenCalledWith(
        'Please enter valid account credentials.',
        'Validation Error'
      );
    });

    it('should advance to Stage 2 when valid account credentials are provided', () => {
      component.registerForm.patchValue({
        name: 'Dr. Mahmoud Samy',
        email: 'dr.mahmoud@clinic.com',
        password: 'StrongPassword123!'
      });

      component.nextStage();

      expect(component.currentStage()).toBe(2);
    });

    it('should navigate back to previous stage on prevStage()', () => {
      component.currentStage.set(2);
      component.prevStage();
      expect(component.currentStage()).toBe(1);
    });
  });

  describe('Role Selection & Specific Configuration', () => {
    it('should update role to doctor and advance stage on onRoleChange', () => {
      component.registerForm.patchValue({
        name: 'Dr. Samy',
        email: 'samy@clinic.com',
        password: 'Password123!'
      });

      component.onRoleChange('doctor');

      expect(component.registerForm.get('role')?.value).toBe('doctor');
      expect(component.currentStage()).toBe(2);
    });

    it('should support switching to assistant role', () => {
      component.setRole('assistant');
      expect(component.registerForm.get('role')?.value).toBe('assistant');
    });

    it('should toggle clinic availability days', () => {
      // selectedClinicDays starts with ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
      expect(component.selectedClinicDays.includes('Saturday')).toBeFalse();

      component.toggleRegisterClinicDay('Saturday');
      expect(component.selectedClinicDays.includes('Saturday')).toBeTrue();

      component.toggleRegisterClinicDay('Saturday');
      expect(component.selectedClinicDays.includes('Saturday')).toBeFalse();
    });
  });
});

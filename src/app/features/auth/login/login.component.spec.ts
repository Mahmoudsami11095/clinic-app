import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { LoginComponent } from './login.component';
import { AuthService, User } from '../../../core/auth/auth.service';
import { LanguageService } from '../../../core/i18n/language.service';
import { ThemeService } from '../../../core/services/theme.service';
import { ClinicService } from '../../../core/services/clinic.service';
import { ToastrService } from 'ngx-toastr';
import { Router, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let mockAuthService: jasmine.SpyObj<AuthService>;
  let mockLanguageService: jasmine.SpyObj<LanguageService>;
  let mockThemeService: any;
  let mockToastrService: jasmine.SpyObj<ToastrService>;
  let mockClinicService: jasmine.SpyObj<ClinicService>;
  let router: Router;

  const mockUser: User = {
    id: 'u-1',
    name: 'Dr. John Doe',
    email: 'doctor@test.com',
    role: 'doctor',
    title: 'Dr.'
  };

  beforeEach(async () => {
    mockAuthService = jasmine.createSpyObj('AuthService', ['login', 'loginWithSocial', 'isAuthenticated', 'triggerPostLoginWelcome']);
    mockLanguageService = jasmine.createSpyObj('LanguageService', ['translate', 'setLanguage']);
    mockLanguageService.currentLang = signal('en') as any;
    mockLanguageService.dir = signal('ltr') as any;
    mockLanguageService.translate.and.callFake((key: string) => key);

    mockThemeService = {
      isDarkMode: signal(false),
      toggle: jasmine.createSpy('toggle')
    };

    mockToastrService = jasmine.createSpyObj('ToastrService', ['success', 'error', 'info', 'warning']);
    mockClinicService = jasmine.createSpyObj('ClinicService', ['getClinicsObservable']);

    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: mockAuthService },
        { provide: LanguageService, useValue: mockLanguageService },
        { provide: ThemeService, useValue: mockThemeService },
        { provide: ToastrService, useValue: mockToastrService },
        { provide: ClinicService, useValue: mockClinicService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.returnValue(Promise.resolve(true));
    spyOn(router, 'navigateByUrl').and.returnValue(Promise.resolve(true));
    fixture.detectChanges();
  });

  it('should create component and initialize with default signals', () => {
    expect(component).toBeTruthy();
    expect(component.isSuccess()).toBeFalse();
    expect(component.welcomeUser()).toBeNull();
    expect(component.isLoading()).toBeFalse();
    expect(component.showPassword()).toBeFalse();
  });

  it('should toggle password visibility signal', () => {
    expect(component.showPassword()).toBeFalse();
    component.togglePassword();
    expect(component.showPassword()).toBeTrue();
    component.togglePassword();
    expect(component.showPassword()).toBeFalse();
  });

  it('should trigger success animation state and delayed navigation on successful login', fakeAsync(() => {
    mockAuthService.login.and.returnValue(of(mockUser));

    component.loginForm.setValue({
      email: 'doctor@test.com',
      password: 'password123'
    });

    component.onSubmit();

    expect(component.isSuccess()).toBeTrue();
    expect(component.welcomeUser()).toEqual(mockUser);
    expect(component.isLoading()).toBeFalse();
    expect(mockToastrService.success).toHaveBeenCalled();

    // Verify navigation has NOT occurred immediately before button checkmark
    expect(router.navigate).not.toHaveBeenCalled();

    // Fast forward 250ms
    tick(250);

    // Verify post-login welcome is triggered and navigation occurs to doctor dashboard
    expect(mockAuthService.triggerPostLoginWelcome).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
  }));

  it('should handle login error gracefully and not trigger success animation', () => {
    mockAuthService.login.and.returnValue(throwError(() => new Error('Invalid credentials')));

    component.loginForm.setValue({
      email: 'doctor@test.com',
      password: 'wrong-password'
    });

    component.onSubmit();

    expect(component.isSuccess()).toBeFalse();
    expect(component.welcomeUser()).toBeNull();
    expect(component.isLoading()).toBeFalse();
    expect(component.errorMessage()).toBeTruthy();
    expect(mockToastrService.error).toHaveBeenCalled();
  });

  it('should trigger success animation and navigate on quickLogin', fakeAsync(() => {
    mockAuthService.login.and.returnValue(of(mockUser));

    component.quickLogin(mockUser);

    expect(component.isSuccess()).toBeTrue();
    expect(component.welcomeUser()).toEqual(mockUser);

    tick(250);
    expect(mockAuthService.triggerPostLoginWelcome).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
  }));

  it('should compute avatar initials correctly', () => {
    expect(component.getAvatarInitials('Dr. John Doe')).toBe('DJ');
    expect(component.getAvatarInitials('Sarah')).toBe('SA');
    expect(component.getAvatarInitials('')).toBe('U');
  });
});

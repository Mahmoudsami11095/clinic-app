import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AssistantHubComponent } from './assistant-hub.component';
import { ClinicService } from '../../core/services/clinic.service';
import { AuthService } from '../../core/auth/auth.service';
import { LanguageService } from '../../core/i18n/language.service';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';

describe('AssistantHubComponent', () => {
  let component: AssistantHubComponent;
  let fixture: ComponentFixture<AssistantHubComponent>;
  let mockClinicService: any;
  let mockAuthService: any;
  let mockLanguageService: any;

  beforeEach(async () => {
    mockClinicService = {
      activeClinicName: signal('Downtown Dental Center'),
      activeClinicId: signal('c-1')
    };

    mockAuthService = {
      currentUser: signal({
        id: 'u-asst-1',
        fullName: 'Nouran Emad',
        role: 'assistant'
      })
    };

    mockLanguageService = {
      translate: jasmine.createSpy('translate').and.callFake((k: string) => k),
      currentLang: signal('en'),
      dir: signal('ltr')
    };

    await TestBed.configureTestingModule({
      imports: [AssistantHubComponent],
      providers: [
        provideRouter([]),
        { provide: ClinicService, useValue: mockClinicService },
        { provide: AuthService, useValue: mockAuthService },
        { provide: LanguageService, useValue: mockLanguageService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AssistantHubComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and display active facility and assistant operator', () => {
    expect(component).toBeTruthy();
    expect(component.clinicService.activeClinicName()).toBe('Downtown Dental Center');
    expect(component.authService.currentUser()?.role).toBe('assistant');
  });

  it('should process quick patient intake', () => {
    component.intakeName = 'Hassan Tamer';
    component.intakePhone = '+201011223344';
    component.saveQuickIntake();

    expect(component.intakeStatus()).toContain('Hassan Tamer');
    expect(component.intakeName).toBe('');
    expect(component.intakePhone).toBe('');
  });

  it('should process cashiering payment and generate receipt', () => {
    component.posPatient = 'PAT-2002';
    component.posAmount = 750;
    component.posMethod = 'MobileWallet';
    component.processPayment();

    expect(component.posReceipt()).toBeTruthy();
    expect(component.posReceipt()?.patient).toBe('PAT-2002');
    expect(component.posReceipt()?.amount).toBe(750);
  });
});

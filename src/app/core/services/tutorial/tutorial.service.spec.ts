import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { TutorialService } from './tutorial.service';
import { AuthService, User } from '../../auth/auth.service';
import { signal } from '@angular/core';

describe('TutorialService', () => {
  let service: TutorialService;
  let mockRouter: any;
  let mockAuthService: any;
  let currentUserSignal: any;

  beforeEach(() => {
    currentUserSignal = signal<User | null>({
      id: 'doc-1',
      name: 'Dr. Mahmoud',
      email: 'dr@test.com',
      role: 'doctor',
      title: 'Consultant',
      clinicId: 'c1'
    });

    mockRouter = {
      url: '/appointments',
      events: {
        pipe: () => ({
          subscribe: () => {}
        })
      },
      navigateByUrl: jasmine.createSpy('navigateByUrl')
    };

    mockAuthService = {
      currentUser: currentUserSignal
    };

    TestBed.configureTestingModule({
      providers: [
        TutorialService,
        { provide: Router, useValue: mockRouter },
        { provide: AuthService, useValue: mockAuthService }
      ]
    });

    service = TestBed.inject(TutorialService);
  });

  afterEach(() => {
    service.resetCompletedTours();
  });

  it('should be created and have help center closed by default', () => {
    expect(service).toBeTruthy();
    expect(service.isHelpCenterOpen()).toBeFalse();
    expect(service.isTourActive()).toBeFalse();
  });

  it('should toggle help center open and close', () => {
    service.openHelpCenter();
    expect(service.isHelpCenterOpen()).toBeTrue();

    service.closeHelpCenter();
    expect(service.isHelpCenterOpen()).toBeFalse();

    service.toggleHelpCenter();
    expect(service.isHelpCenterOpen()).toBeTrue();
  });

  it('should start a tour and navigate to first step', () => {
    service.startTour('tour-doctor');
    expect(service.isTourActive()).toBeTrue();
    expect(service.currentTour()?.id).toBe('tour-doctor');
    expect(service.currentStepIndex()).toBe(0);
    expect(service.currentStep()?.titleKey).toBe('tutorial.steps.doctor.step1_title');
  });

  it('should advance steps and finish tour on last step', () => {
    service.startTour('tour-doctor');
    const total = service.totalSteps();
    expect(total).toBeGreaterThan(1);

    service.nextStep();
    expect(service.currentStepIndex()).toBe(1);

    service.previousStep();
    expect(service.currentStepIndex()).toBe(0);

    // Skip to end
    while (!service.isLastStep()) {
      service.nextStep();
    }
    expect(service.isLastStep()).toBeTrue();

    // Advancing on last step completes tour
    service.nextStep();
    expect(service.isTourActive()).toBeFalse();
    expect(service.completedTourIds()).toContain('tour-doctor');
  });

  it('should allow skipping a tour without marking it completed', () => {
    service.startTour('tour-reception');
    expect(service.isTourActive()).toBeTrue();

    service.skipTour();
    expect(service.isTourActive()).toBeFalse();
    expect(service.completedTourIds()).not.toContain('tour-reception');
  });

  it('should compute contextual page help based on current route', () => {
    service.currentUrl.set('/appointments');
    const help = service.currentPageHelp();
    expect(help.title).toBe('Appointments & Waiting Queue');
    expect(help.recommendedTourId).toBe('tour-reception');
  });

  it('should filter tours based on current user role', () => {
    currentUserSignal.set({
      id: 'doc-1',
      name: 'Dr. Mahmoud',
      email: 'dr@test.com',
      role: 'doctor',
      clinicId: 'c1'
    });
    const doctorTours = service.filteredTours();
    expect(doctorTours.some(t => t.id === 'tour-doctor')).toBeTrue();
    expect(doctorTours.some(t => t.id === 'tour-owner')).toBeFalse();
  });
});

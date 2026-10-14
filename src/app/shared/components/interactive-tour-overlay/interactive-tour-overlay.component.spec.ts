import { ComponentFixture, TestBed } from '@angular/core/testing';
import { InteractiveTourOverlayComponent } from './interactive-tour-overlay.component';
import { TutorialService } from '../../../core/services/tutorial/tutorial.service';
import { LanguageService } from '../../../core/i18n/language.service';
import { signal } from '@angular/core';

describe('InteractiveTourOverlayComponent', () => {
  let component: InteractiveTourOverlayComponent;
  let fixture: ComponentFixture<InteractiveTourOverlayComponent>;
  let mockTutorialService: any;
  let mockLanguageService: any;

  beforeEach(async () => {
    mockTutorialService = {
      isTourActive: signal(true),
      currentTour: signal({
        id: 'tour-test',
        titleKey: 'Test Tour',
        steps: [
          { titleKey: 'Step 1', contentKey: 'Desc 1', targetSelector: '#nav-dashboard' },
          { titleKey: 'Step 2', contentKey: 'Desc 2', targetSelector: '#nav-patients' }
        ]
      }),
      currentStep: signal({ titleKey: 'Step 1', contentKey: 'Desc 1', targetSelector: '#nav-dashboard' }),
      currentStepIndex: signal(0),
      totalSteps: signal(2),
      isLastStep: signal(false),
      nextStep: jasmine.createSpy('nextStep'),
      previousStep: jasmine.createSpy('previousStep'),
      skipTour: jasmine.createSpy('skipTour')
    };

    mockLanguageService = {
      translate: (key: string) => key,
      isLoaded: signal(true)
    };

    await TestBed.configureTestingModule({
      imports: [InteractiveTourOverlayComponent],
      providers: [
        { provide: TutorialService, useValue: mockTutorialService },
        { provide: LanguageService, useValue: mockLanguageService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(InteractiveTourOverlayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and render tour card when active', () => {
    expect(component).toBeTruthy();
    const compiled = fixture.nativeElement;
    expect(compiled.querySelector('.z-\\[100\\]')).toBeTruthy();
  });

  it('should call nextStep on ArrowRight keydown', () => {
    const event = new KeyboardEvent('keydown', { key: 'ArrowRight' });
    window.dispatchEvent(event);
    expect(mockTutorialService.nextStep).toHaveBeenCalled();
  });

  it('should call previousStep on ArrowLeft keydown', () => {
    const event = new KeyboardEvent('keydown', { key: 'ArrowLeft' });
    window.dispatchEvent(event);
    expect(mockTutorialService.previousStep).toHaveBeenCalled();
  });

  it('should call skipTour on Escape keydown', () => {
    const event = new KeyboardEvent('keydown', { key: 'Escape' });
    window.dispatchEvent(event);
    expect(mockTutorialService.skipTour).toHaveBeenCalled();
  });
});

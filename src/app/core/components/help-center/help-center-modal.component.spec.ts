import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HelpCenterModalComponent } from './help-center-modal.component';
import { TutorialService } from '../../services/tutorial/tutorial.service';
import { LanguageService } from '../../i18n/language.service';
import { signal } from '@angular/core';

describe('HelpCenterModalComponent', () => {
  let component: HelpCenterModalComponent;
  let fixture: ComponentFixture<HelpCenterModalComponent>;
  let mockTutorialService: any;
  let mockLanguageService: any;

  beforeEach(async () => {
    mockTutorialService = {
      isHelpCenterOpen: signal(true),
      closeHelpCenter: jasmine.createSpy('closeHelpCenter'),
      startTour: jasmine.createSpy('startTour'),
      currentPageHelp: signal({
        title: 'Appointments',
        titleAr: 'المواعيد',
        summary: 'Schedule visits',
        summaryAr: 'جدولة المواعيد',
        tips: [{ en: 'Tip 1', ar: 'نصيحة ١' }],
        recommendedTourId: 'tour-reception'
      }),
      cheatSheets: signal([
        {
          id: 'card-1',
          title: 'Reception Cheat Sheet',
          titleAr: 'بطاقة الاستقبال',
          badge: 'Card 1',
          badgeAr: 'بطاقة ١',
          icon: 'pi pi-id-card',
          targetRole: 'Receptionist',
          steps: [
            { num: 1, title: 'Arrival', titleAr: 'الوصول', desc: 'Check in', descAr: 'تسجيل وصول', shortcut: 'Ctrl + N' }
          ]
        }
      ]),
      filteredTours: signal([
        { id: 'tour-reception', titleKey: 'Reception Tour', descriptionKey: 'Learn check-in', roles: ['admin'], icon: 'pi pi-id-card', steps: [] }
      ]),
      completedTourIds: signal([]),
      keyboardShortcuts: signal([
        { keys: ['Ctrl', 'K'], description: 'Search', descriptionAr: 'بحث', category: 'general' }
      ])
    };

    mockLanguageService = {
      currentLang: signal('en'),
      translate: (k: string) => k,
      isLoaded: signal(true)
    };

    await TestBed.configureTestingModule({
      imports: [HelpCenterModalComponent],
      providers: [
        { provide: TutorialService, useValue: mockTutorialService },
        { provide: LanguageService, useValue: mockLanguageService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(HelpCenterModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and display default page-guide tab', () => {
    expect(component).toBeTruthy();
    expect(component.activeTab()).toBe('page-guide');
  });

  it('should switch tabs', () => {
    component.setTab('cheat-sheets');
    expect(component.activeTab()).toBe('cheat-sheets');

    component.setTab('tours');
    expect(component.activeTab()).toBe('tours');

    component.setTab('shortcuts');
    expect(component.activeTab()).toBe('shortcuts');
  });

  it('should filter cheat sheets based on searchQuery', () => {
    expect(component.filteredCheatSheets().length).toBe(1);

    component.searchQuery.set('NonExistentQueryXYZ');
    expect(component.filteredCheatSheets().length).toBe(0);

    component.searchQuery.set('Reception');
    expect(component.filteredCheatSheets().length).toBe(1);
  });

  it('should delegate tour start to TutorialService', () => {
    component.startTour('tour-reception');
    expect(mockTutorialService.startTour).toHaveBeenCalledWith('tour-reception');
  });

  it('should delegate close to TutorialService', () => {
    component.close();
    expect(mockTutorialService.closeHelpCenter).toHaveBeenCalled();
  });
});

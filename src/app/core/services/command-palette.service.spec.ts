import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { CommandPaletteService } from './command-palette.service';
import { ThemeService } from './theme.service';
import { LanguageService } from '../i18n/language.service';
import { AuthService } from '../auth/auth.service';
import { environment } from '../../../environments/environment';

describe('CommandPaletteService - Level 1 (SW/Unit)', () => {
  let service: CommandPaletteService;
  let httpTesting: HttpTestingController;
  let routerSpy: jasmine.SpyObj<Router>;
  let themeSpy: jasmine.SpyObj<ThemeService>;
  let langSpy: jasmine.SpyObj<LanguageService>;
  let authSpy: jasmine.SpyObj<AuthService>;

  beforeEach(() => {
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    themeSpy = jasmine.createSpyObj('ThemeService', ['toggle']);
    langSpy = jasmine.createSpyObj('LanguageService', ['setLanguage', 'currentLang']);
    langSpy.currentLang.and.returnValue('en');
    authSpy = jasmine.createSpyObj('AuthService', ['logout']);

    TestBed.configureTestingModule({
      providers: [
        CommandPaletteService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: Router, useValue: routerSpy },
        { provide: ThemeService, useValue: themeSpy },
        { provide: LanguageService, useValue: langSpy },
        { provide: AuthService, useValue: authSpy }
      ]
    });

    service = TestBed.inject(CommandPaletteService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('1. should initialize with closed palette and default state', () => {
    expect(service.isOpen()).toBeFalse();
    expect(service.query()).toBe('');
    expect(service.activeIndex()).toBe(0);
    expect(service.backendResults().length).toBe(0);
    expect(service.staticCommands().length).toBeGreaterThan(5);
  });

  it('2. should open, close, and toggle palette correctly', () => {
    service.open();
    expect(service.isOpen()).toBeTrue();
    expect(service.query()).toBe('');

    service.close();
    expect(service.isOpen()).toBeFalse();

    service.toggle();
    expect(service.isOpen()).toBeTrue();

    service.toggle();
    expect(service.isOpen()).toBeFalse();
  });

  it('3. should filter static commands by title, category, and keywords', () => {
    service.setQuery('dashboard');
    const filtered = service.filteredCommands();
    expect(filtered.some(c => c.id === 'nav-dashboard')).toBeTrue();
    expect(filtered.every(c => 
      c.title.toLowerCase().includes('dashboard') || 
      c.category.includes('dashboard') ||
      c.keywords?.some(k => k.includes('dashboard'))
    )).toBeTrue();
  });

  it('4. should cycle active index forward and backward with wrapping', () => {
    service.setQuery('');
    const total = service.filteredCommands().length;

    expect(service.activeIndex()).toBe(0);

    service.selectNext();
    expect(service.activeIndex()).toBe(1);

    service.selectPrevious();
    expect(service.activeIndex()).toBe(0);

    // Backward wrapping
    service.selectPrevious();
    expect(service.activeIndex()).toBe(total - 1);

    // Forward wrapping
    service.selectNext();
    expect(service.activeIndex()).toBe(0);
  });

  it('5. should execute active command perform action', () => {
    service.setQuery('dashboard');
    service.executeActive();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/dashboard'], undefined);
    expect(service.isOpen()).toBeFalse();
  });

  it('6. should execute theme toggle action and close', () => {
    service.open();
    const themeCmd = service.staticCommands().find(c => c.id === 'pref-theme');
    expect(themeCmd).toBeDefined();

    service.executeCommand(themeCmd!);
    expect(themeSpy.toggle).toHaveBeenCalled();
    expect(service.isOpen()).toBeFalse();
  });

  it('7. should query backend search API with debouncing and populate results', fakeAsync(() => {
    service.setQuery('Nourhan');
    expect(service.isSearchingBackend()).toBeTrue();

    tick(250);

    const req = httpTesting.expectOne(`${environment.apiUrl}/search?q=Nourhan&limit=6`);
    expect(req.request.method).toBe('GET');

    req.flush({
      patients: [
        { id: 'p-101', name: 'Nourhan Tarek', phone: '01012345678', gender: 'Female' }
      ],
      doctors: [],
      chairs: [],
      materials: []
    });

    expect(service.isSearchingBackend()).toBeFalse();
    expect(service.backendResults().length).toBe(1);
    expect(service.backendResults()[0].title).toBe('Nourhan Tarek');
    expect(service.backendResults()[0].category).toBe('patients');
  }));
});

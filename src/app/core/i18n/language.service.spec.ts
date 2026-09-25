import { TestBed } from '@angular/core/testing';
import { provideTranslateService, TranslateService } from '@ngx-translate/core';
import { provideHttpClient } from '@angular/common/http';
import { LanguageService } from './language.service';

describe('LanguageService', () => {
  let service: LanguageService;
  let translateService: TranslateService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideTranslateService({
          lang: 'en',
          fallbackLang: 'en'
        }),
        LanguageService
      ]
    });

    service = TestBed.inject(LanguageService);
    translateService = TestBed.inject(TranslateService);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should be created and have default language', () => {
    expect(service).toBeTruthy();
    expect(service.currentLang()).toBeDefined();
  });

  it('should switch language to Arabic and set dir to rtl', () => {
    service.setLanguage('ar');
    expect(service.currentLang()).toBe('ar');
    expect(service.dir()).toBe('rtl');
    expect(localStorage.getItem('clinic_lang')).toBe('ar');
    expect(document.documentElement.getAttribute('dir')).toBe('rtl');
    expect(document.documentElement.getAttribute('lang')).toBe('ar');
  });

  it('should switch language to English and set dir to ltr', () => {
    service.setLanguage('en');
    expect(service.currentLang()).toBe('en');
    expect(service.dir()).toBe('ltr');
    expect(localStorage.getItem('clinic_lang')).toBe('en');
    expect(document.documentElement.getAttribute('dir')).toBe('ltr');
    expect(document.documentElement.getAttribute('lang')).toBe('en');
  });

  it('should return fallback if key translation is not loaded and key contains dots', () => {
    spyOn(translateService, 'instant').and.returnValue('auth.login_title');
    const result = service.translate('auth.login_title', 'Welcome Back');
    expect(result).toBe('Welcome Back');
  });

  it('should return translated value when translation is available', () => {
    spyOn(translateService, 'instant').and.returnValue('تسجيل الدخول');
    const result = service.translate('auth.login_title', 'Welcome Back');
    expect(result).toBe('تسجيل الدخول');
  });
});

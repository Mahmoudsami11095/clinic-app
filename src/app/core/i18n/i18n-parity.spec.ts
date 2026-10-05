import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideTranslateService } from '@ngx-translate/core';
import { LanguageService } from './language.service';
import { ClinicCurrencyPipe } from './clinic-currency.pipe';

// Import raw translations directly for complete recursive parity validation
import enTranslations from '../../../../public/i18n/en.json';
import arTranslations from '../../../../public/i18n/ar.json';

describe('Milestone 8: Bilingual RTL Parity & Localization Tests (Level 1)', () => {
  let languageService: LanguageService;
  let currencyPipe: ClinicCurrencyPipe;

  interface TranslationLeaf {
    path: string[];
    pathString: string;
    value: string;
  }

  function extractAllLeaves(obj: Record<string, any>, currentPath: string[] = []): TranslationLeaf[] {
    let leaves: TranslationLeaf[] = [];
    for (const k of Object.keys(obj)) {
      const newPath = [...currentPath, k];
      const value = obj[k];
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        leaves = leaves.concat(extractAllLeaves(value, newPath));
      } else {
        leaves.push({
          path: newPath,
          pathString: newPath.join(' -> '),
          value: String(value)
        });
      }
    }
    return leaves;
  }

  function getValueByPath(obj: Record<string, any>, path: string[]): any {
    return path.reduce((curr, p) => (curr ? curr[p] : undefined), obj);
  }

  beforeEach(() => {
    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideTranslateService({
          lang: 'en',
          fallbackLang: 'en'
        }),
        LanguageService,
        ClinicCurrencyPipe
      ]
    });

    languageService = TestBed.inject(LanguageService);
    currencyPipe = TestBed.inject(ClinicCurrencyPipe);
  });

  afterEach(() => {
    localStorage.clear();
    // Reset DOM attributes to default LTR
    if (typeof document !== 'undefined' && document.documentElement) {
      document.documentElement.dir = 'ltr';
      document.documentElement.lang = 'en';
    }
  });

  describe('1. Complete Translation Key Parity (en.json vs ar.json)', () => {
    const enLeaves = extractAllLeaves(enTranslations);
    const arLeaves = extractAllLeaves(arTranslations);
    const enPathSet = new Set(enLeaves.map(l => l.pathString));
    const arPathSet = new Set(arLeaves.map(l => l.pathString));

    it('should have exact key count parity between English and Arabic', () => {
      expect(enLeaves.length).toBeGreaterThan(1000);
      expect(enLeaves.length).toEqual(arLeaves.length);
    });

    it('should ensure all English keys exist in Arabic translation file (0 missing in AR)', () => {
      const missingInAr = enLeaves.filter(l => !arPathSet.has(l.pathString)).map(l => l.pathString);
      expect(missingInAr).withContext(`Keys missing in ar.json: ${missingInAr.join(', ')}`).toEqual([]);
    });

    it('should ensure all Arabic keys exist in English translation file (0 missing in EN)', () => {
      const missingInEn = arLeaves.filter(l => !enPathSet.has(l.pathString)).map(l => l.pathString);
      expect(missingInEn).withContext(`Keys missing in en.json: ${missingInEn.join(', ')}`).toEqual([]);
    });

    it('should verify that all translation values in en.json and ar.json are non-empty strings', () => {
      for (const leaf of enLeaves) {
        const valEn = leaf.value;
        expect(typeof valEn).toBe('string', `Value for EN key ${leaf.pathString} should be string`);
        expect(valEn.trim().length).toBeGreaterThan(0, `EN key ${leaf.pathString} should not be empty`);

        const valAr = getValueByPath(arTranslations, leaf.path);
        expect(typeof valAr).toBe('string', `Value for AR key ${leaf.pathString} should be string`);
        expect(valAr.trim().length).toBeGreaterThan(0, `AR key ${leaf.pathString} should not be empty`);
      }
    });

    it('should verify essential newly enhanced feature namespaces exist in both files', () => {
      const requiredSections = [
        'common',
        'auth',
        'sidebar',
        'dashboard',
        'patients',
        'appointments',
        'doctors',
        'billing',
        'prescriptions',
        'clinics',
        'dental',
        'inventory',
        'radiology',
        'chairs',
        'command_palette',
        'offline',
        'treatment_plans'
      ];

      for (const sec of requiredSections) {
        expect((enTranslations as any)[sec]).withContext(`Section ${sec} missing in en.json`).toBeDefined();
        expect((arTranslations as any)[sec]).withContext(`Section ${sec} missing in ar.json`).toBeDefined();
      }
    });
  });

  describe('2. Layout Directionality & RTL Attributes (System/Integration Level)', () => {
    it('should set dir="ltr" and lang="en" when English is active', () => {
      languageService.setLanguage('en');

      expect(languageService.currentLang()).toBe('en');
      expect(languageService.dir()).toBe('ltr');
      expect(languageService.isRtl()).toBeFalse();
      expect(document.documentElement.getAttribute('dir')).toBe('ltr');
      expect(document.documentElement.getAttribute('lang')).toBe('en');
    });

    it('should set dir="rtl" and lang="ar" when Arabic is active', () => {
      languageService.setLanguage('ar');

      expect(languageService.currentLang()).toBe('ar');
      expect(languageService.dir()).toBe('rtl');
      expect(languageService.isRtl()).toBeTrue();
      expect(document.documentElement.getAttribute('dir')).toBe('rtl');
      expect(document.documentElement.getAttribute('lang')).toBe('ar');
    });

    it('should persist selected language preference in localStorage', () => {
      languageService.setLanguage('ar');
      expect(localStorage.getItem('clinic_lang')).toBe('ar');

      languageService.setLanguage('en');
      expect(localStorage.getItem('clinic_lang')).toBe('en');
    });
  });

  describe('3. Localized Currency Formatting Parity (EGP / ج.م)', () => {
    it('should format currency with EGP suffix in English mode', () => {
      languageService.setLanguage('en');
      expect(currencyPipe.transform(2500)).toBe('2,500 EGP');
      expect(currencyPipe.transform(125.5, 'symbol', '1.2-2')).toBe('125.50 EGP');
      expect(currencyPipe.transform(-500)).toBe('-500 EGP');
    });

    it('should format currency with ج.م suffix in Arabic mode', () => {
      languageService.setLanguage('ar');
      expect(currencyPipe.transform(2500)).toBe('2,500 ج.م');
      expect(currencyPipe.transform(125.5, 'symbol', '1.2-2')).toBe('125.50 ج.م');
      expect(currencyPipe.transform(-500)).toBe('-500 ج.م');
    });

    it('should dynamically switch currency formatting when language is switched', () => {
      languageService.setLanguage('en');
      expect(currencyPipe.transform(4200)).toBe('4,200 EGP');

      languageService.setLanguage('ar');
      expect(currencyPipe.transform(4200)).toBe('4,200 ج.م');
    });
  });
});

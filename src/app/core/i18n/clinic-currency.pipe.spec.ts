import { TestBed } from '@angular/core/testing';
import { ClinicCurrencyPipe } from './clinic-currency.pipe';
import { LanguageService } from './language.service';
import { signal } from '@angular/core';

describe('ClinicCurrencyPipe', () => {
  let pipe: ClinicCurrencyPipe;
  let mockLanguageService: { currentLang: () => 'en' | 'ar' };
  let currentLangSignal = signal<'en' | 'ar'>('en');

  beforeEach(() => {
    currentLangSignal.set('en');
    mockLanguageService = {
      currentLang: () => currentLangSignal()
    };

    TestBed.configureTestingModule({
      providers: [
        ClinicCurrencyPipe,
        { provide: LanguageService, useValue: mockLanguageService }
      ]
    });

    pipe = TestBed.inject(ClinicCurrencyPipe);
  });

  it('should create the pipe', () => {
    expect(pipe).toBeTruthy();
  });

  describe('English locale formatting', () => {
    beforeEach(() => {
      currentLangSignal.set('en');
    });

    it('should format numbers with EGP suffix in English', () => {
      expect(pipe.transform(1500)).toBe('1,500 EGP');
      expect(pipe.transform(250.5, 'symbol', '1.2-2')).toBe('250.50 EGP');
      expect(pipe.transform(0)).toBe('0 EGP');
    });

    it('should format negative amounts with leading minus sign', () => {
      expect(pipe.transform(-350)).toBe('-350 EGP');
    });

    it('should handle numeric string inputs', () => {
      expect(pipe.transform('12500')).toBe('12,500 EGP');
    });

    it('should return empty string for null, undefined, or invalid inputs', () => {
      expect(pipe.transform(null)).toBe('');
      expect(pipe.transform(undefined)).toBe('');
      expect(pipe.transform('')).toBe('');
      expect(pipe.transform('not-a-number')).toBe('');
    });

    it('should support display none without currency symbol', () => {
      expect(pipe.transform(1200, 'none')).toBe('1,200');
      expect(pipe.transform(-400, 'none')).toBe('-400');
    });
  });

  describe('Arabic locale formatting (RTL Parity)', () => {
    beforeEach(() => {
      currentLangSignal.set('ar');
    });

    it('should format numbers with ج.م suffix in Arabic', () => {
      expect(pipe.transform(1500)).toBe('1,500 ج.م');
      expect(pipe.transform(250.5, 'symbol', '1.2-2')).toBe('250.50 ج.م');
      expect(pipe.transform(0)).toBe('0 ج.م');
    });

    it('should format negative amounts with leading minus sign in Arabic', () => {
      expect(pipe.transform(-500)).toBe('-500 ج.م');
    });

    it('should react dynamically when language changes from EN to AR without recreating pipe', () => {
      currentLangSignal.set('en');
      expect(pipe.transform(1000)).toBe('1,000 EGP');

      currentLangSignal.set('ar');
      expect(pipe.transform(1000)).toBe('1,000 ج.م');
    });
  });
});

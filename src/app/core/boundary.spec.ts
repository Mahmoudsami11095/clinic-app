import { FormControl, FormGroup } from '@angular/forms';
import { phoneValidator } from './validators/phone.validator';
import { splitPhoneNumber, combinePhoneNumber } from './utils/phone.utils';

describe('Frontend Boundary & Edge Case Validation Suite', () => {
  describe('Phone Validator Boundaries', () => {
    let form: FormGroup;
    let countryControl: FormControl;
    let phoneControl: FormControl;

    beforeEach(() => {
      countryControl = new FormControl('+20');
      phoneControl = new FormControl('', [phoneValidator('countryCode')]);
      form = new FormGroup({
        countryCode: countryControl,
        phoneNumber: phoneControl,
      });
    });

    it('should return null when input is empty or null (empty boundary)', () => {
      phoneControl.setValue('');
      expect(phoneControl.errors).toBeNull();

      phoneControl.setValue(null);
      expect(phoneControl.errors).toBeNull();
    });

    it('should return onlyDigits error when non-digit characters are present', () => {
      phoneControl.setValue('01012345abc');
      expect(phoneControl.errors).toEqual({ onlyDigits: true });

      phoneControl.setValue('0101234@567');
      expect(phoneControl.errors).toEqual({ onlyDigits: true });
    });

    it('should validate valid Egyptian mobile boundaries (+20)', () => {
      const validNumbers = [
        '01012345678', // 010
        '01112345678', // 011
        '01212345678', // 012
        '01512345678', // 015
        '1012345678',  // Without leading zero
        '010-1234-5678', // Formatted with hyphens
        '010 1234 5678', // Formatted with spaces
        '(010) 12345678' // Formatted with parentheses
      ];

      for (const num of validNumbers) {
        phoneControl.setValue(num);
        expect(phoneControl.errors).toBeNull();
      }
    });

    it('should flag invalid Egyptian mobile prefix boundaries', () => {
      const invalidPrefixes = [
        '01312345678', // 013 (Landline Qalyubia)
        '01412345678', // 014 (Reserved)
        '01612345678', // 016 (Unassigned)
        '01712345678', // 017 (Unassigned)
        '01812345678', // 018 (Unassigned)
        '01912345678'  // 019 (Unassigned)
      ];

      for (const num of invalidPrefixes) {
        phoneControl.setValue(num);
        expect(phoneControl.errors).toEqual({ invalidEgyptPhone: true });
      }
    });

    it('should flag invalid Egyptian mobile length boundaries', () => {
      // 9 digits (too short)
      phoneControl.setValue('010123456');
      expect(phoneControl.errors).toEqual({ invalidEgyptPhone: true });

      // 12 digits (too long)
      phoneControl.setValue('010123456789');
      expect(phoneControl.errors).toEqual({ invalidEgyptPhone: true });
    });

    it('should validate international phone length boundaries (6 to 15 digits)', () => {
      countryControl.setValue('+1'); // Switch to USA

      // 5 digits (below min boundary of 6)
      phoneControl.setValue('12345');
      expect(phoneControl.errors).toEqual({ invalidLength: true });

      // 6 digits (exact min boundary)
      phoneControl.setValue('123456');
      expect(phoneControl.errors).toBeNull();

      // 10 digits (typical US phone)
      phoneControl.setValue('8005550199');
      expect(phoneControl.errors).toBeNull();

      // 15 digits (exact max boundary E.164)
      phoneControl.setValue('123456789012345');
      expect(phoneControl.errors).toBeNull();

      // 16 digits (above max boundary)
      phoneControl.setValue('1234567890123456');
      expect(phoneControl.errors).toEqual({ invalidLength: true });
    });
  });

  describe('Phone Utility Edge Cases', () => {
    it('splitPhoneNumber should handle null, undefined, and empty string', () => {
      expect(splitPhoneNumber(null)).toEqual({ countryCode: '+20', phoneNumber: '' });
      expect(splitPhoneNumber(undefined)).toEqual({ countryCode: '+20', phoneNumber: '' });
      expect(splitPhoneNumber('')).toEqual({ countryCode: '+20', phoneNumber: '' });
      expect(splitPhoneNumber('   ')).toEqual({ countryCode: '+20', phoneNumber: '' });
    });

    it('splitPhoneNumber should parse international prefixes correctly', () => {
      expect(splitPhoneNumber('+20 1001234567')).toEqual({ countryCode: '+20', phoneNumber: '1001234567' });
      expect(splitPhoneNumber('+966 501234567')).toEqual({ countryCode: '+966', phoneNumber: '501234567' });
      expect(splitPhoneNumber('+1 8005550199')).toEqual({ countryCode: '+1', phoneNumber: '8005550199' });
    });

    it('combinePhoneNumber should handle null and undefined safely', () => {
      expect(combinePhoneNumber(null, null)).toBe('+20');
      expect(combinePhoneNumber('+966', null)).toBe('+966');
      expect(combinePhoneNumber('+20', '1001234567')).toBe('+201001234567');
    });
  });
});

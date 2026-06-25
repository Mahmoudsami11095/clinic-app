import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function phoneValidator(countryCodeControlName: string): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) return null;
    
    const formGroup = control.parent;
    const country = formGroup?.get(countryCodeControlName)?.value || '+20';
    const val = control.value.toString().replace(/[\s\-()]/g, '');

    if (!/^\d+$/.test(val)) {
      return { onlyDigits: true };
    }

    if (country === '+20') {
      let clean = val;
      if (clean.startsWith('0')) {
        clean = clean.substring(1);
      }
      
      // Check if it looks like a mobile number (starts with 1)
      const mobilePrefix = /^(10|11|12|15)/.test(clean);
      if (mobilePrefix) {
        // Must be exactly 10 digits after removing leading 0 (e.g. 1012345678)
        if (!/^(10|11|12|15)\d{8}$/.test(clean)) {
          return { invalidEgyptPhone: true };
        }
      } else {
        // Landline: 7-9 digits (area code + number)
        if (clean.length < 7 || clean.length > 9) {
          return { invalidEgyptPhone: true };
        }
      }
    } else {
      if (val.length < 6 || val.length > 15) {
        return { invalidLength: true };
      }
    }
    return null;
  };
}

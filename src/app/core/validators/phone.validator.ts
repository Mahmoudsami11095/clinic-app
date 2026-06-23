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
      
      const isMobile = /^(10|11|12|15)\d{8}$/.test(clean);
      const isLandline = clean.length >= 7 && clean.length <= 9;
      if (!isMobile && !isLandline) {
        return { invalidEgyptPhone: true };
      }
    } else {
      if (val.length < 6 || val.length > 15) {
        return { invalidLength: true };
      }
    }
    return null;
  };
}

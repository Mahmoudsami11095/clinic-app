import { Pipe, PipeTransform, inject } from '@angular/core';
import { LanguageService } from './language.service';

@Pipe({
  name: 'clinicCurrency',
  standalone: true,
  pure: false
})
export class ClinicCurrencyPipe implements PipeTransform {
  private languageService = inject(LanguageService);

  transform(
    value: number | string | null | undefined,
    display: 'symbol' | 'code' | 'none' = 'symbol',
    digitsInfo: string = '1.0-2'
  ): string {
    if (value === null || value === undefined || value === '') {
      return '';
    }

    const num = typeof value === 'number' ? value : parseFloat(String(value));
    if (isNaN(num)) {
      return '';
    }

    // Parse digitsInfo format: {minIntegerDigits}.{minFractionDigits}-{maxFractionDigits}
    let minFraction = 0;
    let maxFraction = 2;
    if (digitsInfo) {
      const parts = digitsInfo.split('.');
      if (parts[1]) {
        const fractionParts = parts[1].split('-');
        minFraction = parseInt(fractionParts[0], 10) || 0;
        maxFraction = parseInt(fractionParts[1] || fractionParts[0], 10) || 0;
      }
    }

    const isNegative = num < 0;
    const absVal = Math.abs(num);

    const formattedNum = absVal.toLocaleString('en-US', {
      minimumFractionDigits: minFraction,
      maximumFractionDigits: maxFraction
    });

    if (display === 'none') {
      return isNegative ? `-${formattedNum}` : formattedNum;
    }

    const isAr = this.languageService.currentLang() === 'ar';
    const symbol = isAr ? 'ج.م' : 'EGP';

    // Format: "1,250 EGP" or "1,250 ج.م" (with negative sign preserved)
    const result = `${formattedNum} ${symbol}`;
    return isNegative ? `-${result}` : result;
  }
}

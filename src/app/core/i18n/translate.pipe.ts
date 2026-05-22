import { Pipe, PipeTransform, inject } from '@angular/core';
import { LanguageService } from './language.service';

@Pipe({
  name: 'translate',
  standalone: true,
  pure: false
})
export class TranslatePipe implements PipeTransform {
  private languageService = inject(LanguageService);

  transform(key: string): string {
    if (!key) return '';
    return this.languageService.translate(key);
  }
}

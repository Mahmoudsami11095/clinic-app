import { Injectable, signal, computed, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Injectable({
  providedIn: 'root'
})
export class LanguageService {
  private translateService = inject(TranslateService);
  private currentLangSignal = signal<'en' | 'ar'>(this.getInitialLanguage());

  currentLang = this.currentLangSignal.asReadonly();
  dir = computed(() => this.currentLangSignal() === 'ar' ? 'rtl' : 'ltr');

  constructor() {
    // Initial sync
    const initialLang = this.currentLangSignal();
    this.translateService.setFallbackLang('en');
    this.translateService.use(initialLang);
    this.updateDomAttributes(initialLang);
  }

  translate(key: string): string {
    // Return instant translation; if not loaded yet, returns the key
    const res = this.translateService.instant(key);
    return res;
  }

  setLanguage(lang: 'en' | 'ar') {
    this.currentLangSignal.set(lang);
    localStorage.setItem('clinic_lang', lang);
    this.translateService.use(lang);
    this.updateDomAttributes(lang);
  }

  private getInitialLanguage(): 'en' | 'ar' {
    const saved = localStorage.getItem('clinic_lang');
    if (saved === 'en' || saved === 'ar') {
      return saved;
    }
    return 'en'; // default
  }

  private updateDomAttributes(lang: 'en' | 'ar') {
    const dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.dir = dir;
    document.documentElement.lang = lang;
  }
}

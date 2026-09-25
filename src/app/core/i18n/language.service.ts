import { Injectable, signal, computed, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LanguageService {
  private translateService = inject(TranslateService);
  private currentLangSignal = signal<'en' | 'ar'>(this.getInitialLanguage());
  readonly isLoaded = signal(false);

  currentLang = this.currentLangSignal.asReadonly();
  dir = computed(() => this.currentLangSignal() === 'ar' ? 'rtl' : 'ltr');

  constructor() {
    // Initial sync
    const initialLang = this.currentLangSignal();
    this.translateService.setFallbackLang('en');
    this.updateDomAttributes(initialLang);
    this.translateService.use(initialLang).subscribe({
      next: () => this.isLoaded.set(true),
      error: () => this.isLoaded.set(true)
    });
  }

  init(): Promise<any> {
    const initialLang = this.currentLangSignal();
    this.translateService.setFallbackLang('en');
    this.updateDomAttributes(initialLang);
    return firstValueFrom(this.translateService.use(initialLang))
      .then(() => {
        this.isLoaded.set(true);
      })
      .catch((err) => {
        console.warn('Could not load translations:', err);
        this.isLoaded.set(true);
      });
  }

  translate(key: string, fallback: string = ''): string {
    const res = this.translateService.instant(key);
    // If translations are still loading and res is the raw key (e.g. "auth.login_title"), suppress raw dot string
    if (res === key && key.includes('.')) {
      return fallback;
    }
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

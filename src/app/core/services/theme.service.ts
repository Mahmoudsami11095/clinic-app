import { Injectable, signal, computed, effect } from '@angular/core';

export type ThemeMode = 'light' | 'dark' | 'system';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly STORAGE_KEY = 'clinic_theme';

  /** The user's chosen mode preference */
  private modeSignal = signal<ThemeMode>(this.getStoredMode());

  /** Whether the OS prefers dark */
  private systemPrefersDark = signal(this.getSystemPreference());

  /** Readonly mode for components */
  mode = this.modeSignal.asReadonly();

  /** Resolved boolean: is the UI actually dark right now? */
  isDark = computed(() => {
    const m = this.modeSignal();
    if (m === 'system') return this.systemPrefersDark();
    return m === 'dark';
  });

  constructor() {
    // Listen for OS theme changes
    if (typeof window !== 'undefined') {
      const mql = window.matchMedia('(prefers-color-scheme: dark)');
      mql.addEventListener('change', (e) => {
        this.systemPrefersDark.set(e.matches);
      });
    }

    // Apply theme class whenever isDark changes
    effect(() => {
      this.applyTheme(this.isDark());
    });
  }

  setMode(mode: ThemeMode): void {
    this.modeSignal.set(mode);
    localStorage.setItem(this.STORAGE_KEY, mode);
  }

  toggle(): void {
    this.setMode(this.isDark() ? 'light' : 'dark');
  }

  private getStoredMode(): ThemeMode {
    if (typeof window === 'undefined') return 'light';
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (stored === 'light' || stored === 'dark' || stored === 'system') {
      return stored;
    }
    return 'light'; // default to light
  }

  private getSystemPreference(): boolean {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  private applyTheme(dark: boolean): void {
    const root = document.documentElement;
    if (dark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }
}

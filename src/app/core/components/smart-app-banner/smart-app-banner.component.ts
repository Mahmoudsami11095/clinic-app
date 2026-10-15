import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { NativeDeviceService } from '../../services/mobile/native-device.service';
import { TranslatePipe } from '../../i18n/translate.pipe';

@Component({
  selector: 'app-smart-app-banner',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  template: `
    @if (isVisible()) {
      <div 
        class="bg-slate-900/95 text-white border-b border-slate-800 px-3 py-2 flex items-center justify-between text-xs sticky top-0 z-40 backdrop-blur-md shadow-sm transition-all"
        role="banner">
        
        <div class="flex items-center gap-2.5 min-w-0">
          <button 
            type="button" 
            (click)="dismissBanner()" 
            class="text-slate-400 hover:text-white p-1 rounded-full cursor-pointer transition-colors"
            aria-label="Dismiss banner">
            <i class="pi pi-times text-[10px]"></i>
          </button>

          <div class="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-500 flex items-center justify-center text-white shrink-0 shadow-sm border border-indigo-400/30">
            <i class="pi pi-plus text-base font-bold"></i>
          </div>

          <div class="min-w-0">
            <div class="font-bold text-slate-100 truncate flex items-center gap-1.5">
              <span>Smart Clinic</span>
              <span class="text-[9px] px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 font-mono">v7.0.0</span>
            </div>
            <div class="text-[10px] text-slate-400 truncate flex items-center gap-1">
              <span class="text-amber-400">★★★★★</span>
              <span>• {{ 'mobile.app_banner_subtitle' | translate }}</span>
            </div>
          </div>
        </div>

        <button 
          type="button" 
          (click)="openDownloadPage()"
          class="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[11px] font-bold shadow-xs cursor-pointer transition-colors shrink-0 ms-2">
          {{ 'mobile.app_banner_cta' | translate }}
        </button>
      </div>
    }
  `
})
export class SmartAppBannerComponent {
  private deviceService = inject(NativeDeviceService);
  private router = inject(Router);

  private readonly DISMISS_KEY = 'smart_app_banner_dismissed_until';
  private readonly DISMISS_DAYS = 14;

  readonly isDismissed = signal(this.checkIfDismissed());

  readonly isVisible = computed(() => {
    // Never show inside native app wrapper
    if (this.deviceService.isNative()) return false;
    // Don't show if user dismissed it within the last 14 days
    if (this.isDismissed()) return false;
    // Show on mobile devices or narrow screen viewports
    return typeof window !== 'undefined' && (this.deviceService.isIOS() || this.deviceService.isAndroid() || window.innerWidth <= 768);
  });

  private checkIfDismissed(): boolean {
    if (typeof localStorage === 'undefined') return false;
    const dismissedUntil = localStorage.getItem(this.DISMISS_KEY);
    if (!dismissedUntil) return false;
    return Date.now() < parseInt(dismissedUntil, 10);
  }

  dismissBanner(): void {
    if (typeof localStorage !== 'undefined') {
      const expiry = Date.now() + this.DISMISS_DAYS * 24 * 60 * 60 * 1000;
      localStorage.setItem(this.DISMISS_KEY, expiry.toString());
    }
    this.isDismissed.set(true);
  }

  openDownloadPage(): void {
    this.router.navigate(['/download']);
  }
}

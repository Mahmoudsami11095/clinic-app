import { Injectable, signal, computed } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';

export type MobilePlatform = 'ios' | 'android' | 'web';

@Injectable({
  providedIn: 'root'
})
export class NativeDeviceService {
  readonly isNative = signal(Capacitor.isNativePlatform());
  readonly platform = signal<MobilePlatform>(this.detectPlatform());

  // HIPAA Compliance: Privacy veil blurs UI when app is moved to background/multitasking
  readonly isPrivacyVeilActive = signal(false);

  readonly isIOS = computed(() => this.platform() === 'ios');
  readonly isAndroid = computed(() => this.platform() === 'android');

  constructor() {
    this.initializeNativeListeners();
  }

  private detectPlatform(): MobilePlatform {
    const p = Capacitor.getPlatform();
    if (p === 'ios') return 'ios';
    if (p === 'android') return 'android';
    return 'web';
  }

  private async initializeNativeListeners() {
    if (!this.isNative()) return;

    try {
      // Hide native splash screen once Angular bootstrap is ready
      await SplashScreen.hide();

      // Configure default transparent/dark status bar
      await StatusBar.setStyle({ style: Style.Dark });
      if (this.isAndroid()) {
        await StatusBar.setBackgroundColor({ color: '#0f172a' });
      }

      // App lifecycle listeners (HIPAA background privacy protection)
      App.addListener('appStateChange', ({ isActive }) => {
        this.isPrivacyVeilActive.set(!isActive);
      });
    } catch {
      // Graceful fallback if native plugins are uninitialized in mock or test runners
    }
  }

  dismissPrivacyVeil() {
    this.isPrivacyVeilActive.set(false);
  }
}

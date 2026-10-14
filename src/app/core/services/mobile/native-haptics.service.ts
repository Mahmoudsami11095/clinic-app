import { Injectable, signal } from '@angular/core';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';

@Injectable({
  providedIn: 'root'
})
export class NativeHapticsService {
  readonly isAvailable = signal(Capacitor.isPluginAvailable('Haptics'));

  async impact(style: 'light' | 'medium' | 'heavy' = 'light') {
    if (this.isAvailable()) {
      try {
        const nativeStyle = 
          style === 'heavy' ? ImpactStyle.Heavy :
          style === 'medium' ? ImpactStyle.Medium : ImpactStyle.Light;

        await Haptics.impact({ style: nativeStyle });
        return;
      } catch {
        // Fallback to web
      }
    }

    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      const ms = style === 'heavy' ? 40 : style === 'medium' ? 25 : 10;
      navigator.vibrate(ms);
    }
  }

  async notification(type: 'success' | 'warning' | 'error' = 'success') {
    if (this.isAvailable()) {
      try {
        const nativeType = 
          type === 'error' ? NotificationType.Error :
          type === 'warning' ? NotificationType.Warning : NotificationType.Success;

        await Haptics.notification({ type: nativeType });
        return;
      } catch {
        // Fallback to web
      }
    }

    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      if (type === 'error') {
        navigator.vibrate([50, 50, 100]);
      } else if (type === 'warning') {
        navigator.vibrate([30, 50, 30]);
      } else {
        navigator.vibrate(40);
      }
    }
  }

  async selectionChanged() {
    if (this.isAvailable()) {
      try {
        await Haptics.selectionChanged();
        return;
      } catch {
        // Fallback
      }
    }

    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(5);
    }
  }
}

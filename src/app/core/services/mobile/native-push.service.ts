import { Injectable, signal, inject } from '@angular/core';
import { PushNotifications, Token, ActionPerformed, PushNotificationSchema } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

export interface MobileNotificationPayload {
  title?: string;
  body?: string;
  data?: any;
}

@Injectable({
  providedIn: 'root'
})
export class NativePushService {
  private http = inject(HttpClient);

  readonly isAvailable = signal(Capacitor.isPluginAvailable('PushNotifications'));
  readonly deviceToken = signal<string | null>(null);
  readonly lastNotification = signal<MobileNotificationPayload | null>(null);

  constructor() {
    this.initPushListeners();
  }

  async requestPermissionsAndRegister(): Promise<boolean> {
    if (!this.isAvailable()) {
      return this.fallbackWebNotificationPermission();
    }

    try {
      let permStatus = await PushNotifications.checkPermissions();
      if (permStatus.receive === 'prompt') {
        permStatus = await PushNotifications.requestPermissions();
      }

      if (permStatus.receive === 'granted') {
        await PushNotifications.register();
        return true;
      }
      return false;
    } catch (err) {
      console.warn('Native push permission request failed:', err);
      return false;
    }
  }

  private initPushListeners() {
    if (!this.isAvailable()) return;

    try {
      PushNotifications.addListener('registration', (token: Token) => {
        this.deviceToken.set(token.value);
        this.syncTokenWithBackend(token.value);
      });

      PushNotifications.addListener('registrationError', (err: any) => {
        console.error('Push notification registration error:', err);
      });

      PushNotifications.addListener('pushNotificationReceived', (notification: PushNotificationSchema) => {
        this.lastNotification.set({
          title: notification.title,
          body: notification.body,
          data: notification.data
        });
      });

      PushNotifications.addListener('pushNotificationActionPerformed', (action: ActionPerformed) => {
        this.lastNotification.set({
          title: action.notification.title,
          body: action.notification.body,
          data: action.notification.data
        });
      });
    } catch {
      // Graceful fallback for mock and headless environments
    }
  }

  private syncTokenWithBackend(token: string) {
    // Post token to backend device registry
    const platform = Capacitor.getPlatform();
    this.http.post(`${environment.apiUrl}/mobile/devices/register`, {
      deviceToken: token,
      platform: platform,
      appVersion: '7.0.0'
    }).subscribe({
      next: () => console.log('Mobile device token synchronized with backend'),
      error: (err) => console.warn('Could not sync mobile push token (backend may be pre-migrated):', err)
    });
  }

  private async fallbackWebNotificationPermission(): Promise<boolean> {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      const res = await Notification.requestPermission();
      return res === 'granted';
    }
    return false;
  }
}

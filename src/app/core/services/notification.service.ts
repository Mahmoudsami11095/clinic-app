import { Injectable, signal, effect, inject, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import * as signalR from '@microsoft/signalr';
import { AuthService } from '../auth/auth.service';
import { NativeHapticsService } from './mobile/native-haptics.service';
import { environment } from '../../../environments/environment';

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

export type NotificationFilter = 'all' | 'unread' | 'clinical' | 'operational';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private haptics = inject(NativeHapticsService);
  private router = inject(Router);
  private hubConnection: signalR.HubConnection | null = null;
  private toastTimer: any = null;
  
  public notifications = signal<Notification[]>([]);
  public unreadCount = signal<number>(0);
  public chairStatusUpdated = signal<any | null>(null);
  public filterType = signal<NotificationFilter>('all');
  public activeToast = signal<Notification | null>(null);

  public filteredNotifications = computed(() => {
    const list = this.notifications();
    const filter = this.filterType();

    if (filter === 'unread') {
      return list.filter(n => !n.isRead);
    }
    if (filter === 'clinical') {
      return list.filter(n => {
        const t = (n.type || '').toLowerCase();
        return t === 'appointment' || t === 'clinical' || t === 'prescription' || t === 'radiology';
      });
    }
    if (filter === 'operational') {
      return list.filter(n => {
        const t = (n.type || '').toLowerCase();
        return t === 'operatory' || t === 'chair' || t === 'inventory' || t === 'material' || t === 'billing';
      });
    }
    return list;
  });

  constructor() {
    effect(() => {
      const isAuthenticated = this.authService.isAuthenticated();
      if (isAuthenticated) {
        const token = this.authService.getToken();
        if (token) {
          this.startConnection(token);
          this.fetchInitialNotifications();
        }
      } else {
        this.stopConnection();
      }
    });
  }

  private startConnection(token: string) {
    if (this.hubConnection) {
      this.hubConnection.stop();
    }

    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl(`${environment.apiUrl.replace(/\/api$/, '')}/hubs/notifications`, {
        accessTokenFactory: () => token
      })
      .withAutomaticReconnect()
      .build();

    this.hubConnection.start()
      .then(() => console.log('SignalR connection started for notifications'))
      .catch(err => console.error('Error while starting SignalR connection: ', err));

    this.hubConnection.on('ReceiveNotification', (notification: Notification) => {
      this.notifications.update(n => [notification, ...n]);
      this.updateUnreadCount();
      this.triggerToastAlert(notification);
    });

    this.hubConnection.on('ReceiveChairStatusUpdate', (chair: any) => {
      this.chairStatusUpdated.set(chair);
    });
  }

  public joinClinicRoom(clinicId: string) {
    if (this.hubConnection && this.hubConnection.state === signalR.HubConnectionState.Connected) {
      this.hubConnection.invoke('JoinClinicRoom', clinicId).catch(err => console.warn('SignalR join room failed', err));
    }
  }

  private stopConnection() {
    if (this.hubConnection) {
      this.hubConnection.stop();
      this.hubConnection = null;
    }
    this.notifications.set([]);
    this.unreadCount.set(0);
    this.activeToast.set(null);
  }

  private fetchInitialNotifications() {
    this.http.get<Notification[]>(`${environment.apiUrl}/notifications`)
      .subscribe({
        next: (data) => {
          this.notifications.set(data || []);
          this.updateUnreadCount();
        },
        error: (err) => console.error('Error fetching notifications', err)
      });
  }

  private updateUnreadCount() {
    const count = this.notifications().filter(n => !n.isRead).length;
    this.unreadCount.set(count);
  }

  public setFilter(filter: NotificationFilter) {
    this.filterType.set(filter);
  }

  public triggerToastAlert(notification: Notification) {
    this.activeToast.set(notification);
    this.haptics.notification('warning').catch(() => {});

    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
    }
    this.toastTimer = setTimeout(() => {
      this.activeToast.set(null);
    }, 5000);
  }

  public dismissToast() {
    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
    }
    this.activeToast.set(null);
  }

  public markAsRead(id: string) {
    const notif = this.notifications().find(n => n.id === id);
    if (notif && !notif.isRead) {
      this.notifications.update(n => {
        const index = n.findIndex(x => x.id === id);
        if (index !== -1) {
          const updated = [...n];
          updated[index] = { ...updated[index], isRead: true };
          return updated;
        }
        return n;
      });
      this.updateUnreadCount();

      this.http.patch(`${environment.apiUrl}/notifications/${id}/read`, {}).subscribe({
        error: (err) => console.warn('Failed to mark notification read on backend', err)
      });
    }
  }

  public markAllAsRead() {
    this.notifications.update(n => n.map(x => ({ ...x, isRead: true })));
    this.unreadCount.set(0);

    this.http.patch(`${environment.apiUrl}/notifications/read-all`, {}).subscribe({
      error: (err) => console.warn('Failed to mark all notifications read on backend', err)
    });
  }

  public deleteNotification(id: string) {
    this.notifications.update(n => n.filter(x => x.id !== id));
    this.updateUnreadCount();
    if (this.activeToast()?.id === id) {
      this.dismissToast();
    }

    this.http.delete(`${environment.apiUrl}/notifications/${id}`).subscribe({
      error: (err) => console.warn('Failed to delete notification on backend', err)
    });
  }

  public resolveRouteForNotification(notification: Notification): string {
    const t = (notification.type || '').toLowerCase();
    if (t.includes('appointment')) return '/appointments';
    if (t.includes('chair') || t.includes('operatory')) return '/chair-board';
    if (t.includes('billing') || t.includes('payment') || t.includes('claim')) return '/billing';
    if (t.includes('inventory') || t.includes('material') || t.includes('stock')) return '/inventory';
    if (t.includes('radiology') || t.includes('scan') || t.includes('dicom')) return '/radiology';
    return '/dashboard';
  }

  public navigateAndMarkRead(notification: Notification) {
    this.markAsRead(notification.id);
    this.dismissToast();
    const route = this.resolveRouteForNotification(notification);
    this.router.navigate([route]);
  }
}

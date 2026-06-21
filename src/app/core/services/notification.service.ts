import { Injectable, signal, effect, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import * as signalR from '@microsoft/signalr';
import { AuthService } from '../auth/auth.service';
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

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private hubConnection: signalR.HubConnection | null = null;
  
  public notifications = signal<Notification[]>([]);
  public unreadCount = signal<number>(0);

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
    });
  }

  private stopConnection() {
    if (this.hubConnection) {
      this.hubConnection.stop();
      this.hubConnection = null;
    }
    this.notifications.set([]);
    this.unreadCount.set(0);
  }

  private fetchInitialNotifications() {
    this.http.get<Notification[]>(`${environment.apiUrl}/notifications`)
      .subscribe({
        next: (data) => {
          this.notifications.set(data);
          this.updateUnreadCount();
        },
        error: (err) => console.error('Error fetching notifications', err)
      });
  }

  private updateUnreadCount() {
    const count = this.notifications().filter(n => !n.isRead).length;
    this.unreadCount.set(count);
  }

  public markAsRead(id: string) {
    const notif = this.notifications().find(n => n.id === id);
    if (notif && !notif.isRead) {
      this.http.patch(`${environment.apiUrl}/notifications/${id}/read`, {}).subscribe({
        next: () => {
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
        }
      });
    }
  }

  public markAllAsRead() {
    this.http.patch(`${environment.apiUrl}/notifications/read-all`, {}).subscribe({
      next: () => {
        this.notifications.update(n => n.map(x => ({ ...x, isRead: true })));
        this.unreadCount.set(0);
      }
    });
  }
}

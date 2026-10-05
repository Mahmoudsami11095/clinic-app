import { Injectable, inject, signal, effect } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { ToastrService } from 'ngx-toastr';

export interface PendingAction {
  id: string;
  url: string;
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: any;
  timestamp: number;
  label?: string;
}

@Injectable({
  providedIn: 'root'
})
export class OfflineService {
  private http = inject(HttpClient);
  private toastr = inject(ToastrService);

  readonly isOnline = signal<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);
  readonly isReconnected = signal<boolean>(false);
  readonly pendingActions = signal<PendingAction[]>([]);

  private readonly STORAGE_PREFIX = 'medclinic_cache_';
  private readonly QUEUE_KEY = 'medclinic_offline_queue';

  constructor() {
    this.initListeners();
    this.loadPendingQueue();
  }

  private initListeners(): void {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.handleOnline());
      window.addEventListener('offline', () => this.handleOffline());
    }
  }

  private handleOnline(): void {
    this.isOnline.set(true);
    this.isReconnected.set(true);
    
    this.toastr.success('Connection restored. Synchronizing records...', 'Back Online');

    // Auto-dismiss reconnected banner after 5 seconds
    setTimeout(() => {
      this.isReconnected.set(false);
    }, 5000);

    // Replay queued offline mutations
    this.flushPendingQueue();
  }

  private handleOffline(): void {
    this.isOnline.set(false);
    this.isReconnected.set(false);
    this.toastr.warning('You are currently working offline. Cached records are available.', 'Offline Mode Active');
  }

  /**
   * Save a local snapshot for fast offline fallback
   */
  saveSnapshot<T>(key: string, data: T): void {
    try {
      if (typeof localStorage !== 'undefined') {
        const item = {
          data,
          cachedAt: Date.now()
        };
        localStorage.setItem(this.STORAGE_PREFIX + key, JSON.stringify(item));
      }
    } catch (e) {
      console.warn('Could not save offline cache snapshot:', e);
    }
  }

  /**
   * Retrieve a local snapshot when offline or on network failure
   */
  getSnapshot<T>(key: string): T | null {
    try {
      if (typeof localStorage !== 'undefined') {
        const itemStr = localStorage.getItem(this.STORAGE_PREFIX + key);
        if (itemStr) {
          const parsed = JSON.parse(itemStr);
          return parsed.data as T;
        }
      }
    } catch (e) {
      console.warn('Could not read offline cache snapshot:', e);
    }
    return null;
  }

  /**
   * Queue a data mutation performed while offline
   */
  queueAction(action: Omit<PendingAction, 'id' | 'timestamp'>): void {
    const fullAction: PendingAction = {
      ...action,
      id: 'action_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      timestamp: Date.now()
    };

    const updated = [...this.pendingActions(), fullAction];
    this.pendingActions.set(updated);
    this.savePendingQueue(updated);

    this.toastr.info('Action queued locally. Will synchronize once connected.', 'Offline Sync');
  }

  /**
   * Flush pending mutations once back online
   */
  async flushPendingQueue(): Promise<void> {
    const queue = [...this.pendingActions()];
    if (queue.length === 0) return;

    const remaining: PendingAction[] = [];

    for (const action of queue) {
      try {
        if (action.method === 'POST') {
          await firstValueFrom(this.http.post(action.url, action.body));
        } else if (action.method === 'PUT') {
          await firstValueFrom(this.http.put(action.url, action.body));
        } else if (action.method === 'DELETE') {
          await firstValueFrom(this.http.delete(action.url));
        }
      } catch (err) {
        console.warn('Failed to replay offline action:', action, err);
        remaining.push(action);
      }
    }

    this.pendingActions.set(remaining);
    this.savePendingQueue(remaining);

    if (remaining.length === 0) {
      this.toastr.success('All offline changes synchronized successfully!', 'Sync Complete');
    }
  }

  /**
   * Manually check connection via health ping
   */
  async checkConnection(): Promise<boolean> {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      this.isOnline.set(false);
      return false;
    }

    try {
      await fetch('/favicon.ico', { method: 'HEAD', cache: 'no-store' });
      this.handleOnline();
      return true;
    } catch {
      this.handleOffline();
      return false;
    }
  }

  private loadPendingQueue(): void {
    try {
      if (typeof localStorage !== 'undefined') {
        const str = localStorage.getItem(this.QUEUE_KEY);
        if (str) {
          const parsed = JSON.parse(str);
          this.pendingActions.set(parsed || []);
        }
      }
    } catch {}
  }

  private savePendingQueue(queue: PendingAction[]): void {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(this.QUEUE_KEY, JSON.stringify(queue));
      }
    } catch {}
  }
}

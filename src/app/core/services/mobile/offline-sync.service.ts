import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import * as localForage from 'localforage';

export interface QueuedRequest {
  id: string;
  url: string;
  method: 'POST' | 'PUT' | 'DELETE';
  body?: any;
  timestamp: number;
}

@Injectable({
  providedIn: 'root'
})
export class OfflineSyncService {
  readonly isOnline = signal(true);
  readonly pendingQueueSize = signal(0);
  private queueStore: LocalForage;

  constructor(private http: HttpClient) {
    this.queueStore = localForage.createInstance({
      name: 'smartClinicDB',
      storeName: 'syncQueue'
    });

    this.checkInitialNetwork();
    this.setupListeners();
    this.updateQueueCount();
  }

  private checkInitialNetwork() {
    if (typeof window !== 'undefined') {
      this.isOnline.set(navigator.onLine);
    }
  }

  private setupListeners() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.isOnline.set(true);
        this.processQueue();
      });

      window.addEventListener('offline', () => {
        this.isOnline.set(false);
      });
    }
  }

  async queueRequest(url: string, method: 'POST' | 'PUT' | 'DELETE', body?: any): Promise<void> {
    const request: QueuedRequest = {
      id: crypto.randomUUID(),
      url,
      method,
      body,
      timestamp: Date.now()
    };

    await this.queueStore.setItem(request.id, request);
    await this.updateQueueCount();

    if (this.isOnline()) {
      this.processQueue();
    }
  }

  private async updateQueueCount() {
    const keys = await this.queueStore.keys();
    this.pendingQueueSize.set(keys.length);
  }

  async processQueue(): Promise<void> {
    if (!this.isOnline()) return;

    const keys = await this.queueStore.keys();
    if (keys.length === 0) return;

    // Process sequentially to maintain data integrity
    const sortedKeys = keys.sort(); // Assuming basic chronological sort is sufficient or IDs encode time
    
    for (const key of sortedKeys) {
      if (!this.isOnline()) break; // Stop if connection drops during sync
      
      const req: QueuedRequest | null = await this.queueStore.getItem(key);
      if (!req) continue;

      try {
        await this.dispatchToBackend(req);
        await this.queueStore.removeItem(key);
      } catch (err: any) {
        // If it's a 4xx error (e.g. Bad Request), we drop it so it doesn't block the queue forever.
        // If it's a 5xx or 0 (network fail), we leave it in the queue for later.
        if (err.status >= 400 && err.status < 500) {
          console.warn('Dropping invalid offline request from queue', req, err);
          await this.queueStore.removeItem(key);
        } else {
          console.error('Offline request failed to dispatch, retaining in queue', err);
          break; // Stop processing further requests until network stabilizes
        }
      }
    }
    
    await this.updateQueueCount();
  }

  private dispatchToBackend(req: QueuedRequest): Promise<any> {
    return new Promise((resolve, reject) => {
      const headers = new HttpHeaders({ 'X-Offline-Synced': 'true' });
      const options = { headers };

      if (req.method === 'POST') {
        this.http.post(req.url, req.body, options).subscribe({ next: resolve, error: reject });
      } else if (req.method === 'PUT') {
        this.http.put(req.url, req.body, options).subscribe({ next: resolve, error: reject });
      } else if (req.method === 'DELETE') {
        this.http.delete(req.url, options).subscribe({ next: resolve, error: reject });
      }
    });
  }
}

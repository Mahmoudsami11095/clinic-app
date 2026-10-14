import { HttpInterceptorFn, HttpResponse, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { of, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { OfflineSyncService } from '../services/mobile/offline-sync.service';

export const offlineSyncInterceptor: HttpInterceptorFn = (req, next) => {
  const syncService = inject(OfflineSyncService);

  // Skip GET requests, auth requests, or requests marked as already synced
  if (req.method === 'GET' || req.headers.has('X-Offline-Synced') || req.url.includes('/api/auth/')) {
    return next(req);
  }

  // If already known to be offline, queue immediately and return optimistic 200
  if (!syncService.isOnline()) {
    syncService.queueRequest(req.url, req.method as any, req.body);
    return of(new HttpResponse({
      status: 200,
      body: { message: 'Action saved locally and queued for offline synchronization.', data: req.body }
    }));
  }

  // If online, attempt request; if network disconnection (status 0), queue for sync
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 0) {
        syncService.isOnline.set(false);
        syncService.queueRequest(req.url, req.method as any, req.body);
        return of(new HttpResponse({
          status: 200,
          body: { message: 'Network connection lost. Action queued for synchronization.', data: req.body }
        }));
      }
      return throwError(() => error);
    })
  );
};

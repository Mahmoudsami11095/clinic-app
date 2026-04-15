import { HttpInterceptorFn, HttpResponse, HttpRequest, HttpHandlerFn, HttpEvent } from '@angular/common/http';
import { Observable, delay, of } from 'rxjs';

export const mockBackendInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> => {
  // Only intercept /api requests
  if (!req.url.startsWith('/api')) {
    return next(req);
  }

  const handleMockRequest = (entity: string): Observable<HttpEvent<unknown>> => {
    if (req.method === 'GET') {
      const mockUrl = `/assets/mock-data/${entity}.json`;
      const modifiedReq = req.clone({ url: mockUrl });
      return next(modifiedReq).pipe(delay(500)); // Simulate network latency
    } else {
      // Simulate POST, PUT, DELETE with a generic success response
      console.log(`[Mock Backend] Intercepted ${req.method} to ${req.url}`, req.body);
      return of(new HttpResponse({ status: 200, body: { message: 'Success' } })).pipe(delay(500));
    }
  };

  if (req.url.includes('/api/patients')) return handleMockRequest('patients');
  if (req.url.includes('/api/appointments')) return handleMockRequest('appointments');
  if (req.url.includes('/api/doctors')) return handleMockRequest('doctors');
  if (req.url.includes('/api/billing')) return handleMockRequest('billing');

  // Fallback for unmatched API requests
  return next(req);
};

import { HttpInterceptorFn, HttpResponse, HttpRequest, HttpHandlerFn, HttpEvent } from '@angular/common/http';
import { Observable, delay, of, tap } from 'rxjs';

export const mockBackendInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> => {
  // Only intercept /api requests
  if (!req.url.startsWith('/api')) {
    return next(req);
  }

  const getEntityName = (url: string): string | null => {
    if (url.includes('/api/patients')) return 'patients';
    if (url.includes('/api/appointments')) return 'appointments';
    if (url.includes('/api/doctors')) return 'doctors';
    if (url.includes('/api/billing')) return 'billing';
    return null;
  };

  const entity = getEntityName(req.url);
  if (!entity) {
    return next(req);
  }

  const storageKey = `mock_${entity}`;

  if (req.method === 'GET') {
    const storedData = localStorage.getItem(storageKey);
    if (storedData) {
      // Return cached data from localStorage
      const parsedData = JSON.parse(storedData);
      return of(new HttpResponse({
        status: 200,
        body: { data: parsedData }
      })).pipe(delay(400));
    } else {
      // Fetch from JSON and cache it
      const mockUrl = `/assets/mock-data/${entity}.json`;
      const modifiedReq = req.clone({ url: mockUrl });
      return next(modifiedReq).pipe(
        delay(400),
        tap((event) => {
          if (event instanceof HttpResponse) {
            const body = event.body as { data: any[] };
            if (body && body.data) {
              localStorage.setItem(storageKey, JSON.stringify(body.data));
            }
          }
        })
      );
    }
  } else if (req.method === 'POST') {
    const newItem = req.body as any;
    const storedData = localStorage.getItem(storageKey);
    let list: any[] = [];
    if (storedData) {
      list = JSON.parse(storedData);
    }
    // Push new item. Ensure it has an ID if not present
    if (newItem && typeof newItem === 'object') {
      if (!newItem.id) {
        newItem.id = crypto.randomUUID();
      }
      list.push(newItem);
      localStorage.setItem(storageKey, JSON.stringify(list));
    }
    console.log(`[Mock Backend] POST Success to ${req.url}`, newItem);
    return of(new HttpResponse({ status: 200, body: { message: 'Success', data: newItem } })).pipe(delay(400));

  } else if (req.method === 'PUT') {
    const updatedItem = req.body as any;
    const storedData = localStorage.getItem(storageKey);
    if (storedData && updatedItem && typeof updatedItem === 'object') {
      let list: any[] = JSON.parse(storedData);
      const index = list.findIndex(item => item.id === updatedItem.id);
      if (index !== -1) {
        list[index] = { ...list[index], ...updatedItem };
        localStorage.setItem(storageKey, JSON.stringify(list));
        console.log(`[Mock Backend] PUT Success to ${req.url}`, updatedItem);
        return of(new HttpResponse({ status: 200, body: { message: 'Success', data: list[index] } })).pipe(delay(400));
      }
    }
    // Also handle dynamic ID in URL like /api/billing/123
    const urlParts = req.url.split('/');
    const lastPart = urlParts[urlParts.length - 1];
    if (lastPart && storedData && updatedItem) {
      let list: any[] = JSON.parse(storedData);
      const index = list.findIndex(item => item.id === lastPart);
      if (index !== -1) {
        list[index] = { ...list[index], ...updatedItem };
        localStorage.setItem(storageKey, JSON.stringify(list));
        console.log(`[Mock Backend] PUT Success for ID ${lastPart} to ${req.url}`, updatedItem);
        return of(new HttpResponse({ status: 200, body: { message: 'Success', data: list[index] } })).pipe(delay(400));
      }
    }

    return of(new HttpResponse({ status: 200, body: { message: 'Success' } })).pipe(delay(400));
  }

  return next(req);
};

import { HttpInterceptorFn, HttpResponse, HttpHandlerFn, HttpEvent } from '@angular/common/http';
import { Observable, delay, of } from 'rxjs';
import {
  readMockList,
  resolveMockEntity,
  writeMockList,
} from '../mock/mock-data.store';

const entityMemoryCache: Partial<Record<string, unknown[]>> = {};

function getList(entity: string): unknown[] {
  if (!entityMemoryCache[entity]) {
    entityMemoryCache[entity] = readMockList(entity);
  }
  return entityMemoryCache[entity]!;
}

function setList(entity: string, list: unknown[]): void {
  entityMemoryCache[entity] = list;
  writeMockList(entity, list);
}

export const mockBackendInterceptor: HttpInterceptorFn = (req, next): Observable<HttpEvent<unknown>> => {
  if (!req.url.startsWith('/api')) {
    return next(req);
  }

  const entity = resolveMockEntity(req.url);
  if (!entity) {
    return next(req);
  }

  if (req.method === 'GET') {
    const data = getList(entity);
    return of(new HttpResponse({ status: 200, body: { data } })).pipe(delay(400));
  }

  if (req.method === 'POST') {
    const newItem = req.body as Record<string, unknown> | null;
    const list = [...getList(entity)];

    if (newItem && typeof newItem === 'object') {
      if (!newItem['id']) {
        newItem['id'] = crypto.randomUUID();
      }
      list.push(newItem);
      setList(entity, list);
    }

    return of(new HttpResponse({ status: 200, body: { message: 'Success', data: newItem } })).pipe(delay(400));
  }

  if (req.method === 'PUT') {
    const updatedItem = req.body as Record<string, unknown> | null;
    const list = [...getList(entity)];

    if (updatedItem && typeof updatedItem === 'object') {
      const index = list.findIndex(
        item => (item as Record<string, unknown>)['id'] === updatedItem['id']
      );
      if (index !== -1) {
        list[index] = { ...(list[index] as object), ...updatedItem };
        setList(entity, list);
        return of(new HttpResponse({ status: 200, body: { message: 'Success', data: list[index] } })).pipe(
          delay(400)
        );
      }
    }

    const urlParts = req.url.split('/');
    const idFromUrl = urlParts[urlParts.length - 1];
    if (idFromUrl && updatedItem) {
      const index = list.findIndex(
        item => String((item as Record<string, unknown>)['id']) === idFromUrl
      );
      if (index !== -1) {
        list[index] = { ...(list[index] as object), ...updatedItem };
        setList(entity, list);
        return of(new HttpResponse({ status: 200, body: { message: 'Success', data: list[index] } })).pipe(
          delay(400)
        );
      }
    }

    return of(new HttpResponse({ status: 200, body: { message: 'Success' } })).pipe(delay(400));
  }

  if (req.method === 'DELETE') {
    const urlParts = req.url.split('/').filter(Boolean);
    const idFromUrl = urlParts[urlParts.length - 1];
    const list = [...getList(entity)];
    const index = list.findIndex(
      item => String((item as Record<string, unknown>)['id']) === idFromUrl
    );

    if (index !== -1) {
      list.splice(index, 1);
      setList(entity, list);
      return of(new HttpResponse({ status: 200, body: { message: 'Deleted' } })).pipe(delay(400));
    }

    return of(new HttpResponse({ status: 404, body: { message: 'Not found' } })).pipe(delay(400));
  }

  return next(req);
};

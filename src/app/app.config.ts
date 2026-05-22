import { ApplicationConfig, inject, provideAppInitializer, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { mockBackendInterceptor } from './core/interceptors/mock-backend.interceptor';
import { initializeMockDatabase } from './core/mock/mock-data.store';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withInterceptors([mockBackendInterceptor])),
    provideAppInitializer(() => {
      const http = inject(HttpClient);
      return initializeMockDatabase(http);
    }),
  ]
};

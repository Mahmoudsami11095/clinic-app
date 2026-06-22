import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject, Injector } from '@angular/core';
import { AuthService } from '../auth/auth.service';
import { catchError, throwError } from 'rxjs';

export const authTokenInterceptor: HttpInterceptorFn = (req, next) => {
  const injector = inject(Injector);
  const token = localStorage.getItem('clinic_token');

  let clonedReq = req;
  if (token) {
    clonedReq = req.clone({
      headers: req.headers.set('Authorization', `Bearer ${token}`)
    });
  }

  return next(clonedReq).pipe(
    catchError((err: HttpErrorResponse) => {
      // Don't intercept 401s from the auth endpoints themselves (e.g., wrong password)
      if (err.status === 401 && !req.url.includes('/auth/')) {
        injector.get(AuthService).logout();
      }
      return throwError(() => err);
    })
  );
};

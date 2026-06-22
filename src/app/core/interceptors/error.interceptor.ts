import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject, Injector } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { catchError, throwError } from 'rxjs';
import { extractErrorMessage } from '../utils/error.utils';
import { LanguageService } from '../i18n/language.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const toastr = inject(ToastrService);
  const injector = inject(Injector);

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      let errorMessage = err.message || 'Unknown error';
      let errorTitle = 'Error';
      
      try {
        const languageService = injector.get(LanguageService);
        errorMessage = extractErrorMessage(err, (k) => languageService.translate(k));
        errorTitle = languageService.translate('toast.error');
      } catch (e) {
        errorMessage = extractErrorMessage(err, (k) => k);
      }

      // Extend the error object with the extracted message
      const customError = Object.assign(err, { extractedMessage: errorMessage });

      console.error('[HTTP Error Interceptor]:', {
        url: req.url,
        status: err.status,
        message: errorMessage,
        originalError: err
      });

      if (err.status === 0 || err.status === 401 || err.status === 403 || err.status >= 500) {
        const isUnassignedClinicError = err.status === 403 && req.method === 'GET' && errorMessage.toLowerCase().includes('assigned to at least one clinic');
        if (!isUnassignedClinicError) {
          toastr.error(errorMessage, errorTitle);
        }
      }

      return throwError(() => customError);
    })
  );
};

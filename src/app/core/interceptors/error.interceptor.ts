import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { catchError, throwError } from 'rxjs';
import { extractErrorMessage } from '../utils/error.utils';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const toastr = inject(ToastrService);

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      const errorMessage = extractErrorMessage(err);
      
      // Extend the error object with the extracted message
      const customError = Object.assign(err, { extractedMessage: errorMessage });

      console.error('[HTTP Error Interceptor]:', {
        url: req.url,
        status: err.status,
        message: errorMessage,
        originalError: err
      });

      if (err.status === 0 || err.status >= 500) {
        toastr.error(errorMessage, 'Server Error');
      }

      return throwError(() => customError);
    })
  );
};

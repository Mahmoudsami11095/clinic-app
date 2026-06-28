import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject, Injector } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { catchError, throwError, retry, timer } from 'rxjs';
import { extractErrorMessage } from '../utils/error.utils';
import { LanguageService } from '../i18n/language.service';
import emailjs from '@emailjs/browser';
import { environment } from '../../../environments/environment';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const toastr = inject(ToastrService);
  const injector = inject(Injector);

  return next(req).pipe(
    retry({
      count: 2,
      delay: (error: HttpErrorResponse, retryCount: number) => {
        // Retry on Server Unreachable (0) or Service Unavailable (503, 504) which usually happen on cold starts
        if (error.status === 0 || error.status === 503 || error.status === 504) {
          console.warn(`[HTTP Error Interceptor]: Request failed with status ${error.status}. Retrying (${retryCount}/2)...`);
          return timer(2000); // wait 2 seconds before retrying
        }
        return throwError(() => error);
      }
    }),
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

      // Automatically send an email notification to the developer for critical backend crashes
      if (err.status >= 500) {
        if (environment.emailjs.publicKey !== 'YOUR_PUBLIC_KEY') {
          const templateParams = {
            status: err.status.toString(),
            url: req.url,
            time: new Date().toLocaleString(),
            message: errorMessage
          };
          
          emailjs.send(
            environment.emailjs.serviceId,
            environment.emailjs.templateId,
            templateParams,
            { publicKey: environment.emailjs.publicKey }
          ).then(
            (response) => console.log('Error successfully reported via email.', response.status, response.text),
            (error) => console.error('Failed to report error via email.', error)
          );
        } else {
          console.warn('EmailJS public key is not configured. Cannot send error report.');
        }
      }

      return throwError(() => customError);
    })
  );
};

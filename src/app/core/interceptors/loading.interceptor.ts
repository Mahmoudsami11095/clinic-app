import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { NgxSpinnerService } from 'ngx-spinner';
import { finalize } from 'rxjs';

let totalRequests = 0;
let showTimeout: any;
let hideTimeout: any;

export const loadingInterceptor: HttpInterceptorFn = (req, next) => {
  const spinner = inject(NgxSpinnerService);

  totalRequests++;
  if (totalRequests === 1) {
    clearTimeout(hideTimeout);
    showTimeout = setTimeout(() => spinner.show(), 50);
  }

  return next(req).pipe(
    finalize(() => {
      totalRequests--;
      if (totalRequests === 0) {
        clearTimeout(showTimeout);
        hideTimeout = setTimeout(() => spinner.hide(), 50);
      }
    })
  );
};

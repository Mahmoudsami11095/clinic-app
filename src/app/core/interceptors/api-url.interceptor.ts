import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export const apiUrlInterceptor: HttpInterceptorFn = (req, next) => {
  // If the request URL starts with '/api', prepend the environment API URL
  if (req.url.startsWith('/api') || req.url.startsWith('api/')) {
    const apiReq = req.clone({
      url: `${environment.apiUrl}${req.url.startsWith('/') ? req.url.substring(4) : req.url.substring(3)}`
    });
    return next(apiReq);
  }
  return next(req);
};

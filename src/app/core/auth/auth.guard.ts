import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return true;
  }

  // Redirect to login page and store the attempted URL
  router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
  return false;
};

export const unauthGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    const user = authService.currentUser();
    if (user) {
      if (user.role === 'patient' || user.role === 'assistant') {
        router.navigate(['/appointments']);
      } else {
        router.navigate(['/dashboard']);
      }
    } else {
      router.navigate(['/dashboard']);
    }
    return false;
  }

  return true;
};

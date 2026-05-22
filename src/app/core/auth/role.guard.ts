import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

export const roleGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const allowedRoles = route.data?.['roles'] as Array<'admin' | 'doctor' | 'assistant' | 'patient'>;
  const user = authService.currentUser();

  if (!user) {
    return false;
  }

  if (!allowedRoles || allowedRoles.includes(user.role)) {
    return true;
  }

  // User does not have access. Redirect to a page they do have access to:
  if (user.role === 'patient') {
    router.navigate(['/appointments']);
  } else if (user.role === 'assistant') {
    router.navigate(['/appointments']);
  } else if (user.role === 'doctor') {
    router.navigate(['/dashboard']);
  } else {
    router.navigate(['/dashboard']);
  }

  return false;
};

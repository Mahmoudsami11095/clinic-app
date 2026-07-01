import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

export const subscriptionGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const user = authService.currentUser();

  if (user && user.role === 'doctor') {
    const isExpired = user.subscriptionStatus === 'expired' || 
      (user.subscriptionStatus === 'trial' && user.trialEndDate && new Date() > new Date(user.trialEndDate)) ||
      (user.subscriptionStatus === 'active' && user.subscriptionEndDate && new Date() > new Date(user.subscriptionEndDate));

    if (isExpired) {
      if (state.url.startsWith('/subscription')) {
        return true;
      }
      router.navigate(['/subscription']);
      return false;
    }
  }

  if (user && user.role === 'doctor' && state.url.startsWith('/subscription')) {
    const isExpired = user.subscriptionStatus === 'expired' || 
      (user.subscriptionStatus === 'trial' && user.trialEndDate && new Date() > new Date(user.trialEndDate)) ||
      (user.subscriptionStatus === 'active' && user.subscriptionEndDate && new Date() > new Date(user.subscriptionEndDate));
      
    if (!isExpired) {
      router.navigate(['/dashboard']);
      return false;
    }
  }

  return true;
};

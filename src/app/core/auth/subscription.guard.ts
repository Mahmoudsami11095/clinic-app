import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

export const subscriptionGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const user = authService.currentUser();

  if (user && user.role === 'doctor') {
    const status = user.subscriptionStatus?.toLowerCase();
    const isTrialExpired = status === 'trial' && user.trialEndDate && new Date() > new Date(user.trialEndDate);
    const isSubscriptionExpired = status === 'active' && user.subscriptionEndDate && new Date() > new Date(user.subscriptionEndDate);

    const isLocked = status === 'expired' || 
                     status === 'pendingapproval' || 
                     status === 'suspended' || 
                     isTrialExpired || 
                     isSubscriptionExpired ||
                     !status;

    if (isLocked) {
      if (state.url.startsWith('/subscription')) {
        return true;
      }
      router.navigate(['/subscription']);
      return false;
    }
  }

  if (user && user.role === 'doctor' && state.url.startsWith('/subscription')) {
    const status = user.subscriptionStatus?.toLowerCase();
    const isTrialExpired = status === 'trial' && user.trialEndDate && new Date() > new Date(user.trialEndDate);
    const isSubscriptionExpired = status === 'active' && user.subscriptionEndDate && new Date() > new Date(user.subscriptionEndDate);

    const isLocked = status === 'expired' || 
                     status === 'pendingapproval' || 
                     status === 'suspended' || 
                     isTrialExpired || 
                     isSubscriptionExpired ||
                     !status;
      
    if (!isLocked) {
      router.navigate(['/dashboard']);
      return false;
    }
  }

  return true;
};

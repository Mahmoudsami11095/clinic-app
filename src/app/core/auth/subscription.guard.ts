import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

export const subscriptionGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const user = authService.currentUser();

  if (user && user.role === 'doctor') {
    const status = user.subscriptionStatus?.toLowerCase();
    const isTrialExpired = user.trialEndDate ? new Date() > new Date(user.trialEndDate) : true;
    const isSubscriptionExpired = user.subscriptionEndDate ? new Date() > new Date(user.subscriptionEndDate) : true;

    let isLocked = false;
    if (status === 'expired' || status === 'suspended' || !status) {
      isLocked = true;
    } else if (status === 'trial') {
      isLocked = isTrialExpired;
    } else if (status === 'active') {
      isLocked = isSubscriptionExpired;
    }

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
    const isTrialExpired = user.trialEndDate ? new Date() > new Date(user.trialEndDate) : true;
    const isSubscriptionExpired = user.subscriptionEndDate ? new Date() > new Date(user.subscriptionEndDate) : true;

    let isLocked = false;
    if (status === 'expired' || status === 'suspended' || !status) {
      isLocked = true;
    } else if (status === 'trial') {
      isLocked = isTrialExpired;
    } else if (status === 'active') {
      isLocked = isSubscriptionExpired;
    }
      
    if (!isLocked) {
      router.navigate(['/dashboard']);
      return false;
    }
  }

  return true;
};

import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-subscription',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './subscription.component.html',
  styleUrls: []
})
export class SubscriptionComponent implements OnInit {
  private fb = inject(FormBuilder);
  private toastr = inject(ToastrService);
  private router = inject(Router);
  protected authService = inject(AuthService);
  protected env = environment;

  promoForm!: FormGroup;
  isValidatingPromo = signal(false);
  isActivating = signal(false);
  pricingData = signal<any>(null);

  appliedCode = signal<string>('');
  discountType = signal<string>('');
  discountValue = signal<number>(0);
  discountAmount = signal<number>(0);
  finalAnnualFee = signal<number>(300);
  extraMonths = signal<number>(0);
  totalDue = signal<number>(400);

  isCheckingStatus = signal(false);

  checkLockedStatus(status: any) {
    const statusLower = status.subscriptionStatus?.toLowerCase();
    const isTrialExpired = statusLower === 'trial' && status.trialEndDate && new Date() > new Date(status.trialEndDate);
    const isSubExpired = statusLower === 'active' && status.subscriptionEndDate && new Date() > new Date(status.subscriptionEndDate);
    
    return statusLower === 'expired' || 
           statusLower === 'pendingapproval' || 
           statusLower === 'suspended' || 
           isTrialExpired || 
           isSubExpired || 
           !statusLower;
  }

  ngOnInit() {
    this.promoForm = this.fb.group({
      code: ['', [Validators.required]]
    });

    this.loadPricing();

    // Refresh subscription status from database on load
    this.authService.refreshSubscriptionStatus().subscribe({
      next: (res) => {
        if (!this.checkLockedStatus(res)) {
          this.router.navigate(['/dashboard']);
        }
      }
    });
  }

  checkApprovalStatus() {
    this.isCheckingStatus.set(true);
    this.authService.refreshSubscriptionStatus().subscribe({
      next: (res) => {
        this.isCheckingStatus.set(false);
        const isLocked = this.checkLockedStatus(res);
        if (!isLocked) {
          this.toastr.success('Your subscription has been approved and activated! Welcome back.');
          this.router.navigate(['/dashboard']);
        } else {
          this.toastr.info('Subscription status checked. Still awaiting approval or action.');
        }
      },
      error: () => {
        this.isCheckingStatus.set(false);
        this.toastr.error('Failed to verify subscription status.');
      }
    });
  }

  loadPricing() {
    this.authService.getSubscriptionStatus().subscribe({
      next: (res) => {
        this.pricingData.set(res);
        if (res.pricing) {
          this.finalAnnualFee.set(res.pricing.annualSubscriptionFee);
          this.totalDue.set(res.pricing.initialSetupFee + res.pricing.annualSubscriptionFee);
        }
      },
      error: () => {
        this.toastr.error('Failed to load subscription pricing data.');
      }
    });
  }

  applyPromo() {
    if (this.promoForm.invalid) return;

    const code = this.promoForm.value.code.trim().toUpperCase();
    this.isValidatingPromo.set(true);

    this.authService.validatePromo(code).subscribe({
      next: (res) => {
        this.isValidatingPromo.set(false);
        if (res.valid) {
          this.appliedCode.set(res.code);
          this.discountType.set(res.discountType);
          this.discountValue.set(res.value);
          this.discountAmount.set(res.discountAmount);
          this.finalAnnualFee.set(res.finalAnnualFee);
          this.extraMonths.set(res.extraMonths);
          this.totalDue.set(res.totalDue);
          this.toastr.success(`Promo code "${res.code}" applied successfully!`);
        }
      },
      error: (err) => {
        this.isValidatingPromo.set(false);
        const errMsg = err?.error?.message || 'Invalid or expired promo code.';
        this.toastr.error(errMsg);
      }
    });
  }

  clearPromo() {
    this.appliedCode.set('');
    this.discountType.set('');
    this.discountValue.set(0);
    this.discountAmount.set(0);
    this.extraMonths.set(0);
    this.promoForm.reset();
    
    const pricing = this.pricingData()?.pricing;
    if (pricing) {
      this.finalAnnualFee.set(pricing.annualSubscriptionFee);
      this.totalDue.set(pricing.initialSetupFee + pricing.annualSubscriptionFee);
    }
  }

  processPayment() {
    this.isActivating.set(true);
    const code = this.appliedCode() || undefined;

    this.authService.activateManual(code).subscribe({
      next: () => {
        this.isActivating.set(false);
        this.toastr.success('Payment simulated successfully! Awaiting administrator approval.');
      },
      error: (err) => {
        this.isActivating.set(false);
        const errMsg = err?.error?.message || 'Payment simulation failed.';
        this.toastr.error(errMsg);
      }
    });
  }
}

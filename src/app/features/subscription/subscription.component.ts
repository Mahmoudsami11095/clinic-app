import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-subscription',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslatePipe],
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
  tierQuota = signal<any>(null);
  isLocked = signal<boolean>(false);

  // Upgrade Modal State
  isUpgradeModalOpen = signal<boolean>(false);
  selectedUpgradeTier = signal<string>('Enterprise');
  isSubmittingUpgrade = signal<boolean>(false);

  appliedCode = signal<string>('');
  discountType = signal<string>('');
  discountValue = signal<number>(0);
  discountAmount = signal<number>(0);
  finalAnnualFee = signal<number>(300);
  extraMonths = signal<number>(0);
  totalDue = signal<number>(400);

  isCheckingStatus = signal(false);

  checkLockedStatus(status: any) {
    const statusLower = status?.subscriptionStatus?.toLowerCase();
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

    this.loadSubscriptionData();
  }

  loadSubscriptionData() {
    this.authService.getSubscriptionStatus().subscribe({
      next: (res) => {
        this.pricingData.set(res);
        this.tierQuota.set(res.tierQuota);
        const locked = this.checkLockedStatus(res);
        this.isLocked.set(locked);

        if (res.pricing) {
          const setupFee = res.isInitialFeePaid ? 0 : res.pricing.initialSetupFee;
          this.finalAnnualFee.set(res.pricing.annualSubscriptionFee);
          this.totalDue.set(setupFee + res.pricing.annualSubscriptionFee);
        }
      },
      error: () => {
        this.toastr.error('Failed to load subscription details.');
      }
    });
  }

  getRemainingDays(): number {
    const data = this.pricingData();
    if (!data) return 0;
    const targetDate = data.subscriptionEndDate || data.trialEndDate;
    if (!targetDate) return 0;
    const target = new Date(targetDate).getTime();
    const now = Date.now();
    return Math.max(0, Math.ceil((target - now) / (1000 * 60 * 60 * 24)));
  }

  getExpiryDateFormatted(): string {
    const data = this.pricingData();
    if (!data) return '';
    const targetDate = data.subscriptionEndDate || data.trialEndDate;
    if (!targetDate) return '';
    return new Date(targetDate).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  openUpgradeModal(tierName: string) {
    this.selectedUpgradeTier.set(tierName);
    this.isUpgradeModalOpen.set(true);
  }

  closeUpgradeModal() {
    this.isUpgradeModalOpen.set(false);
  }

  confirmUpgrade() {
    const tier = this.selectedUpgradeTier();
    this.isSubmittingUpgrade.set(true);
    this.authService.upgradeTier(tier).subscribe({
      next: () => {
        this.isSubmittingUpgrade.set(false);
        this.isUpgradeModalOpen.set(false);
        this.toastr.success(
          `Upgrade request to ${tier} submitted successfully! A representative will activate your expanded quotas.`,
          'Tier Upgrade Requested'
        );
      },
      error: () => {
        this.isSubmittingUpgrade.set(false);
        this.toastr.error('Failed to submit upgrade request.', 'Error');
      }
    });
  }

  checkApprovalStatus() {
    this.isCheckingStatus.set(true);
    this.authService.refreshSubscriptionStatus().subscribe({
      next: (res) => {
        this.isCheckingStatus.set(false);
        const isLocked = this.checkLockedStatus(res);
        this.isLocked.set(isLocked);
        if (!isLocked) {
          this.toastr.success('Your subscription has been approved and activated! Welcome back.');
          this.loadSubscriptionData();
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
    const isPaid = this.pricingData()?.isInitialFeePaid;
    if (pricing) {
      const setupFee = isPaid ? 0 : pricing.initialSetupFee;
      this.finalAnnualFee.set(pricing.annualSubscriptionFee);
      this.totalDue.set(setupFee + pricing.annualSubscriptionFee);
    }
  }

  processPayment() {
    this.isActivating.set(true);
    const code = this.appliedCode() || undefined;

    this.authService.activateManual(code).subscribe({
      next: () => {
        this.isActivating.set(false);
        this.toastr.success('Payment simulated successfully! Welcome.');
        this.loadSubscriptionData();
      },
      error: (err) => {
        this.isActivating.set(false);
        const errMsg = err?.error?.message || 'Payment simulation failed.';
        this.toastr.error(errMsg);
      }
    });
  }

  selectedFile: File | null = null;
  isUploadingReceipt = signal(false);

  onFileSelected(event: any) {
    const file = event.target.files?.[0];
    if (file) {
      const allowedExtensions = ['jpg', 'jpeg', 'png', 'pdf'];
      const fileExt = file.name.split('.').pop()?.toLowerCase();
      if (!fileExt || !allowedExtensions.includes(fileExt)) {
        this.toastr.error('Only image files (PNG, JPG, JPEG) and PDF files (PDF) are allowed.', 'Invalid File Format');
        event.target.value = '';
        this.selectedFile = null;
        return;
      }

      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        this.toastr.error('File size cannot exceed 5MB.', 'File Too Large');
        event.target.value = '';
        this.selectedFile = null;
        return;
      }

      this.selectedFile = file;
    }
  }

  uploadReceipt() {
    if (!this.selectedFile) {
      this.toastr.warning('Please select a transfer receipt file first.');
      return;
    }

    this.isUploadingReceipt.set(true);
    const formData = new FormData();
    formData.append('file', this.selectedFile);

    this.authService.uploadReceipt(formData).subscribe({
      next: (res) => {
        this.isUploadingReceipt.set(false);
        this.toastr.success('Transfer receipt uploaded successfully! Welcome.');
        
        const user = this.authService.currentUser();
        if (user) {
          user.subscriptionStatus = res.subscriptionStatus;
          user.isInitialFeePaid = res.isInitialFeePaid;
          this.authService.setCurrentUser(user);
        }

        this.loadSubscriptionData();
      },
      error: (err) => {
        this.isUploadingReceipt.set(false);
        const errMsg = err?.error?.message || 'Failed to upload receipt.';
        this.toastr.error(errMsg);
      }
    });
  }
}

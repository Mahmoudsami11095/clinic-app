import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-admin-settings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './admin-settings.component.html',
  styleUrls: []
})
export class AdminSettingsComponent implements OnInit {
  private fb = inject(FormBuilder);
  private toastr = inject(ToastrService);
  protected authService = inject(AuthService);

  settingsForm!: FormGroup;
  promoForm!: FormGroup;

  isSavingSettings = signal(false);
  isCreatingPromo = signal(false);
  isLoadingData = signal(true);

  promosList = signal<any[]>([]);
  doctorsList = signal<any[]>([]);

  ngOnInit() {
    this.settingsForm = this.fb.group({
      initialSetupFee: [100.00, [Validators.required, Validators.min(0)]],
      annualSubscriptionFee: [300.00, [Validators.required, Validators.min(0)]],
      trialDurationMonths: [6, [Validators.required, Validators.min(0)]]
    });

    this.promoForm = this.fb.group({
      code: ['', [Validators.required, Validators.pattern('^[a-zA-Z0-9]+$')]],
      discountType: ['Percent', [Validators.required]],
      value: [10, [Validators.required, Validators.min(1)]],
      maxUses: [100, [Validators.required, Validators.min(1)]],
      expiryDays: [365, [Validators.required, Validators.min(1)]]
    });

    this.loadData();
  }

  loadData() {
    this.isLoadingData.set(true);
    this.authService.getSubscriptionSettings().subscribe({
      next: (res) => {
        if (res.data) {
          this.settingsForm.patchValue({
            initialSetupFee: res.data.initialSetupFee,
            annualSubscriptionFee: res.data.annualSubscriptionFee,
            trialDurationMonths: res.data.trialDurationMonths
          });
        }
        
        this.authService.getPromos().subscribe({
          next: (promoRes) => {
            this.promosList.set(promoRes.data || []);
            this.loadDoctors();
          },
          error: () => {
            this.toastr.error('Failed to load active promo codes.');
            this.loadDoctors();
          }
        });
      },
      error: () => {
        this.toastr.error('Failed to load global subscription configurations.');
        this.isLoadingData.set(false);
      }
    });
  }

  loadDoctors() {
    this.authService.getDoctorsSubscriptions().subscribe({
      next: (res) => {
        this.doctorsList.set(res.data || []);
        this.isLoadingData.set(false);
      },
      error: () => {
        this.toastr.error('Failed to load doctors subscription list.');
        this.isLoadingData.set(false);
      }
    });
  }

  saveSettings() {
    if (this.settingsForm.invalid) return;

    this.isSavingSettings.set(true);
    const body = {
      initialSetupFee: Number(this.settingsForm.value.initialSetupFee),
      annualSubscriptionFee: Number(this.settingsForm.value.annualSubscriptionFee),
      trialDurationMonths: Number(this.settingsForm.value.trialDurationMonths)
    };

    this.authService.updateSubscriptionSettings(body).subscribe({
      next: () => {
        this.isSavingSettings.set(false);
        this.toastr.success('Pricing configurations updated successfully.');
      },
      error: (err) => {
        this.isSavingSettings.set(false);
        const errMsg = err?.error?.message || 'Failed to update configurations.';
        this.toastr.error(errMsg);
      }
    });
  }

  createPromo() {
    if (this.promoForm.invalid) return;

    this.isCreatingPromo.set(true);
    
    // Calculate expiry date
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + Number(this.promoForm.value.expiryDays));

    const body = {
      code: this.promoForm.value.code.toUpperCase().trim(),
      discountType: this.promoForm.value.discountType,
      value: Number(this.promoForm.value.value),
      maxUses: Number(this.promoForm.value.maxUses),
      expiryDate: expiry
    };

    this.authService.createPromo(body).subscribe({
      next: (res) => {
        this.isCreatingPromo.set(false);
        this.toastr.success('Promo code generated successfully.');
        this.promosList.update(list => [...list, res.data]);
        this.promoForm.reset({
          discountType: 'Percent',
          value: 10,
          maxUses: 100,
          expiryDays: 365
        });
      },
      error: (err) => {
        this.isCreatingPromo.set(false);
        const errMsg = err?.error?.message || 'Failed to generate promo code.';
        this.toastr.error(errMsg);
      }
    });
  }

  deletePromo(id: string) {
    if (!confirm('Are you sure you want to delete/revoke this promo code?')) return;

    this.authService.deletePromo(id).subscribe({
      next: () => {
        this.toastr.success('Promo code deleted successfully.');
        this.promosList.update(list => list.filter(p => p.id !== id));
      },
      error: () => {
        this.toastr.error('Failed to delete promo code.');
      }
    });
  }

  activateDoctor(doctorId: string) {
    if (!confirm('Are you sure you want to approve and activate this doctor\'s subscription?')) return;

    this.authService.activateDoctorSubscription(doctorId).subscribe({
      next: (res) => {
        this.toastr.success(res.message || 'Subscription activated successfully.');
        this.doctorsList.update(list => list.map(d => d.id === doctorId ? { ...d, subscriptionStatus: 'Active' } : d));
      },
      error: (err) => {
        const errMsg = err?.error?.message || 'Failed to activate subscription.';
        this.toastr.error(errMsg);
      }
    });
  }
}

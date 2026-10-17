import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { TenantService } from '../../../../core/services/tenant/tenant.service';
import { InputFieldComponent } from '@clinic/ui/input-field/input-field.component';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-tenant-onboarding',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, InputFieldComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './tenant-onboarding.component.html'
})
export class TenantOnboardingComponent {
  private fb = inject(FormBuilder);
  private tenantService = inject(TenantService);
  private toastr = inject(ToastrService);

  onboardingForm = this.fb.group({
    organizationName: ['', Validators.required],
    subdomain: ['', [Validators.required, Validators.pattern('^[a-z0-9-]+$')]],
    subscriptionTier: ['Starter', Validators.required],
    adminName: ['', Validators.required],
    adminEmail: ['', [Validators.required, Validators.email]],
    adminPassword: ['', [Validators.required, Validators.minLength(6)]]
  });

  isSubmitting = signal(false);
  successResult = signal<{ message: string, loginUrl: string } | null>(null);

  onSubmit() {
    if (this.onboardingForm.invalid) {
      this.onboardingForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.tenantService.onboardTenant(this.onboardingForm.value as any).subscribe({
      next: (res) => {
        this.successResult.set({ message: res.message, loginUrl: res.loginUrl });
        this.toastr.success('Tenant organization created successfully', 'Success');
      },
      error: () => {
        this.isSubmitting.set(false);
        this.toastr.error('Failed to create tenant organization', 'Error');
      },
      complete: () => this.isSubmitting.set(false)
    });
  }
}

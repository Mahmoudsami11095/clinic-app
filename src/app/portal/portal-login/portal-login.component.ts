import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { PatientPortalService } from '../services/patient-portal.service';

@Component({
  selector: 'app-portal-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div class="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div class="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 mb-4">
          <svg class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7 7z" />
          </svg>
        </div>
        <h2 class="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Patient Portal
        </h2>
        <p class="mt-2 text-sm text-slate-600 dark:text-slate-400">
          بوابة المرضى الذكية • Access your appointments & prescriptions
        </p>
      </div>

      <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div class="bg-white dark:bg-slate-800 py-8 px-6 shadow-xl rounded-2xl sm:px-10 border border-slate-100 dark:border-slate-700/60">
          <!-- Step 1: Request OTP -->
          @if (step() === 'phone') {
            <form (ngSubmit)="onRequestOtp()" class="space-y-6">
              <div>
                <label class="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Mobile Number / رقم الهاتف
                </label>
                <div class="mt-2 relative rounded-md shadow-sm">
                  <input
                    type="tel"
                    [(ngModel)]="phone"
                    name="phone"
                    required
                    placeholder="+20 100 000 0000"
                    class="block w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 dark:bg-slate-700/50 dark:text-white focus:ring-2 focus:ring-indigo-500 text-base"
                  />
                </div>
                <p class="mt-1 text-xs text-slate-500">We'll send a 6-digit verification code via WhatsApp/SMS</p>
              </div>

              @if (errorMessage()) {
                <div class="p-3 rounded-lg bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 text-sm">
                  {{ errorMessage() }}
                </div>
              }

              <button
                type="submit"
                [disabled]="isLoading() || !phone.trim()"
                class="w-full flex justify-center py-3.5 px-4 rounded-xl shadow-md text-base font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 transition cursor-pointer"
              >
                {{ isLoading() ? 'Sending Code...' : 'Send Verification Code (إرسال الرمز)' }}
              </button>

              <div class="text-center pt-2">
                <button
                  type="button"
                  (click)="useDemoPatient()"
                  class="text-xs text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                >
                  ⚡ Fast Fill Demo Patient (+201012345678)
                </button>
              </div>
            </form>
          }

          <!-- Step 2: Verify OTP -->
          @if (step() === 'otp') {
            <form (ngSubmit)="onVerifyOtp()" class="space-y-6">
              <div class="text-center mb-2">
                <span class="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 mb-2">
                  Code sent to {{ phone }}
                </span>
                <p class="text-xs text-slate-500">Enter the 6-digit code below</p>
              </div>

              <div>
                <input
                  type="text"
                  [(ngModel)]="otpCode"
                  name="otpCode"
                  maxlength="6"
                  required
                  placeholder="• • • • • •"
                  class="block w-full px-4 py-3 text-center tracking-widest text-2xl font-bold rounded-xl border border-slate-300 dark:border-slate-600 dark:bg-slate-700/50 dark:text-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              @if (errorMessage()) {
                <div class="p-3 rounded-lg bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 text-sm">
                  {{ errorMessage() }}
                </div>
              }

              <button
                type="submit"
                [disabled]="isLoading() || otpCode.length < 4"
                class="w-full flex justify-center py-3.5 px-4 rounded-xl shadow-md text-base font-medium text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 transition cursor-pointer"
              >
                {{ isLoading() ? 'Verifying...' : 'Verify & Sign In (تأكيد ودخول)' }}
              </button>

              <div class="flex justify-between items-center text-xs">
                <button
                  type="button"
                  (click)="step.set('phone')"
                  class="text-slate-500 hover:underline cursor-pointer"
                >
                  ← Change Number
                </button>
                <button
                  type="button"
                  (click)="onRequestOtp()"
                  class="text-indigo-600 hover:underline cursor-pointer"
                >
                  Resend Code
                </button>
              </div>
            </form>
          }
        </div>
      </div>
    </div>
  `
})
export class PortalLoginComponent {
  private portalService = inject(PatientPortalService);
  private router = inject(Router);

  phone = '';
  otpCode = '';
  step = signal<'phone' | 'otp'>('phone');
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);

  useDemoPatient(): void {
    this.phone = '+201012345678';
  }

  onRequestOtp(): void {
    if (!this.phone.trim()) return;
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.portalService.sendOtp(this.phone).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        this.step.set('otp');
        if (res.debugOtp) {
          this.otpCode = res.debugOtp;
        }
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err.error?.message || 'Failed to dispatch code. Please try again.');
      }
    });
  }

  onVerifyOtp(): void {
    if (!this.otpCode.trim()) return;
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.portalService.verifyOtp(this.phone, this.otpCode).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.router.navigate(['/portal/dashboard']);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err.error?.message || 'Invalid verification code.');
      }
    });
  }
}

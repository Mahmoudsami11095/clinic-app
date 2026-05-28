import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../../../core/auth/auth.service';
import { ClinicService } from '../../../core/services/clinic.service';
import { TranslatePipe } from '../../../core/i18n/translate.pipe';
import { LanguageService } from '../../../core/i18n/language.service';
import { ThemeService } from '../../../core/services/theme.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, TranslatePipe],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent {
  protected authService = inject(AuthService);
  protected clinicService = inject(ClinicService);
  protected languageService = inject(LanguageService);
  protected themeService = inject(ThemeService);
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private toastr = inject(ToastrService);

  registerForm: FormGroup;
  showPassword = signal(false);
  isLoading = signal(false);

  availableRoles = [
    { value: 'patient', labelKey: 'auth.role_patient' },
    { value: 'doctor', labelKey: 'auth.role_doctor' },
    { value: 'assistant', labelKey: 'auth.role_assistant' }
  ];

  constructor() {
    this.registerForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      role: ['patient', Validators.required],
      clinicId: ['', Validators.required],
      phone: ['', [Validators.pattern(/^\+?[0-9]{8,15}$/)]],
      gender: ['Male'],
      age: [30, [Validators.min(1), Validators.max(120)]]
    });
  }

  togglePassword() {
    this.showPassword.update(v => !v);
  }

  onSubmit() {
    if (this.registerForm.invalid) {
      this.toastr.error(this.languageService.translate('auth.required_fields'), this.languageService.translate('toast.error'));
      this.registerForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    const formValues = this.registerForm.value;

    this.authService.register(formValues).subscribe({
      next: () => {
        this.isLoading.set(true);
        this.toastr.success(
          this.languageService.translate('auth.register_success'),
          this.languageService.translate('toast.success')
        );
        this.router.navigate(['/login']);
      },
      error: (err) => {
        this.isLoading.set(false);
        const errorMsg = err?.error?.message || this.languageService.translate('toast.error');
        this.toastr.error(errorMsg, this.languageService.translate('toast.error'));
      }
    });
  }
}

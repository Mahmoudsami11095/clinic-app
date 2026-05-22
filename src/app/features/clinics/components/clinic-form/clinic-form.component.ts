import { Component, Input, Output, EventEmitter, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ClinicService } from '../../../../core/services/clinic.service';
import { Clinic } from '../../../../core/models/clinic.model';
import { TranslatePipe } from '../../../../core/i18n/translate.pipe';

@Component({
  selector: 'app-clinic-form',
  imports: [CommonModule, ReactiveFormsModule, TranslatePipe],
  templateUrl: './clinic-form.component.html',
  styleUrl: './clinic-form.component.css'
})
export class ClinicFormComponent implements OnInit {
  @Input() clinic?: Clinic;
  @Output() saved = new EventEmitter<Clinic>();
  @Output() cancelled = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private clinicService = inject(ClinicService);

  submitting = false;

  form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    address: ['', [Validators.required, Validators.minLength(5)]],
    phone: ['', [Validators.required, Validators.pattern(/^\+?[\d\s\-()]{7,15}$/)]]
  });

  ngOnInit() {
    if (this.clinic) {
      this.form.patchValue({
        name: this.clinic.name,
        address: this.clinic.address,
        phone: this.clinic.phone
      });
    }
  }

  isInvalid(field: string): boolean {
    const ctrl = this.form.get(field);
    return !!(ctrl && ctrl.invalid && (ctrl.dirty || ctrl.touched));
  }

  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting = true;
    const formValue = this.form.value;

    if (this.clinic) {
      const updatedClinic: Clinic = {
        ...this.clinic,
        name: formValue.name || '',
        address: formValue.address || '',
        phone: formValue.phone || ''
      };

      this.clinicService.update(updatedClinic).subscribe({
        next: (data) => {
          this.submitting = false;
          this.saved.emit(data);
          this.form.reset();
        },
        error: () => this.submitting = false
      });
    } else {
      const newClinic: Clinic = {
        id: crypto.randomUUID(),
        name: formValue.name || '',
        address: formValue.address || '',
        phone: formValue.phone || ''
      };

      this.clinicService.create(newClinic).subscribe({
        next: (data) => {
          this.submitting = false;
          this.saved.emit(data);
          this.form.reset();
        },
        error: () => this.submitting = false
      });
    }
  }

  onCancel() {
    this.form.reset();
    this.cancelled.emit();
  }
}

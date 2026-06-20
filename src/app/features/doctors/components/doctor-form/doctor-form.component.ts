import { Component, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormArray, FormControl, AbstractControl, ValidationErrors } from '@angular/forms';
import { DoctorService } from '../../services/doctor.service';
import { Doctor } from '../../models/doctor.model';
import { TranslatePipe } from '../../../../core/i18n/translate.pipe';
import { LanguageService } from '../../../../core/i18n/language.service';
import { ToastrService } from 'ngx-toastr';

import { InputFieldComponent } from '../../../../shared/components/input-field/input-field.component';
import { PhoneInputFieldComponent } from '../../../../shared/components/phone-input-field/phone-input-field.component';

@Component({
  selector: 'app-doctor-form',
  imports: [CommonModule, ReactiveFormsModule, TranslatePipe, InputFieldComponent, PhoneInputFieldComponent],
  templateUrl: './doctor-form.component.html',
  styleUrl: './doctor-form.component.css'
})
export class DoctorFormComponent {
  @Output() saved = new EventEmitter<Doctor>();
  @Output() cancelled = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private doctorService = inject(DoctorService);
  protected langService = inject(LanguageService);
  private toastr = inject(ToastrService);

  submitting = false;

  readonly specializations = ['Cardiology', 'Pediatrics', 'Neurology', 'Dermatology', 'Psychiatry', 'Orthopedics', 'General Practice', 'Dentistry'];
  readonly weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  form = this.fb.group({
    firstName: ['', [Validators.required, Validators.minLength(2)]],
    lastName: ['', [Validators.required, Validators.minLength(2)]],
    specialization: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    countryCode: ['+20', Validators.required],
    phoneNumber: ['', [Validators.required, (control: AbstractControl) => this.phoneFormatValidator(control)]],
    availability: this.fb.group({
      days: this.fb.array([], Validators.required),
      hours: ['09:00 - 17:00', Validators.required]
    })
  });

  constructor() {
    this.form.get('countryCode')?.valueChanges.subscribe(() => {
      this.form.get('phoneNumber')?.updateValueAndValidity();
    });
  }

  get daysFormArray() {
    return this.form.get('availability.days') as FormArray;
  }

  onDayToggle(day: string, event: Event) {
    const checked = (event.target as HTMLInputElement).checked;
    if (checked) {
      this.daysFormArray.push(new FormControl(day));
    } else {
      const index = this.daysFormArray.controls.findIndex(x => x.value === day);
      if (index !== -1) {
        this.daysFormArray.removeAt(index);
      }
    }
  }

  isDaySelected(day: string): boolean {
    return this.daysFormArray.controls.some(x => x.value === day);
  }

  isInvalid(field: string): boolean {
    const ctrl = this.form.get(field);
    return !!(ctrl && ctrl.invalid && (ctrl.dirty || ctrl.touched));
  }

  splitContactNumber(contactNumber: string): { countryCode: string; phoneNumber: string } {
    if (!contactNumber) return { countryCode: '+20', phoneNumber: '' };
    contactNumber = contactNumber.trim();
    if (contactNumber.startsWith('+')) {
      const prefixes = ['+966', '+971', '+380', '+359', '+249', '+212', '+213', '+216', '+218', '+20', '+44', '+49', '+33', '+91', '+86', '+1'];
      for (const prefix of prefixes) {
        if (contactNumber.startsWith(prefix)) {
          return { countryCode: prefix, phoneNumber: contactNumber.substring(prefix.length).trim() };
        }
      }
      if (contactNumber.length >= 4) {
        return { countryCode: contactNumber.substring(0, 4), phoneNumber: contactNumber.substring(4) };
      }
    }
    return { countryCode: '+20', phoneNumber: contactNumber };
  }

  phoneFormatValidator(control: AbstractControl): ValidationErrors | null {
    if (!control.value) return null;
    const country = this.form?.get('countryCode')?.value || '+20';
    const val = control.value.replace(/[\s\-()]/g, '');

    if (!/^\d+$/.test(val)) {
      return { onlyDigits: true };
    }

    if (country === '+20') {
      let clean = val;
      if (clean.startsWith('0')) {
        clean = clean.substring(1);
      }
      
      const isMobile = /^(10|11|12|15)\d{8}$/.test(clean);
      const isLandline = clean.length >= 7 && clean.length <= 9;
      if (!isMobile && !isLandline) {
        return { invalidEgyptPhone: true };
      }
    } else {
      if (val.length < 6 || val.length > 15) {
        return { invalidLength: true };
      }
    }
    return null;
  }

  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting = true;
    const rawValue = this.form.getRawValue();
    const contactNum = `${rawValue.countryCode}${rawValue.phoneNumber}`;

    const newDoctor: Doctor = {
      id: crypto.randomUUID(),
      avatar: null,
      firstName: rawValue.firstName!,
      lastName: rawValue.lastName!,
      specialization: rawValue.specialization!,
      email: rawValue.email!,
      contactNumber: contactNum,
      countryCode: rawValue.countryCode!,
      phoneNumber: rawValue.phoneNumber!,
      availability: {
        days: rawValue.availability?.days as string[] || [],
        hours: rawValue.availability?.hours || ''
      }
    };

    this.doctorService.create(newDoctor).subscribe({
      next: () => {
        this.submitting = false;
        this.toastr.success(
          this.langService.translate('toast.doctor_added'),
          this.langService.translate('toast.success')
        );
        this.saved.emit(newDoctor);
        this.form.reset();
      },
      error: () => {
        this.submitting = false;
        this.toastr.toastrConfig.preventDuplicates = true;
        this.toastr.error(
          this.langService.translate('toast.doctor_add_error'),
          this.langService.translate('toast.error')
        );
      }
    });
  }

  onCancel() {
    this.form.reset();
    this.cancelled.emit();
  }
}

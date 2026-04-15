import { Component, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormArray, FormControl } from '@angular/forms';
import { DoctorService } from '../../services/doctor.service';
import { Doctor } from '../../models/doctor.model';

@Component({
  selector: 'app-doctor-form',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './doctor-form.component.html',
  styleUrl: './doctor-form.component.css'
})
export class DoctorFormComponent {
  @Output() saved = new EventEmitter<Doctor>();
  @Output() cancelled = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private doctorService = inject(DoctorService);

  submitting = false;

  readonly specializations = ['Cardiology', 'Pediatrics', 'Neurology', 'Dermatology', 'Psychiatry', 'Orthopedics', 'General Practice'];
  readonly weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  form = this.fb.group({
    firstName: ['', [Validators.required, Validators.minLength(2)]],
    lastName: ['', [Validators.required, Validators.minLength(2)]],
    specialization: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    contactNumber: ['', [Validators.required, Validators.pattern(/^\+?[\d\s\-()]{7,15}$/)]],
    availability: this.fb.group({
      days: this.fb.array([], Validators.required),
      hours: ['09:00 - 17:00', Validators.required]
    })
  });

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

  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting = true;
    const newDoctor: Doctor = {
      id: crypto.randomUUID(),
      avatar: null,
      ...(this.form.value as Omit<Doctor, 'id' | 'avatar'>)
    };

    this.doctorService.create(newDoctor).subscribe({
      next: () => {
        this.submitting = false;
        this.saved.emit(newDoctor);
        this.form.reset();
      },
      error: () => this.submitting = false
    });
  }

  onCancel() {
    this.form.reset();
    this.cancelled.emit();
  }
}

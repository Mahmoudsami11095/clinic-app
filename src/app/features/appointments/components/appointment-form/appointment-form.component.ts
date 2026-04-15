import { Component, OnInit, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { AppointmentService } from '../../services/appointment.service';
import { PatientService } from '../../../patients/services/patient.service';
import { DoctorService } from '../../../doctors/services/doctor.service';
import { Appointment } from '../../models/appointment.model';
import { Patient } from '../../../patients/models/patient.model';
import { Doctor } from '../../../doctors/models/doctor.model';

@Component({
  selector: 'app-appointment-form',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './appointment-form.component.html',
  styleUrl: './appointment-form.component.css'
})
export class AppointmentFormComponent implements OnInit {
  @Output() saved = new EventEmitter<Appointment>();
  @Output() cancelled = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private patientService = inject(PatientService);
  private doctorService = inject(DoctorService);
  private appService = inject(AppointmentService);

  patients: Patient[] = [];
  doctors: Doctor[] = [];
  submitting = false;

  form = this.fb.group({
    patientId: ['', Validators.required],
    doctorId: ['', Validators.required],
    date: ['', Validators.required],
    time: ['', Validators.required],
    type: ['', Validators.required],
    notes: ['']
  });

  readonly appointmentTypes = ['General Consultation', 'Follow-up', 'Emergency', 'Surgery', 'Pediatric Checkup', 'Dermatology Review'];

  ngOnInit() {
    this.patientService.getAll().subscribe(data => this.patients = data);
    this.doctorService.getAll().subscribe(data => this.doctors = data);
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
    const newAppointment: Appointment = {
      id: crypto.randomUUID(),
      status: 'scheduled',
      ...(this.form.value as Omit<Appointment, 'id' | 'status'>)
    };

    this.appService.create(newAppointment).subscribe({
      next: () => {
        this.submitting = false;
        this.saved.emit(newAppointment);
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

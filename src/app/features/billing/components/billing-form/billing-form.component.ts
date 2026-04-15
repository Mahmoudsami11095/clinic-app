import { Component, OnInit, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { BillingService } from '../../services/billing.service';
import { PatientService } from '../../../patients/services/patient.service';
import { BillingRecord } from '../../models/billing.model';
import { Patient } from '../../../patients/models/patient.model';

@Component({
  selector: 'app-billing-form',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './billing-form.component.html',
  styleUrl: './billing-form.component.css'
})
export class BillingFormComponent implements OnInit {
  @Output() saved = new EventEmitter<BillingRecord>();
  @Output() cancelled = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private billingService = inject(BillingService);
  private patientService = inject(PatientService);

  patients: Patient[] = [];
  submitting = false;

  readonly statusOptions = ['paid', 'pending', 'overdue'];
  readonly paymentMethods = ['Credit Card', 'Cash', 'Insurance', 'Bank Transfer', 'Mobile Payment'];

  form = this.fb.group({
    patientId: ['', Validators.required],
    amount: ['', [Validators.required, Validators.min(0.1)]],
    dateIssued: [new Date().toISOString().split('T')[0], Validators.required],
    status: ['pending', Validators.required],
    paymentMethod: ['Cash', Validators.required],
    description: ['', [Validators.required, Validators.minLength(5)]]
  });

  ngOnInit() {
    this.patientService.getAll().subscribe(data => {
      this.patients = data;
    });
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
    const newRecord: BillingRecord = {
      id: `INV-${Math.floor(Math.random() * 90000) + 10000}`,
      patientId: formValue.patientId!,
      amount: Number(formValue.amount),
      dateIssued: formValue.dateIssued!,
      status: formValue.status!,
      paymentMethod: formValue.paymentMethod || null,
      description: formValue.description || undefined
    };

    this.billingService.create(newRecord).subscribe({
      next: () => {
        this.submitting = false;
        this.saved.emit(newRecord);
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

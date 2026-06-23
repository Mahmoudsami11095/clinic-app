import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RadiologyService, RadiologyCenter, RadiologyRecord } from '../../services/radiology.service';
import { PatientService } from '../../../patients/services/patient.service';
import { AuthService } from '../../../../core/auth/auth.service';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { TranslatePipe } from '../../../../core/i18n/translate.pipe';
import { AddressAutocompleteComponent } from '../../../../shared/components/address-autocomplete/address-autocomplete.component';

@Component({
  selector: 'app-radiology-dashboard',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, ModalComponent, TranslatePipe, AddressAutocompleteComponent
  ],
  templateUrl: './radiology-dashboard.component.html'
})
export class RadiologyDashboardComponent implements OnInit {
  private radiologyService = inject(RadiologyService);
  private patientService = inject(PatientService);
  protected authService = inject(AuthService);
  private fb = inject(FormBuilder);

  centers = signal<RadiologyCenter[]>([]);
  records = signal<RadiologyRecord[]>([]);
  patients = signal<any[]>([]);
  
  activeTab = signal<'centers' | 'records'>('centers');

  // Modals
  centerDialogVisible = signal(false);
  recordDialogVisible = signal(false);

  // Alerts
  successMsg = signal('');
  errorMsg = signal('');

  // Forms
  centerForm = this.fb.group({
    id: [''],
    name: ['', [Validators.required, Validators.minLength(3)]],
    contactNumber: [''],
    address: ['']
  });

  recordForm = this.fb.group({
    id: [''],
    patientId: ['', Validators.required],
    radiologyCenterId: ['', Validators.required],
    procedureName: ['', Validators.required],
    amountPaid: [0, [Validators.required, Validators.min(0)]],
    date: ['', Validators.required],
    notes: ['']
  });

  totalAmountPaid = computed(() => {
    return this.records().reduce((sum, record) => sum + record.amountPaid, 0);
  });

  ngOnInit() {
    if (this.authService.isUnassigned()) {
      return;
    }
    this.loadCenters();
    this.loadRecords();
    this.loadPatients();
  }

  loadCenters() {
    this.radiologyService.getCenters().subscribe({
      next: (data: RadiologyCenter[]) => this.centers.set(data),
      error: () => this.showError('Failed to load centers')
    });
  }

  loadRecords() {
    const user = this.authService.currentUser();
    const doctorId = user?.role === 'doctor' ? user.id : undefined;
    
    this.radiologyService.getRecords(doctorId).subscribe({
      next: (data: RadiologyRecord[]) => this.records.set(data),
      error: () => this.showError('Failed to load records')
    });
  }

  loadPatients() {
    this.patientService.getAll().subscribe({
      next: (data) => {
        const mapped = data.map(p => ({
          ...p,
          name: `${p.firstName} ${p.lastName}`
        }));
        this.patients.set(mapped);
      },
      error: () => {}
    });
  }

  // Center actions
  openCenterDialog(center?: RadiologyCenter) {
    if (center) {
      this.centerForm.patchValue(center);
    } else {
      this.centerForm.reset();
    }
    this.centerDialogVisible.set(true);
  }

  saveCenter() {
    if (this.centerForm.invalid) return;
    const value = this.centerForm.value as any;
    
    if (value.id) {
      this.radiologyService.updateCenter(value.id, value).subscribe({
        next: () => {
          this.loadCenters();
          this.centerDialogVisible.set(false);
          this.showSuccess('Center updated successfully');
        },
        error: () => this.showError('Failed to update center')
      });
    } else {
      this.radiologyService.createCenter(value).subscribe({
        next: () => {
          this.loadCenters();
          this.centerDialogVisible.set(false);
          this.showSuccess('Center created successfully');
        },
        error: () => this.showError('Failed to create center')
      });
    }
  }

  deleteCenter(id: string) {
    if (confirm('Are you sure you want to delete this center?')) {
      this.radiologyService.deleteCenter(id).subscribe({
        next: () => {
          this.loadCenters();
          this.showSuccess('Center deleted successfully');
        },
        error: () => this.showError('Failed to delete center')
      });
    }
  }

  // Record actions
  openRecordDialog(record?: RadiologyRecord) {
    if (record) {
      this.recordForm.patchValue(record);
    } else {
      this.recordForm.reset({
        date: new Date().toISOString().split('T')[0],
        amountPaid: 0
      });
    }
    this.recordDialogVisible.set(true);
  }

  saveRecord() {
    if (this.recordForm.invalid) return;
    const value = this.recordForm.value as any;
    
    const user = this.authService.currentUser();
    if (!value.doctorId) {
      value.doctorId = user?.id; // default to current user if not set
    }

    if (value.id) {
      this.radiologyService.updateRecord(value.id, value).subscribe({
        next: () => {
          this.loadRecords();
          this.recordDialogVisible.set(false);
          this.showSuccess('Record updated successfully');
        },
        error: () => this.showError('Failed to update record')
      });
    } else {
      this.radiologyService.createRecord(value).subscribe({
        next: () => {
          this.loadRecords();
          this.recordDialogVisible.set(false);
          this.showSuccess('Record created successfully');
        },
        error: () => this.showError('Failed to create record')
      });
    }
  }

  deleteRecord(id: string) {
    if (confirm('Are you sure you want to delete this record?')) {
      this.radiologyService.deleteRecord(id).subscribe({
        next: () => {
          this.loadRecords();
          this.showSuccess('Record deleted successfully');
        },
        error: () => this.showError('Failed to delete record')
      });
    }
  }

  private showSuccess(msg: string) {
    this.successMsg.set(msg);
    setTimeout(() => this.successMsg.set(''), 3000);
  }

  private showError(msg: string) {
    this.errorMsg.set(msg);
    setTimeout(() => this.errorMsg.set(''), 3000);
  }
}

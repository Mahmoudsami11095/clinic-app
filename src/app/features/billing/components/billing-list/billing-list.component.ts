import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BillingService } from '../../services/billing.service';
import { BillingRecord, BillingRecordWithDetails, PaymentLog } from '../../models/billing.model';
import { PatientService } from '../../../patients/services/patient.service';
import { AppointmentService } from '../../../appointments/services/appointment.service';
import { AuthService } from '../../../../core/auth/auth.service';
import { ClinicService } from '../../../../core/services/clinic.service';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { BillingFormComponent } from '../billing-form/billing-form.component';
import { TranslatePipe } from '../../../../core/i18n/translate.pipe';
import { forkJoin } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { LanguageService } from '../../../../core/i18n/language.service';

@Component({
  selector: 'app-billing-list',
  imports: [CommonModule, FormsModule, ModalComponent, BillingFormComponent, TranslatePipe],
  templateUrl: './billing-list.component.html',
  styleUrl: './billing-list.component.css'
})
export class BillingListComponent implements OnInit {
  private billingService = inject(BillingService);
  private patientService = inject(PatientService);
  private appointmentService = inject(AppointmentService);
  protected authService = inject(AuthService);
  private clinicService = inject(ClinicService);
  private toastr = inject(ToastrService);
  private langService = inject(LanguageService);

  billingRecords = signal<BillingRecordWithDetails[]>([]);
  loading = signal(true);
  
  // Filters
  searchQuery = signal('');
  selectedStatus = signal<string>('all');
  isModalOpen = signal(false);

  // Pay Modal State
  isPayModalOpen = signal(false);
  selectedRecordToPay = signal<BillingRecordWithDetails | null>(null);
  payAmount = signal<number>(0);
  payMethod = signal<string>('Cash');
  payDate = signal<string>(new Date().toISOString().split('T')[0]);
  paymentMethods = ['Credit Card', 'Cash', 'Insurance', 'Bank Transfer', 'Mobile Payment'];

  expandedInvoiceId = signal<string | null>(null);

  // Derived Stats
  totalOutstanding = computed(() => {
    return this.clinicService.filterByActiveClinic(this.billingRecords())
      .reduce((sum, b) => {
        if (b.status === 'paid') return sum;
        const paid = b.paidAmount !== undefined ? b.paidAmount : 0;
        return sum + (b.amount - paid);
      }, 0);
  });

  totalCollected = computed(() => {
    return this.clinicService.filterByActiveClinic(this.billingRecords())
      .reduce((sum, b) => {
        if (b.status === 'paid') {
          return sum + (b.paidAmount !== undefined ? b.paidAmount : b.amount);
        }
        return sum + (b.paidAmount || 0);
      }, 0);
  });

  filteredRecords = computed(() => {
    let result = this.billingRecords();
    const query = this.searchQuery().toLowerCase().trim();
    const status = this.selectedStatus();
    result = this.clinicService.filterByActiveClinic(result);

    if (query) {
      result = result.filter(b => 
        b.patientName.toLowerCase().includes(query) ||
        b.id.includes(query) ||
        (b.paymentMethod && b.paymentMethod.toLowerCase().includes(query))
      );
    }

    if (status !== 'all') {
      result = result.filter(b => b.status === status);
    }

    return result.sort((a, b) => new Date(b.dateIssued).getTime() - new Date(a.dateIssued).getTime());
  });

  ngOnInit() {
    if (this.authService.isUnassigned()) {
      this.loading.set(false);
      return;
    }

    const doctorId = this.authService.currentDoctorId();
    const patientId = this.authService.currentPatientId();

    if (doctorId) {
      forkJoin({
        billing: this.billingService.getAllWithDetails(),
        appointments: this.appointmentService.getAll()
      }).subscribe({
        next: ({ billing, appointments }) => {
          const doctorApptIds = new Set(
            appointments
              .filter(a => a.doctorId === doctorId)
              .map(a => a.id)
          );
          const doctorPatientIds = new Set(
            appointments
              .filter(a => a.doctorId === doctorId)
              .map(a => a.patientId)
          );
          const filteredBilling = billing.filter(b => {
            if (b.appointmentId) {
              return doctorApptIds.has(b.appointmentId);
            }
            return doctorPatientIds.has(b.patientId);
          });
          
          this.billingRecords.set(filteredBilling);
          this.loading.set(false);
        },
        error: () => this.loading.set(false)
      });
    } else if (patientId) {
      this.billingService.getAllWithDetails().subscribe({
        next: (data) => {
          this.billingRecords.set(data.filter(b => b.patientId === patientId));
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
    } else {
      this.billingService.getAllWithDetails().subscribe({
        next: (data) => {
          this.billingRecords.set(data);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
    }
  }

  onSearch(event: Event) {
    this.searchQuery.set((event.target as HTMLInputElement).value);
  }

  onStatusFilter(status: string) {
    this.selectedStatus.set(status);
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'paid': return 'bg-emerald-100 text-emerald-700 ring-emerald-200';
      case 'partially_paid': return 'bg-cyan-100 text-cyan-700 ring-cyan-200';
      case 'pending': return 'bg-amber-100 text-amber-700 ring-amber-200';
      case 'overdue': return 'bg-red-100 text-red-700 ring-red-200';
      default: return 'bg-slate-100 text-slate-700 ring-slate-200';
    }
  }

  getAvatarColor(name: string): string {
    const colors = [
      'from-indigo-400 to-purple-400',
      'from-emerald-400 to-teal-400',
      'from-amber-400 to-orange-400',
      'from-rose-400 to-pink-400',
      'from-sky-400 to-blue-400',
      'from-violet-400 to-fuchsia-400',
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  }

  openModal() {
    this.isModalOpen.set(true);
  }

  closeModal() {
    this.isModalOpen.set(false);
  }

  handleBillingSaved(record: BillingRecord) {
    this.patientService.getAll().subscribe(patients => {
      const patient = patients.find(p => p.id === record.patientId);
      const newRecordWithDetails: BillingRecordWithDetails = {
        ...record,
        patientName: patient ? `${patient.firstName} ${patient.lastName}` : 'Unknown Patient'
      };
      
      this.billingRecords.update(records => [newRecordWithDetails, ...records]);
      this.closeModal();
    });
  }

  openPayModal(bill: BillingRecordWithDetails) {
    this.selectedRecordToPay.set(bill);
    const remaining = bill.amount - (bill.paidAmount || 0);
    this.payAmount.set(remaining);
    this.payMethod.set(bill.paymentMethod || 'Cash');
    this.payDate.set(new Date().toISOString().split('T')[0]);
    this.isPayModalOpen.set(true);
  }

  closePayModal() {
    this.isPayModalOpen.set(false);
    this.selectedRecordToPay.set(null);
  }

  toggleInvoiceExpand(id: string): void {
    if (this.expandedInvoiceId() === id) {
      this.expandedInvoiceId.set(null);
    } else {
      this.expandedInvoiceId.set(id);
    }
  }

  getPaymentLogs(record: BillingRecord): PaymentLog[] {
    if (record.payments && record.payments.length > 0) {
      return record.payments;
    }
    const paidAmount = record.paidAmount !== undefined ? record.paidAmount : (record.status === 'paid' ? record.amount : 0);
    if (paidAmount > 0) {
      return [{
        amount: paidAmount,
        date: record.dateIssued.split('T')[0],
        paymentMethod: record.paymentMethod || 'Cash'
      }];
    }
    return [];
  }

  submitPayment() {
    const record = this.selectedRecordToPay();
    if (!record) return;

    const paid = Number(this.payAmount());
    const currentPaid = record.paidAmount !== undefined ? record.paidAmount : (record.status === 'paid' ? record.amount : 0);
    const newPaidAmount = currentPaid + paid;
    const isFullyPaid = newPaidAmount >= record.amount;

    const newPayment: PaymentLog = {
      amount: paid,
      date: this.payDate(),
      paymentMethod: this.payMethod()
    };

    const existingPayments = this.getPaymentLogs(record);
    const updatedPayments = [...existingPayments, newPayment];

    const updated: BillingRecord = {
      ...record,
      paidAmount: newPaidAmount,
      status: isFullyPaid ? 'paid' : 'partially_paid',
      paymentMethod: this.payMethod(),
      description: record.description,
      payments: updatedPayments
    };

    this.billingService.update(updated).subscribe({
      next: () => {
        this.billingRecords.update(records => 
          records.map(r => r.id === record.id ? { ...r, ...updated, patientName: r.patientName } : r)
        );
        this.toastr.success(
          this.langService.translate('toast.payment_recorded'),
          this.langService.translate('toast.success')
        );
        this.closePayModal();
      },
      error: () => {
        this.toastr.error(
          this.langService.translate('toast.payment_record_error'),
          this.langService.translate('toast.error')
        );
      }
    });
  }
}

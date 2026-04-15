import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BillingService } from '../../services/billing.service';
import { BillingRecordWithDetails } from '../../models/billing.model';

@Component({
  selector: 'app-billing-list',
  imports: [CommonModule, FormsModule],
  templateUrl: './billing-list.component.html',
  styleUrl: './billing-list.component.css'
})
export class BillingListComponent implements OnInit {
  private billingService = inject(BillingService);

  billingRecords = signal<BillingRecordWithDetails[]>([]);
  loading = signal(true);
  
  // Filters
  searchQuery = signal('');
  selectedStatus = signal<string>('all');

  // Derived Stats
  totalOutstanding = computed(() => {
    return this.billingRecords()
      .filter(b => b.status === 'pending' || b.status === 'overdue')
      .reduce((sum, b) => sum + b.amount, 0);
  });

  totalCollected = computed(() => {
    return this.billingRecords()
      .filter(b => b.status === 'paid')
      .reduce((sum, b) => sum + b.amount, 0);
  });

  filteredRecords = computed(() => {
    let result = this.billingRecords();
    const query = this.searchQuery().toLowerCase().trim();
    const status = this.selectedStatus();

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

    // Sort by date descending (newest first)
    return result.sort((a, b) => new Date(b.dateIssued).getTime() - new Date(a.dateIssued).getTime());
  });

  ngOnInit() {
    this.billingService.getAllWithDetails().subscribe({
      next: (data) => {
        this.billingRecords.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
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
}

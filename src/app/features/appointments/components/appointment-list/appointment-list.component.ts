import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AppointmentService } from '../../services/appointment.service';
import { AppointmentWithDetails } from '../../models/appointment.model';

@Component({
  selector: 'app-appointment-list',
  imports: [CommonModule, FormsModule],
  templateUrl: './appointment-list.component.html',
  styleUrl: './appointment-list.component.css'
})
export class AppointmentListComponent implements OnInit {
  private appointmentService = inject(AppointmentService);

  appointments = signal<AppointmentWithDetails[]>([]);
  loading = signal(true);
  
  // Filters
  searchQuery = signal('');
  selectedStatus = signal<string>('all');
  selectedDate = signal<string>('');

  filteredAppointments = computed(() => {
    let result = this.appointments();
    const query = this.searchQuery().toLowerCase().trim();
    const status = this.selectedStatus();
    const date = this.selectedDate();

    if (query) {
      result = result.filter(a => 
        a.patientName.toLowerCase().includes(query) ||
        a.doctorName.toLowerCase().includes(query) ||
        a.type.toLowerCase().includes(query)
      );
    }

    if (status !== 'all') {
      result = result.filter(a => a.status === status);
    }

    if (date) {
      // Compare just the YYYY-MM-DD part
      const searchDate = new Date(date).toDateString();
      result = result.filter(a => new Date(a.date).toDateString() === searchDate);
    }

    // Sort by date ascending (upcoming first)
    return result.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  });

  ngOnInit() {
    this.appointmentService.getAllWithDetails().subscribe({
      next: (data) => {
        this.appointments.set(data);
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

  onDateFilter(event: Event) {
    this.selectedDate.set((event.target as HTMLInputElement).value);
  }

  clearDateFilter() {
    this.selectedDate.set('');
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'completed': return 'bg-emerald-100 text-emerald-700 ring-emerald-200';
      case 'scheduled': return 'bg-blue-100 text-blue-700 ring-blue-200';
      case 'cancelled': return 'bg-red-100 text-red-700 ring-red-200';
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

  isPast(dateStr: string): boolean {
    return new Date(dateStr) < new Date();
  }
}

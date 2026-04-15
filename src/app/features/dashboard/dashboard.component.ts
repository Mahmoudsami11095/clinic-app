import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardService, DashboardStats, RecentAppointment } from './services/dashboard.service';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class Dashboard implements OnInit {
  private dashboardService = inject(DashboardService);

  stats = signal<DashboardStats | null>(null);
  recentAppointments = signal<RecentAppointment[]>([]);
  loading = signal(true);

  statCards = [
    { key: 'totalPatients' as const, label: 'Total Patients', icon: 'pi pi-users', color: 'indigo' },
    { key: 'totalDoctors' as const, label: 'Active Doctors', icon: 'pi pi-user-plus', color: 'emerald' },
    { key: 'todayAppointments' as const, label: 'Upcoming Appts', icon: 'pi pi-calendar', color: 'amber' },
    { key: 'pendingBills' as const, label: 'Pending Bills', icon: 'pi pi-wallet', color: 'rose' },
  ];

  ngOnInit() {
    this.dashboardService.getDashboardData().subscribe({
      next: ({ stats, recentAppointments }) => {
        this.stats.set(stats);
        this.recentAppointments.set(recentAppointments);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  getStatValue(key: string): number | string {
    const s = this.stats();
    if (!s) return '—';
    return (s as any)[key] ?? 0;
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'completed': return 'bg-emerald-100 text-emerald-700';
      case 'scheduled': return 'bg-blue-100 text-blue-700';
      case 'cancelled': return 'bg-red-100 text-red-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}

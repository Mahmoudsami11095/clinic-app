import { Component, OnInit, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardService, DashboardStats, RecentAppointment, DashboardAnalytics } from './services/dashboard.service';
import { AuthService } from '../../core/auth/auth.service';
import { ClinicService } from '../../core/services/clinic.service';
import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { ChartModule } from 'primeng/chart';

export interface StatCard {
  key: keyof DashboardStats;
  labelKey: string;
  icon: string;
  color: string;
}

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, TranslatePipe, ChartModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class Dashboard implements OnInit {
  private dashboardService = inject(DashboardService);
  private authService = inject(AuthService);
  private clinicService = inject(ClinicService);

  stats = signal<DashboardStats | null>(null);
  recentAppointments = signal<RecentAppointment[]>([]);
  analytics = signal<DashboardAnalytics | null>(null);
  loading = signal(true);

  statCards: StatCard[] = [];
  isDoctor = false;

  appointmentsChartData: any;
  revenueChartData: any;
  typeChartData: any;
  profitChartData: any;

  lineChartOptions: any;
  barChartOptions: any;
  pieChartOptions: any;
  mixedChartOptions: any;

  constructor() {
    effect(() => {
      // Access signal to establish dependency
      const clinicId = this.clinicService.activeClinicId();
      this.loadDashboardData();
    });
  }

  ngOnInit() {
    this.isDoctor = this.authService.isDoctor();
    if (this.isDoctor) {
      this.statCards = [
        { key: 'totalPatients', labelKey: 'dashboard.total_patients', icon: 'pi pi-users', color: 'indigo' },
        { key: 'todayAppointments', labelKey: 'dashboard.upcoming_appts', icon: 'pi pi-calendar', color: 'amber' },
        { key: 'pendingBills', labelKey: 'dashboard.pending_bills', icon: 'pi pi-wallet', color: 'rose' },
        { key: 'totalCollected', labelKey: 'dashboard.total_collected', icon: 'pi pi-money-bill', color: 'emerald' },
        { key: 'totalOutstanding', labelKey: 'dashboard.total_outstanding', icon: 'pi pi-clock', color: 'rose' }
      ];
    } else {
      this.statCards = [
        { key: 'totalPatients', labelKey: 'dashboard.total_patients', icon: 'pi pi-users', color: 'indigo' },
        { key: 'totalDoctors', labelKey: 'dashboard.active_doctors', icon: 'pi pi-user-plus', color: 'emerald' },
        { key: 'todayAppointments', labelKey: 'dashboard.upcoming_appts', icon: 'pi pi-calendar', color: 'amber' },
        { key: 'pendingBills', labelKey: 'dashboard.pending_bills', icon: 'pi pi-wallet', color: 'rose' }
      ];
    }
    this.initChartOptions();
  }

  loadDashboardData() {
    this.loading.set(true);
    this.dashboardService.getDashboardData().subscribe({
      next: ({ stats, recentAppointments, analytics }) => {
        this.stats.set(stats);
        this.recentAppointments.set(recentAppointments);
        this.analytics.set(analytics);
        this.setupCharts(analytics);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
      complete: () => this.loading.set(false)
    });
  }

  setupCharts(analytics: DashboardAnalytics) {
    const documentStyle = getComputedStyle(document.documentElement);

    this.appointmentsChartData = {
      labels: analytics.appointmentsOverTime.labels,
      datasets: [
        {
          label: 'Appointments',
          data: analytics.appointmentsOverTime.data,
          fill: true,
          borderColor: documentStyle.getPropertyValue('--indigo-500') || '#6366f1',
          tension: 0.4,
          backgroundColor: 'rgba(99, 102, 241, 0.1)'
        }
      ]
    };

    if (analytics.revenueOverTime) {
      this.revenueChartData = {
        labels: analytics.revenueOverTime.labels,
        datasets: [
          {
            label: 'Revenue',
            data: analytics.revenueOverTime.data,
            backgroundColor: documentStyle.getPropertyValue('--emerald-500') || '#10b981',
            borderRadius: 6
          }
        ]
      };
    }

    if (analytics.profitTrend) {
      this.profitChartData = {
        labels: analytics.profitTrend.labels,
        datasets: [
          {
            type: 'line',
            label: 'Net Profit',
            data: analytics.profitTrend.profit,
            borderColor: documentStyle.getPropertyValue('--indigo-500') || '#6366f1',
            tension: 0.4,
            fill: false,
            borderWidth: 3
          },
          {
            type: 'bar',
            label: 'Revenue',
            data: analytics.profitTrend.revenue,
            backgroundColor: documentStyle.getPropertyValue('--emerald-400') || '#34d399',
            borderRadius: 6
          },
          {
            type: 'bar',
            label: 'Expenses',
            data: analytics.profitTrend.expenses,
            backgroundColor: documentStyle.getPropertyValue('--rose-400') || '#fb7185',
            borderRadius: 6
          }
        ]
      };
    }

    this.typeChartData = {
      labels: analytics.appointmentsByType.labels.length > 0 ? analytics.appointmentsByType.labels : ['No Data'],
      datasets: [
        {
          data: analytics.appointmentsByType.data.length > 0 ? analytics.appointmentsByType.data : [1],
          backgroundColor: [
            documentStyle.getPropertyValue('--indigo-500') || '#6366f1',
            documentStyle.getPropertyValue('--purple-500') || '#a855f7',
            documentStyle.getPropertyValue('--amber-500') || '#f59e0b',
            documentStyle.getPropertyValue('--emerald-500') || '#10b981',
            documentStyle.getPropertyValue('--rose-500') || '#f43f5e'
          ],
          hoverBackgroundColor: [
            documentStyle.getPropertyValue('--indigo-400') || '#818cf8',
            documentStyle.getPropertyValue('--purple-400') || '#c084fc',
            documentStyle.getPropertyValue('--amber-400') || '#fbbf24',
            documentStyle.getPropertyValue('--emerald-400') || '#34d399',
            documentStyle.getPropertyValue('--rose-400') || '#fb7185'
          ]
        }
      ]
    };
  }

  initChartOptions() {
    const documentStyle = getComputedStyle(document.documentElement);
    const textColor = documentStyle.getPropertyValue('--text-color') || '#495057';
    const textColorSecondary = documentStyle.getPropertyValue('--text-color-secondary') || '#6c757d';
    const surfaceBorder = documentStyle.getPropertyValue('--surface-border') || '#dfe7ef';

    this.lineChartOptions = {
      maintainAspectRatio: false,
      aspectRatio: 0.8,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(15, 23, 42, 0.9)',
          titleFont: { family: 'Inter', size: 13 },
          bodyFont: { family: 'Inter', size: 14, weight: 'bold' },
          padding: 10,
          cornerRadius: 8,
          displayColors: false
        }
      },
      scales: {
        x: {
          ticks: { color: textColorSecondary, font: { family: 'Inter', size: 12 } },
          grid: { color: 'transparent', drawBorder: false }
        },
        y: {
          ticks: { color: textColorSecondary, font: { family: 'Inter', size: 12 }, stepSize: 1 },
          grid: { color: surfaceBorder, drawBorder: false, borderDash: [5, 5] }
        }
      }
    };

    this.barChartOptions = {
      maintainAspectRatio: false,
      aspectRatio: 0.8,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(15, 23, 42, 0.9)',
          titleFont: { family: 'Inter', size: 13 },
          bodyFont: { family: 'Inter', size: 14, weight: 'bold' },
          padding: 10,
          cornerRadius: 8,
          displayColors: false,
          callbacks: {
            label: (context: any) => {
              let label = context.dataset.label || '';
              if (label) label += ': ';
              if (context.parsed.y !== null) {
                label += new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(context.parsed.y);
              }
              return label;
            }
          }
        }
      },
      scales: {
        x: {
          ticks: { color: textColorSecondary, font: { family: 'Inter', size: 12 } },
          grid: { color: 'transparent', drawBorder: false }
        },
        y: {
          ticks: { color: textColorSecondary, font: { family: 'Inter', size: 12 } },
          grid: { color: surfaceBorder, drawBorder: false, borderDash: [5, 5] }
        }
      }
    };

    this.pieChartOptions = {
      maintainAspectRatio: false,
      aspectRatio: 1,
      plugins: {
        legend: {
          position: 'bottom',
          labels: { color: textColor, font: { family: 'Inter', size: 12 }, usePointStyle: true, padding: 20 }
        },
        tooltip: {
          backgroundColor: 'rgba(15, 23, 42, 0.9)',
          titleFont: { family: 'Inter', size: 13 },
          bodyFont: { family: 'Inter', size: 14, weight: 'bold' },
          padding: 10,
          cornerRadius: 8
        }
      }
    };

    this.mixedChartOptions = {
      maintainAspectRatio: false,
      aspectRatio: 0.8,
      plugins: {
        legend: {
          labels: { color: textColor, font: { family: 'Inter', size: 12 }, usePointStyle: true }
        },
        tooltip: {
          backgroundColor: 'rgba(15, 23, 42, 0.9)',
          titleFont: { family: 'Inter', size: 13 },
          bodyFont: { family: 'Inter', size: 14, weight: 'bold' },
          padding: 10,
          cornerRadius: 8,
          callbacks: {
            label: (context: any) => {
              let label = context.dataset.label || '';
              if (label) label += ': ';
              if (context.parsed.y !== null) {
                label += new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(context.parsed.y);
              }
              return label;
            }
          }
        }
      },
      scales: {
        x: {
          ticks: { color: textColorSecondary, font: { family: 'Inter', size: 12 } },
          grid: { color: 'transparent', drawBorder: false }
        },
        y: {
          ticks: { color: textColorSecondary, font: { family: 'Inter', size: 12 } },
          grid: { color: surfaceBorder, drawBorder: false, borderDash: [5, 5] }
        }
      }
    };
  }

  getStatValue(key: keyof DashboardStats): number | string {
    const s = this.stats();
    if (!s) return '—';
    const val = s[key] ?? 0;
    if (key === 'totalCollected' || key === 'totalOutstanding') {
      return '$' + Number(val).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    return val;
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

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { forkJoin, map, catchError, of } from 'rxjs';
import { AuthService } from '../../../core/auth/auth.service';
import { ClinicService } from '../../../core/services/clinic.service';
import { Patient } from '../../patients/models/patient.model';
import { Doctor } from '../../doctors/models/doctor.model';
import { Appointment } from '../../appointments/models/appointment.model';
import { BillingRecord } from '../../billing/models/billing.model';
import { RadiologyRecord } from '../../radiology/services/radiology.service';

export interface DashboardStats {
  totalPatients: number;
  totalDoctors: number;
  todayAppointments: number;
  totalRevenue: number;
  pendingBills: number;
  totalCollected: number;
  totalOutstanding: number;
  totalExpenses?: number;
  netProfit?: number;
}

export interface RecentAppointment {
  id: string;
  patientName: string;
  doctorName: string;
  date: string;
  type: string;
  status: string;
}

export interface DashboardAnalytics {
  appointmentsByType: { labels: string[], data: number[] };
  appointmentsOverTime: { labels: string[], data: number[] };
  revenueOverTime?: { labels: string[], data: number[] };
  profitTrend?: {
    labels: string[];
    revenue: number[];
    expenses: number[];
    profit: number[];
  };
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private clinicService = inject(ClinicService);

  getDashboardData() {
    const activeClinicId = this.clinicService.activeClinicId();

    return forkJoin({
      patients: this.http.get<{ data: Patient[] }>('/api/patients'),
      appointments: this.http.get<{ data: Appointment[] }>('/api/appointments'),
      doctors: this.http.get<{ data: Doctor[] }>('/api/doctors'),
      billing: this.http.get<{ data: BillingRecord[] }>('/api/billing'),
      radiology: this.http.get<{ data: RadiologyRecord[] }>('/api/Radiology/records').pipe(
        catchError(() => of({ data: [] }))
      ),
    }).pipe(
      map(({ patients, appointments, doctors, billing, radiology }) => {
        const doctorId = this.authService.isDoctor() ? this.authService.currentDoctorId() : undefined;
        
        let patientsList = patients.data;
        let doctorsList = doctors.data;
        let apptsList = appointments.data;
        let billsList = billing.data;
        let radList = radiology.data || [];

        // 1. Filter by Active Clinic (skipped for doctors — they see all assigned clinics)
        if (this.clinicService.shouldFilterByActiveClinic() && activeClinicId !== 'all') {
          patientsList = patientsList.filter(p => p.clinicId === activeClinicId);
          doctorsList = doctorsList.filter(d => d.clinicIds?.includes(activeClinicId));
          apptsList = apptsList.filter(a => a.clinicId === activeClinicId);
          billsList = billsList.filter(b => b.clinicId === activeClinicId);
        }

        // 2. Filter by Doctor if logged in as doctor
        if (doctorId) {
          apptsList = apptsList.filter(a => a.doctorId === doctorId);
          billsList = billsList.filter(b => {
            if (b.appointmentId) {
              const appt = appointments.data.find(a => a.id === b.appointmentId);
              return appt && appt.doctorId === doctorId;
            }
            // Fallback: if patient has any appointment with this doctor
            return appointments.data.some(a => a.patientId === b.patientId && a.doctorId === doctorId);
          });
          radList = radList.filter(r => r.doctorId === doctorId);
        }

        const uniquePatientIds = new Set(apptsList.map(a => a.patientId));

        const stats: DashboardStats = {
          totalPatients: doctorId ? uniquePatientIds.size : patientsList.length,
          totalDoctors: doctorId ? 1 : doctorsList.length,
          todayAppointments: apptsList.filter(a => a.status === 'scheduled').length,
          totalRevenue: billsList
            .filter(b => b.status === 'paid')
            .reduce((sum: number, b: BillingRecord) => sum + b.amount, 0),
          pendingBills: billsList.filter(b => b.status === 'pending' || b.status === 'overdue').length,
          totalCollected: billsList.reduce((sum: number, b: BillingRecord) => {
            if (b.status === 'paid') {
              return sum + (b.paidAmount !== undefined ? b.paidAmount : b.amount);
            }
            return sum + (b.paidAmount || 0);
          }, 0),
          totalOutstanding: billsList.reduce((sum: number, b: BillingRecord) => {
            if (b.status === 'paid') return sum;
            const paid = b.paidAmount !== undefined ? b.paidAmount : 0;
            return sum + (b.amount - paid);
          }, 0),
          totalExpenses: radList.reduce((sum: number, r: RadiologyRecord) => sum + (r.amountPaid || 0), 0),
        };
        stats.netProfit = stats.totalCollected - (stats.totalExpenses || 0);

        const recentAppointments: RecentAppointment[] = apptsList
          .sort((a: Appointment, b: Appointment) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .slice(0, 5)
          .map((appt: Appointment) => {
            const patient = patients.data.find((p: Patient) => p.id === appt.patientId);
            const doctor = doctors.data.find((d: Doctor) => d.id === appt.doctorId);
            return {
              id: appt.id,
              patientName: patient ? `${patient.firstName} ${patient.lastName}` : 'Unknown',
              doctorName: doctor ? `Dr. ${doctor.firstName} ${doctor.lastName}` : 'Unknown',
              date: appt.date,
              type: appt.type,
              status: appt.status,
            };
          });

        const analytics: DashboardAnalytics = {
          appointmentsByType: { labels: [], data: [] },
          appointmentsOverTime: { labels: [], data: [] }
        };

        const typeCounts: Record<string, number> = {};
        apptsList.forEach(a => {
          typeCounts[a.type] = (typeCounts[a.type] || 0) + 1;
        });
        analytics.appointmentsByType.labels = Object.keys(typeCounts);
        analytics.appointmentsByType.data = Object.values(typeCounts);

        const monthsLabels: string[] = [];
        const apptsData: number[] = [0, 0, 0, 0, 0, 0];
        const revenueData: number[] = [0, 0, 0, 0, 0, 0];
        const expensesData: number[] = [0, 0, 0, 0, 0, 0];
        
        const now = new Date();
        for (let i = 5; i >= 0; i--) {
          const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
          monthsLabels.push(d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }));
        }

        apptsList.forEach(a => {
          const d = new Date(a.date);
          const diffMonths = (now.getFullYear() - d.getFullYear()) * 12 + now.getMonth() - d.getMonth();
          if (diffMonths >= 0 && diffMonths < 6) {
            apptsData[5 - diffMonths]++;
          }
        });
        analytics.appointmentsOverTime.labels = monthsLabels;
        analytics.appointmentsOverTime.data = apptsData;

        billsList.forEach(b => {
          if (b.status === 'paid') {
            const d = new Date(b.dateIssued || now.toISOString());
            const diffMonths = (now.getFullYear() - d.getFullYear()) * 12 + now.getMonth() - d.getMonth();
            if (diffMonths >= 0 && diffMonths < 6) {
              revenueData[5 - diffMonths] += (b.paidAmount !== undefined ? b.paidAmount : b.amount);
            }
          }
        });
        radList.forEach(r => {
          const d = new Date(r.date || now.toISOString());
          const diffMonths = (now.getFullYear() - d.getFullYear()) * 12 + now.getMonth() - d.getMonth();
          if (diffMonths >= 0 && diffMonths < 6) {
            expensesData[5 - diffMonths] += (r.amountPaid || 0);
          }
        });
        
        const profitData = revenueData.map((rev, i) => rev - expensesData[i]);

        analytics.revenueOverTime = { labels: monthsLabels, data: revenueData };
        analytics.profitTrend = {
          labels: monthsLabels,
          revenue: revenueData,
          expenses: expensesData,
          profit: profitData
        };

        return { stats, recentAppointments, analytics };
      })
    );
  }
}

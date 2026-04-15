import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { forkJoin, map } from 'rxjs';

export interface DashboardStats {
  totalPatients: number;
  totalDoctors: number;
  todayAppointments: number;
  totalRevenue: number;
  pendingBills: number;
}

export interface RecentAppointment {
  id: string;
  patientName: string;
  doctorName: string;
  date: string;
  type: string;
  status: string;
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private http = inject(HttpClient);

  getDashboardData() {
    return forkJoin({
      patients: this.http.get<{ data: any[] }>('/api/patients'),
      appointments: this.http.get<{ data: any[] }>('/api/appointments'),
      doctors: this.http.get<{ data: any[] }>('/api/doctors'),
      billing: this.http.get<{ data: any[] }>('/api/billing'),
    }).pipe(
      map(({ patients, appointments, doctors, billing }) => {
        const stats: DashboardStats = {
          totalPatients: patients.data.length,
          totalDoctors: doctors.data.length,
          todayAppointments: appointments.data.filter(a => a.status === 'scheduled').length,
          totalRevenue: billing.data
            .filter(b => b.status === 'paid')
            .reduce((sum: number, b: any) => sum + b.amount, 0),
          pendingBills: billing.data.filter(b => b.status === 'pending' || b.status === 'overdue').length,
        };

        const recentAppointments: RecentAppointment[] = appointments.data
          .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .slice(0, 5)
          .map((appt: any) => {
            const patient = patients.data.find((p: any) => p.id === appt.patientId);
            const doctor = doctors.data.find((d: any) => d.id === appt.doctorId);
            return {
              id: appt.id,
              patientName: patient ? `${patient.firstName} ${patient.lastName}` : 'Unknown',
              doctorName: doctor ? `Dr. ${doctor.firstName} ${doctor.lastName}` : 'Unknown',
              date: appt.date,
              type: appt.type,
              status: appt.status,
            };
          });

        return { stats, recentAppointments };
      })
    );
  }
}

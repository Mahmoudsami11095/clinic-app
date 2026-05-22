import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { forkJoin, map } from 'rxjs';
import { AuthService } from '../../../core/auth/auth.service';

export interface DashboardStats {
  totalPatients: number;
  totalDoctors: number;
  todayAppointments: number;
  totalRevenue: number;
  pendingBills: number;
  totalCollected: number;
  totalOutstanding: number;
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
  private authService = inject(AuthService);

  getDashboardData() {
    return forkJoin({
      patients: this.http.get<{ data: any[] }>('/api/patients'),
      appointments: this.http.get<{ data: any[] }>('/api/appointments'),
      doctors: this.http.get<{ data: any[] }>('/api/doctors'),
      billing: this.http.get<{ data: any[] }>('/api/billing'),
    }).pipe(
      map(({ patients, appointments, doctors, billing }) => {
        const doctorId = this.authService.currentDoctorId();
        
        let apptsList = appointments.data;
        let billsList = billing.data;
        
        if (doctorId) {
          apptsList = appointments.data.filter(a => a.doctorId === doctorId);
          billsList = billing.data.filter(b => {
            if (b.appointmentId) {
              const appt = appointments.data.find(a => a.id === b.appointmentId);
              return appt && appt.doctorId === doctorId;
            }
            // Fallback: if patient has any appointment with this doctor
            return appointments.data.some(a => a.patientId === b.patientId && a.doctorId === doctorId);
          });
        }

        const uniquePatientIds = new Set(apptsList.map(a => a.patientId));

        const stats: DashboardStats = {
          totalPatients: doctorId ? uniquePatientIds.size : patients.data.length,
          totalDoctors: doctorId ? 1 : doctors.data.length,
          todayAppointments: apptsList.filter(a => a.status === 'scheduled').length,
          totalRevenue: billsList
            .filter(b => b.status === 'paid')
            .reduce((sum: number, b: any) => sum + b.amount, 0),
          pendingBills: billsList.filter(b => b.status === 'pending' || b.status === 'overdue').length,
          totalCollected: billsList.reduce((sum: number, b: any) => sum + (b.paidAmount || 0), 0),
          totalOutstanding: billsList.reduce((sum: number, b: any) => sum + (b.amount - (b.paidAmount || 0)), 0),
        };

        const recentAppointments: RecentAppointment[] = apptsList
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

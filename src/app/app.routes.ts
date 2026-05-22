import { Routes } from '@angular/router';
import { MainLayout } from './core/layout/main-layout/main-layout.component';
import { roleGuard } from './core/auth/role.guard';

export const routes: Routes = [
  {
    path: '', // Base layout wraps inner routes
    component: MainLayout,
    children: [
      {
        path: 'dashboard',
        loadChildren: () => import('./features/dashboard/dashboard.routes').then(m => m.dashboardRoutes),
        canActivate: [roleGuard],
        data: { roles: ['admin', 'doctor'] }
      },
      {
        path: 'patients',
        loadChildren: () => import('./features/patients/patient.routes').then(m => m.patientRoutes),
        canActivate: [roleGuard],
        data: { roles: ['admin', 'doctor', 'assistant'] }
      },
      {
        path: 'appointments',
        loadChildren: () => import('./features/appointments/appointment.routes').then(m => m.appointmentRoutes),
        canActivate: [roleGuard],
        data: { roles: ['admin', 'doctor', 'assistant', 'patient'] }
      },
      {
        path: 'doctors',
        loadChildren: () => import('./features/doctors/doctor.routes').then(m => m.doctorRoutes),
        canActivate: [roleGuard],
        data: { roles: ['admin'] }
      },
      {
        path: 'billing',
        loadChildren: () => import('./features/billing/billing.routes').then(m => m.billingRoutes),
        canActivate: [roleGuard],
        data: { roles: ['admin', 'doctor', 'assistant', 'patient'] }
      },
      {
        path: 'clinics',
        loadChildren: () => import('./features/clinics/clinics.routes').then(m => m.clinicsRoutes),
        canActivate: [roleGuard],
        data: { roles: ['admin'] }
      },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  }
];

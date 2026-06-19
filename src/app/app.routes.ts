import { Routes } from '@angular/router';
import { MainLayout } from './core/layout/main-layout/main-layout.component';
import { roleGuard } from './core/auth/role.guard';
import { authGuard, unauthGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent),
    canActivate: [unauthGuard]
  },
  {
    path: 'register',
    loadComponent: () => import('./features/auth/register/register.component').then(m => m.RegisterComponent),
    canActivate: [unauthGuard]
  },
  {
    path: '',
    component: MainLayout,
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        loadChildren: () => import('./features/dashboard/dashboard.routes').then(m => m.dashboardRoutes),
        canActivate: [roleGuard],
        data: { roles: ['admin', 'doctor'] }
      },
      {
        path: '3d-dental-chart',
        loadChildren: () => import('./features/dental-chart/dental-chart.routes').then(m => m.dentalChartRoutes),
        canActivate: [roleGuard],
        data: { roles: ['admin', 'doctor', 'assistant'] }
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
        data: { roles: ['admin', 'doctor'] }
      },
      {
        path: 'profile',
        loadChildren: () => import('./features/profile/profile.routes').then(m => m.profileRoutes),
        canActivate: [roleGuard],
        data: { roles: ['admin', 'doctor', 'assistant', 'patient'] }
      },
      {
        path: 'inventory',
        loadChildren: () => import('./features/inventory/inventory.routes').then(m => m.inventoryRoutes),
        canActivate: [roleGuard],
        data: { roles: ['admin', 'doctor', 'assistant'] }
      },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },
  { path: '**', redirectTo: '' }
];

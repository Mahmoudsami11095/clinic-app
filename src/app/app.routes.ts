import { Routes } from '@angular/router';
import { MainLayout } from './core/layout/main-layout/main-layout';
import { Component } from '@angular/core';

@Component({ template: '<div class="p-6 text-slate-500">Feature coming soon...</div>' })
class DummyComponent {}

export const routes: Routes = [
  {
    path: '', // Base layout wraps inner routes
    component: MainLayout,
    children: [
      { path: 'dashboard', component: DummyComponent }, // loadChildren: () => import('./features/dashboard/dashboard.routes').then(m => m.dashboardRoutes)
      { path: 'patients', component: DummyComponent }, // loadChildren: () => import('./features/patients/patient.routes').then(m => m.patientRoutes)
      { path: 'appointments', component: DummyComponent }, // loadChildren: () => import('./features/appointments/appointment.routes').then(m => m.appointmentRoutes)
      { path: 'doctors', component: DummyComponent }, // loadChildren: () => import('./features/doctors/doctor.routes').then(m => m.doctorRoutes)
      { path: 'billing', component: DummyComponent }, // loadChildren: () => import('./features/billing/billing.routes').then(m => m.billingRoutes)
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },
  // { path: 'auth', loadChildren: () => import('./core/auth/auth.routes').then(m => m.authRoutes) }
];

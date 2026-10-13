import { Routes } from '@angular/router';
import { AppointmentListComponent } from './components/appointment-list/appointment-list.component';

export const appointmentRoutes: Routes = [
  { path: '', component: AppointmentListComponent },
  {
    path: 'recalls',
    loadComponent: () => import('./components/recall-manager/patient-recall-manager.component').then(m => m.PatientRecallManagerComponent)
  },
  {
    path: 'standby',
    loadComponent: () => import('./components/standby-queue-manager/standby-queue-manager.component').then(m => m.StandbyQueueManagerComponent)
  },
  {
    path: ':id/prescribe',
    loadComponent: () => import('./components/appointment-prescription/appointment-prescription.component').then(m => m.AppointmentPrescriptionComponent)
  }
];

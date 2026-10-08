import { Routes } from '@angular/router';
import { PatientListComponent } from './components/patient-list/patient-list.component';

export const patientRoutes: Routes = [
  { path: '', component: PatientListComponent },
  {
    path: 'consent-dossier',
    loadComponent: () => import('./components/consent-manager/informed-consent-manager.component').then(m => m.InformedConsentManagerComponent)
  },
  {
    path: ':id',
    loadComponent: () => import('./components/patient-detail/patient-detail.component').then(m => m.PatientDetailComponent)
  }
];

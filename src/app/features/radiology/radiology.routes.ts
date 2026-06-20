import { Routes } from '@angular/router';

export const radiologyRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/radiology-dashboard/radiology-dashboard.component').then(m => m.RadiologyDashboardComponent),
  }
];

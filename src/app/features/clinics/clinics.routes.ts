import { Routes } from '@angular/router';
import { ClinicListComponent } from './components/clinic-list/clinic-list.component';
import { ClinicDetailsComponent } from './components/clinic-details/clinic-details.component';

export const clinicsRoutes: Routes = [
  {
    path: '',
    component: ClinicListComponent
  },
  {
    path: ':id',
    component: ClinicDetailsComponent
  }
];

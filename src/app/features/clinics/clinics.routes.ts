import { Routes } from '@angular/router';
import { ClinicListComponent } from './components/clinic-list/clinic-list.component';

export const clinicsRoutes: Routes = [
  {
    path: '',
    component: ClinicListComponent
  }
];

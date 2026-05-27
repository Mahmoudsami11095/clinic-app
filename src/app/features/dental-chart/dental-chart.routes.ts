import { Routes } from '@angular/router';

export const dentalChartRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./dental-chart.component').then(
        m => m.DentalChartComponent
      )
  }
];

import { Routes } from '@angular/router';

export const dentalChartRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./dental-chart.component').then(
        m => m.DentalChartComponent
      )
  },
  {
    path: 'periodontal',
    loadComponent: () =>
      import('./components/periodontal-chart/periodontal-chart.component').then(
        m => m.PeriodontalChartComponent
      )
  }
];

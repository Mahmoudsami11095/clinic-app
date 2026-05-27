import { Routes } from '@angular/router';

export const dentalChartRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/three-dental-chart/three-dental-chart.component').then(
        m => m.ThreeDentalChartComponent
      )
  }
];

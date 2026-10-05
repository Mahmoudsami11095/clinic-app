import { Routes } from '@angular/router';

export const equipmentRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/equipment-list/equipment-list.component').then(m => m.EquipmentListComponent)
  }
];

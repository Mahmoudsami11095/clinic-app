import { Routes } from '@angular/router';

export const inventoryRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/inventory-list/inventory-list.component').then(m => m.InventoryListComponent)
  }
];

import { Routes } from '@angular/router';

export const inventoryRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/inventory-list/inventory-list.component').then(m => m.InventoryListComponent)
  },
  {
    path: 'transfers',
    loadComponent: () => import('./components/transfer-board/stock-transfer-board.component').then(m => m.StockTransferBoardComponent)
  },
  {
    path: 'procurement',
    loadComponent: () => import('./components/purchase-order-manager/purchase-order-manager.component').then(m => m.PurchaseOrderManagerComponent)
  }
];

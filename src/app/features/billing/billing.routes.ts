import { Routes } from '@angular/router';
import { BillingListComponent } from './components/billing-list/billing-list.component';
import { DoctorCommissionsComponent } from './components/doctor-commissions/doctor-commissions.component';

export const billingRoutes: Routes = [
  { path: '', component: BillingListComponent },
  { path: 'commissions', component: DoctorCommissionsComponent },
  {
    path: 'insurance-claims',
    loadComponent: () => import('./components/insurance-claims/insurance-claims-manager.component').then(m => m.InsuranceClaimsManagerComponent)
  },
  {
    path: 'plans',
    loadComponent: () => import('./components/payment-plan-manager/payment-plan-manager.component').then(m => m.PaymentPlanManagerComponent)
  }
];

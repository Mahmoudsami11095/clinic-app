import { Injectable, inject } from '@angular/core';
import { BillingRecord } from '../../features/billing/models/billing.model';
import { BillingService } from '../../features/billing/services/billing.service';
import { Observable, map } from 'rxjs';

export interface UnpaidInvoiceDetail {
  invoice: BillingRecord;
  amount: number;
  paidAmount: number;
  balanceDue: number;
}

export interface PatientDebtSummary {
  patientId: string;
  totalDebt: number;
  unpaidCount: number;
  unpaidInvoices: UnpaidInvoiceDetail[];
}

@Injectable({
  providedIn: 'root'
})
export class PatientDebtService {
  private billingService = inject(BillingService);

  /**
   * Calculates debt summary for a specific patient given a set of billing records.
   * BR-FIN-02: Determines exact unpaid balances across unpaid and partially paid invoices.
   */
  calculatePatientDebt(patientId: string, records: BillingRecord[]): PatientDebtSummary {
    if (!patientId || !records || records.length === 0) {
      return { patientId, totalDebt: 0, unpaidCount: 0, unpaidInvoices: [] };
    }

    let totalDebt = 0;
    const unpaidInvoices: UnpaidInvoiceDetail[] = [];

    for (const record of records) {
      if (record.patientId === patientId) {
        const isPaid = record.status?.toLowerCase() === 'paid';
        const amount = Number(record.amount) || 0;
        const paidAmount = record.paidAmount !== undefined && record.paidAmount !== null
          ? Number(record.paidAmount)
          : (isPaid ? amount : 0);

        const balanceDue = Math.max(0, amount - paidAmount);

        if (balanceDue > 0 && !isPaid) {
          totalDebt += balanceDue;
          unpaidInvoices.push({
            invoice: record,
            amount,
            paidAmount,
            balanceDue: Math.round(balanceDue * 100) / 100
          });
        }
      }
    }

    return {
      patientId,
      totalDebt: Math.round(totalDebt * 100) / 100,
      unpaidCount: unpaidInvoices.length,
      unpaidInvoices
    };
  }

  /**
   * Builds a map of patient debts from an array of billing records.
   */
  buildDebtMap(records: BillingRecord[]): Map<string, PatientDebtSummary> {
    const debtMap = new Map<string, PatientDebtSummary>();
    if (!records || records.length === 0) return debtMap;

    for (const record of records) {
      const patientId = record.patientId;
      if (!patientId || debtMap.has(patientId)) continue;
      debtMap.set(patientId, this.calculatePatientDebt(patientId, records));
    }

    return debtMap;
  }

  /**
   * Loads all billing records and returns a map of all patient debts.
   */
  loadAllPatientDebts(): Observable<Map<string, PatientDebtSummary>> {
    return this.billingService.getAll().pipe(
      map(records => this.buildDebtMap(records))
    );
  }

  /**
   * Loads all billing records and calculates debt for a specific patient.
   */
  getDebtForPatient(patientId: string): Observable<PatientDebtSummary> {
    return this.billingService.getAll().pipe(
      map(records => this.calculatePatientDebt(patientId, records))
    );
  }
}

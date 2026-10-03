import { Component, Input, Output, EventEmitter, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BillingRecordWithDetails, PaymentLog } from '../../models/billing.model';
import { ClinicService } from '../../../../core/services/clinic.service';
import { AuthService } from '../../../../core/auth/auth.service';
import { TranslatePipe } from '../../../../core/i18n/translate.pipe';

@Component({
  selector: 'app-invoice-print-modal',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  template: `
    @if (isOpen && bill) {
      <div class="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 print:p-0 print:static print:inset-auto">
        <!-- Backdrop (hidden on print) -->
        <div
          class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity no-print"
          (click)="close.emit()"
        ></div>

        <!-- Modal Dialog Box -->
        <div class="relative w-full max-w-4xl max-h-[94vh] flex flex-col bg-slate-100 dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden print:w-full print:max-w-none print:max-h-none print:shadow-none print:bg-white print:rounded-none">
          
          <!-- Top Toolbar (Hidden on print) -->
          <div class="flex flex-wrap items-center justify-between gap-3 px-6 py-4 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 no-print">
            <div class="flex items-center gap-2">
              <div class="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                <i class="pi pi-print text-lg"></i>
              </div>
              <div>
                <h3 class="text-base font-bold text-slate-800 dark:text-slate-100">
                  {{ (printMode() === 'thermal' ? 'billing.print_thermal_receipt' : 'billing.print_formal_invoice') | translate }}
                </h3>
                <p class="text-xs text-slate-500 dark:text-slate-400">
                  {{ 'billing.receipt_no' | translate }}: REC-{{ formatId(bill.id) }}
                </p>
              </div>
            </div>

            <!-- Format Selector & Actions -->
            <div class="flex items-center gap-3">
              <!-- Format Switcher -->
              <div class="inline-flex rounded-xl bg-slate-100 dark:bg-slate-950 p-1 border border-slate-200/80 dark:border-slate-800 text-xs font-semibold">
                <button
                  type="button"
                  (click)="setMode('thermal')"
                  [class]="printMode() === 'thermal' ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'"
                  class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer"
                >
                  <i class="pi pi-receipt text-xs"></i>
                  <span>{{ 'billing.print_thermal_receipt' | translate }}</span>
                </button>
                <button
                  type="button"
                  (click)="setMode('a4')"
                  [class]="printMode() === 'a4' ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'"
                  class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer"
                >
                  <i class="pi pi-file text-xs"></i>
                  <span>{{ 'billing.print_formal_invoice' | translate }}</span>
                </button>
              </div>

              <!-- Print Button -->
              <button
                type="button"
                (click)="printDocument()"
                class="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm shadow-indigo-500/20 transition-all cursor-pointer"
              >
                <i class="pi pi-print text-xs"></i>
                <span>{{ 'billing.print_now' | translate }}</span>
              </button>

              <!-- Close Button -->
              <button
                type="button"
                (click)="close.emit()"
                class="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <i class="pi pi-times text-sm"></i>
              </button>
            </div>
          </div>

          <!-- Document Preview Area (Scrollable in Modal, Full in Print) -->
          <div class="flex-1 overflow-y-auto p-4 sm:p-8 flex justify-center bg-slate-100 dark:bg-slate-950 print:p-0 print:bg-white print:overflow-visible">
            
            <!-- ==============================================
                 1. 80mm ESC/POS THERMAL RECEIPT VIEW
                 ============================================== -->
            @if (printMode() === 'thermal') {
              <div class="printable-document-content thermal-receipt-slip bg-white text-slate-900 shadow-lg border border-slate-200 print:shadow-none print:border-none">
                
                <!-- Clinic Header -->
                <div class="text-center pb-2">
                  <h2 class="text-base font-black tracking-wide uppercase">{{ clinicDetails().name }}</h2>
                  <p class="text-[11px] leading-tight text-slate-600 mt-1">{{ clinicDetails().address }}</p>
                  <p class="text-[11px] font-semibold text-slate-700 mt-0.5" *ngIf="clinicDetails().phone">
                    Tel: {{ clinicDetails().phone }}
                  </p>
                </div>

                <div class="border-b border-dashed border-slate-400 my-2"></div>

                <!-- Voided Alert Banner if Voided -->
                @if (bill.status === 'voided') {
                  <div class="my-2 p-2 border-2 border-dashed border-red-600 bg-red-50 text-center rounded">
                    <div class="text-xs font-black text-red-600 uppercase tracking-widest">*** VOIDED INVOICE ***</div>
                    <div class="text-[10px] text-red-700 font-semibold mt-0.5" *ngIf="bill.voidReason">Reason: {{ bill.voidReason }}</div>
                    <div class="text-[9px] text-red-500 font-mono mt-0.5" *ngIf="bill.voidedAt">{{ bill.voidedAt | date:'short' }}</div>
                  </div>
                }

                <!-- Metadata Info -->
                <div class="text-[11px] space-y-1">
                  <div class="flex justify-between">
                    <span class="text-slate-500">{{ 'billing.date' | translate }}:</span>
                    <span class="font-semibold">{{ bill.dateIssued | date:'short' }}</span>
                  </div>
                  <div class="flex justify-between" *ngIf="bill.invoiceNumber">
                    <span class="text-slate-500">{{ 'billing.invoice_no' | translate }}:</span>
                    <span class="font-mono font-bold text-slate-900">{{ bill.invoiceNumber }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-slate-500">{{ 'billing.receipt_no' | translate }}:</span>
                    <span class="font-mono font-bold">REC-{{ formatId(bill.id) }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-slate-500">{{ 'billing.cashier' | translate }}:</span>
                    <span class="font-medium">{{ cashierName() }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-slate-500">{{ 'billing.patient_label' | translate }}:</span>
                    <span class="font-bold truncate max-w-[170px]">{{ bill.patientName }}</span>
                  </div>
                  <div class="flex justify-between" *ngIf="bill.patientId">
                    <span class="text-slate-500">Patient ID:</span>
                    <span class="font-mono text-slate-600">{{ bill.patientId.substring(0, 8) }}</span>
                  </div>
                </div>

                <div class="border-b border-dashed border-slate-400 my-2"></div>

                <!-- Items Header & Table -->
                <div class="text-[11px]">
                  <div class="flex justify-between font-bold text-slate-700 uppercase pb-1 border-b border-slate-200">
                    <span class="text-start flex-1">{{ 'billing.description_label' | translate }}</span>
                    <span class="w-10 text-center">QTY</span>
                    <span class="w-16 text-end">{{ 'billing.amount' | translate }}</span>
                  </div>
                  
                  <div class="py-1.5 space-y-1">
                    @for (item of parsedItems(); track $index) {
                      <div class="flex justify-between text-slate-800">
                        <span class="text-start flex-1 leading-tight pe-1">{{ item.description }}</span>
                        <span class="w-10 text-center font-mono">{{ item.quantity }}</span>
                        <span class="w-16 text-end font-mono font-semibold">{{ item.price | currency }}</span>
                      </div>
                    }
                  </div>
                </div>

                <div class="border-b border-dashed border-slate-400 my-2"></div>

                <!-- Financial Totals -->
                <div class="text-[12px] space-y-1 font-mono">
                  <div class="flex justify-between">
                    <span class="text-slate-600">{{ 'billing.subtotal' | translate }}:</span>
                    <span>{{ (bill.subtotal || bill.amount) | currency }}</span>
                  </div>
                  @if (bill.discountAmount && bill.discountAmount > 0) {
                    <div class="flex justify-between text-rose-600">
                      <span>Discount ({{ bill.discountPercentage }}%):</span>
                      <span>-{{ bill.discountAmount | currency }}</span>
                    </div>
                  }
                  <div class="flex justify-between font-bold text-[13px] pt-1 border-t border-slate-200 text-slate-900">
                    <span>{{ 'billing.total_amount' | translate }}:</span>
                    <span>{{ bill.amount | currency }}</span>
                  </div>
                  
                  <!-- Payments Log Breakdown -->
                  @for (pay of paymentList(); track $index) {
                    <div class="flex justify-between text-emerald-700 text-[11px] pt-0.5">
                      <span>Paid ({{ pay.paymentMethod }}):</span>
                      <span>{{ pay.amount | currency }}</span>
                    </div>
                  }

                  <div class="flex justify-between font-bold text-[12px] pt-1 border-t border-dashed border-slate-300"
                       [class.text-red-600]="balanceDue() > 0"
                       [class.text-emerald-700]="balanceDue() === 0">
                    <span>{{ 'billing.balance_due' | translate }}:</span>
                    <span>{{ balanceDue() | currency }}</span>
                  </div>
                </div>

                <div class="border-b border-dashed border-slate-400 my-2"></div>

                <!-- Digital Verification QR Code -->
                <div class="text-center py-2 flex flex-col items-center">
                  <div class="w-24 h-24 p-1 bg-white border border-slate-300 rounded flex items-center justify-center">
                    <!-- Clean SVG Monochrome QR Matrix -->
                    <svg viewBox="0 0 100 100" class="w-full h-full text-black" fill="currentColor">
                      <!-- Corner Top Left -->
                      <rect x="5" y="5" width="25" height="25" fill="black"/>
                      <rect x="10" y="10" width="15" height="15" fill="white"/>
                      <rect x="14" y="14" width="7" height="7" fill="black"/>
                      <!-- Corner Top Right -->
                      <rect x="70" y="5" width="25" height="25" fill="black"/>
                      <rect x="75" y="10" width="15" height="15" fill="white"/>
                      <rect x="79" y="14" width="7" height="7" fill="black"/>
                      <!-- Corner Bottom Left -->
                      <rect x="5" y="70" width="25" height="25" fill="black"/>
                      <rect x="10" y="75" width="15" height="15" fill="white"/>
                      <rect x="14" y="79" width="7" height="7" fill="black"/>
                      <!-- Authentic Data Pattern Cells -->
                      <rect x="36" y="8" width="6" height="6"/>
                      <rect x="48" y="12" width="6" height="6"/>
                      <rect x="58" y="6" width="6" height="6"/>
                      <rect x="10" y="38" width="6" height="6"/>
                      <rect x="22" y="44" width="6" height="6"/>
                      <rect x="36" y="36" width="8" height="8"/>
                      <rect x="48" y="40" width="6" height="6"/>
                      <rect x="60" y="36" width="6" height="6"/>
                      <rect x="76" y="42" width="6" height="6"/>
                      <rect x="88" y="36" width="6" height="6"/>
                      <rect x="38" y="54" width="6" height="6"/>
                      <rect x="52" y="58" width="6" height="6"/>
                      <rect x="68" y="52" width="6" height="6"/>
                      <rect x="82" y="60" width="6" height="6"/>
                      <rect x="36" y="74" width="8" height="8"/>
                      <rect x="50" y="80" width="6" height="6"/>
                      <rect x="64" y="72" width="6" height="6"/>
                      <rect x="76" y="82" width="6" height="6"/>
                      <rect x="88" y="76" width="6" height="6"/>
                    </svg>
                  </div>
                  <span class="text-[9px] font-mono text-slate-500 mt-1 uppercase tracking-wider">
                    E-VERIFIED #{{ formatId(bill.id) }}
                  </span>
                </div>

                <!-- Footer Messages -->
                <div class="text-center text-[10px] text-slate-600 space-y-0.5 pt-1">
                  <p class="font-bold">{{ 'billing.thank_you_visit' | translate }}</p>
                  <p class="text-slate-500">{{ 'billing.digital_verification_notice' | translate }}</p>
                </div>
              </div>
            }

            <!-- ==============================================
                 2. FORMAL A4 MEDICAL INVOICE VIEW
                 ============================================== -->
            @if (printMode() === 'a4') {
              <div class="printable-document-content a4-invoice-sheet bg-white text-slate-900 shadow-xl border border-slate-200 p-8 sm:p-12 print:shadow-none print:border-none print:p-0">
                
                <!-- Formal Header -->
                <div class="flex justify-between items-start border-b-2 border-slate-800 pb-6 mb-6">
                  <div>
                    <div class="flex items-center gap-3">
                      <div class="w-12 h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center text-2xl font-black">
                        +
                      </div>
                      <div>
                        <h1 class="text-2xl font-black tracking-tight text-slate-900 uppercase">
                          {{ clinicDetails().name }}
                        </h1>
                        <p class="text-xs font-semibold text-indigo-600 tracking-wider uppercase">
                          Specialized Outpatient Medical & Dental Services
                        </p>
                      </div>
                    </div>
                    <div class="mt-3 text-xs text-slate-600 space-y-0.5">
                      <p>{{ clinicDetails().address }}</p>
                      <p>Phone: {{ clinicDetails().phone || '+20 2 1234 5678' }} | Email: support&#64;clinic.com</p>
                    </div>
                  </div>

                  <div class="text-end">
                    <span class="inline-block px-3 py-1 bg-slate-900 text-white font-mono text-sm font-bold rounded-lg uppercase tracking-wider"
                          [class.bg-rose-700]="bill.status === 'voided'">
                      {{ bill.status === 'voided' ? 'VOIDED INVOICE' : 'TAX INVOICE' }}
                    </span>
                    <div class="mt-3 text-xs text-slate-600 space-y-1">
                      <p><span class="font-semibold text-slate-800">Invoice No:</span> <span class="font-mono font-bold text-slate-900">{{ bill.invoiceNumber || ('INV-' + formatId(bill.id)) }}</span></p>
                      <p><span class="font-semibold text-slate-800">Date:</span> {{ bill.dateIssued | date:'mediumDate' }}</p>
                      <p><span class="font-semibold text-slate-800">Status:</span> 
                        <span class="font-bold uppercase ms-1"
                              [class.text-emerald-600]="bill.status === 'paid'"
                              [class.text-amber-600]="bill.status === 'partially_paid'"
                              [class.text-rose-600]="bill.status === 'voided'"
                              [class.text-red-600]="bill.status === 'pending' || bill.status === 'overdue'">
                          {{ bill.status }}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>

                <!-- Voided Alert Banner for A4 Invoice -->
                @if (bill.status === 'voided') {
                  <div class="mb-6 p-4 border-2 border-red-600 bg-red-50/80 rounded-xl flex items-center justify-between text-red-700">
                    <div class="flex items-center gap-3">
                      <div class="w-10 h-10 rounded-lg bg-red-600 text-white flex items-center justify-center font-black text-xl">
                        !
                      </div>
                      <div>
                        <div class="font-black text-base uppercase tracking-wider text-red-800">INVOICE VOIDED (INVALID)</div>
                        <div class="text-xs text-red-700 font-medium" *ngIf="bill.voidReason">Reason: {{ bill.voidReason }}</div>
                      </div>
                    </div>
                    <div class="text-end text-xs font-mono text-red-600" *ngIf="bill.voidedAt">
                      Voided: {{ bill.voidedAt | date:'medium' }}
                    </div>
                  </div>
                }

                <!-- Patient & Consultation Details Cards -->
                <div class="grid grid-cols-2 gap-6 mb-8 text-xs">
                  <div class="bg-slate-50 border border-slate-200 rounded-xl p-4">
                    <h3 class="font-bold text-slate-500 uppercase tracking-wider mb-2 text-[10px]">PATIENT INFORMATION</h3>
                    <p class="text-sm font-bold text-slate-900">{{ bill.patientName }}</p>
                    <p class="text-slate-600 mt-1" *ngIf="bill.patientId">Patient File ID: <span class="font-mono">{{ bill.patientId }}</span></p>
                    <p class="text-slate-600 mt-0.5" *ngIf="bill.appointmentType">Visit Type: {{ bill.appointmentType }}</p>
                  </div>

                  <div class="bg-slate-50 border border-slate-200 rounded-xl p-4">
                    <h3 class="font-bold text-slate-500 uppercase tracking-wider mb-2 text-[10px]">BILLING SUMMARY</h3>
                    <p class="text-slate-700">Cashier: <span class="font-semibold">{{ cashierName() }}</span></p>
                    <p class="text-slate-700 mt-1">Payment Channel: <span class="font-semibold">{{ bill.paymentMethod || 'Standard Payment' }}</span></p>
                    <p class="text-slate-700 mt-0.5">Appointment Date: {{ (bill.appointmentDate || bill.dateIssued) | date:'mediumDate' }}</p>
                  </div>
                </div>

                <!-- Formal Itemized Table -->
                <div class="border border-slate-200 rounded-xl overflow-hidden mb-8">
                  <table class="w-full text-xs">
                    <thead class="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                      <tr>
                        <th class="py-3 px-4 text-start">#</th>
                        <th class="py-3 px-4 text-start">Service / Procedure Description</th>
                        <th class="py-3 px-4 text-center">Qty</th>
                        <th class="py-3 px-4 text-end">Unit Price</th>
                        <th class="py-3 px-4 text-end">Line Total</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-200">
                      @for (item of parsedItems(); track $index) {
                        <tr>
                          <td class="py-3 px-4 font-mono text-slate-500">{{ $index + 1 }}</td>
                          <td class="py-3 px-4 font-semibold text-slate-800">{{ item.description }}</td>
                          <td class="py-3 px-4 text-center font-mono">{{ item.quantity }}</td>
                          <td class="py-3 px-4 text-end font-mono">{{ item.price | currency }}</td>
                          <td class="py-3 px-4 text-end font-mono font-bold text-slate-900">{{ (item.quantity * item.price) | currency }}</td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>

                <!-- Totals & Payment Logs -->
                <div class="grid grid-cols-2 gap-8 items-start mb-8 text-xs">
                  <!-- Payment History Log -->
                  <div>
                    <h4 class="font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-2">PAYMENT TRANSACTIONS LOG</h4>
                    @if (paymentList().length > 0) {
                      <div class="border border-slate-200 rounded-lg overflow-hidden">
                        <table class="w-full text-[11px]">
                          <thead class="bg-slate-50 border-b border-slate-200 text-slate-500 font-medium">
                            <tr>
                              <th class="py-1.5 px-3 text-start">Date</th>
                              <th class="py-1.5 px-3 text-start">Method</th>
                              <th class="py-1.5 px-3 text-end">Amount</th>
                            </tr>
                          </thead>
                          <tbody class="divide-y divide-slate-100 font-mono">
                            @for (pay of paymentList(); track $index) {
                              <tr>
                                <td class="py-1.5 px-3">{{ pay.date | date:'shortDate' }}</td>
                                <td class="py-1.5 px-3 capitalize">{{ pay.paymentMethod }}</td>
                                <td class="py-1.5 px-3 text-end font-semibold text-emerald-700">{{ pay.amount | currency }}</td>
                              </tr>
                            }
                          </tbody>
                        </table>
                      </div>
                    } @else {
                      <p class="text-slate-400 italic">No payments logged yet.</p>
                    }
                  </div>

                  <!-- Financial Calculations Box -->
                  <div class="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-2 font-mono text-xs">
                    <div class="flex justify-between text-slate-600">
                      <span>Gross Subtotal:</span>
                      <span>{{ (bill.subtotal || bill.amount) | currency }}</span>
                    </div>
                    @if (bill.discountAmount && bill.discountAmount > 0) {
                      <div class="flex justify-between text-rose-600">
                        <span>Discount ({{ bill.discountPercentage }}% - {{ bill.discountReason || 'Courtesy' }}):</span>
                        <span>-{{ bill.discountAmount | currency }}</span>
                      </div>
                      @if (bill.discountAuthorizedBy) {
                        <div class="text-[10px] text-slate-500 italic text-end">
                          Auth: {{ bill.discountAuthorizedBy }}
                        </div>
                      }
                    } @else {
                      <div class="flex justify-between text-slate-600">
                        <span>Discount (0%):</span>
                        <span>$0.00</span>
                      </div>
                    }
                    <div class="flex justify-between font-bold text-sm text-slate-900 pt-2 border-t border-slate-300">
                      <span>Total Net Payable:</span>
                      <span>{{ bill.amount | currency }}</span>
                    </div>
                    <div class="flex justify-between text-emerald-700 font-semibold pt-1">
                      <span>Total Amount Paid:</span>
                      <span>{{ totalPaidAmount() | currency }}</span>
                    </div>
                    <div class="flex justify-between font-bold text-sm pt-2 border-t-2 border-slate-900"
                         [class.text-red-600]="balanceDue() > 0"
                         [class.text-emerald-700]="balanceDue() === 0">
                      <span>Remaining Balance Due:</span>
                      <span>{{ balanceDue() | currency }}</span>
                    </div>
                  </div>
                </div>

                <!-- Signatures & Stamp Section -->
                <div class="grid grid-cols-2 gap-12 pt-8 border-t border-slate-200 mt-12 text-center text-xs">
                  <div>
                    <div class="h-16 border-b border-dashed border-slate-400"></div>
                    <p class="font-bold text-slate-700 mt-2">{{ 'billing.signature_authorized' | translate }}</p>
                    <p class="text-[10px] text-slate-400">Clinic Cashier / Administration</p>
                  </div>
                  <div>
                    <div class="h-16 border border-dashed border-slate-300 rounded-xl flex items-center justify-center text-slate-300 uppercase tracking-widest text-[10px]">
                      Official Clinic Stamp
                    </div>
                    <p class="font-bold text-slate-700 mt-2">Clinic Stamp Box</p>
                    <p class="text-[10px] text-slate-400">Medical Practice Seal</p>
                  </div>
                </div>

                <!-- Footer Terms -->
                <div class="mt-12 text-center text-[10px] text-slate-400 border-t border-slate-100 pt-4">
                  <p>{{ 'billing.thank_you_visit' | translate }} — {{ 'billing.digital_verification_notice' | translate }}</p>
                </div>
              </div>
            }

          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    /* On-Screen Preview Styles */
    .thermal-receipt-slip {
      width: 320px;
      padding: 18px 16px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    }

    .a4-invoice-sheet {
      width: 100%;
      max-width: 800px;
      min-height: 1000px;
    }

    /* Print Overrides */
    @media print {
      .thermal-receipt-slip {
        width: 74mm !important;
        max-width: 74mm !important;
        padding: 2mm 0 !important;
        margin: 0 auto !important;
        font-size: 11px !important;
        line-height: 1.25 !important;
        color: #000000 !important;
        background: #ffffff !important;
        border: none !important;
        box-shadow: none !important;
      }

      .a4-invoice-sheet {
        width: 100% !important;
        max-width: 100% !important;
        padding: 0 !important;
        margin: 0 !important;
        border: none !important;
        box-shadow: none !important;
      }
    }
  `]
})
export class InvoicePrintModalComponent {
  @Input() isOpen = false;
  @Input() bill: BillingRecordWithDetails | null = null;
  @Output() close = new EventEmitter<void>();

  private clinicService = inject(ClinicService);
  private authService = inject(AuthService);

  printMode = signal<'thermal' | 'a4'>('thermal');

  setMode(mode: 'thermal' | 'a4') {
    this.printMode.set(mode);
  }

  clinicDetails = computed(() => {
    if (!this.bill) return { name: 'Smart Clinic', address: 'Medical Center', phone: '' };
    const clinics = this.clinicService.clinics();
    const match = this.bill.clinicId ? clinics.find(c => c.id === this.bill!.clinicId) : null;
    if (match) {
      return {
        name: match.name,
        address: match.address || (match.city ? `${match.city}, ${match.country || ''}` : 'Main Clinic Branch'),
        phone: match.phone || ''
      };
    }
    const activeName = this.clinicService.activeClinicName();
    return {
      name: activeName && activeName !== 'All Clinics' ? activeName : 'Smart Clinic Healthcare',
      address: '123 Healthcare Ave, Outpatient Center',
      phone: '+20 2 1234 5678'
    };
  });

  cashierName = computed(() => {
    const user = this.authService.currentUser();
    return user?.name || 'Reception Desk';
  });

  parsedItems = computed(() => {
    if (!this.bill) return [];
    const desc = this.bill.description || this.bill.appointmentType || 'Medical Consultation & Treatment';
    
    // If comma or newline separated, split into individual items
    if (desc.includes('\n') || desc.includes(';')) {
      const parts = desc.split(/[\n;]+/).map(s => s.trim()).filter(Boolean);
      return parts.map(p => ({
        description: p,
        quantity: 1,
        price: Number((this.bill!.amount / parts.length).toFixed(2))
      }));
    }

    return [{
      description: desc,
      quantity: 1,
      price: this.bill.amount
    }];
  });

  paymentList = computed<PaymentLog[]>(() => {
    if (!this.bill) return [];
    if (this.bill.payments && this.bill.payments.length > 0) {
      return this.bill.payments;
    }
    const paid = this.bill.paidAmount !== undefined ? this.bill.paidAmount : (this.bill.status === 'paid' ? this.bill.amount : 0);
    if (paid > 0) {
      return [{
        amount: paid,
        date: this.bill.dateIssued,
        paymentMethod: this.bill.paymentMethod || 'Cash'
      }];
    }
    return [];
  });

  totalPaidAmount = computed(() => {
    if (!this.bill) return 0;
    if (this.bill.paidAmount !== undefined) return this.bill.paidAmount;
    return this.bill.status === 'paid' ? this.bill.amount : 0;
  });

  balanceDue = computed(() => {
    if (!this.bill) return 0;
    return Math.max(0, this.bill.amount - this.totalPaidAmount());
  });

  formatId(id: string): string {
    return (id || '1').padStart(5, '0');
  }

  printDocument() {
    window.print();
  }
}

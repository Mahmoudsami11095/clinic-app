import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '../../../../core/i18n/translate.pipe';
import { LabWorkOrderService, LabWorkOrder, FittingEligibilityResult } from '../../services/lab-work-order.service';
import { IntraoralMeshViewerComponent } from '../intraoral-mesh-viewer/intraoral-mesh-viewer.component';

@Component({
  selector: 'app-lab-work-orders-board',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe, IntraoralMeshViewerComponent],
  template: `
    <div class="p-6 max-w-7xl mx-auto space-y-6 animate-fade-in text-slate-100">
      <!-- Header -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div class="flex items-center gap-2">
            <span class="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <i class="pi pi-box text-xl"></i>
            </span>
            <div>
              <h1 class="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
                {{ 'lab.title' | translate }}
                <span class="text-xs px-2.5 py-0.5 rounded-full font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  Release v9.0.0
                </span>
              </h1>
              <p class="text-sm text-slate-400 mt-0.5">
                {{ 'lab.subtitle' | translate }}
              </p>
            </div>
          </div>
        </div>

        <div class="flex items-center gap-3">
          <button
            type="button"
            (click)="showEligibilityCheckerModal.set(true)"
            id="fitting-eligibility-modal-btn"
            class="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <i class="pi pi-shield text-xs"></i>
            <span>{{ 'lab.check_gate_btn' | translate }}</span>
          </button>

          <button
            type="button"
            (click)="showNewOrderModal.set(true)"
            id="new-lab-order-modal-btn"
            class="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-lg shadow-cyan-500/20 transition-all flex items-center gap-2 cursor-pointer"
          >
            <i class="pi pi-plus text-xs"></i>
            <span>{{ 'lab.new_order_btn' | translate }}</span>
          </button>
        </div>
      </div>

      <!-- Quick Metrics Summary -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div class="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
          <span class="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">{{ 'lab.col_dispatched' | translate }}</span>
          <div class="flex items-center justify-between mt-1">
            <span class="text-2xl font-black text-white">{{ dispatchedOrders().length }}</span>
            <span class="p-2 rounded-lg bg-slate-800 text-slate-300"><i class="pi pi-send text-xs"></i></span>
          </div>
        </div>

        <div class="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
          <span class="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">{{ 'lab.col_milling' | translate }}</span>
          <div class="flex items-center justify-between mt-1">
            <span class="text-2xl font-black text-amber-300">{{ millingOrders().length }}</span>
            <span class="p-2 rounded-lg bg-amber-500/10 text-amber-300"><i class="pi pi-cog text-xs"></i></span>
          </div>
        </div>

        <div class="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
          <span class="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">{{ 'lab.col_shipped' | translate }}</span>
          <div class="flex items-center justify-between mt-1">
            <span class="text-2xl font-black text-blue-300">{{ shippedOrders().length }}</span>
            <span class="p-2 rounded-lg bg-blue-500/10 text-blue-300"><i class="pi pi-truck text-xs"></i></span>
          </div>
        </div>

        <div class="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
          <span class="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">{{ 'lab.col_received' | translate }}</span>
          <div class="flex items-center justify-between mt-1">
            <span class="text-2xl font-black text-emerald-300">{{ receivedOrders().length }}</span>
            <span class="p-2 rounded-lg bg-emerald-500/10 text-emerald-300"><i class="pi pi-check-circle text-xs"></i></span>
          </div>
        </div>
      </div>

      <!-- Kanban 4-Column Board -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <!-- Column 1: Dispatched -->
        <div class="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col space-y-3">
          <div class="flex items-center justify-between border-b border-slate-800 pb-2">
            <h3 class="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <i class="pi pi-send text-slate-400 text-xs"></i>
              <span>{{ 'lab.col_dispatched' | translate }}</span>
            </h3>
            <span class="px-2 py-0.5 rounded-md bg-slate-800 text-[10px] font-mono text-slate-300">{{ dispatchedOrders().length }}</span>
          </div>

          <div class="space-y-3 flex-1 overflow-y-auto">
            @for (order of dispatchedOrders(); track order.id) {
              <div class="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2.5 hover:border-slate-700 transition-colors">
                <div class="flex items-center justify-between gap-1">
                  <span class="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/30 text-[11px] font-mono font-bold">
                    Tooth #{{ order.toothNumber }}
                  </span>
                  <span class="text-[10px] text-slate-500 font-mono">{{ order.orderToken }}</span>
                </div>

                <div>
                  <h4 class="font-bold text-white text-xs">{{ order.patientName }}</h4>
                  <p class="text-[11px] text-slate-400">{{ order.restorationType }}</p>
                </div>

                <div class="flex items-center gap-1.5 flex-wrap text-[10px]">
                  <span class="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">{{ order.material }}</span>
                  <span class="px-1.5 py-0.5 rounded bg-slate-800 text-amber-300 font-bold">Shade: {{ order.shade }}</span>
                </div>

                <div class="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-1">
                  <button
                    type="button"
                    (click)="open3DViewer(order)"
                    class="px-2 py-1 rounded-md text-[10px] font-bold bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/30 transition-colors flex items-center gap-1 cursor-pointer"
                    title="View 3D Intraoral Impression"
                  >
                    <i class="pi pi-box text-[9px]"></i>
                    <span>3D Scan</span>
                  </button>
                  <button
                    type="button"
                    (click)="advanceStatus(order, 'Milling')"
                    class="px-2 py-1 rounded-md text-[10px] font-bold bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/30 transition-colors cursor-pointer"
                  >
                    Start Milling &rarr;
                  </button>
                </div>
              </div>
            } @empty {
              <p class="text-xs text-slate-600 text-center py-6 italic">No orders dispatched</p>
            }
          </div>
        </div>

        <!-- Column 2: Milling & Production -->
        <div class="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col space-y-3">
          <div class="flex items-center justify-between border-b border-slate-800 pb-2">
            <h3 class="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
              <i class="pi pi-cog text-amber-400 text-xs animate-spin"></i>
              <span>{{ 'lab.col_milling' | translate }}</span>
            </h3>
            <span class="px-2 py-0.5 rounded-md bg-amber-950 text-[10px] font-mono text-amber-300 border border-amber-500/30">{{ millingOrders().length }}</span>
          </div>

          <div class="space-y-3 flex-1 overflow-y-auto">
            @for (order of millingOrders(); track order.id) {
              <div class="p-4 rounded-xl bg-slate-950/80 border border-amber-500/30 space-y-2.5 hover:border-amber-500/50 transition-colors">
                <div class="flex items-center justify-between gap-1">
                  <span class="px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-500/30 text-[11px] font-mono font-bold">
                    Tooth #{{ order.toothNumber }}
                  </span>
                  <span class="text-[10px] text-slate-500 font-mono">{{ order.orderToken }}</span>
                </div>

                <div>
                  <h4 class="font-bold text-white text-xs">{{ order.patientName }}</h4>
                  <p class="text-[11px] text-slate-400">{{ order.restorationType }}</p>
                </div>

                @if (order.labTechnicianNotes) {
                  <p class="text-[10px] text-amber-200/80 bg-amber-950/40 p-2 rounded-lg border border-amber-500/20 italic">
                    "{{ order.labTechnicianNotes }}"
                  </p>
                }

                <div class="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-1">
                  <button
                    type="button"
                    (click)="open3DViewer(order)"
                    class="px-2 py-1 rounded-md text-[10px] font-bold bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/30 transition-colors flex items-center gap-1 cursor-pointer"
                    title="View 3D Intraoral Impression"
                  >
                    <i class="pi pi-box text-[9px]"></i>
                    <span>3D Scan</span>
                  </button>
                  <button
                    type="button"
                    (click)="advanceStatus(order, 'Shipped')"
                    class="px-2 py-1 rounded-md text-[10px] font-bold bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 transition-colors cursor-pointer"
                  >
                    Mark Shipped &rarr;
                  </button>
                </div>
              </div>
            } @empty {
              <p class="text-xs text-slate-600 text-center py-6 italic">No units in milling</p>
            }
          </div>
        </div>

        <!-- Column 3: Shipped -->
        <div class="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col space-y-3">
          <div class="flex items-center justify-between border-b border-slate-800 pb-2">
            <h3 class="text-xs font-bold uppercase tracking-wider text-blue-300 flex items-center gap-1.5">
              <i class="pi pi-truck text-blue-400 text-xs"></i>
              <span>{{ 'lab.col_shipped' | translate }}</span>
            </h3>
            <span class="px-2 py-0.5 rounded-md bg-blue-950 text-[10px] font-mono text-blue-300 border border-blue-500/30">{{ shippedOrders().length }}</span>
          </div>

          <div class="space-y-3 flex-1 overflow-y-auto">
            @for (order of shippedOrders(); track order.id) {
              <div class="p-4 rounded-xl bg-slate-950/80 border border-blue-500/30 space-y-2.5 hover:border-blue-500/50 transition-colors">
                <div class="flex items-center justify-between gap-1">
                  <span class="px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-500/30 text-[11px] font-mono font-bold">
                    Tooth #{{ order.toothNumber }}
                  </span>
                  <span class="text-[10px] text-slate-500 font-mono">{{ order.orderToken }}</span>
                </div>

                <div>
                  <h4 class="font-bold text-white text-xs">{{ order.patientName }}</h4>
                  <p class="text-[11px] text-slate-400">{{ order.restorationType }}</p>
                </div>

                <div class="text-[10px] text-blue-200 bg-blue-950/40 p-2 rounded-lg border border-blue-500/20 flex items-center gap-1.5">
                  <i class="pi pi-map-marker text-blue-400"></i>
                  <span>{{ order.labTrackingNumber || 'Courier in Transit' }}</span>
                </div>

                <div class="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-1">
                  <button
                    type="button"
                    (click)="open3DViewer(order)"
                    class="px-2 py-1 rounded-md text-[10px] font-bold bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/30 transition-colors flex items-center gap-1 cursor-pointer"
                    title="View 3D Intraoral Impression"
                  >
                    <i class="pi pi-box text-[9px]"></i>
                    <span>3D Scan</span>
                  </button>
                  <button
                    type="button"
                    (click)="advanceStatus(order, 'ReceivedByClinic')"
                    class="px-2 py-1 rounded-md text-[10px] font-bold bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 transition-colors cursor-pointer"
                  >
                    Mark Received &check;
                  </button>
                </div>
              </div>
            } @empty {
              <p class="text-xs text-slate-600 text-center py-6 italic">No shipments in transit</p>
            }
          </div>
        </div>

        <!-- Column 4: Ready for Patient Fitting -->
        <div class="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col space-y-3">
          <div class="flex items-center justify-between border-b border-slate-800 pb-2">
            <h3 class="text-xs font-bold uppercase tracking-wider text-emerald-300 flex items-center gap-1.5">
              <i class="pi pi-check-circle text-emerald-400 text-xs"></i>
              <span>{{ 'lab.col_received' | translate }}</span>
            </h3>
            <span class="px-2 py-0.5 rounded-md bg-emerald-950 text-[10px] font-mono text-emerald-300 border border-emerald-500/30">{{ receivedOrders().length }}</span>
          </div>

          <div class="space-y-3 flex-1 overflow-y-auto">
            @for (order of receivedOrders(); track order.id) {
              <div class="p-4 rounded-xl bg-slate-950/80 border border-emerald-500/40 space-y-2.5 shadow-md shadow-emerald-950/10">
                <div class="flex items-center justify-between gap-1">
                  <span class="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/30 text-[11px] font-mono font-bold">
                    Tooth #{{ order.toothNumber }}
                  </span>
                  <span class="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                    Ready for Chair
                  </span>
                </div>

                <div>
                  <h4 class="font-bold text-white text-xs">{{ order.patientName }}</h4>
                  <p class="text-[11px] text-slate-400">{{ order.restorationType }} ({{ order.shade }})</p>
                </div>

                <div class="p-2 bg-emerald-950/30 border border-emerald-500/20 rounded-lg text-[10px] text-emerald-200 flex items-center gap-1.5">
                  <i class="pi pi-calendar-plus text-emerald-400"></i>
                  <span>Eligible for Fitting Booking</span>
                </div>

                <div class="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-1">
                  <button
                    type="button"
                    (click)="open3DViewer(order)"
                    class="px-2 py-1 rounded-md text-[10px] font-bold bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/30 transition-colors flex items-center gap-1 cursor-pointer"
                    title="View 3D Intraoral Impression"
                  >
                    <i class="pi pi-box text-[9px]"></i>
                    <span>View 3D Scan</span>
                  </button>
                  <span class="text-[10px] text-emerald-400 font-semibold">&check; Verified</span>
                </div>
              </div>
            } @empty {
              <p class="text-xs text-slate-600 text-center py-6 italic">No units in clinic inventory</p>
            }
          </div>
        </div>
      </div>

      <!-- New Lab Order Modal -->
      @if (showNewOrderModal()) {
        <div class="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div class="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl">
            <div class="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 class="text-base font-bold text-white flex items-center gap-2">
                <i class="pi pi-box text-cyan-400"></i>
                <span>{{ 'lab.new_modal_title' | translate }}</span>
              </h3>
              <button
                type="button"
                (click)="showNewOrderModal.set(false)"
                class="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <i class="pi pi-times text-xs"></i>
              </button>
            </div>

            <div class="space-y-3 text-xs">
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-slate-300 font-semibold mb-1">Patient Name</label>
                  <input
                    type="text"
                    [(ngModel)]="newPatientName"
                    class="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-hidden focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label class="block text-slate-300 font-semibold mb-1">FDI Tooth #</label>
                  <input
                    type="number"
                    [(ngModel)]="newToothNumber"
                    class="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-hidden focus:border-cyan-500"
                  />
                </div>
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-slate-300 font-semibold mb-1">Restoration Type</label>
                  <select
                    [(ngModel)]="newRestorationType"
                    class="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-hidden focus:border-cyan-500"
                  >
                    <option value="Full Anatomical Crown">Full Anatomical Crown</option>
                    <option value="3-Unit Bridge">3-Unit Bridge</option>
                    <option value="Aesthetic Veneer">Aesthetic Veneer</option>
                    <option value="Custom Implant Abutment">Custom Implant Abutment</option>
                  </select>
                </div>
                <div>
                  <label class="block text-slate-300 font-semibold mb-1">Material</label>
                  <select
                    [(ngModel)]="newMaterial"
                    class="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-hidden focus:border-cyan-500"
                  >
                    <option value="Monolithic Multi-Layer Zirconia">Monolithic Multi-Layer Zirconia</option>
                    <option value="Lithium Disilicate (IPS e.max)">Lithium Disilicate (IPS e.max)</option>
                    <option value="Titanium Grade 5 Base">Titanium Grade 5 Base</option>
                    <option value="PMMA Temporary">PMMA Temporary</option>
                  </select>
                </div>
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-slate-300 font-semibold mb-1">VITA Classical Shade</label>
                  <select
                    [(ngModel)]="newShade"
                    class="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-hidden focus:border-cyan-500"
                  >
                    <option value="A1">A1</option>
                    <option value="A2">A2</option>
                    <option value="A3">A3</option>
                    <option value="B1">B1</option>
                    <option value="BL2">BL2 (Bleach)</option>
                  </select>
                </div>
                <div>
                  <label class="block text-slate-300 font-semibold mb-1">Estimated Turnaround</label>
                  <select
                    [(ngModel)]="newEstimatedDays"
                    class="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-hidden focus:border-cyan-500"
                  >
                    <option [value]="3">3 Business Days</option>
                    <option [value]="5">5 Business Days</option>
                    <option [value]="7">7 Business Days</option>
                  </select>
                </div>
              </div>

              <div>
                <label class="block text-slate-300 font-semibold mb-1">Dental Milling Partner</label>
                <input
                  type="text"
                  [(ngModel)]="newLabPartnerName"
                  class="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-hidden focus:border-cyan-500"
                />
              </div>
            </div>

            <div class="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                (click)="showNewOrderModal.set(false)"
                class="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                (click)="submitNewOrder()"
                id="submit-create-lab-order-btn"
                class="px-4 py-2 rounded-xl text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white shadow-md shadow-cyan-600/30 cursor-pointer"
              >
                Dispatch to Lab
              </button>
            </div>
          </div>
        </div>
      }

      <!-- Fitting Gate Check Modal (BR-LAB-01 Governance Verification) -->
      @if (showEligibilityCheckerModal()) {
        <div class="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div class="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl">
            <div class="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 class="text-base font-bold text-white flex items-center gap-2">
                <i class="pi pi-shield text-amber-400"></i>
                <span>{{ 'lab.gate_modal_title' | translate }}</span>
              </h3>
              <button
                type="button"
                (click)="showEligibilityCheckerModal.set(false)"
                class="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <i class="pi pi-times text-xs"></i>
              </button>
            </div>

            <div class="space-y-3 text-xs">
              <p class="text-slate-400">
                Rule <strong>BR-LAB-01</strong> prevents appointment booking for crown fittings until the unit is physically received in clinic.
              </p>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-slate-300 font-semibold mb-1">Patient ID</label>
                  <input
                    type="text"
                    [(ngModel)]="checkPatientId"
                    class="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-hidden focus:border-amber-500"
                  />
                </div>
                <div>
                  <label class="block text-slate-300 font-semibold mb-1">FDI Tooth #</label>
                  <input
                    type="number"
                    [(ngModel)]="checkToothNumber"
                    class="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-hidden focus:border-amber-500"
                  />
                </div>
              </div>

              @if (eligibilityResult(); as result) {
                <div
                  [class]="result.canSchedule ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200' : 'bg-rose-950/40 border-rose-500/40 text-rose-200'"
                  class="p-3 rounded-xl border space-y-1"
                >
                  <div class="flex items-center gap-2 font-bold text-sm">
                    <i [class]="result.canSchedule ? 'pi pi-check-circle text-emerald-400' : 'pi pi-times-circle text-rose-400'"></i>
                    <span>{{ result.canSchedule ? 'Booking Permitted' : 'Booking Prohibited (Gate Blocked)' }}</span>
                  </div>
                  <p class="text-[11px] opacity-90">{{ result.reason }}</p>
                </div>
              }
            </div>

            <div class="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                (click)="showEligibilityCheckerModal.set(false)"
                class="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                Close
              </button>

              <button
                type="button"
                (click)="testCheckFitting()"
                id="submit-check-fitting-btn"
                class="px-4 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white shadow-md shadow-amber-600/30 cursor-pointer"
              >
                Run Gate Validation
              </button>
            </div>
          </div>
        </div>
      }

      <!-- 3D Intraoral Mesh Viewer Modal -->
      <app-intraoral-mesh-viewer
        [order]="selected3DOrder()"
        [(visible)]="show3DViewerModal"
      />
    </div>
  `
})
export class LabWorkOrdersBoardComponent implements OnInit {
  private labService = inject(LabWorkOrderService);

  orders = signal<LabWorkOrder[]>([]);

  dispatchedOrders = computed(() => this.orders().filter(o => o.status === 'Dispatched' || o.status === 'ReceivedByLab'));
  millingOrders = computed(() => this.orders().filter(o => o.status === 'Milling' || o.status === 'QualityControl'));
  shippedOrders = computed(() => this.orders().filter(o => o.status === 'Shipped'));
  receivedOrders = computed(() => this.orders().filter(o => o.status === 'ReceivedByClinic'));

  // Modals
  showNewOrderModal = signal<boolean>(false);
  showEligibilityCheckerModal = signal<boolean>(false);
  show3DViewerModal = signal<boolean>(false);
  selected3DOrder = signal<LabWorkOrder | null>(null);
  eligibilityResult = signal<FittingEligibilityResult | null>(null);

  // New Order Form Model
  newPatientName = 'Jonathan Reed';
  newToothNumber = 36;
  newRestorationType = 'Full Anatomical Crown';
  newMaterial = 'Monolithic Multi-Layer Zirconia';
  newShade = 'A2';
  newEstimatedDays = 4;
  newLabPartnerName = 'Apex Precision CAD/CAM Lab';

  // Gate Checker Form Model
  checkPatientId = 'pat-201'; // Seed Arthur Pendelton (Tooth 36 Milling -> Blocked)
  checkToothNumber = 36;

  ngOnInit(): void {
    this.loadOrders();
  }

  loadOrders(): void {
    this.labService.getLabOrders().subscribe(res => {
      this.orders.set(res);
    });
  }

  submitNewOrder(): void {
    this.labService.createLabOrder({
      patientId: `pat-${Date.now()}`,
      patientName: this.newPatientName,
      toothNumber: this.newToothNumber,
      restorationType: this.newRestorationType,
      material: this.newMaterial,
      shade: this.newShade,
      labPartnerName: this.newLabPartnerName,
      estimatedDays: this.newEstimatedDays
    }).subscribe(() => {
      this.showNewOrderModal.set(false);
      this.loadOrders();
    });
  }

  advanceStatus(order: LabWorkOrder, nextStatus: string): void {
    this.labService.updateOrderStatus(order.orderToken, {
      status: nextStatus,
      trackingNumber: nextStatus === 'Shipped' ? `EXP-${Math.floor(Math.random() * 900000 + 100000)}` : order.labTrackingNumber,
      technicianNotes: `Advanced to ${nextStatus} via chairside logistics board.`
    }).subscribe(() => {
      this.loadOrders();
    });
  }

  testCheckFitting(): void {
    this.labService.checkFittingEligibility(this.checkPatientId, this.checkToothNumber).subscribe(res => {
      this.eligibilityResult.set(res);
    });
  }

  open3DViewer(order: LabWorkOrder): void {
    this.selected3DOrder.set(order);
    this.show3DViewerModal.set(true);
  }
}

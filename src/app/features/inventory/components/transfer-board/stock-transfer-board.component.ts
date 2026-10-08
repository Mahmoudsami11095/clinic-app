import { Component, OnInit, signal, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StockTransferService } from '../../services/stock-transfer.service';
import { ClinicService } from '../../../../core/services/clinic.service';
import { MaterialsService } from '../../services/materials.service';
import { StockTransferRequisition, CreateStockTransferRequest } from '../../models/stock-transfer.model';
import { Material } from '../../models/material.model';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import { TranslatePipe } from '../../../../core/i18n/translate.pipe';

@Component({
  selector: 'app-stock-transfer-board',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent, StatusBadgeComponent, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-6 font-cairo animate-fade-in p-2 sm:p-4">
      
      <!-- Top Action Bar -->
      <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-700 shadow-xs">
        <div class="space-y-1">
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-teal-50 dark:bg-teal-500/10 text-teal-700 dark:text-teal-300 border border-teal-200/80 dark:border-teal-500/20">
            <i class="pi pi-arrows-h"></i>
            <span>{{ 'transfers.badge' | translate }}</span>
          </div>
          <h2 class="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">{{ 'transfers.title' | translate }}</h2>
          <p class="text-xs text-slate-500 dark:text-slate-400">{{ 'transfers.subtitle' | translate }}</p>
        </div>

        <div class="flex items-center gap-3">
          <button
            type="button"
            (click)="loadTransfers()"
            class="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer bg-transparent"
            [title]="'transfers.refresh' | translate"
          >
            <i class="pi pi-refresh" [class.animate-spin]="loading()"></i>
          </button>

          <button
            type="button"
            (click)="openRequestModal()"
            class="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-2 cursor-pointer border-none"
          >
            <i class="pi pi-plus"></i>
            <span>{{ 'transfers.new_requisition' | translate }}</span>
          </button>
        </div>
      </div>

      <!-- Governance & Logistics Safety Notice -->
      <div class="bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200/80 dark:border-indigo-800/50 rounded-2xl p-4 flex items-start gap-3 text-indigo-950 dark:text-indigo-200 text-xs">
        <div class="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
          <i class="pi pi-shield"></i>
        </div>
        <div class="space-y-0.5">
          <h4 class="font-bold">{{ 'transfers.governance_title' | translate }}</h4>
          <p class="text-indigo-800 dark:text-indigo-300 leading-relaxed">{{ 'transfers.governance_desc' | translate }}</p>
        </div>
      </div>

      <!-- Tab Switcher -->
      <div class="flex items-center gap-2 border-b border-slate-200 dark:border-slate-700 overflow-x-auto pb-1">
        <button
          type="button"
          (click)="selectedTab.set('all')"
          [class.border-teal-600]="selectedTab() === 'all'"
          [class.text-teal-700]="selectedTab() === 'all'"
          [class.font-bold]="selectedTab() === 'all'"
          class="px-4 py-2.5 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border-b-2 border-transparent transition-all whitespace-nowrap cursor-pointer bg-transparent flex items-center gap-2"
        >
          <span>{{ 'transfers.tab_all' | translate }}</span>
          <span class="px-2 py-0.5 rounded-full text-2xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">{{ transfers().length }}</span>
        </button>

        <button
          type="button"
          (click)="selectedTab.set('inbound')"
          [class.border-teal-600]="selectedTab() === 'inbound'"
          [class.text-teal-700]="selectedTab() === 'inbound'"
          [class.font-bold]="selectedTab() === 'inbound'"
          class="px-4 py-2.5 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border-b-2 border-transparent transition-all whitespace-nowrap cursor-pointer bg-transparent flex items-center gap-2"
        >
          <i class="pi pi-arrow-down-left text-teal-600"></i>
          <span>{{ 'transfers.tab_inbound' | translate }}</span>
          <span class="px-2 py-0.5 rounded-full text-2xs bg-teal-100 dark:bg-teal-900/40 text-teal-800 dark:text-teal-300">{{ inboundCount() }}</span>
        </button>

        <button
          type="button"
          (click)="selectedTab.set('outbound')"
          [class.border-teal-600]="selectedTab() === 'outbound'"
          [class.text-teal-700]="selectedTab() === 'outbound'"
          [class.font-bold]="selectedTab() === 'outbound'"
          class="px-4 py-2.5 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border-b-2 border-transparent transition-all whitespace-nowrap cursor-pointer bg-transparent flex items-center gap-2"
        >
          <i class="pi pi-arrow-up-right text-indigo-600"></i>
          <span>{{ 'transfers.tab_outbound' | translate }}</span>
          <span class="px-2 py-0.5 rounded-full text-2xs bg-indigo-100 dark:bg-indigo-900/40 text-indigo-800 dark:text-indigo-300">{{ outboundCount() }}</span>
        </button>
      </div>

      <!-- Transfers List Grid -->
      @if (loading()) {
        <div class="py-16 flex flex-col items-center justify-center bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700">
          <div class="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mb-3"></div>
          <span class="text-xs text-slate-500">{{ 'transfers.loading' | translate }}</span>
        </div>
      } @else if (filteredTransfers().length === 0) {
        <div class="py-16 text-center bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 space-y-3">
          <div class="w-14 h-14 bg-slate-100 dark:bg-slate-700 text-slate-400 rounded-2xl flex items-center justify-center mx-auto text-2xl">
            <i class="pi pi-inbox"></i>
          </div>
          <h3 class="text-sm font-bold text-slate-700 dark:text-slate-200">{{ 'transfers.empty_title' | translate }}</h3>
          <p class="text-xs text-slate-400 max-w-sm mx-auto">{{ 'transfers.empty_desc' | translate }}</p>
        </div>
      } @else {
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          @for (transfer of filteredTransfers(); track transfer.id) {
            <div class="bg-white dark:bg-slate-800 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-700 shadow-xs hover:border-teal-400 transition-all space-y-4">
              
              <!-- Header -->
              <div class="flex items-start justify-between gap-2">
                <div>
                  <span class="font-mono text-xs font-bold text-teal-700 dark:text-teal-400 block">{{ transfer.requisitionNumber }}</span>
                  <span class="text-2xs text-slate-400">{{ transfer.requestedAt | date:'short' }}</span>
                </div>

                <div class="flex items-center gap-1.5">
                  <!-- Priority badge -->
                  @if (transfer.priority === 'Emergency') {
                    <span class="px-2 py-0.5 rounded-full text-2xs font-bold bg-rose-100 text-rose-700 border border-rose-200">{{ transfer.priority }}</span>
                  } @else if (transfer.priority === 'Urgent') {
                    <span class="px-2 py-0.5 rounded-full text-2xs font-bold bg-amber-100 text-amber-700 border border-amber-200">{{ transfer.priority }}</span>
                  }

                  <!-- Status badge -->
                  <app-status-badge
                    [status]="transfer.status"
                    type="transfer"
                    [pulse]="transfer.status === 'InTransit'"
                  ></app-status-badge>
                </div>
              </div>

              <!-- Requisition Info -->
              <div class="space-y-1.5 text-xs">
                <div class="font-bold text-slate-900 dark:text-white text-sm">{{ transfer.materialName }}</div>
                <div class="flex items-center justify-between text-slate-500 dark:text-slate-400">
                  <span>{{ 'transfers.quantity_req' | translate }}:</span>
                  <span class="font-bold text-slate-800 dark:text-slate-200 font-mono">{{ transfer.quantityRequested }} units</span>
                </div>
                
                @if (transfer.quantityDispatched) {
                  <div class="flex items-center justify-between text-slate-500 dark:text-slate-400">
                    <span>{{ 'transfers.quantity_disp' | translate }}:</span>
                    <span class="font-semibold text-indigo-600 dark:text-indigo-400 font-mono">{{ transfer.quantityDispatched }} units</span>
                  </div>
                }

                @if (transfer.quantityDamaged > 0) {
                  <div class="flex items-center justify-between text-rose-600 font-semibold text-2xs">
                    <span>{{ 'transfers.damaged_units' | translate }}:</span>
                    <span class="font-mono">{{ transfer.quantityDamaged }} units ({{ transfer.damageReason }})</span>
                  </div>
                }
              </div>

              <!-- Route Origin / Destination -->
              <div class="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-700 text-2xs space-y-1">
                <div class="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                  <i class="pi pi-arrow-circle-right text-indigo-500"></i>
                  <span class="font-semibold">{{ 'transfers.from' | translate }}:</span>
                  <span class="truncate">{{ transfer.sourceClinicName }}</span>
                </div>
                <div class="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                  <i class="pi pi-map-marker text-teal-500"></i>
                  <span class="font-semibold">{{ 'transfers.to' | translate }}:</span>
                  <span class="truncate">{{ transfer.destinationClinicName }}</span>
                </div>
              </div>

              <!-- Actions depending on status and active clinic -->
              <div class="pt-2 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-700">
                @if (transfer.status === 'Requested') {
                  <button
                    type="button"
                    (click)="openDispatchModal(transfer)"
                    class="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-colors cursor-pointer border-none flex items-center gap-1.5 shadow-2xs"
                  >
                    <i class="pi pi-send text-2xs"></i>
                    <span>{{ 'transfers.dispatch_btn' | translate }}</span>
                  </button>
                }

                @if (transfer.status === 'InTransit') {
                  <button
                    type="button"
                    (click)="openReceiveModal(transfer)"
                    class="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors cursor-pointer border-none flex items-center gap-1.5 shadow-2xs"
                  >
                    <i class="pi pi-check text-2xs"></i>
                    <span>{{ 'transfers.receive_btn' | translate }}</span>
                  </button>
                }
              </div>

            </div>
          }
        </div>
      }

      <!-- MODAL 1: New Stock Transfer Requisition (Reusing app-modal) -->
      <app-modal
        [isOpen]="isRequestModalOpen()"
        [title]="'transfers.modal_req_title' | translate"
        (close)="isRequestModalOpen.set(false)"
      >
        <div class="space-y-4 text-xs">
          <div>
            <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">{{ 'transfers.source_clinic' | translate }} *</label>
            <select [(ngModel)]="reqModel.sourceClinicId" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white">
              @for (clinic of clinicService.clinics(); track clinic.id) {
                <option [value]="clinic.id">{{ clinic.name }}</option>
              }
            </select>
          </div>

          <div>
            <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">{{ 'transfers.dest_clinic' | translate }} *</label>
            <select [(ngModel)]="reqModel.destinationClinicId" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white">
              @for (clinic of clinicService.clinics(); track clinic.id) {
                <option [value]="clinic.id">{{ clinic.name }}</option>
              }
            </select>
          </div>

          <div>
            <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">{{ 'transfers.select_material' | translate }} *</label>
            <select [(ngModel)]="reqModel.materialId" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white">
              @for (mat of materialsList(); track mat.id) {
                <option [value]="mat.id">{{ mat.name }} ({{ mat.quantity }} in stock)</option>
              }
            </select>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">{{ 'transfers.quantity' | translate }} *</label>
              <input type="number" min="1" [(ngModel)]="reqModel.quantityRequested" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-mono" />
            </div>
            <div>
              <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">{{ 'transfers.priority' | translate }}</label>
              <select [(ngModel)]="reqModel.priority" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white">
                <option value="Normal">Normal</option>
                <option value="Urgent">Urgent</option>
                <option value="Emergency">Emergency</option>
              </select>
            </div>
          </div>

          <div>
            <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">{{ 'transfers.notes' | translate }}</label>
            <input type="text" [(ngModel)]="reqModel.notes" placeholder="e.g. Needed for implant surgery" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white" />
          </div>

          <div class="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button type="button" (click)="isRequestModalOpen.set(false)" class="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold cursor-pointer bg-transparent">
              {{ 'common.cancel' | translate }}
            </button>
            <button type="button" (click)="submitTransferRequest()" [disabled]="!isRequestValid()" class="px-6 py-2.5 rounded-xl bg-teal-600 text-white text-xs font-bold hover:bg-teal-700 transition-colors cursor-pointer border-none disabled:opacity-50 shadow-xs">
              {{ 'transfers.submit_request' | translate }}
            </button>
          </div>
        </div>
      </app-modal>

      <!-- MODAL 2: Physical Inspection & Receive Shipment (BR-LOG-02) (Reusing app-modal) -->
      <app-modal
        [isOpen]="isReceiveModalOpen()"
        [title]="'transfers.receive_modal_title' | translate"
        (close)="isReceiveModalOpen.set(false)"
      >
        <div class="space-y-4 text-xs">
          <div class="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-2xl space-y-1 border border-slate-200/60 dark:border-slate-700">
            <span class="text-2xs text-slate-400 block">{{ 'transfers.incoming_shipment' | translate }}</span>
            <span class="font-bold text-slate-800 dark:text-slate-200 block text-sm">{{ selectedTransfer()?.materialName }}</span>
            <span class="text-2xs text-teal-600 font-mono font-semibold">{{ selectedTransfer()?.quantityDispatched }} units dispatched</span>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">{{ 'transfers.received_qty' | translate }} *</label>
              <input type="number" min="0" [(ngModel)]="receiveModel.quantityReceived" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-mono" />
            </div>
            <div>
              <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">{{ 'transfers.damaged_qty' | translate }}</label>
              <input type="number" min="0" [(ngModel)]="receiveModel.quantityDamaged" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-mono" />
            </div>
          </div>

          @if (receiveModel.quantityDamaged > 0) {
            <div>
              <label class="block font-semibold text-rose-600 mb-1.5">{{ 'transfers.damage_reason' | translate }} *</label>
              <select [(ngModel)]="receiveModel.damageReason" class="w-full px-3.5 py-2.5 rounded-xl border border-rose-300 bg-white dark:bg-slate-700 text-slate-900 dark:text-white">
                <option value="BrokenSeal">Broken Seal / Packaging Damaged</option>
                <option value="TemperatureExcursion">Cold-Chain Temperature Excursion</option>
                <option value="MissingInTransit">Missing Items In Transit</option>
              </select>
            </div>
          }

          <div class="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button type="button" (click)="isReceiveModalOpen.set(false)" class="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold cursor-pointer bg-transparent">
              {{ 'common.cancel' | translate }}
            </button>
            <button type="button" (click)="submitReceiveShipment()" class="px-6 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors cursor-pointer border-none shadow-xs">
              {{ 'transfers.confirm_receive' | translate }}
            </button>
          </div>
        </div>
      </app-modal>

    </div>
  `
})
export class StockTransferBoardComponent implements OnInit {
  private transferService = inject(StockTransferService);
  protected clinicService = inject(ClinicService);
  private materialsService = inject(MaterialsService);

  readonly transfers = signal<StockTransferRequisition[]>([]);
  readonly materialsList = signal<Material[]>([]);
  readonly loading = signal<boolean>(true);
  readonly selectedTab = signal<'all' | 'inbound' | 'outbound'>('all');

  readonly isRequestModalOpen = signal<boolean>(false);
  readonly isReceiveModalOpen = signal<boolean>(false);
  readonly selectedTransfer = signal<StockTransferRequisition | null>(null);

  // Request Form State
  reqModel: CreateStockTransferRequest = {
    sourceClinicId: '',
    destinationClinicId: '',
    materialId: '',
    quantityRequested: 10,
    priority: 'Normal',
    notes: ''
  };

  // Receive Form State
  receiveModel = {
    quantityReceived: 0,
    quantityDamaged: 0,
    damageReason: 'BrokenSeal',
    notes: ''
  };

  readonly inboundCount = computed(() => {
    const activeId = this.clinicService.activeClinicId();
    return this.transfers().filter(t => t.destinationClinicId === activeId && t.status !== 'Received').length;
  });

  readonly outboundCount = computed(() => {
    const activeId = this.clinicService.activeClinicId();
    return this.transfers().filter(t => t.sourceClinicId === activeId && t.status === 'Requested').length;
  });

  readonly filteredTransfers = computed(() => {
    const tab = this.selectedTab();
    const all = this.transfers();
    const activeId = this.clinicService.activeClinicId();

    if (tab === 'inbound') {
      return activeId === 'all' ? all : all.filter(t => t.destinationClinicId === activeId);
    }
    if (tab === 'outbound') {
      return activeId === 'all' ? all : all.filter(t => t.sourceClinicId === activeId);
    }
    return all;
  });

  ngOnInit(): void {
    this.loadTransfers();
    this.loadMaterials();
  }

  loadTransfers(): void {
    this.loading.set(true);
    const activeId = this.clinicService.activeClinicId();
    this.transferService.getTransfers(activeId).subscribe({
      next: (data) => {
        this.transfers.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.transfers.set([]);
        this.loading.set(false);
      }
    });
  }

  loadMaterials(): void {
    const activeId = this.clinicService.activeClinicId();
    this.materialsService.getMaterials(activeId).subscribe({
      next: (res) => this.materialsList.set(res.data || []),
      error: () => this.materialsList.set([])
    });
  }

  openRequestModal(): void {
    const clinics = this.clinicService.clinics();
    this.reqModel = {
      sourceClinicId: clinics[0]?.id || '',
      destinationClinicId: clinics[1]?.id || clinics[0]?.id || '',
      materialId: this.materialsList()[0]?.id || '',
      quantityRequested: 10,
      priority: 'Normal',
      notes: ''
    };
    this.isRequestModalOpen.set(true);
  }

  isRequestValid(): boolean {
    return (
      !!this.reqModel.sourceClinicId &&
      !!this.reqModel.destinationClinicId &&
      this.reqModel.sourceClinicId !== this.reqModel.destinationClinicId &&
      !!this.reqModel.materialId &&
      this.reqModel.quantityRequested > 0
    );
  }

  submitTransferRequest(): void {
    if (!this.isRequestValid()) return;

    this.transferService.requestTransfer(this.reqModel).subscribe({
      next: () => {
        this.isRequestModalOpen.set(false);
        this.loadTransfers();
      }
    });
  }

  openDispatchModal(transfer: StockTransferRequisition): void {
    // Quick dispatch action
    const dispatchPayload = {
      quantityDispatched: transfer.quantityRequested,
      batchNumber: 'LOT-' + new Date().toISOString().substring(0, 10),
      notes: 'Dispatched via regional clinic courier'
    };

    this.transferService.dispatchTransfer(transfer.id, dispatchPayload).subscribe({
      next: () => this.loadTransfers()
    });
  }

  openReceiveModal(transfer: StockTransferRequisition): void {
    this.selectedTransfer.set(transfer);
    this.receiveModel = {
      quantityReceived: transfer.quantityDispatched || transfer.quantityRequested,
      quantityDamaged: 0,
      damageReason: 'BrokenSeal',
      notes: ''
    };
    this.isReceiveModalOpen.set(true);
  }

  submitReceiveShipment(): void {
    const trf = this.selectedTransfer();
    if (!trf) return;

    this.transferService.receiveTransfer(trf.id, this.receiveModel).subscribe({
      next: () => {
        this.isReceiveModalOpen.set(false);
        this.loadTransfers();
      }
    });
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'Requested':
        return 'bg-amber-100 text-amber-800 border border-amber-200';
      case 'Approved':
        return 'bg-blue-100 text-blue-800 border border-blue-200';
      case 'InTransit':
        return 'bg-indigo-100 text-indigo-800 border border-indigo-200';
      case 'Received':
        return 'bg-emerald-100 text-emerald-800 border border-emerald-200';
      default:
        return 'bg-slate-100 text-slate-800 border border-slate-200';
    }
  }
}

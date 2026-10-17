import { Component, OnInit, signal, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProcurementService, PurchaseOrder, Supplier } from '../../../../core/services/procurement/procurement.service';
import { MaterialsService } from '../../services/materials.service';
import { Material } from '../../models/material.model';
import { ModalComponent } from '@clinic/ui/modal/modal.component';
import { StatusBadgeComponent } from '@clinic/ui/status-badge/status-badge.component';

@Component({
  selector: 'app-purchase-order-manager',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent, StatusBadgeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './purchase-order-manager.component.html'
})
export class PurchaseOrderManagerComponent implements OnInit {
  private procurementService = inject(ProcurementService);
  private materialsService = inject(MaterialsService);

  orders = signal<PurchaseOrder[]>([]);
  suppliers = signal<Supplier[]>([]);
  materials = signal<Material[]>([]);
  
  loading = signal(false);
  
  showCreateModal = signal(false);
  isSubmitting = signal(false);

  newPo = signal<{ supplierId: string, items: { materialId: string, quantity: number, unitPrice: number }[] }>({
    supplierId: '',
    items: []
  });

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.loading.set(true);
    this.procurementService.getOrders().subscribe({
      next: (res) => this.orders.set(res.data),
      complete: () => this.loading.set(false)
    });
    
    this.procurementService.getSuppliers().subscribe(res => this.suppliers.set(res.data));
    this.materialsService.getMaterials().subscribe(res => this.materials.set(res.data));
  }

  openCreateModal() {
    this.newPo.set({ supplierId: '', items: [] });
    this.showCreateModal.set(true);
  }

  addItem() {
    this.newPo.update(p => ({
      ...p,
      items: [...p.items, { materialId: '', quantity: 1, unitPrice: 0 }]
    }));
  }

  removeItem(index: number) {
    this.newPo.update(p => {
      const newItems = [...p.items];
      newItems.splice(index, 1);
      return { ...p, items: newItems };
    });
  }

  updateItem(index: number, field: 'materialId' | 'quantity' | 'unitPrice', value: string | number) {
    this.newPo.update(p => {
      const newItems = [...p.items];
      newItems[index] = { ...newItems[index], [field]: value };
      return { ...p, items: newItems };
    });
  }

  updateSupplier(supplierId: string) {
    this.newPo.update(p => ({ ...p, supplierId }));
  }

  createDraftPO() {
    if (!this.newPo().supplierId || this.newPo().items.length === 0) return;
    
    this.isSubmitting.set(true);
    // Hardcode clinicId for now, standard practice in this phase unless we have a clinic switcher
    this.procurementService.createDraftPO({
      clinicId: 'clinic-1',
      supplierId: this.newPo().supplierId,
      items: this.newPo().items
    }).subscribe({
      next: () => {
        this.showCreateModal.set(false);
        this.loadData();
      },
      complete: () => this.isSubmitting.set(false)
    });
  }

  dispatchOrder(id: string) {
    this.procurementService.dispatchOrder(id).subscribe(() => this.loadData());
  }

  receiveOrder(id: string) {
    this.procurementService.receiveOrder(id).subscribe(() => this.loadData());
  }
}

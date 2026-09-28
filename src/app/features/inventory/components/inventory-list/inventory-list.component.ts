import { Component, OnInit, effect, DestroyRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MaterialsService } from '../../services/materials.service';
import { Material } from '../../models/material.model';
import { AuthService } from '../../../../core/auth/auth.service';
import { ClinicService } from '../../../../core/services/clinic.service';
import { TranslatePipe } from '../../../../core/i18n/translate.pipe';
import { InventoryFormComponent } from '../inventory-form/inventory-form.component';
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";

import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-inventory-list',
  standalone: true,
  imports: [CommonModule, FormsModule, InventoryFormComponent, TranslatePipe],
  templateUrl: './inventory-list.component.html',
  styleUrls: ['./inventory-list.component.scss']
})
export class InventoryListComponent implements OnInit {
  private destroyRef = inject(DestroyRef);
  private route = inject(ActivatedRoute, { optional: true });
  materials: Material[] = [];
  doctorId: string = '';
  activeClinicId: string = 'all';
  isDoctor: boolean = false;
  isAssistant: boolean = false;
  showForm: boolean = false;
  selectedMaterial: Material | null = null;
  loading: boolean = true;
  error: string = '';
  searchTerm: string = '';
  activeFilter: 'all' | 'low' | 'out' | 'healthy' = 'all';

  get lowStockCount(): number {
    return this.materials.filter(m => this.isLowStock(m)).length;
  }

  get outOfStockCount(): number {
    return this.materials.filter(m => this.isOutOfStock(m)).length;
  }

  get totalAlertCount(): number {
    return this.lowStockCount + this.outOfStockCount;
  }

  isLowStock(material: Material): boolean {
    const threshold = material.minStockAlert ?? 5;
    return material.quantity > 0 && material.quantity <= threshold;
  }

  isOutOfStock(material: Material): boolean {
    return material.quantity <= 0;
  }

  getStockStatus(material: Material): 'out' | 'low' | 'healthy' {
    if (this.isOutOfStock(material)) return 'out';
    if (this.isLowStock(material)) return 'low';
    return 'healthy';
  }

  setFilter(filter: 'all' | 'low' | 'out' | 'healthy'): void {
    this.activeFilter = filter;
  }

  get filteredMaterials(): Material[] {
    let list = this.materials;
    if (this.activeFilter === 'low') {
      list = list.filter(m => this.isLowStock(m));
    } else if (this.activeFilter === 'out') {
      list = list.filter(m => this.isOutOfStock(m));
    } else if (this.activeFilter === 'healthy') {
      list = list.filter(m => !this.isLowStock(m) && !this.isOutOfStock(m));
    }

    if (!this.searchTerm.trim()) {
      return list;
    }
    const term = this.searchTerm.toLowerCase().trim();
    return list.filter(m => m.name.toLowerCase().includes(term));
  }

  constructor(
    private materialsService: MaterialsService,
    private authService: AuthService,
    public clinicService: ClinicService
  ) {
    // Automatically reload materials when active clinic changes
    effect(() => {
      this.activeClinicId = this.clinicService.activeClinicId();
      if (this.doctorId) {
        this.loadMaterials();
      }
    });
  }

  ngOnInit(): void {
    const user = this.authService.currentUser();
    if (user) {
      if (user.role === 'doctor') {
        this.isDoctor = true;
        this.doctorId = user.doctorId || user.id;
      } else if (user.role === 'assistant') {
        this.isAssistant = true;
        this.doctorId = user.doctorId || '';
      }
    }

    if (this.authService.isUnassigned()) {
      this.error = 'Unassigned Account. You must be assigned to at least one clinic to access this data.';
      this.loading = false;
      return;
    }

    if (this.route) {
      this.route.queryParams.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
        const filter = params['filter'];
        if (filter && ['all', 'low', 'out', 'healthy'].includes(filter)) {
          this.activeFilter = filter as 'all' | 'low' | 'out' | 'healthy';
        }
      });
    }

    if (this.doctorId) {
      this.loadMaterials();
    } else {
      this.error = 'No doctor context found to load inventory.';
      this.loading = false;
    }
  }

  loadMaterials(): void {
    this.loading = true;
    this.materialsService.getByDoctor(this.doctorId, this.activeClinicId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) => {
        this.materials = res.data;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load materials.';
        this.loading = false;
        console.error(err);
      }
    });
  }

  openAddForm(): void {
    if (this.activeClinicId === 'all') {
      alert('Please select a specific clinic to add materials to.');
      return;
    }
    this.selectedMaterial = null;
    this.showForm = true;
  }

  openEditForm(material: Material): void {
    this.selectedMaterial = { ...material };
    this.showForm = true;
  }

  onClinicChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.clinicService.setActiveClinicId(select.value);
  }

  closeForm(): void {
    this.showForm = false;
    this.selectedMaterial = null;
  }

  onSaved(): void {
    this.closeForm();
    this.loadMaterials();
  }

  deleteMaterial(id: string): void {
    if (confirm('Are you sure you want to delete this material?')) {
      this.materialsService.delete(id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: () => {
          this.loadMaterials();
        },
        error: (err) => {
          console.error('Failed to delete material', err);
          alert('Failed to delete material.');
        }
      });
    }
  }
}

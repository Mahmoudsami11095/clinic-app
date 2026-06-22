import { Component, OnInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MaterialsService } from '../../services/materials.service';
import { Material } from '../../models/material.model';
import { AuthService } from '../../../../core/auth/auth.service';
import { ClinicService } from '../../../../core/services/clinic.service';
import { TranslatePipe } from '../../../../core/i18n/translate.pipe';
import { InventoryFormComponent } from '../inventory-form/inventory-form.component';

@Component({
  selector: 'app-inventory-list',
  standalone: true,
  imports: [CommonModule, FormsModule, InventoryFormComponent, TranslatePipe],
  templateUrl: './inventory-list.component.html',
  styleUrls: ['./inventory-list.component.scss']
})
export class InventoryListComponent implements OnInit {
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
        this.doctorId = user.doctorId || ''; // Assuming assistants have doctorId mapping
      }
    }

    if (this.authService.isUnassigned()) {
      this.error = 'Unassigned Account. You must be assigned to at least one clinic to access this data.';
      this.loading = false;
      return;
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
    this.materialsService.getByDoctor(this.doctorId, this.activeClinicId).subscribe({
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

  get filteredMaterials(): Material[] {
    if (!this.searchTerm.trim()) {
      return this.materials;
    }
    const term = this.searchTerm.toLowerCase().trim();
    return this.materials.filter(m => m.name.toLowerCase().includes(term));
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
      this.materialsService.delete(id).subscribe({
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

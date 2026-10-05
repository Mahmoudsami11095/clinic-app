import { Component, OnInit, effect, DestroyRef, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { EquipmentService } from '../../services/equipment.service';
import { Equipment, EquipmentMaintenanceLogRequest } from '../../models/equipment.model';
import { AuthService } from '../../../../core/auth/auth.service';
import { ClinicService } from '../../../../core/services/clinic.service';
import { TranslatePipe } from '../../../../core/i18n/translate.pipe';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-equipment-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './equipment-list.component.html',
  styleUrls: ['./equipment-list.component.scss']
})
export class EquipmentListComponent implements OnInit {
  private destroyRef = inject(DestroyRef);
  private toastr = inject(ToastrService);
  private equipmentService = inject(EquipmentService);
  private authService = inject(AuthService);
  public clinicService = inject(ClinicService);

  equipmentList: Equipment[] = [];
  activeClinicId: string = 'all';
  loading: boolean = true;
  error: string = '';
  searchTerm: string = '';
  activeFilter: 'all' | 'operational' | 'maintenance' | 'repair' = 'all';
  selectedCategory: string = 'all';

  categories: string[] = [
    'Sterilization', 'Operatory', 'Handpieces', 'Curing & Lights', 'Diagnostic', 'Surgical', 'General'
  ];

  // Modals state
  isFormModalOpen = signal<boolean>(false);
  isMaintenanceModalOpen = signal<boolean>(false);
  isSubmitting = signal<boolean>(false);
  isSeeding = signal<boolean>(false);

  // Form Model
  formModel: Equipment = this.getEmptyFormModel();
  isEditMode: boolean = false;

  // Image Preview Lightbox
  previewImageUrl = signal<string | null>(null);
  previewImageTitle = signal<string>('');

  openImagePreview(url: string, title: string): void {
    this.previewImageUrl.set(url);
    this.previewImageTitle.set(title);
  }

  closeImagePreview(): void {
    this.previewImageUrl.set(null);
    this.previewImageTitle.set('');
  }

  filterCategory(category: string): void {
    this.setCategory(category);
  }

  // Maintenance Log Model
  selectedEquipmentForService: Equipment | null = null;
  serviceModel: EquipmentMaintenanceLogRequest = {
    serviceDate: new Date().toISOString().substring(0, 10),
    nextDueDate: '',
    notes: '',
    status: 'Operational',
    serviceProvider: '',
    serviceContactPhone: ''
  };

  get operationalCount(): number {
    return this.equipmentList.filter(e => e.status === 'Operational' && !e.isMaintenanceDue).length;
  }

  get maintenanceDueCount(): number {
    return this.equipmentList.filter(e => e.status === 'Maintenance Due' || e.isMaintenanceDue).length;
  }

  get inRepairCount(): number {
    return this.equipmentList.filter(e => e.status === 'In Repair' || e.status === 'Decommissioned').length;
  }

  constructor() {
    effect(() => {
      this.activeClinicId = this.clinicService.activeClinicId();
      this.loadEquipment();
    });
  }

  ngOnInit(): void {
    if (this.authService.isUnassigned()) {
      this.error = 'Unassigned Account. You must be assigned to at least one clinic to access equipment.';
      this.loading = false;
      return;
    }
  }

  loadEquipment(): void {
    this.loading = true;
    this.error = '';

    this.equipmentService.getEquipment(this.activeClinicId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.equipmentList = res.data || [];
          this.loading = false;
        },
        error: (err) => {
          this.error = 'Failed to load clinic equipment.';
          this.loading = false;
          console.error(err);
        }
      });
  }

  get filteredEquipment(): Equipment[] {
    let list = this.equipmentList;

    if (this.activeFilter === 'operational') {
      list = list.filter(e => e.status === 'Operational' && !e.isMaintenanceDue);
    } else if (this.activeFilter === 'maintenance') {
      list = list.filter(e => e.status === 'Maintenance Due' || e.isMaintenanceDue);
    } else if (this.activeFilter === 'repair') {
      list = list.filter(e => e.status === 'In Repair' || e.status === 'Decommissioned');
    }

    if (this.selectedCategory !== 'all') {
      list = list.filter(e => e.category === this.selectedCategory);
    }

    if (!this.searchTerm.trim()) {
      return list;
    }

    const term = this.searchTerm.toLowerCase().trim();
    return list.filter(e =>
      e.name.toLowerCase().includes(term) ||
      (e.serialNumber && e.serialNumber.toLowerCase().includes(term)) ||
      (e.roomOrChair && e.roomOrChair.toLowerCase().includes(term)) ||
      (e.manufacturer && e.manufacturer.toLowerCase().includes(term)) ||
      (e.modelNumber && e.modelNumber.toLowerCase().includes(term))
    );
  }

  setFilter(filter: 'all' | 'operational' | 'maintenance' | 'repair'): void {
    this.activeFilter = filter;
  }

  setCategory(category: string): void {
    this.selectedCategory = category;
  }

  openAddModal(): void {
    this.isEditMode = false;
    this.formModel = this.getEmptyFormModel();
    this.isFormModalOpen.set(true);
  }

  openEditModal(item: Equipment): void {
    this.isEditMode = true;
    this.formModel = { ...item };
    this.isFormModalOpen.set(true);
  }

  closeFormModal(): void {
    this.isFormModalOpen.set(false);
  }

  saveEquipment(): void {
    if (!this.formModel.name.trim()) {
      this.toastr.warning('Equipment name is required.');
      return;
    }

    const clinicId = this.formModel.clinicId || (this.activeClinicId !== 'all' ? this.activeClinicId : this.clinicService.allowedClinics()[0]?.id);
    if (!clinicId) {
      this.toastr.error('Please select a target clinic.');
      return;
    }
    this.formModel.clinicId = clinicId;

    this.isSubmitting.set(true);
    const request$ = this.isEditMode && this.formModel.id
      ? this.equipmentService.update(this.formModel.id, this.formModel)
      : this.equipmentService.create(this.formModel);

    request$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) => {
        this.isSubmitting.set(false);
        this.closeFormModal();
        this.toastr.success(res.message || 'Equipment saved successfully.', 'Asset Registered');
        this.loadEquipment();
      },
      error: (err) => {
        this.isSubmitting.set(false);
        const msg = err.error?.message || 'Failed to save equipment.';
        this.toastr.error(msg, 'Error');
      }
    });
  }

  deleteEquipment(item: Equipment): void {
    if (!item.id) return;
    if (!confirm(`Are you sure you want to remove "${item.name}" from equipment records?`)) return;

    this.equipmentService.delete(item.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.toastr.success('Equipment record removed.', 'Deleted');
          this.loadEquipment();
        },
        error: (err) => {
          this.toastr.error(err.error?.message || 'Failed to delete equipment.', 'Error');
        }
      });
  }

  openMaintenanceModal(item: Equipment): void {
    this.selectedEquipmentForService = item;
    this.serviceModel = {
      serviceDate: new Date().toISOString().substring(0, 10),
      nextDueDate: item.nextMaintenanceDate ? item.nextMaintenanceDate.substring(0, 10) : '',
      notes: '',
      status: 'Operational',
      serviceProvider: item.serviceProvider || '',
      serviceContactPhone: item.serviceContactPhone || ''
    };
    this.isMaintenanceModalOpen.set(true);
  }

  closeMaintenanceModal(): void {
    this.isMaintenanceModalOpen.set(false);
    this.selectedEquipmentForService = null;
  }

  saveMaintenanceLog(): void {
    if (!this.selectedEquipmentForService?.id) return;

    this.isSubmitting.set(true);
    this.equipmentService.logMaintenance(this.selectedEquipmentForService.id, this.serviceModel)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.isSubmitting.set(false);
          this.closeMaintenanceModal();
          this.toastr.success(res.message || 'Maintenance record saved.', 'Service Logged');
          this.loadEquipment();
        },
        error: (err) => {
          this.isSubmitting.set(false);
          this.toastr.error(err.error?.message || 'Failed to log maintenance.', 'Error');
        }
      });
  }

  seedDefaultEquipment(): void {
    const clinicId = this.activeClinicId !== 'all' ? this.activeClinicId : this.clinicService.allowedClinics()[0]?.id;
    if (!clinicId) {
      this.toastr.warning('Please select a specific clinic to seed standard devices.');
      return;
    }

    this.isSeeding.set(true);
    this.equipmentService.seedDefaults(clinicId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.isSeeding.set(false);
          this.toastr.success(res.message || 'Standard dental devices seeded.', 'Catalog Initialized');
          if (this.activeClinicId === 'all') {
            this.clinicService.setActiveClinicId(clinicId);
          }
          this.loadEquipment();
        },
        error: (err) => {
          this.isSeeding.set(false);
          this.toastr.error(err.error?.message || 'Failed to seed equipment.', 'Error');
        }
      });
  }

  private getEmptyFormModel(): Equipment {
    return {
      clinicId: this.activeClinicId !== 'all' ? this.activeClinicId : (this.clinicService.allowedClinics()[0]?.id || ''),
      name: '',
      category: 'Sterilization',
      status: 'Operational',
      serialNumber: '',
      modelNumber: '',
      manufacturer: '',
      roomOrChair: 'Operatory 1',
      purchaseCost: undefined,
      purchaseDate: '',
      warrantyExpiryDate: '',
      nextMaintenanceDate: '',
      maintenanceNotes: '',
      serviceProvider: '',
      serviceContactPhone: '',
      imageUrl: ''
    };
  }
}

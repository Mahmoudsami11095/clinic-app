import { Component, OnInit, effect, DestroyRef, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { MaterialsService } from '../../services/materials.service';
import { Material } from '../../models/material.model';
import { AuthService } from '../../../../core/auth/auth.service';
import { ClinicService } from '../../../../core/services/clinic.service';
import { TranslatePipe } from '../../../../core/i18n/translate.pipe';
import { InventoryFormComponent } from '../inventory-form/inventory-form.component';
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";

import { ActivatedRoute, RouterLink } from '@angular/router';

@Component({
  selector: 'app-inventory-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, InventoryFormComponent, TranslatePipe],
  templateUrl: './inventory-list.component.html',
  styleUrls: ['./inventory-list.component.scss']
})
export class InventoryListComponent implements OnInit {
  private destroyRef = inject(DestroyRef);
  private route = inject(ActivatedRoute, { optional: true });
  private toastr = inject(ToastrService);
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
  activeFilter: 'all' | 'low' | 'out' | 'healthy' | 'expired' = 'all';
  selectedCategory: string = 'all';
  isSeeding = signal<boolean>(false);

  categories: string[] = [
    'Impression', 'Restorative', 'Matrix', 'Endodontic',
    'Isolation', 'Instruments', 'Anesthesia', 'Finishing',
    'Lab', 'Burs', 'Disposables', 'Diagnostic'
  ];

  // REQ-INV-02: Supplier & Purchase Order Workflow State
  isReceiveModalOpen = signal<boolean>(false);
  selectedMaterialForShipment = signal<Material | null>(null);
  isSubmittingShipment = signal<boolean>(false);
  shipmentMaterialId: string = '';
  shipmentQty: number = 0;
  shipmentSupplier: string = '';
  shipmentPORef: string = '';
  shipmentBatch: string = '';
  shipmentExpiry: string = '';
  shipmentUnitCost: number | null = null;

  // REQ-INV-03: Bulk CSV Import State
  isBulkImportModalOpen = signal<boolean>(false);
  isImportingCsv = signal<boolean>(false);
  parsedCsvRows = signal<Partial<Material>[]>([]);
  csvParseErrors = signal<string[]>([]);
  csvFileName = signal<string>('');
  bulkTargetClinicId: string = '';

  // Image Preview Lightbox State
  previewImageUrl = signal<string | null>(null);
  previewImageTitle = signal<string>('');

  get expiredCount(): number {
    return this.materials.filter(m => this.isExpired(m)).length;
  }

  get lowStockCount(): number {
    return this.materials.filter(m => this.isLowStock(m) && !this.isExpired(m)).length;
  }

  get outOfStockCount(): number {
    return this.materials.filter(m => this.isOutOfStock(m) && !this.isExpired(m)).length;
  }

  get totalAlertCount(): number {
    return this.expiredCount + this.lowStockCount + this.outOfStockCount;
  }

  get hasDefaultMaterials(): boolean {
    return this.materials.some(m => m.isDefault);
  }

  isExpired(material: Material): boolean {
    return this.materialsService.isExpired(material);
  }

  isLowStock(material: Material): boolean {
    const threshold = material.minStockAlert ?? 5;
    return material.quantity > 0 && material.quantity <= threshold;
  }

  isOutOfStock(material: Material): boolean {
    return material.quantity <= 0;
  }

  getStockStatus(material: Material): 'expired' | 'out' | 'low' | 'healthy' {
    if (this.isExpired(material)) return 'expired';
    if (this.isOutOfStock(material)) return 'out';
    if (this.isLowStock(material)) return 'low';
    return 'healthy';
  }

  setFilter(filter: 'all' | 'low' | 'out' | 'healthy' | 'expired'): void {
    this.activeFilter = filter;
  }

  setCategory(category: string): void {
    this.selectedCategory = category;
  }

  get filteredMaterials(): Material[] {
    let list = this.materials;

    if (this.activeFilter === 'expired') {
      list = list.filter(m => this.isExpired(m));
    } else if (this.activeFilter === 'low') {
      list = list.filter(m => this.isLowStock(m));
    } else if (this.activeFilter === 'out') {
      list = list.filter(m => this.isOutOfStock(m));
    } else if (this.activeFilter === 'healthy') {
      list = list.filter(m => !this.isLowStock(m) && !this.isOutOfStock(m) && !this.isExpired(m));
    }

    if (this.selectedCategory !== 'all') {
      list = list.filter(m => m.category === this.selectedCategory);
    }

    if (!this.searchTerm.trim()) {
      return list;
    }
    const term = this.searchTerm.toLowerCase().trim();
    return list.filter(m => 
      m.name.toLowerCase().includes(term) ||
      (m.category && m.category.toLowerCase().includes(term)) ||
      (m.supplierName && m.supplierName.toLowerCase().includes(term))
    );
  }

  isAdmin: boolean = false;

  constructor(
    private materialsService: MaterialsService,
    private authService: AuthService,
    public clinicService: ClinicService
  ) {
    // Automatically reload materials when active clinic changes
    effect(() => {
      this.activeClinicId = this.clinicService.activeClinicId();
      if (this.doctorId || this.isAdmin || this.isAssistant) {
        this.loadMaterials();
      }
    });
  }

  ngOnInit(): void {
    const user = this.authService.currentUser();
    if (user) {
      if (user.role === 'admin') {
        this.isAdmin = true;
      } else if (user.role === 'doctor') {
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
        if (filter && ['all', 'low', 'out', 'healthy', 'expired'].includes(filter)) {
          this.activeFilter = filter as 'all' | 'low' | 'out' | 'healthy' | 'expired';
        }
      });
    }

    if (this.doctorId || this.isAdmin || this.isAssistant) {
      this.loadMaterials();
    } else {
      this.error = 'No doctor or clinic context found to load inventory.';
      this.loading = false;
    }
  }

  loadMaterials(): void {
    this.loading = true;
    this.error = '';

    const request$ = this.doctorId
      ? this.materialsService.getByDoctor(this.doctorId, this.activeClinicId)
      : this.materialsService.getMaterials(this.activeClinicId);

    request$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) => {
        this.materials = res.data || [];
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load materials.';
        this.loading = false;
        console.error(err);
      }
    });
  }

  seedDefaultMaterials(clinicIdToSeed?: string): void {
    const clinicId = clinicIdToSeed || (this.activeClinicId !== 'all' ? this.activeClinicId : this.clinicService.allowedClinics()[0]?.id);
    if (!clinicId) {
      this.toastr.warning('Please select a specific clinic to seed default materials.', 'Select Clinic');
      return;
    }

    this.isSeeding.set(true);
    this.materialsService.seedDefaults(clinicId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.isSeeding.set(false);
          this.toastr.success(res.message || 'Default dental materials seeded successfully.', 'Catalog Initialized');
          if (this.activeClinicId === 'all') {
            this.clinicService.setActiveClinicId(clinicId);
          }
          this.loadMaterials();
        },
        error: (err) => {
          this.isSeeding.set(false);
          const msg = err.error?.message || 'Failed to seed default materials.';
          this.toastr.error(msg, 'Seeding Failed');
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

  // REQ-INV-02: Supplier & Inward Shipment Actions
  openReceiveShipmentModal(material?: Material): void {
    if (material) {
      this.selectedMaterialForShipment.set(material);
      this.shipmentMaterialId = material.id || '';
      this.shipmentSupplier = material.supplierName && material.supplierName !== 'Dr MAHDY' ? material.supplierName : '';
      this.shipmentPORef = material.purchaseOrderRef || '';
      this.shipmentUnitCost = material.unitCost || null;
      this.shipmentBatch = material.batchNumber || '';
    } else {
      this.selectedMaterialForShipment.set(this.materials[0] || null);
      this.shipmentMaterialId = this.materials[0]?.id || '';
      this.shipmentSupplier = '';
      this.shipmentPORef = '';
      this.shipmentUnitCost = null;
      this.shipmentBatch = '';
    }
    this.shipmentQty = 0;
    this.shipmentExpiry = '';
    this.isReceiveModalOpen.set(true);
  }

  closeReceiveShipmentModal(): void {
    this.isReceiveModalOpen.set(false);
    this.selectedMaterialForShipment.set(null);
  }

  confirmInwardShipment(): void {
    if (!this.shipmentMaterialId || this.shipmentQty <= 0) {
      this.toastr.warning('Please select a material and enter a valid quantity received.');
      return;
    }

    this.isSubmittingShipment.set(true);
    this.materialsService.receiveShipment(this.shipmentMaterialId, {
      quantityReceived: Number(this.shipmentQty),
      supplierName: this.shipmentSupplier || undefined,
      purchaseOrderRef: this.shipmentPORef || undefined,
      batchNumber: this.shipmentBatch || undefined,
      expirationDate: this.shipmentExpiry || undefined,
      unitCost: this.shipmentUnitCost ? Number(this.shipmentUnitCost) : undefined
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) => {
        this.isSubmittingShipment.set(false);
        this.closeReceiveShipmentModal();
        this.toastr.success(
          `Received ${this.shipmentQty} units for ${res.data?.name || 'material'}.`,
          'Inward Shipment Recorded'
        );
        this.loadMaterials();
      },
      error: () => {
        this.isSubmittingShipment.set(false);
        this.toastr.error('Failed to record inward shipment.', 'Error');
      }
    });
  }

  // REQ-INV-03: Bulk CSV Import Handlers
  openBulkImportModal(): void {
    this.bulkTargetClinicId = this.activeClinicId !== 'all' 
      ? this.activeClinicId 
      : (this.clinicService.allowedClinics()[0]?.id || '');
    this.parsedCsvRows.set([]);
    this.csvParseErrors.set([]);
    this.csvFileName.set('');
    this.isBulkImportModalOpen.set(true);
  }

  closeBulkImportModal(): void {
    this.isBulkImportModalOpen.set(false);
    this.parsedCsvRows.set([]);
    this.csvParseErrors.set([]);
    this.csvFileName.set('');
  }

  downloadCsvTemplate(): void {
    this.materialsService.downloadCsvTemplate();
  }

  onCsvFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    const file = input.files[0];
    this.csvFileName.set(file.name);

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      this.parseCsvContent(text);
    };
    reader.readAsText(file, 'UTF-8');
    input.value = '';
  }

  parseCsvContent(text: string): void {
    const errors: string[] = [];
    const rows: Partial<Material>[] = [];

    if (!text || !text.trim()) {
      errors.push('Uploaded CSV file is empty.');
      this.csvParseErrors.set(errors);
      this.parsedCsvRows.set([]);
      return;
    }

    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
    if (lines.length < 2) {
      errors.push('CSV file must have a header row and at least one data row.');
      this.csvParseErrors.set(errors);
      this.parsedCsvRows.set([]);
      return;
    }

    // Strip optional BOM and quotes
    const cleanHeaderLine = lines[0].replace(/^\uFEFF/, '');
    const headerParts = cleanHeaderLine.split(',').map(h => h.trim().replace(/^["']|["']$/g, '').toLowerCase());

    const nameIdx = headerParts.findIndex(h => h === 'name' || h === 'item name' || h === 'material name');
    const catIdx = headerParts.findIndex(h => h === 'category');
    const qtyIdx = headerParts.findIndex(h => h === 'quantity' || h === 'qty' || h === 'stock');
    const unitIdx = headerParts.findIndex(h => h === 'unit');
    const minAlertIdx = headerParts.findIndex(h => h.includes('min') || h.includes('threshold') || h.includes('alert'));
    const costIdx = headerParts.findIndex(h => h.includes('cost') || h.includes('price'));
    const batchIdx = headerParts.findIndex(h => h.includes('batch') || h.includes('lot'));
    const expiryIdx = headerParts.findIndex(h => h.includes('exp') || h.includes('date'));
    const supplierIdx = headerParts.findIndex(h => h.includes('supplier') || h.includes('vendor'));
    const imgIdx = headerParts.findIndex(h => h.includes('image') || h.includes('photo') || h.includes('pic'));

    if (nameIdx === -1) {
      errors.push('Missing required column "Name" in CSV header.');
      this.csvParseErrors.set(errors);
      this.parsedCsvRows.set([]);
      return;
    }

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      // Regex CSV splitter handling quoted commas
      const matches = line.match(/(?:^|,)("(?:[^"]|"")*"|[^,]*)/g);
      if (!matches) continue;

      const cells = matches.map(cell => {
        let val = cell.replace(/^,/, '').trim();
        if (val.startsWith('"') && val.endsWith('"')) {
          val = val.substring(1, val.length - 1).replace(/""/g, '"');
        }
        return val.trim();
      });

      const name = cells[nameIdx] || '';
      if (!name) {
        errors.push(`Row ${i + 1}: Name is empty and was skipped.`);
        continue;
      }

      const item: Partial<Material> = {
        name,
        category: catIdx !== -1 && cells[catIdx] ? cells[catIdx] : 'General',
        quantity: qtyIdx !== -1 && !isNaN(Number(cells[qtyIdx])) ? Math.max(0, Number(cells[qtyIdx])) : 0,
        unit: unitIdx !== -1 && cells[unitIdx] ? cells[unitIdx] : 'Pieces',
        minStockAlert: minAlertIdx !== -1 && !isNaN(Number(cells[minAlertIdx])) ? Math.max(1, Number(cells[minAlertIdx])) : 5,
        unitCost: costIdx !== -1 && !isNaN(Number(cells[costIdx])) ? Number(cells[costIdx]) : undefined,
        batchNumber: batchIdx !== -1 && cells[batchIdx] ? cells[batchIdx] : undefined,
        expirationDate: expiryIdx !== -1 && cells[expiryIdx] ? cells[expiryIdx] : undefined,
        supplierName: supplierIdx !== -1 && cells[supplierIdx] ? cells[supplierIdx] : undefined,
        imageUrl: imgIdx !== -1 && cells[imgIdx] ? cells[imgIdx] : undefined
      };

      rows.push(item);
    }

    this.parsedCsvRows.set(rows);
    this.csvParseErrors.set(errors);
  }

  confirmBulkImport(): void {
    const items = this.parsedCsvRows();
    if (items.length === 0) {
      this.toastr.warning('No valid rows found to import.');
      return;
    }

    const clinicId = this.bulkTargetClinicId || (this.activeClinicId !== 'all' ? this.activeClinicId : this.clinicService.allowedClinics()[0]?.id);
    if (!clinicId) {
      this.toastr.error('Please select a target clinic for the imported items.');
      return;
    }

    this.isImportingCsv.set(true);
    this.materialsService.bulkImport(clinicId, items)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.isImportingCsv.set(false);
          this.closeBulkImportModal();
          this.toastr.success(res.message || `Successfully imported ${items.length} materials.`, 'Import Complete');
          if (this.activeClinicId === 'all') {
            this.clinicService.setActiveClinicId(clinicId);
          }
          this.loadMaterials();
        },
        error: (err) => {
          this.isImportingCsv.set(false);
          const msg = err.error?.message || 'Failed to import materials.';
          this.toastr.error(msg, 'Import Failed');
        }
      });
  }

  // Image Lightbox Handlers
  openImagePreview(url?: string, name?: string): void {
    if (url) {
      this.previewImageUrl.set(url);
      this.previewImageTitle.set(name || 'Tool / Supply Image');
    }
  }

  closeImagePreview(): void {
    this.previewImageUrl.set(null);
  }

  getMaterialImage(material: Material): string {
    if (material.imageUrl) {
      return material.imageUrl;
    }
    const cat = (material.category || '').toLowerCase();
    const name = (material.name || '').toLowerCase();

    // 1. Anesthesia & Injection tools ("بنج", syringes, needles, carpules)
    if (cat === 'anesthesia' || name.includes('بنج') || name.includes('anesthe') || name.includes('needle') || name.includes('syringe')) {
      return '/images/materials/anesthetic.jpg';
    }
    // 2. Restorative & Matrix (composites, filling, bond, strips, core)
    if (cat === 'restorative' || cat === 'matrix' || name.includes('composite') || name.includes('filling') || name.includes('resin') || name.includes('matrix')) {
      return '/images/materials/composite.jpg';
    }
    // 3. Disposables & PPE (gloves, masks, sponges, pouches, bibs)
    if (cat === 'disposables' || name.includes('glove') || name.includes('mask') || name.includes('pouch') || name.includes('sponge') || name.includes('gauze') || name.includes('shield')) {
      return '/images/materials/gloves.jpg';
    }
    // 4. Clinical Hand Instruments (forceps, mirrors, probes, pliers, tweezers, excavators, carvers, spatulas)
    if (cat === 'instruments' || name.includes('tweezer') || name.includes('probe') || name.includes('plier') || name.includes('knife') || name.includes('carver') || name.includes('spatula') || name.includes('excavator') || name.includes('forcep') || name.includes('scissor') || name.includes('handle')) {
      return '/images/materials/instruments.jpg';
    }
    // 5. Impression Materials & Trays (alginate, silicone, impression tray)
    if (cat === 'impression' || name.includes('impression') || name.includes('alginate') || name.includes('silicone') || name.includes('tray')) {
      return '/images/materials/impression.jpg';
    }
    // 6. Rotary Burs & Accessories (burs, bur holder, diamond, carbide)
    if (cat === 'burs' || name.includes('bur') || name.includes('stone') || name.includes('disc') || name.includes('polishing') || name.includes('wheel')) {
      return '/images/materials/burs.jpg';
    }
    // 7. General fallback for clinical tools
    return '/images/materials/composite.jpg';
  }
}

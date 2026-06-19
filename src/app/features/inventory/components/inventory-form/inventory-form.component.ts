import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Material } from '../../models/material.model';
import { MaterialsService } from '../../services/materials.service';

@Component({
  selector: 'app-inventory-form',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './inventory-form.component.html',
  styleUrls: ['./inventory-form.component.scss']
})
export class InventoryFormComponent implements OnInit {
  @Input() material: Material | null = null;
  @Input() doctorId: string = '';
  @Input() clinicId: string = '';
  @Output() saved = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  materialForm!: FormGroup;
  isSubmitting = false;
  error = '';

  constructor(
    private fb: FormBuilder,
    private materialsService: MaterialsService
  ) {}

  ngOnInit(): void {
    this.materialForm = this.fb.group({
      name: [this.material?.name || '', [Validators.required]],
      quantity: [this.material?.quantity || 0, [Validators.required, Validators.min(0)]],
      unit: [this.material?.unit || '']
    });
  }

  onSubmit(): void {
    if (this.materialForm.invalid) return;

    this.isSubmitting = true;
    this.error = '';

    const formValue = this.materialForm.value;
    const materialData: Material = {
      id: this.material?.id,
      doctorId: this.doctorId,
      clinicId: this.clinicId,
      name: formValue.name,
      quantity: formValue.quantity,
      unit: formValue.unit
    };

    const request$ = this.material?.id 
      ? this.materialsService.update(this.material.id, materialData)
      : this.materialsService.create(materialData);

    request$.subscribe({
      next: () => {
        this.isSubmitting = false;
        this.saved.emit();
      },
      error: (err) => {
        this.error = 'Failed to save material. Please try again.';
        this.isSubmitting = false;
        console.error(err);
      }
    });
  }

  onCancel(): void {
    this.cancelled.emit();
  }
}

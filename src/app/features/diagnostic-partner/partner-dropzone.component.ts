import { Component, OnInit, signal, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { DiagnosticPartnerService, DiagnosticRequisitionOrder, PartnerUploadResult } from '../../core/services/diagnostic-partner.service';
import { TranslatePipe } from '../../core/i18n/translate.pipe';

@Component({
  selector: 'app-partner-dropzone',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white py-10 px-4 sm:px-6 lg:px-8 font-cairo">
      <div class="max-w-3xl mx-auto space-y-6">
        
        <!-- Header -->
        <div class="text-center space-y-2">
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
            <i class="pi pi-shield"></i>
            <span>{{ 'dropzone.secure_portal' | translate }}</span>
          </div>
          <h1 class="text-3xl font-extrabold tracking-tight">{{ 'dropzone.title' | translate }}</h1>
          <p class="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto">{{ 'dropzone.subtitle' | translate }}</p>
        </div>

        <!-- Token Search Input if not loaded -->
        @if (!order() && !loading()) {
          <div class="bg-slate-800/80 border border-slate-700/80 rounded-3xl p-6 sm:p-8 backdrop-blur-md shadow-xl space-y-4">
            <h3 class="text-sm font-bold text-slate-200">{{ 'dropzone.enter_token_prompt' | translate }}</h3>
            
            <div class="flex flex-col sm:flex-row gap-3">
              <div class="relative flex-1">
                <i class="pi pi-qrcode absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"></i>
                <input
                  type="text"
                  [ngModel]="searchToken()"
                  (ngModelChange)="searchToken.set($event)"
                  placeholder="e.g. ORD-A1B2C3"
                  (keyup.enter)="resolveOrder(searchToken())"
                  class="w-full pl-10 pr-4 py-3 bg-slate-900/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-indigo-500 font-mono uppercase"
                />
              </div>

              <button
                type="button"
                [disabled]="!searchToken().trim()"
                (click)="resolveOrder(searchToken())"
                class="px-6 py-3 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-500 disabled:opacity-50 transition-colors cursor-pointer border-none flex items-center justify-center gap-2"
              >
                <i class="pi pi-search"></i>
                <span>{{ 'dropzone.lookup_btn' | translate }}</span>
              </button>
            </div>

            @if (errorMessage()) {
              <p class="text-xs text-rose-400 bg-rose-500/10 py-2 px-3 rounded-xl border border-rose-500/20">
                {{ errorMessage() }}
              </p>
            }
          </div>
        }

        <!-- Loading Spinner -->
        @if (loading()) {
          <div class="flex flex-col items-center justify-center py-16 bg-slate-800/50 rounded-3xl border border-slate-700/60 p-6 text-center">
            <div class="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3"></div>
            <p class="text-xs text-slate-300 font-medium">{{ 'dropzone.resolving' | translate }}</p>
          </div>
        }

        <!-- Success Screen -->
        @if (uploadSuccess() && uploadResult(); as res) {
          <div class="bg-slate-800/90 border border-emerald-500/30 rounded-3xl p-8 text-center space-y-4 backdrop-blur-md animate-fade-in shadow-2xl">
            <div class="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-2xl flex items-center justify-center mx-auto text-3xl">
              <i class="pi pi-check"></i>
            </div>
            <h2 class="text-2xl font-bold text-white">{{ 'dropzone.upload_complete_title' | translate }}</h2>
            <p class="text-xs text-slate-300 max-w-md mx-auto">{{ res.message }}</p>

            <div class="bg-slate-900/80 rounded-2xl p-4 text-xs space-y-2 border border-slate-700/60 max-w-md mx-auto text-start">
              <div class="flex justify-between">
                <span class="text-slate-400">{{ 'dropzone.files_linked' | translate }}:</span>
                <span class="font-bold text-emerald-400">{{ res.filesProcessed }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-slate-400">{{ 'dropzone.order_status' | translate }}:</span>
                <span class="font-bold text-indigo-300">{{ res.orderStatus }}</span>
              </div>
            </div>

            <div class="pt-4 flex justify-center gap-3">
              <button
                type="button"
                (click)="resetOrder()"
                class="px-6 py-2.5 rounded-xl bg-slate-700 text-white text-xs font-semibold hover:bg-slate-600 transition-colors border-none cursor-pointer"
              >
                {{ 'dropzone.upload_another' | translate }}
              </button>
            </div>
          </div>
        }

        <!-- Order Details & Upload Dropzone -->
        @if (order(); as ord) {
          @if (!uploadSuccess()) {
            <div class="bg-slate-800/90 border border-slate-700/80 rounded-3xl p-6 sm:p-8 backdrop-blur-md shadow-xl space-y-6 animate-fade-in">
              
              <!-- Requisition Summary Card -->
              <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-slate-700/80">
                <div>
                  <div class="flex items-center gap-2">
                    <span class="px-2.5 py-0.5 rounded-full text-xs font-bold font-mono bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      {{ ord.requisitionToken }}
                    </span>
                    <span class="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300">
                      {{ ord.serviceType }}
                    </span>
                  </div>
                  <h2 class="text-lg font-bold text-white mt-1.5">{{ ord.indications }}</h2>
                  <p class="text-xs text-slate-400 mt-0.5">{{ ord.clinicName }} • {{ ord.doctorName }}</p>
                </div>

                <div class="text-end">
                  <span class="text-2xs text-slate-400 block">{{ 'dropzone.patient_ref' | translate }}</span>
                  <span class="text-xs font-bold text-slate-200">{{ ord.patientName }}</span>
                  @if (ord.toothNumber) {
                    <span class="text-2xs text-indigo-300 block font-semibold mt-0.5">FDI Tooth #{{ ord.toothNumber }}</span>
                  }
                </div>
              </div>

              <!-- Drag & Drop Zone -->
              <div class="space-y-2">
                <label class="block text-xs font-semibold text-slate-300">{{ 'dropzone.drop_files_label' | translate }} *</label>
                
                <div
                  (dragover)="onDragOver($event)"
                  (dragleave)="onDragLeave($event)"
                  (drop)="onFileDrop($event)"
                  [class.border-indigo-500]="isDragging()"
                  [class.bg-indigo-500/10]="isDragging()"
                  class="border-2 border-dashed border-slate-600 rounded-2xl p-8 text-center cursor-pointer hover:border-slate-500 transition-all bg-slate-900/40"
                  (click)="fileInput.click()"
                >
                  <input
                    #fileInput
                    type="file"
                    multiple
                    (change)="onFileSelected($event)"
                    class="hidden"
                    accept=".pdf,.png,.jpg,.jpeg,.dcm,.stl,.obj,.zip"
                  />
                  <div class="w-12 h-12 bg-slate-800 text-indigo-400 rounded-2xl flex items-center justify-center mx-auto mb-3 text-2xl shadow-inner">
                    <i class="pi pi-cloud-upload"></i>
                  </div>
                  <p class="text-xs font-bold text-slate-200">{{ 'dropzone.drag_cta' | translate }}</p>
                  <p class="text-2xs text-slate-400 mt-1">{{ 'dropzone.supported_formats' | translate }}</p>
                </div>
              </div>

              <!-- Selected Files List -->
              @if (selectedFiles().length > 0) {
                <div class="space-y-2">
                  <span class="text-xs font-semibold text-slate-300">{{ 'dropzone.staged_files' | translate }} ({{ selectedFiles().length }}):</span>
                  <div class="space-y-1.5 max-h-40 overflow-y-auto">
                    @for (file of selectedFiles(); track file.name; let idx = $index) {
                      <div class="flex items-center justify-between py-1.5 px-3 bg-slate-900/80 rounded-xl text-xs border border-slate-700/60">
                        <span class="truncate max-w-xs font-mono text-slate-300">{{ file.name }}</span>
                        <div class="flex items-center gap-2">
                          <span class="text-2xs text-slate-500">{{ (file.size / 1024).toFixed(0) }} KB</span>
                          <button
                            type="button"
                            (click)="removeFile(idx)"
                            class="text-rose-400 hover:text-rose-300 cursor-pointer bg-transparent border-none p-1"
                          >
                            <i class="pi pi-trash text-2xs"></i>
                          </button>
                        </div>
                      </div>
                    }
                  </div>
                </div>
              }

              <!-- Technician Name & Notes Form -->
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-700/80">
                <div>
                  <label class="block text-xs font-semibold text-slate-300 mb-1.5">{{ 'dropzone.tech_name' | translate }}</label>
                  <input
                    type="text"
                    [ngModel]="technicianName()"
                    (ngModelChange)="technicianName.set($event)"
                    placeholder="e.g. Eng. Moustafa (Apex Lab)"
                    class="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/80 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label class="block text-xs font-semibold text-slate-300 mb-1.5">{{ 'dropzone.tech_notes' | translate }}</label>
                  <input
                    type="text"
                    [ngModel]="partnerNotes()"
                    (ngModelChange)="partnerNotes.set($event)"
                    placeholder="e.g. Sintered at 1500C, fit checked"
                    class="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/80 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-indigo-500"
                  />
                </div>
              </div>

              <!-- Submit Button -->
              @if (errorMessage()) {
                <p class="text-xs text-rose-400 bg-rose-500/10 py-2 px-3 rounded-xl border border-rose-500/20">
                  {{ errorMessage() }}
                </p>
              }

              <div class="pt-4 flex items-center justify-between">
                <button
                  type="button"
                  (click)="resetOrder()"
                  class="px-4 py-2.5 rounded-xl bg-slate-700/60 text-slate-300 text-xs font-semibold hover:bg-slate-700 transition-colors border-none cursor-pointer"
                >
                  <i class="pi pi-arrow-left"></i>
                  <span>{{ 'dropzone.change_order' | translate }}</span>
                </button>

                <button
                  type="button"
                  [disabled]="selectedFiles().length === 0 || isSubmitting()"
                  (click)="uploadResults()"
                  class="px-8 py-3 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md cursor-pointer border-none flex items-center gap-2"
                >
                  @if (isSubmitting()) {
                    <div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>{{ 'dropzone.uploading' | translate }}</span>
                  } @else {
                    <i class="pi pi-check"></i>
                    <span>{{ 'dropzone.submit_upload' | translate }}</span>
                  }
                </button>
              </div>

            </div>
          }
        }

      </div>
    </div>
  `
})
export class PartnerDropzoneComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private partnerService = inject(DiagnosticPartnerService);

  readonly searchToken = signal<string>('');
  readonly order = signal<DiagnosticRequisitionOrder | null>(null);
  readonly loading = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);

  readonly selectedFiles = signal<File[]>([]);
  readonly technicianName = signal<string>('');
  readonly partnerNotes = signal<string>('');
  readonly isDragging = signal<boolean>(false);

  readonly isSubmitting = signal<boolean>(false);
  readonly uploadSuccess = signal<boolean>(false);
  readonly uploadResult = signal<PartnerUploadResult | null>(null);

  ngOnInit(): void {
    const orderToken = this.route.snapshot.queryParamMap.get('order');
    if (orderToken) {
      this.searchToken.set(orderToken);
      this.resolveOrder(orderToken);
    }
  }

  resolveOrder(token: string): void {
    const cleanToken = token.trim().toUpperCase();
    if (!cleanToken) return;

    this.loading.set(true);
    this.errorMessage.set(null);

    this.partnerService.resolveOrder(cleanToken).subscribe({
      next: (ord) => {
        this.order.set(ord);
        this.loading.set(false);
      },
      error: (err) => {
        this.errorMessage.set(err.error?.message || 'Invalid or expired order token.');
        this.loading.set(false);
      }
    });
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);
  }

  onFileDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);

    if (event.dataTransfer?.files) {
      const filesArray = Array.from(event.dataTransfer.files);
      this.selectedFiles.update(current => [...current, ...filesArray]);
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      const filesArray = Array.from(input.files);
      this.selectedFiles.update(current => [...current, ...filesArray]);
    }
  }

  removeFile(index: number): void {
    this.selectedFiles.update(current => current.filter((_, i) => i !== index));
  }

  uploadResults(): void {
    const ord = this.order();
    const files = this.selectedFiles();
    if (!ord || files.length === 0) return;

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    const formData = new FormData();
    files.forEach(file => formData.append('files', file, file.name));
    if (this.technicianName()) formData.append('technicianName', this.technicianName().trim());
    if (this.partnerNotes()) formData.append('partnerNotes', this.partnerNotes().trim());

    this.partnerService.uploadOrderResults(ord.requisitionToken, formData).subscribe({
      next: (res) => {
        this.uploadResult.set(res);
        this.uploadSuccess.set(true);
        this.isSubmitting.set(false);
      },
      error: (err) => {
        this.errorMessage.set(err.error?.message || 'File upload failed. Please try again.');
        this.isSubmitting.set(false);
      }
    });
  }

  resetOrder(): void {
    this.order.set(null);
    this.searchToken.set('');
    this.selectedFiles.set([]);
    this.technicianName.set('');
    this.partnerNotes.set('');
    this.uploadSuccess.set(false);
    this.uploadResult.set(null);
    this.errorMessage.set(null);
  }
}

import { Component, OnInit, signal, computed, inject, ViewChild, ElementRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ConsentService } from '../../services/consent.service';
import { ClinicService } from '../../../../core/services/clinic.service';
import { PatientService } from '../../services/patient.service';
import { DoctorService } from '../../../doctors/services/doctor.service';
import { InformedConsentDocument, ConsentTemplate, CreateInformedConsentRequest } from '../../models/consent.model';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import { TranslatePipe } from '../../../../core/i18n/translate.pipe';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-informed-consent-manager',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent, StatusBadgeComponent, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-6 font-cairo animate-fade-in p-2 sm:p-4">
      
      <!-- Top Action Bar -->
      <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-700 shadow-xs">
        <div class="space-y-1">
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-500/20">
            <i class="pi pi-file-edit"></i>
            <span>{{ 'consent.badge' | translate }}</span>
          </div>
          <h2 class="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">{{ 'consent.title' | translate }}</h2>
          <p class="text-xs text-slate-500 dark:text-slate-400">{{ 'consent.subtitle' | translate }}</p>
        </div>

        <div class="flex items-center gap-3">
          <button
            type="button"
            (click)="loadAllData()"
            class="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer bg-transparent"
            [title]="'common.refresh' | translate"
          >
            <i class="pi pi-refresh" [class.animate-spin]="loading()"></i>
          </button>

          <button
            type="button"
            (click)="openCreateModal()"
            class="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-2 cursor-pointer border-none"
          >
            <i class="pi pi-plus"></i>
            <span>{{ 'consent.new_consent_btn' | translate }}</span>
          </button>
        </div>
      </div>

      <!-- Medico-Legal Immutability & Safety Notice (BR-CONSENT-01..04) -->
      <div class="bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200/80 dark:border-indigo-800/50 rounded-2xl p-4 flex items-start gap-3 text-indigo-950 dark:text-indigo-200 text-xs">
        <div class="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
          <i class="pi pi-shield"></i>
        </div>
        <div class="space-y-0.5">
          <h4 class="font-bold">{{ 'consent.governance_title' | translate }}</h4>
          <p class="text-indigo-800 dark:text-indigo-300 leading-relaxed">{{ 'consent.governance_desc' | translate }}</p>
        </div>
      </div>

      <!-- Consents Grid -->
      @if (loading()) {
        <div class="py-16 flex flex-col items-center justify-center bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700">
          <div class="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3"></div>
          <span class="text-xs text-slate-500">{{ 'consent.loading' | translate }}</span>
        </div>
      } @else if (consents().length === 0) {
        <div class="py-16 text-center bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 space-y-3">
          <div class="w-14 h-14 bg-slate-100 dark:bg-slate-700 text-slate-400 rounded-2xl flex items-center justify-center mx-auto text-2xl">
            <i class="pi pi-inbox"></i>
          </div>
          <h3 class="text-sm font-bold text-slate-700 dark:text-slate-200">{{ 'consent.empty_title' | translate }}</h3>
          <p class="text-xs text-slate-400 max-w-sm mx-auto">{{ 'consent.empty_desc' | translate }}</p>
        </div>
      } @else {
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          @for (doc of consents(); track doc.id) {
            <div class="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-700 shadow-xs hover:border-indigo-400 transition-all space-y-4">
              
              <div class="flex items-start justify-between gap-2">
                <div>
                  <span class="font-mono text-xs font-bold text-indigo-700 dark:text-indigo-400 block">{{ doc.documentNumber }}</span>
                  <span class="text-2xs text-slate-400">{{ doc.createdAt | date:'short' }}</span>
                </div>

                <app-status-badge [status]="doc.status" type="general"></app-status-badge>
              </div>

              <div class="space-y-1.5 text-xs">
                <div class="font-bold text-slate-900 dark:text-white text-sm">{{ doc.procedureName }}</div>
                <div class="text-slate-500 dark:text-slate-400 flex items-center justify-between text-2xs">
                  <span>{{ doc.patientName }} ({{ doc.signatoryRelationship }})</span>
                  @if (doc.toothNumber) {
                    <span class="font-bold text-teal-600">Tooth #{{ doc.toothNumber }}</span>
                  }
                </div>
                <div class="text-2xs text-slate-500">
                  <span>{{ doc.clinicName }} • {{ doc.doctorName }}</span>
                </div>
              </div>

              <!-- Risk Disclosures Pills -->
              @if (doc.clinicalRiskDisclosures.length > 0) {
                <div class="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-100 dark:border-slate-700 text-2xs space-y-1">
                  <span class="font-semibold text-slate-500 block">{{ 'consent.explained_risks' | translate }} ({{ doc.clinicalRiskDisclosures.length }}):</span>
                  <ul class="list-disc list-inside text-slate-600 dark:text-slate-400 space-y-0.5">
                    @for (risk of doc.clinicalRiskDisclosures.slice(0, 2); track risk) {
                      <li class="truncate">{{ risk }}</li>
                    }
                  </ul>
                </div>
              }

              <!-- Cryptographic Hash Badge if locked -->
              @if (doc.documentSha256Checksum) {
                <div class="p-2.5 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 text-2xs flex items-center justify-between">
                  <span class="text-emerald-700 font-semibold flex items-center gap-1">
                    <i class="pi pi-lock text-emerald-600"></i>
                    <span>SHA-256 Verified</span>
                  </span>
                  <span class="font-mono text-emerald-800 text-3xs">{{ doc.documentSha256Checksum.substring(0, 16) }}...</span>
                </div>
              }

              <!-- Action Buttons -->
              <div class="pt-2 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-700">
                @if (doc.status === 'Draft' || doc.status === 'PendingSignature') {
                  <button
                    type="button"
                    (click)="openSignModal(doc, 'patient')"
                    class="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-colors cursor-pointer border-none flex items-center gap-1.5 shadow-2xs"
                  >
                    <i class="pi pi-pencil text-2xs"></i>
                    <span>{{ 'consent.patient_sign_btn' | translate }}</span>
                  </button>
                }

                @if (doc.status === 'SignedByPatient') {
                  <button
                    type="button"
                    (click)="openSignModal(doc, 'doctor')"
                    class="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors cursor-pointer border-none flex items-center gap-1.5 shadow-2xs"
                  >
                    <i class="pi pi-check text-2xs"></i>
                    <span>{{ 'consent.countersign_btn' | translate }}</span>
                  </button>
                }

                @if (doc.status === 'ArchivedLocked') {
                  <button
                    type="button"
                    (click)="printConsentCertificate(doc)"
                    class="px-4 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 transition-colors cursor-pointer bg-white dark:bg-slate-800 flex items-center gap-1.5"
                  >
                    <i class="pi pi-print text-2xs"></i>
                    <span>{{ 'consent.print_certificate' | translate }}</span>
                  </button>
                }
              </div>

            </div>
          }
        </div>
      }

      <!-- MODAL 1: Create Consent Form -->
      <app-modal
        [isOpen]="isCreateModalOpen()"
        [title]="'consent.modal_create_title' | translate"
        (close)="isCreateModalOpen.set(false)"
      >
        <div class="space-y-4 text-xs font-cairo">
          <div>
            <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">{{ 'consent.procedure_template' | translate }} *</label>
            <select [ngModel]="selectedTemplateType" (ngModelChange)="onTemplateSelect($event)" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white">
              @for (t of templates(); track t.procedureType) {
                <option [value]="t.procedureType">{{ t.procedureName }}</option>
              }
            </select>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">{{ 'consent.patient' | translate }} *</label>
              <select [(ngModel)]="newConsent.patientId" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white">
                @for (pat of patients(); track pat.id) {
                  <option [value]="pat.id">{{ pat.firstName }} {{ pat.lastName }}</option>
                }
              </select>
            </div>

            <div>
              <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">{{ 'consent.doctor' | translate }} *</label>
              <select [(ngModel)]="newConsent.doctorId" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white">
                @for (doc of doctors(); track doc.id) {
                  <option [value]="doc.id">Dr. {{ doc.firstName }} {{ doc.lastName }}</option>
                }
              </select>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div class="sm:col-span-2">
              <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">{{ 'consent.procedure_title' | translate }} *</label>
              <input type="text" [(ngModel)]="newConsent.procedureName" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white" />
            </div>

            <div>
              <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">{{ 'consent.tooth_number' | translate }}</label>
              <input type="number" min="11" max="48" [(ngModel)]="newConsent.toothNumber" placeholder="FDI #" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-mono" />
            </div>
          </div>

          <div>
            <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">{{ 'consent.cautions' | translate }}</label>
            <input type="text" [(ngModel)]="newConsent.specialMedicalCautions" placeholder="e.g. Diabetic type 2, Aspirin 81mg" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white" />
          </div>

          <div class="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-700">
            <button type="button" (click)="isCreateModalOpen.set(false)" class="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold cursor-pointer bg-transparent">
              {{ 'common.cancel' | translate }}
            </button>
            <button type="button" (click)="submitNewConsent()" class="px-6 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition-colors cursor-pointer border-none shadow-xs">
              {{ 'consent.create_btn' | translate }}
            </button>
          </div>
        </div>
      </app-modal>

      <!-- MODAL 2: Touchscreen Signature Pad -->
      <app-modal
        [isOpen]="isSignModalOpen()"
        [title]="signModalTitle()"
        (close)="isSignModalOpen.set(false)"
      >
        <div class="space-y-4 text-xs font-cairo">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">{{ 'consent.signatory_name' | translate }} *</label>
              <input type="text" [(ngModel)]="signatoryName" placeholder="Full Legal Name" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white" />
            </div>

            @if (signatureType() === 'patient') {
              <div>
                <label class="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">{{ 'consent.relationship' | translate }}</label>
                <select [(ngModel)]="signatoryRelationship" class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white">
                  <option value="Self">Self (المريض بنفسه)</option>
                  <option value="Parent">Parent / Father / Mother (ولي الأمر)</option>
                  <option value="LegalGuardian">Legal Guardian (الوصي القانوني)</option>
                </select>
              </div>
            }
          </div>

          <!-- Touchscreen Canvas -->
          <div>
            <div class="flex items-center justify-between mb-1.5">
              <label class="font-semibold text-slate-700 dark:text-slate-300">{{ 'consent.sign_canvas_label' | translate }}</label>
              <button type="button" (click)="clearCanvas()" class="text-rose-500 hover:text-rose-600 bg-transparent border-none cursor-pointer text-2xs font-semibold">
                <i class="pi pi-trash"></i> {{ 'consent.clear_signature' | translate }}
              </button>
            </div>

            <div class="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-2xl bg-slate-50 dark:bg-slate-900/60 p-2 text-center">
              <canvas
                #sigCanvas
                width="400"
                height="150"
                class="w-full h-36 bg-white rounded-xl touch-none cursor-crosshair shadow-inner"
                (mousedown)="startDrawing($event)"
                (mousemove)="draw($event)"
                (mouseup)="stopDrawing()"
                (mouseleave)="stopDrawing()"
                (touchstart)="startTouch($event)"
                (touchmove)="drawTouch($event)"
                (touchend)="stopDrawing()"
              ></canvas>
            </div>
          </div>

          <div class="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-700">
            <button type="button" (click)="isSignModalOpen.set(false)" class="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold cursor-pointer bg-transparent">
              {{ 'common.cancel' | translate }}
            </button>
            <button type="button" (click)="confirmSignature()" [disabled]="!signatoryName.trim()" class="px-6 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition-colors cursor-pointer border-none shadow-xs disabled:opacity-50">
              {{ 'consent.save_signature_btn' | translate }}
            </button>
          </div>
        </div>
      </app-modal>

    </div>
  `
})
export class InformedConsentManagerComponent implements OnInit {
  private consentService = inject(ConsentService);
  protected clinicService = inject(ClinicService);
  private patientService = inject(PatientService);
  private doctorService = inject(DoctorService);

  @ViewChild('sigCanvas') sigCanvas?: ElementRef<HTMLCanvasElement>;

  readonly consents = signal<InformedConsentDocument[]>([]);
  readonly templates = signal<ConsentTemplate[]>([]);
  readonly patients = signal<any[]>([]);
  readonly doctors = signal<any[]>([]);
  readonly loading = signal<boolean>(true);

  readonly isCreateModalOpen = signal<boolean>(false);
  readonly isSignModalOpen = signal<boolean>(false);
  readonly selectedConsent = signal<InformedConsentDocument | null>(null);
  readonly signatureType = signal<'patient' | 'doctor'>('patient');

  selectedTemplateType: string = 'DentalImplant';
  signatoryName: string = '';
  signatoryRelationship: string = 'Self';
  private isDrawing = false;

  newConsent: CreateInformedConsentRequest = {
    clinicId: '',
    patientId: '',
    doctorId: '',
    procedureType: 'DentalImplant',
    procedureName: 'Endosseous Dental Implant Placement & Bone Augmentation',
    toothNumber: 46,
    clinicalRiskDisclosures: [],
    specialMedicalCautions: ''
  };

  readonly signModalTitle = computed(() => {
    return this.signatureType() === 'patient'
      ? 'Patient Informed Consent Touchscreen Signature'
      : 'Operating Doctor Clinical Countersignature';
  });

  ngOnInit(): void {
    this.loadAllData();
  }

  loadAllData(): void {
    this.loading.set(true);
    const activeClinicId = this.clinicService.activeClinicId();

    forkJoin({
      consents: this.consentService.getConsents(activeClinicId),
      templates: this.consentService.getTemplates(),
      patients: this.patientService.getAll(),
      doctors: this.doctorService.getAll()
    }).subscribe({
      next: (res) => {
        this.consents.set(res.consents);
        this.templates.set(res.templates);
        this.patients.set(res.patients || []);
        this.doctors.set(res.doctors || []);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  openCreateModal(): void {
    const activeId = this.clinicService.activeClinicId();
    const currentTmpl = this.templates()[0];

    this.newConsent = {
      clinicId: activeId === 'all' ? (this.clinicService.clinics()[0]?.id || '') : activeId,
      patientId: this.patients()[0]?.id || '',
      doctorId: this.doctors()[0]?.id || '',
      procedureType: currentTmpl?.procedureType || 'DentalImplant',
      procedureName: currentTmpl?.procedureName || 'Dental Implant Placement',
      toothNumber: 46,
      clinicalRiskDisclosures: currentTmpl?.standardRisks || [],
      specialMedicalCautions: ''
    };
    this.isCreateModalOpen.set(true);
  }

  onTemplateSelect(type: string): void {
    this.selectedTemplateType = type;
    const tmpl = this.templates().find(t => t.procedureType === type);
    if (tmpl) {
      this.newConsent.procedureType = tmpl.procedureType;
      this.newConsent.procedureName = tmpl.procedureName;
      this.newConsent.clinicalRiskDisclosures = [...tmpl.standardRisks];
    }
  }

  submitNewConsent(): void {
    if (!this.newConsent.clinicId || !this.newConsent.patientId || !this.newConsent.procedureName) return;

    this.consentService.createConsent(this.newConsent).subscribe({
      next: () => {
        this.isCreateModalOpen.set(false);
        this.loadAllData();
      }
    });
  }

  openSignModal(doc: InformedConsentDocument, type: 'patient' | 'doctor'): void {
    this.selectedConsent.set(doc);
    this.signatureType.set(type);
    this.signatoryName = type === 'patient' ? doc.patientName : doc.doctorName;
    this.signatoryRelationship = 'Self';
    this.isSignModalOpen.set(true);

    setTimeout(() => this.clearCanvas(), 100);
  }

  clearCanvas(): void {
    if (!this.sigCanvas) return;
    const ctx = this.sigCanvas.nativeElement.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, this.sigCanvas.nativeElement.width, this.sigCanvas.nativeElement.height);
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = '#1e1b4b';
      ctx.lineCap = 'round';
    }
  }

  startDrawing(event: MouseEvent): void {
    this.isDrawing = true;
    const ctx = this.sigCanvas?.nativeElement.getContext('2d');
    if (ctx) {
      const rect = this.sigCanvas!.nativeElement.getBoundingClientRect();
      ctx.beginPath();
      ctx.moveTo(event.clientX - rect.left, event.clientY - rect.top);
    }
  }

  draw(event: MouseEvent): void {
    if (!this.isDrawing) return;
    const ctx = this.sigCanvas?.nativeElement.getContext('2d');
    if (ctx) {
      const rect = this.sigCanvas!.nativeElement.getBoundingClientRect();
      ctx.lineTo(event.clientX - rect.left, event.clientY - rect.top);
      ctx.stroke();
    }
  }

  stopDrawing(): void {
    this.isDrawing = false;
  }

  startTouch(event: TouchEvent): void {
    event.preventDefault();
    this.isDrawing = true;
    const ctx = this.sigCanvas?.nativeElement.getContext('2d');
    if (ctx && event.touches[0]) {
      const rect = this.sigCanvas!.nativeElement.getBoundingClientRect();
      ctx.beginPath();
      ctx.moveTo(event.touches[0].clientX - rect.left, event.touches[0].clientY - rect.top);
    }
  }

  drawTouch(event: TouchEvent): void {
    event.preventDefault();
    if (!this.isDrawing) return;
    const ctx = this.sigCanvas?.nativeElement.getContext('2d');
    if (ctx && event.touches[0]) {
      const rect = this.sigCanvas!.nativeElement.getBoundingClientRect();
      ctx.lineTo(event.touches[0].clientX - rect.left, event.touches[0].clientY - rect.top);
      ctx.stroke();
    }
  }

  confirmSignature(): void {
    const doc = this.selectedConsent();
    if (!doc) return;

    const dataUrl = this.sigCanvas?.nativeElement.toDataURL() || 'data:image/png;base64,TOUCH_SIG';

    if (this.signatureType() === 'patient') {
      this.consentService.signPatient(doc.id, {
        patientSignatureBase64: dataUrl,
        signatoryName: this.signatoryName,
        signatoryRelationship: this.signatoryRelationship
      }).subscribe({
        next: () => {
          this.isSignModalOpen.set(false);
          this.loadAllData();
        }
      });
    } else {
      this.consentService.countersign(doc.id, {
        doctorSignatureBase64: dataUrl,
        doctorSyndicateNumber: 'SYN-EG-10294'
      }).subscribe({
        next: () => {
          this.isSignModalOpen.set(false);
          this.loadAllData();
        }
      });
    }
  }

  printConsentCertificate(doc: InformedConsentDocument): void {
    window.print();
  }
}

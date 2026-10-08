import { Component, input, output, effect, signal, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Clinic, ClinicQrKit } from '../../core/models/clinic.model';
import { ClinicService } from '../../core/services/clinic.service';
import { ModalComponent } from '../../shared/components/modal/modal.component';
import { TranslatePipe } from '../../core/i18n/translate.pipe';

@Component({
  selector: 'app-clinic-qr-modal',
  standalone: true,
  imports: [CommonModule, ModalComponent, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-modal
      [isOpen]="isOpen() && !!clinic()"
      [title]="('qr_kit.modal_title' | translate) + ' - ' + (clinic()?.name || '')"
      (close)="close.emit()"
    >
      <div class="space-y-6 text-center font-cairo">
        @if (loading()) {
          <div class="py-12 flex flex-col items-center justify-center">
            <div class="w-8 h-8 border-3 border-teal-500 border-t-transparent rounded-full animate-spin mb-2"></div>
            <span class="text-xs text-slate-500">{{ 'qr_kit.generating' | translate }}</span>
          </div>
        } @else if (qrKit(); as kit) {
          <!-- Printable Stand Canvas Preview -->
          <div class="border-2 border-dashed border-teal-200 rounded-3xl p-6 bg-gradient-to-b from-teal-50/40 to-slate-50 relative group">
            <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-2xs font-bold uppercase tracking-wider bg-teal-100 text-teal-800 mb-3">
              <i class="pi pi-sparkles"></i>
              <span>{{ 'qr_kit.scan_to_book' | translate }}</span>
            </div>

            <div class="w-48 h-48 mx-auto bg-white p-3 rounded-2xl shadow-sm border border-slate-200/80 mb-3 flex items-center justify-center">
              <img
                [src]="kit.qrCodeDataUrl"
                [alt]="kit.clinicName"
                class="w-full h-full object-contain"
              />
            </div>

            <h4 class="text-sm font-bold text-slate-800">{{ kit.clinicName }}</h4>
            <p class="text-2xs font-mono text-teal-700 mt-1 break-all select-all">{{ kit.bookingUrl }}</p>
          </div>

          <!-- Action Buttons -->
          <div class="grid grid-cols-2 gap-3 pt-2">
            <button
              type="button"
              (click)="copyBookingLink(kit.bookingUrl)"
              class="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors flex items-center justify-center gap-2 cursor-pointer bg-white"
            >
              <i [class]="copied() ? 'pi pi-check text-emerald-600' : 'pi pi-copy text-slate-400'"></i>
              <span>{{ copied() ? ('qr_kit.copied' | translate) : ('qr_kit.copy_link' | translate) }}</span>
            </button>

            <button
              type="button"
              (click)="printStandPoster()"
              class="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer border-none shadow-xs"
            >
              <i class="pi pi-print"></i>
              <span>{{ 'qr_kit.print_stand' | translate }}</span>
            </button>
          </div>
        }
      </div>
    </app-modal>
  `
})
export class ClinicQrModalComponent {
  private clinicService = inject(ClinicService);

  readonly clinic = input<Clinic | null>(null);
  readonly isOpen = input<boolean>(false);
  readonly close = output<void>();

  readonly qrKit = signal<ClinicQrKit | null>(null);
  readonly loading = signal<boolean>(false);
  readonly copied = signal<boolean>(false);

  constructor() {
    effect(() => {
      const isVisible = this.isOpen();
      const currentClinic = this.clinic();

      if (isVisible && currentClinic) {
        this.fetchQrKit(currentClinic.id);
      } else {
        this.qrKit.set(null);
      }
    });
  }

  fetchQrKit(clinicId: string): void {
    this.loading.set(true);
    this.clinicService.getQrCodeKit(clinicId).subscribe({
      next: (data) => {
        this.qrKit.set(data);
        this.loading.set(false);
      },
      error: () => {
        // Fallback default URL representation
        const slug = this.clinic()?.slug || clinicId;
        const bookingUrl = `https://clinic-app-ten-topaz.vercel.app/book/${slug}`;
        this.qrKit.set({
          clinicId,
          clinicName: this.clinic()?.name || 'Clinic',
          slug,
          bookingUrl,
          qrCodeDataUrl: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(bookingUrl)}`
        });
        this.loading.set(false);
      }
    });
  }

  copyBookingLink(url: string): void {
    navigator.clipboard.writeText(url).then(() => {
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2500);
    });
  }

  printStandPoster(): void {
    window.print();
  }
}

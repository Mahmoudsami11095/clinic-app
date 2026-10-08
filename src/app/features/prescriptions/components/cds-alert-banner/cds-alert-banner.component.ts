import { Component, input, model, output, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CdsEvaluationResponse, CdsAlert } from '../../models/cds.model';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import { TranslatePipe } from '../../../../core/i18n/translate.pipe';

@Component({
  selector: 'app-cds-alert-banner',
  standalone: true,
  imports: [CommonModule, FormsModule, StatusBadgeComponent, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (evaluation(); as ev) {
      <div class="space-y-3 font-cairo animate-fade-in my-3">
        
        <!-- Safe State (All Clear) -->
        @if (ev.isSafe && ev.totalAlertsCount === 0) {
          <div class="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl flex items-center justify-between text-xs text-emerald-800 dark:text-emerald-300">
            <div class="flex items-center gap-2">
              <i class="pi pi-check-circle text-emerald-600 dark:text-emerald-400 text-sm"></i>
              <span class="font-bold">{{ 'cds.safe_status' | translate }}</span>
            </div>
            <span class="text-2xs text-emerald-600 dark:text-emerald-400">{{ 'cds.zero_interactions' | translate }}</span>
          </div>
        }

        <!-- Active Alerts List -->
        @for (alert of ev.alerts; track alert.title) {
          <div
            [class]="alert.severity === 'Critical'
              ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-950 dark:text-rose-200'
              : 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-950 dark:text-amber-200'"
            class="p-4 rounded-2xl border shadow-2xs space-y-2 text-xs"
          >
            <div class="flex items-start justify-between gap-2">
              <div class="flex items-center gap-2">
                <i [class]="alert.severity === 'Critical' ? 'pi pi-exclamation-triangle text-rose-600' : 'pi pi-info-circle text-amber-600'"></i>
                <h4 class="font-bold text-sm">{{ alert.title }}</h4>
              </div>

              <app-status-badge [status]="alert.severity" type="general" [pulse]="alert.severity === 'Critical'"></app-status-badge>
            </div>

            <p class="text-xs leading-relaxed opacity-90">{{ alert.message }}</p>

            @if (alert.clinicalEffect) {
              <div class="p-2.5 rounded-xl bg-white/60 dark:bg-slate-900/40 border border-current/10 text-2xs space-y-0.5">
                <span class="font-bold uppercase tracking-wider block opacity-75">{{ 'cds.clinical_effect' | translate }}:</span>
                <span>{{ alert.clinicalEffect }}</span>
              </div>
            }

            @if (alert.suggestedAlternative) {
              <div class="flex items-center justify-between pt-1">
                <span class="text-2xs font-semibold text-emerald-700 dark:text-emerald-400">
                  <i class="pi pi-lightbulb mr-1"></i>
                  {{ 'cds.alternative_suggestion' | translate }}: <strong>{{ alert.suggestedAlternative }}</strong>
                </span>

                <button
                  type="button"
                  (click)="applyAlternative.emit(alert.suggestedAlternative)"
                  class="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-2xs font-bold transition-colors cursor-pointer border-none shadow-2xs"
                >
                  {{ 'cds.use_alternative' | translate }}
                </button>
              </div>
            }
          </div>
        }

        <!-- Critical Override Input (BR-CDS-01) -->
        @if (ev.hasCriticalAlerts) {
          <div class="p-4 bg-rose-100/60 dark:bg-rose-900/30 border border-rose-300 dark:border-rose-800 rounded-2xl space-y-2 text-xs">
            <div class="flex items-center gap-1.5 text-rose-800 dark:text-rose-300 font-bold">
              <i class="pi pi-lock"></i>
              <span>{{ 'cds.override_required_title' | translate }} (BR-CDS-01)</span>
            </div>
            <p class="text-2xs text-rose-700 dark:text-rose-300">{{ 'cds.override_required_desc' | translate }}</p>
            
            <input
              type="text"
              [ngModel]="overrideReason()"
              (ngModelChange)="overrideReason.set($event)"
              placeholder="e.g. Clinical justification for temporary concurrent therapy with close INR monitoring"
              class="w-full px-3.5 py-2 rounded-xl border border-rose-300 dark:border-rose-700 bg-white dark:bg-slate-800 text-xs text-slate-800 dark:text-white focus:outline-hidden focus:border-rose-500"
            />
          </div>
        }

      </div>
    }
  `
})
export class CdsAlertBannerComponent {
  readonly evaluation = input<CdsEvaluationResponse | null>(null);
  readonly overrideReason = model<string>('');
  readonly applyAlternative = output<string>();
}

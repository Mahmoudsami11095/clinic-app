import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OfflineService } from '../../services/offline.service';
import { TranslatePipe } from '../../i18n/translate.pipe';

@Component({
  selector: 'app-offline-banner',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  template: `
    @if (!offlineService.isOnline()) {
      <div 
        class="bg-gradient-to-r from-amber-600 via-rose-600 to-amber-700 text-white px-4 py-2 text-xs font-semibold flex items-center justify-between shadow-lg sticky top-0 z-50 animate-in slide-in-from-top duration-300"
        role="alert">
        <div class="flex items-center gap-2.5 min-w-0">
          <span class="flex h-2.5 w-2.5 relative flex-shrink-0">
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
            <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-200"></span>
          </span>
          <i class="pi pi-wifi text-sm flex-shrink-0"></i>
          <span class="truncate">
            <strong class="font-bold">{{ 'offline.title' | translate }}</strong> — {{ 'offline.description' | translate }}
          </span>
          @if (offlineService.pendingActions().length > 0) {
            <span class="px-2 py-0.5 bg-black/30 rounded-full text-[10px] font-mono">
              {{ offlineService.pendingActions().length }} {{ 'offline.changes_queued' | translate }}
            </span>
          }
        </div>

        <button 
          type="button"
          (click)="offlineService.checkConnection()"
          class="ms-3 px-2.5 py-1 bg-white/20 hover:bg-white/30 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors flex-shrink-0">
          <i class="pi pi-refresh text-[10px]"></i>
          <span>{{ 'offline.retry' | translate }}</span>
        </button>
      </div>
    } @else if (offlineService.isReconnected()) {
      <div 
        class="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-4 py-2 text-xs font-semibold flex items-center justify-between shadow-lg sticky top-0 z-50 animate-in slide-in-from-top duration-300"
        role="status">
        <div class="flex items-center gap-2">
          <i class="pi pi-check-circle text-sm"></i>
          <span>
            <strong class="font-bold">{{ 'offline.reconnected_title' | translate }}</strong> — {{ 'offline.reconnected_description' | translate }}
          </span>
        </div>
        <button 
          type="button" 
          (click)="offlineService.isReconnected.set(false)"
          class="p-1 hover:bg-white/20 rounded text-white/80 hover:text-white transition-colors">
          <i class="pi pi-times text-xs"></i>
        </button>
      </div>
    }
  `
})
export class OfflineBannerComponent {
  readonly offlineService = inject(OfflineService);
}

import { Component, computed, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoadingService } from '../../services/loading.service';

@Component({
  selector: 'app-top-progress-bar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="isLoading()" class="fixed top-0 left-0 w-full z-[9999] pointer-events-none">
      <div class="h-1 w-full bg-slate-100 dark:bg-slate-800 overflow-hidden relative">
        <div class="absolute top-0 left-0 h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 w-full animate-progress-bar origin-left"></div>
      </div>
    </div>
  `,
  styles: [`
    @keyframes progress-bar {
      0% {
        transform: translateX(-100%);
      }
      50% {
        transform: translateX(0);
      }
      100% {
        transform: translateX(100%);
      }
    }
    .animate-progress-bar {
      animation: progress-bar 1.5s infinite linear;
    }
  `]
})
export class TopProgressBarComponent {
  private loadingService = inject(LoadingService);
  isLoading = computed(() => this.loadingService.isLoading());
}

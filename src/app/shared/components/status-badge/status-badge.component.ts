import { Component, input, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

export type StatusCategory = 'general' | 'appointment' | 'chair' | 'transfer' | 'invoice' | 'inventory';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span [class]="badgeClasses()">
      @if (pulse()) {
        <span class="inline-flex w-1.5 h-1.5 rounded-full bg-current animate-pulse shrink-0"></span>
      }
      <span class="truncate">{{ status() }}</span>
    </span>
  `
})
export class StatusBadgeComponent {
  readonly status = input.required<string>();
  readonly type = input<StatusCategory>('general');
  readonly pulse = input<boolean>(false);
  readonly size = input<'xs' | 'sm' | 'md'>('sm');

  readonly badgeClasses = computed(() => {
    const rawStatus = (this.status() || '').toLowerCase().trim();
    const size = this.size();

    const sizeClass = size === 'xs'
      ? 'px-2 py-0.5 text-2xs font-semibold'
      : size === 'md'
        ? 'px-3 py-1 text-xs font-bold'
        : 'px-2.5 py-0.5 text-2xs font-bold';

    const baseClass = `inline-flex items-center gap-1.5 rounded-full border transition-all ${sizeClass}`;

    // Status color mapping
    switch (rawStatus) {
      // Success states
      case 'received':
      case 'completed':
      case 'paid':
      case 'available':
      case 'active':
      case 'confirmed':
      case 'sterilized':
        return `${baseClass} bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-800/60`;

      // Active / In-progress states
      case 'intransit':
      case 'in-transit':
      case 'in_consultation':
      case 'inprogress':
      case 'in_progress':
      case 'occupied':
      case 'approved':
        return `${baseClass} bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border-indigo-200/80 dark:border-indigo-800/60`;

      // Warning / Pending / Cleaning states
      case 'requested':
      case 'pending':
      case 'waiting':
      case 'checked_in':
      case 'cleaning':
      case 'cooling':
      case 'unpaid':
      case 'partial':
      case 'low_stock':
        return `${baseClass} bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200/80 dark:border-amber-800/60`;

      // Error / Cancelled / Maintenance states
      case 'cancelled':
      case 'canceled':
      case 'maintenance':
      case 'overdue':
      case 'failed':
      case 'expired':
      case 'emergency':
        return `${baseClass} bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200/80 dark:border-rose-800/60`;

      // Default Neutral
      default:
        return `${baseClass} bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700`;
    }
  });
}

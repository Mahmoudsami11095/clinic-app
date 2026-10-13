import { Component, OnInit, signal, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AiNoShowService, StandbyQueueEntry } from '../../../../core/services/ai-no-show/ai-no-show.service';
import { AuthService } from '../../../../core/auth/auth.service';

@Component({
  selector: 'app-standby-queue-manager',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './standby-queue-manager.component.html'
})
export class StandbyQueueManagerComponent implements OnInit {
  private aiNoShowService = inject(AiNoShowService);
  private authService = inject(AuthService);

  queue = signal<StandbyQueueEntry[]>([]);
  loading = signal(false);

  ngOnInit() {
    this.loadQueue();
  }

  loadQueue() {
    const clinicId = this.authService.currentUser()?.clinicId;
    if (!clinicId) return;

    this.loading.set(true);
    this.aiNoShowService.getStandbyQueue(clinicId).subscribe({
      next: (res) => this.queue.set(res),
      complete: () => this.loading.set(false)
    });
  }
}

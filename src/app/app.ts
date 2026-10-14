import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { TopProgressBarComponent } from './core/components/top-progress-bar/top-progress-bar.component';
import { NativeDeviceService } from './core/services/mobile/native-device.service';

@Component({
  selector: 'app-root',
  imports: [CommonModule, RouterOutlet, TopProgressBarComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('clinic-app');
  protected deviceService = inject(NativeDeviceService);
}

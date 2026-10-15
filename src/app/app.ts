import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { TopProgressBarComponent } from './core/components/top-progress-bar/top-progress-bar.component';
import { SmartAppBannerComponent } from './core/components/smart-app-banner/smart-app-banner.component';
import { NativeDeviceService } from './core/services/mobile/native-device.service';

@Component({
  selector: 'app-root',
  imports: [CommonModule, RouterOutlet, TopProgressBarComponent, SmartAppBannerComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('clinic-app');
  protected deviceService = inject(NativeDeviceService);
}

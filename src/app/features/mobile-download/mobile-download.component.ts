import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NativeDeviceService, MobilePlatform } from '../../core/services/mobile/native-device.service';
import { PwaInstallService } from '../../core/services/pwa-install.service';
import { LanguageService } from '../../core/i18n/language.service';
import { TranslatePipe } from '../../core/i18n/translate.pipe';

@Component({
  selector: 'app-mobile-download',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslatePipe],
  templateUrl: './mobile-download.component.html',
  styleUrl: './mobile-download.component.css'
})
export class MobileDownloadComponent {
  protected deviceService = inject(NativeDeviceService);
  protected pwaService = inject(PwaInstallService);
  protected languageService = inject(LanguageService);

  readonly appVersion = signal('7.0.0');
  readonly apkDownloadUrl = signal('https://github.com/Mahmoudsami11095/clinic-app/actions/runs/38545275269');
  readonly ipaDownloadUrl = signal('https://github.com/Mahmoudsami11095/clinic-app/actions/runs/38676168498');

  readonly detectedPlatform = computed<MobilePlatform>(() => this.deviceService.platform());
  readonly isIOS = computed(() => this.deviceService.isIOS());
  readonly isAndroid = computed(() => this.deviceService.isAndroid());
  readonly isDesktop = computed(() => !this.isIOS() && !this.isAndroid());

  installPwa(): void {
    this.pwaService.installPwa();
  }

  toggleLanguage(): void {
    const nextLang = this.languageService.currentLang() === 'en' ? 'ar' : 'en';
    this.languageService.setLanguage(nextLang);
  }
}

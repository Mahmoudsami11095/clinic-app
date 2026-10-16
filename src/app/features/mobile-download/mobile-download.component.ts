import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NativeDeviceService, MobilePlatform } from '../../core/services/mobile/native-device.service';
import { NativeDesktopService, DesktopPlatform } from '../../core/services/desktop/native-desktop.service';
import { PwaInstallService } from '../../core/services/pwa-install.service';
import { LanguageService } from '../../core/i18n/language.service';
import { TranslatePipe } from '../../core/i18n/translate.pipe';

export type AppHubTab = 'desktop' | 'mobile' | 'pwa';

@Component({
  selector: 'app-mobile-download',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslatePipe],
  templateUrl: './mobile-download.component.html',
  styleUrl: './mobile-download.component.css'
})
export class MobileDownloadComponent {
  protected deviceService = inject(NativeDeviceService);
  protected desktopService = inject(NativeDesktopService);
  protected pwaService = inject(PwaInstallService);
  protected languageService = inject(LanguageService);

  readonly appVersion = signal('8.0.0');

  // Desktop Artifact URLs
  readonly windowsSetupUrl = signal('https://github.com/Mahmoudsami11095/clinic-app/releases/download/v8.0.0/SmartClinic-Setup-8.0.0-x64.exe');
  readonly windowsPortableUrl = signal('https://github.com/Mahmoudsami11095/clinic-app/releases/download/v8.0.0/SmartClinic-8.0.0-x64.exe');
  readonly macDmgUrl = signal('https://github.com/Mahmoudsami11095/clinic-app/releases/download/v8.0.0/SmartClinic-8.0.0-mac-universal.dmg');
  readonly linuxAppImageUrl = signal('https://github.com/Mahmoudsami11095/clinic-app/releases/download/v8.0.0/SmartClinic-8.0.0-x64.AppImage');

  // Mobile Artifact URLs
  readonly apkDownloadUrl = signal('https://github.com/Mahmoudsami11095/clinic-app/actions/runs/38545275269');
  readonly ipaDownloadUrl = signal('https://github.com/Mahmoudsami11095/clinic-app/actions/runs/38676168498');

  readonly detectedMobilePlatform = computed<MobilePlatform>(() => this.deviceService.platform());
  readonly detectedDesktopPlatform = computed<DesktopPlatform>(() => this.desktopService.platform());

  readonly isIOS = computed(() => this.deviceService.isIOS());
  readonly isAndroid = computed(() => this.deviceService.isAndroid());
  readonly isDesktop = computed(() => !this.isIOS() && !this.isAndroid());

  readonly isWindows = computed(() => this.desktopService.isWindows());
  readonly isMacOS = computed(() => this.desktopService.isMacOS());
  readonly isLinux = computed(() => this.desktopService.isLinux());

  // Active Category Tab
  readonly activeTab = signal<AppHubTab>(!this.deviceService.isNative() && !this.isIOS() && !this.isAndroid() ? 'desktop' : 'mobile');

  selectTab(tab: AppHubTab): void {
    this.activeTab.set(tab);
  }

  installPwa(): void {
    this.pwaService.installPwa();
  }

  toggleLanguage(): void {
    const nextLang = this.languageService.currentLang() === 'en' ? 'ar' : 'en';
    this.languageService.setLanguage(nextLang);
  }

  async testThermalPrint(): Promise<void> {
    const receiptHtml = `
      <div style="font-family: monospace; width: 280px; padding: 10px; font-size: 12px;">
        <h3 style="text-align: center; margin: 0;">SMART CLINIC</h3>
        <p style="text-align: center; margin: 4px 0; font-size: 10px;">RECEIPT TEST</p>
        <hr style="border: 1px dashed #000;"/>
        <p>Date: ${new Date().toLocaleDateString()}</p>
        <p>Printer: Default 80mm ESC/POS</p>
        <p>Status: OK - Thermal Bridge Operational</p>
        <hr style="border: 1px dashed #000;"/>
      </div>
    `;
    await this.desktopService.printThermalReceipt({ htmlContent: receiptHtml });
  }
}

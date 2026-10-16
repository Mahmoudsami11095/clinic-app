import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NativeDesktopService } from '../../services/desktop/native-desktop.service';
import { LanguageService } from '../../i18n/language.service';
import { TranslatePipe } from '../../i18n/translate.pipe';

@Component({
  selector: 'app-desktop-titlebar',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './desktop-titlebar.component.html',
  styleUrl: './desktop-titlebar.component.css'
})
export class DesktopTitlebarComponent {
  protected desktopService = inject(NativeDesktopService);
  protected languageService = inject(LanguageService);

  readonly appVersion = '8.0.0';

  minimize(): void {
    this.desktopService.minimize();
  }

  maximize(): void {
    this.desktopService.maximize();
  }

  close(): void {
    this.desktopService.close();
  }
}

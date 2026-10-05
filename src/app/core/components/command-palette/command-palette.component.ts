import { Component, HostListener, inject, ElementRef, ViewChild, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CommandPaletteService } from '../../services/command-palette.service';
import { LanguageService } from '../../i18n/language.service';
import { TranslatePipe } from '../../i18n/translate.pipe';
import { CommandItem } from '../../models/command.model';

@Component({
  selector: 'app-command-palette',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  templateUrl: './command-palette.component.html',
  styleUrl: './command-palette.component.css'
})
export class CommandPaletteComponent implements AfterViewChecked {
  readonly paletteService = inject(CommandPaletteService);
  readonly languageService = inject(LanguageService);

  @ViewChild('searchInput') searchInputRef?: ElementRef<HTMLInputElement>;
  private wasOpen = false;

  ngAfterViewChecked(): void {
    if (this.paletteService.isOpen() && !this.wasOpen) {
      this.wasOpen = true;
      setTimeout(() => {
        this.searchInputRef?.nativeElement?.focus();
      }, 50);
    } else if (!this.paletteService.isOpen() && this.wasOpen) {
      this.wasOpen = false;
    }
  }

  @HostListener('window:keydown', ['$event'])
  handleGlobalShortcut(event: KeyboardEvent): void {
    const isCtrlOrCmd = event.ctrlKey || event.metaKey;

    // Ctrl + K or Cmd + K toggles palette
    if (isCtrlOrCmd && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      this.paletteService.toggle();
      return;
    }

    // When palette is open, handle navigation keys
    if (this.paletteService.isOpen()) {
      if (event.key === 'Escape') {
        event.preventDefault();
        this.paletteService.close();
      } else if (event.key === 'ArrowDown') {
        event.preventDefault();
        this.paletteService.selectNext();
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        this.paletteService.selectPrevious();
      } else if (event.key === 'Enter') {
        event.preventDefault();
        this.paletteService.executeActive();
      }
    }
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('palette-backdrop')) {
      this.paletteService.close();
    }
  }

  getItemTitle(item: CommandItem): string {
    if (this.languageService.currentLang() === 'ar' && item.titleAr) {
      return item.titleAr;
    }
    return item.title;
  }

  getCategoryLabel(category: string): string {
    const labels: Record<string, { en: string; ar: string }> = {
      navigation: { en: 'Pages & Navigation', ar: 'الصفحات والتنقل' },
      actions: { en: 'Quick Actions', ar: 'الإجراءات السريعة' },
      patients: { en: 'Patients Directory', ar: 'سجل المرضى' },
      doctors: { en: 'Doctors & Specialists', ar: 'الأطباء والاستشاريون' },
      chairs: { en: 'Operatories & Rooms', ar: 'العيادات والغرف' },
      inventory: { en: 'Inventory & Materials', ar: 'المستودع والمواد' },
      preferences: { en: 'Preferences & System', ar: 'الإعدادات والنظام' }
    };

    const isAr = this.languageService.currentLang() === 'ar';
    return isAr ? labels[category]?.ar || category : labels[category]?.en || category;
  }
}

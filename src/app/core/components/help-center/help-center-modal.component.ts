import { 
  Component, 
  inject, 
  signal, 
  computed, 
  ChangeDetectionStrategy 
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TutorialService } from '../../services/tutorial/tutorial.service';
import { LanguageService } from '../../i18n/language.service';
import { TranslatePipe } from '../../i18n/translate.pipe';
import { ModalComponent } from '../../../shared/components/modal/modal.component';
import { CheatSheetCard } from '../../services/tutorial/tutorial.model';

type HelpTab = 'page-guide' | 'cheat-sheets' | 'tours' | 'shortcuts';

@Component({
  selector: 'app-help-center-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent, TranslatePipe],
  templateUrl: './help-center-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HelpCenterModalComponent {
  protected tutorialService = inject(TutorialService);
  protected languageService = inject(LanguageService);

  readonly activeTab = signal<HelpTab>('page-guide');
  readonly searchQuery = signal('');

  readonly isArabic = computed(() => this.languageService.currentLang() === 'ar');

  readonly filteredCheatSheets = computed<CheatSheetCard[]>(() => {
    const q = this.searchQuery().trim().toLowerCase();
    const sheets = this.tutorialService.cheatSheets();
    if (!q) return sheets;

    return sheets.filter(card => {
      const titleMatch = card.title.toLowerCase().includes(q) || card.titleAr.includes(q);
      const roleMatch = card.targetRole.toLowerCase().includes(q);
      const stepMatch = card.steps.some(s => 
        s.title.toLowerCase().includes(q) || 
        s.titleAr.includes(q) || 
        s.desc.toLowerCase().includes(q) || 
        s.descAr.includes(q)
      );
      return titleMatch || roleMatch || stepMatch;
    });
  });

  setTab(tab: HelpTab) {
    this.activeTab.set(tab);
  }

  startTour(tourId: string) {
    this.tutorialService.startTour(tourId);
  }

  close() {
    this.tutorialService.closeHelpCenter();
  }
}

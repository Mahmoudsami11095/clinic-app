import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommandItem, BackendSearchResult } from '../models/command.model';
import { ThemeService } from './theme.service';
import { LanguageService } from '../i18n/language.service';
import { AuthService } from '../auth/auth.service';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CommandPaletteService {
  private router = inject(Router);
  private http = inject(HttpClient);
  private themeService = inject(ThemeService);
  private languageService = inject(LanguageService);
  private authService = inject(AuthService);

  readonly isOpen = signal(false);
  readonly query = signal('');
  readonly activeIndex = signal(0);
  readonly isSearchingBackend = signal(false);
  readonly backendResults = signal<CommandItem[]>([]);

  private searchDebounceTimer: any = null;

  // Static registered application commands
  readonly staticCommands = signal<CommandItem[]>([
    // Navigation
    {
      id: 'nav-dashboard',
      title: 'Go to Dashboard',
      titleAr: 'الانتقال إلى لوحة التحكم',
      category: 'navigation',
      icon: 'pi pi-home',
      shortcut: 'G D',
      keywords: ['home', 'overview', 'stats', 'analytics'],
      perform: () => this.navigateAndClose(['/dashboard'])
    },
    {
      id: 'nav-patients',
      title: 'Go to Patients Directory',
      titleAr: 'الانتقال إلى دليل المرضى',
      category: 'navigation',
      icon: 'pi pi-users',
      shortcut: 'G P',
      keywords: ['patients', 'records', 'clients', 'charts'],
      perform: () => this.navigateAndClose(['/patients'])
    },
    {
      id: 'nav-appointments',
      title: 'Go to Appointments Calendar',
      titleAr: 'الانتقال إلى جدول المواعيد',
      category: 'navigation',
      icon: 'pi pi-calendar',
      shortcut: 'G A',
      keywords: ['calendar', 'schedule', 'bookings', 'visits'],
      perform: () => this.navigateAndClose(['/appointments'])
    },
    {
      id: 'nav-chair-board',
      title: 'Go to Chair & Operatory Live Board',
      titleAr: 'الانتقال إلى لوحة الغرف والعيادات الفورية',
      category: 'navigation',
      icon: 'pi pi-th-large',
      badge: 'Live',
      keywords: ['chairs', 'operatory', 'rooms', 'sterilization', 'occupancy'],
      perform: () => this.navigateAndClose(['/chair-board'])
    },
    {
      id: 'nav-doctors',
      title: 'Go to Doctors Team',
      titleAr: 'الانتقال إلى الأطباء',
      category: 'navigation',
      icon: 'pi pi-user-plus',
      keywords: ['doctors', 'staff', 'practitioners', 'specialists'],
      perform: () => this.navigateAndClose(['/doctors'])
    },
    {
      id: 'nav-inventory',
      title: 'Go to Inventory & Materials',
      titleAr: 'الانتقال إلى المستودع والمواد',
      category: 'navigation',
      icon: 'pi pi-box',
      keywords: ['inventory', 'stock', 'supplies', 'materials', 'autoclave'],
      perform: () => this.navigateAndClose(['/inventory'])
    },
    {
      id: 'nav-billing',
      title: 'Go to Billing & Invoices',
      titleAr: 'الانتقال إلى الفواتير والمدفوعات',
      category: 'navigation',
      icon: 'pi pi-credit-card',
      keywords: ['billing', 'invoices', 'receipts', 'payments', 'finance'],
      perform: () => this.navigateAndClose(['/invoices'])
    },
    {
      id: 'nav-radiology',
      title: 'Go to Radiology & Scans',
      titleAr: 'الانتقال إلى الأشعة والفحوصات',
      category: 'navigation',
      icon: 'pi pi-camera',
      keywords: ['xray', 'scans', 'radiology', 'panoramic', 'cbct'],
      perform: () => this.navigateAndClose(['/radiology'])
    },
    {
      id: 'nav-profile',
      title: 'Go to My Profile & Clinic Settings',
      titleAr: 'الملف الشخصي وإعدادات العيادة',
      category: 'navigation',
      icon: 'pi pi-cog',
      keywords: ['profile', 'settings', 'account', 'security'],
      perform: () => this.navigateAndClose(['/profile'])
    },

    // Fast Actions
    {
      id: 'act-new-patient',
      title: 'Register New Patient',
      titleAr: 'تسجيل مريض جديد',
      category: 'actions',
      icon: 'pi pi-user-plus',
      shortcut: 'N P',
      keywords: ['create patient', 'add patient', 'register', 'intake'],
      perform: () => this.navigateAndClose(['/patients'], { openCreate: true })
    },
    {
      id: 'act-new-appointment',
      title: 'Book Appointment',
      titleAr: 'حجز موعد جديد',
      category: 'actions',
      icon: 'pi pi-calendar-plus',
      shortcut: 'N A',
      keywords: ['book', 'schedule', 'slot', 'new appointment'],
      perform: () => this.navigateAndClose(['/appointments'])
    },
    {
      id: 'act-view-chairs',
      title: 'View Operatory Occupancy',
      titleAr: 'عرض إشغال العيادات والغرف',
      category: 'actions',
      icon: 'pi pi-check-circle',
      keywords: ['seat patient', 'sterilization', 'room 101', 'ready'],
      perform: () => this.navigateAndClose(['/chair-board'])
    },

    // Preferences & System
    {
      id: 'pref-theme',
      title: 'Toggle Dark / Light Theme',
      titleAr: 'تبديل المظهر الداكن / الفاتح',
      category: 'preferences',
      icon: 'pi pi-moon',
      keywords: ['dark mode', 'light mode', 'theme', 'color'],
      perform: () => {
        this.themeService.toggle();
        this.close();
      }
    },
    {
      id: 'pref-lang',
      title: 'Switch Language (English / العربية)',
      titleAr: 'تغيير اللغة (English / العربية)',
      category: 'preferences',
      icon: 'pi pi-globe',
      keywords: ['arabic', 'english', 'language', 'translate', 'rtl'],
      perform: () => {
        const nextLang = this.languageService.currentLang() === 'en' ? 'ar' : 'en';
        this.languageService.setLanguage(nextLang);
        this.close();
      }
    },
    {
      id: 'pref-signout',
      title: 'Sign Out of Account',
      titleAr: 'تسجيل الخروج',
      category: 'preferences',
      icon: 'pi pi-power-off',
      keywords: ['logout', 'signout', 'exit'],
      perform: () => {
        this.authService.logout();
        this.close();
      }
    }
  ]);

  // Combined filtered commands
  readonly filteredCommands = computed(() => {
    const rawQuery = this.query().trim().toLowerCase();
    const staticList = this.staticCommands();
    const dynamicList = this.backendResults();

    if (!rawQuery) {
      return staticList;
    }

    const filteredStatic = staticList.filter(item => {
      const matchTitle = item.title.toLowerCase().includes(rawQuery);
      const matchTitleAr = item.titleAr ? item.titleAr.toLowerCase().includes(rawQuery) : false;
      const matchCategory = item.category.toLowerCase().includes(rawQuery);
      const matchKeywords = item.keywords?.some(k => k.toLowerCase().includes(rawQuery)) ?? false;
      return matchTitle || matchTitleAr || matchCategory || matchKeywords;
    });

    return [...dynamicList, ...filteredStatic];
  });

  open(): void {
    this.isOpen.set(true);
    this.query.set('');
    this.activeIndex.set(0);
    this.backendResults.set([]);
  }

  close(): void {
    this.isOpen.set(false);
    this.query.set('');
    this.activeIndex.set(0);
    this.backendResults.set([]);
  }

  toggle(): void {
    if (this.isOpen()) {
      this.close();
    } else {
      this.open();
    }
  }

  setQuery(text: string): void {
    this.query.set(text);
    this.activeIndex.set(0);

    const term = text.trim();
    if (term.length >= 2) {
      this.triggerBackendSearch(term);
    } else {
      this.backendResults.set([]);
      this.isSearchingBackend.set(false);
    }
  }

  selectNext(): void {
    const total = this.filteredCommands().length;
    if (total === 0) return;
    this.activeIndex.update(i => (i + 1) % total);
  }

  selectPrevious(): void {
    const total = this.filteredCommands().length;
    if (total === 0) return;
    this.activeIndex.update(i => (i - 1 + total) % total);
  }

  executeActive(): void {
    const commands = this.filteredCommands();
    const index = this.activeIndex();
    if (commands.length > 0 && index >= 0 && index < commands.length) {
      commands[index].perform();
    }
  }

  executeCommand(command: CommandItem): void {
    command.perform();
  }

  private navigateAndClose(route: any[], queryParams?: Record<string, any>): void {
    this.router.navigate(route, queryParams ? { queryParams } : undefined);
    this.close();
  }

  private triggerBackendSearch(term: string): void {
    if (this.searchDebounceTimer) {
      clearTimeout(this.searchDebounceTimer);
    }

    this.isSearchingBackend.set(true);

    this.searchDebounceTimer = setTimeout(() => {
      this.http.get<BackendSearchResult>(`${environment.apiUrl}/search?q=${encodeURIComponent(term)}&limit=6`)
        .subscribe({
          next: (res) => {
            const results: CommandItem[] = [];

            // Patients
            if (res.patients?.length) {
              res.patients.forEach(p => {
                results.push({
                  id: `patient-${p.id}`,
                  title: p.name,
                  titleAr: p.name,
                  category: 'patients',
                  icon: 'pi pi-user',
                  subtext: `Phone: ${p.phone}${p.gender ? ` • ${p.gender}` : ''}`,
                  badge: 'Patient',
                  perform: () => this.navigateAndClose(['/patients'])
                });
              });
            }

            // Doctors
            if (res.doctors?.length) {
              res.doctors.forEach(d => {
                results.push({
                  id: `doctor-${d.id}`,
                  title: `Dr. ${d.name}`,
                  titleAr: `د. ${d.name}`,
                  category: 'doctors',
                  icon: 'pi pi-heart',
                  subtext: `${d.specialization || 'General Practitioner'}${d.email ? ` • ${d.email}` : ''}`,
                  badge: 'Doctor',
                  perform: () => this.navigateAndClose(['/doctors'])
                });
              });
            }

            // Chairs / Operatories
            if (res.chairs?.length) {
              res.chairs.forEach(c => {
                results.push({
                  id: `chair-${c.id}`,
                  title: `${c.chairName} (Room ${c.roomNumber})`,
                  titleAr: `${c.chairName} (غرفة ${c.roomNumber})`,
                  category: 'chairs',
                  icon: 'pi pi-th-large',
                  subtext: `Status: ${c.status.toUpperCase()}`,
                  badge: c.status,
                  perform: () => this.navigateAndClose(['/chair-board'])
                });
              });
            }

            // Materials / Inventory
            if (res.materials?.length) {
              res.materials.forEach(m => {
                results.push({
                  id: `material-${m.id}`,
                  title: m.name,
                  titleAr: m.name,
                  category: 'inventory',
                  icon: 'pi pi-box',
                  subtext: `Category: ${m.category} • Qty: ${m.quantity} ${m.unit || 'units'}`,
                  badge: 'Stock',
                  perform: () => this.navigateAndClose(['/inventory'])
                });
              });
            }

            this.backendResults.set(results);
            this.isSearchingBackend.set(false);
          },
          error: () => {
            this.isSearchingBackend.set(false);
          }
        });
    }, 200);
  }
}

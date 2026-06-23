import { Component, inject, computed } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../auth/auth.service';
import { TranslatePipe } from '../../i18n/translate.pipe';
import { LayoutService } from '../layout.service';
import { PwaInstallService } from '../../services/pwa-install.service';

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive, CommonModule, TranslatePipe],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css'
})
export class Sidebar {
  protected authService = inject(AuthService);
  protected layoutService = inject(LayoutService);
  protected pwaInstallService = inject(PwaInstallService);

  private allMenuItems = [
    { labelKey: 'sidebar.dashboard', route: '/dashboard', icon: 'pi pi-home', roles: ['admin', 'doctor'] },
    { labelKey: 'sidebar.clinics', route: '/clinics', icon: 'pi pi-building', roles: ['admin', 'doctor'] },
    { labelKey: 'sidebar.patients', route: '/patients', icon: 'pi pi-users', roles: ['admin', 'doctor', 'assistant'] },
    { labelKey: 'sidebar.appointments', route: '/appointments', icon: 'pi pi-calendar', roles: ['admin', 'doctor', 'assistant', 'patient'] },
    { labelKey: 'sidebar.radiology', route: '/radiology', icon: 'pi pi-camera', roles: ['admin', 'doctor', 'assistant'] },
    { labelKey: 'sidebar.billing', route: '/billing', icon: 'pi pi-wallet', roles: ['admin', 'doctor', 'assistant', 'patient'] },
    { labelKey: 'sidebar.inventory', route: '/inventory', icon: 'pi pi-box', roles: ['admin', 'doctor', 'assistant'] },
    { labelKey: 'sidebar.doctors', route: '/doctors', icon: 'pi pi-user-plus', roles: ['admin'] },
    { labelKey: 'sidebar.profile', route: '/profile', icon: 'pi pi-user', roles: ['admin', 'doctor', 'assistant', 'patient'] },
  ];

  menuItems = computed(() => {
    const user = this.authService.currentUser();
    if (!user) return [];
    const role = user.role;
    return this.allMenuItems
      .filter(item => {
        if (item.route === '/clinics') {
          return (role === 'admin' && !user.clinicId) || role === 'doctor';
        }
        return item.roles.includes(role);
      })
      .map(item => {
        if (role === 'patient' && item.route === '/appointments') {
          return { ...item, labelKey: 'sidebar.my_portal' };
        }
        if (role === 'patient' && item.route === '/billing') {
          return { ...item, labelKey: 'sidebar.my_bills' };
        }
        return item;
      });
  });

  getAvatarInitials(name: string): string {
    if (!name) return 'U';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }
}

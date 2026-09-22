import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NavigationService } from '../../../core/services/navigation.service';
import { ThemeService } from '../../../core/services/theme.service';
import { NAV_ITEMS } from '../../../core/models/navigation.model';
import { AvatarComponent } from '../../../shared/components/avatar/avatar.component';
import { SafeHtmlPipe } from '@shared/pipes/safe-html.pipe';
import { lucideSvg } from '../../../shared/icons/lucide-icons';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, AvatarComponent, SafeHtmlPipe],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent {
  readonly navigationService = inject(NavigationService);
  private readonly themeService = inject(ThemeService);

  readonly navItems = NAV_ITEMS;
  readonly sidebarOpen = this.navigationService.sidebarOpen;
  readonly currentPage = this.navigationService.currentPage;
  readonly activeGroup = this.navigationService.activeGroup;
  readonly isDark = this.themeService.isDark;

  readonly userInitials = 'JR';
  readonly userName = 'Jessica Ruiz';
  readonly userRole = 'Lab Manager';

  readonly sidebarClasses = computed(() => `
    flex flex-col h-full bg-sidebar text-sidebar-foreground transition-all duration-300 shrink-0
    ${this.sidebarOpen() ? 'w-56' : 'w-14'}
  `);

  navItemClasses(item: { id: string }): string {
    const isActive = this.activeGroup() === item.id || (item.id === 'dashboard' && this.currentPage() === 'dashboard');
    return `
      w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors relative
      ${isActive ? 'bg-white/10 text-white' : 'text-sidebar-foreground hover:bg-white/5 hover:text-white'}
    `;
  }

  isItemActive(item: { id: string }): boolean {
    return this.activeGroup() === item.id || (item.id === 'dashboard' && this.currentPage() === 'dashboard');
  }

  getIconSvg(name: string): string {
    // Exact React parity: lucide-react v1.47.0 shapes (see shared/icons/lucide-icons.ts).
    // Sidebar nav icons render at 16px like React `<Icon size={16}>`.
    return lucideSvg(name, 16);
  }
}
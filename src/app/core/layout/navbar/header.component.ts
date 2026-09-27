import { Component, computed, inject, signal, effect } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule } from "@angular/router";
import { NavigationService } from "../../../core/services/navigation.service";
import { ThemeService } from "../../../core/services/theme.service";
import { NotificationDataService } from "../../../core/services/notification-data.service";
import { SearchInputComponent } from "../../../shared/components/search-input/search-input.component";
import { AvatarComponent } from "../../../shared/components/avatar/avatar.component";
import { IconActionButtonComponent } from "@shared/components/icon-action-button/icon-action-button.component";
import { SafeHtmlPipe } from "@shared/pipes/safe-html.pipe";
import { lucideSvg } from "../../../shared/icons/lucide-icons";

@Component({
  selector: "app-header",
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    SearchInputComponent,
    AvatarComponent,
    IconActionButtonComponent,
    SafeHtmlPipe,
  ],
  templateUrl: "./header.component.html",
  styleUrl: "./header.component.scss",
})
export class HeaderComponent {
  readonly navigationService = inject(NavigationService);
  private readonly themeService = inject(ThemeService);
  private readonly notificationService = inject(NotificationDataService);

  readonly breadcrumbs = this.navigationService.breadcrumbs;
  readonly isDark = this.themeService.isDark;
  readonly notifications = this.notificationService.recentNotifications;
  readonly unreadCount = this.notificationService.unreadCount;
  readonly currentPageLabel = computed(() => {
    const trail = this.breadcrumbs();
    return trail[trail.length - 1]?.label ?? "Dashboard";
  });

  readonly searchOpen = signal(false);
  readonly notificationsOpen = this.navigationService.notificationsOpen;
  readonly profileOpen = this.navigationService.profileOpen;

  constructor() {
    effect(() => {
      if (this.notificationsOpen() || this.profileOpen()) {
      }
    });
  }

  toggleSidebar(): void {
    this.navigationService.toggleSidebar();
  }

  toggleTheme(): void {
    this.themeService.toggle();
  }

  toggleNotifications(): void {
    this.navigationService.toggleNotifications();
  }

  toggleProfile(): void {
    this.navigationService.toggleProfile();
  }

  closeDropdowns(): void {
    this.navigationService.closeDropdowns();
  }

  navigateToNotifications(): void {
    this.navigationService.navigate("notifications");
    this.closeDropdowns();
  }

  navigateToSettings(): void {
    this.navigationService.navigate("settings");
    this.closeDropdowns();
  }

  logout(): void {
    try {
      localStorage.removeItem("dentalab-auth");
      localStorage.removeItem("dentalab-auth-token");
    } catch {}
    this.navigationService.navigate("login");
    this.closeDropdowns();
  }

  markNotificationRead(notification: any): void {
    this.notificationService.markAsRead(notification.id);
  }

  getNotificationIcon(type: string): string {
    const icons: Record<string, string> = {
      order: "package",
      workflow: "git-branch",
      file: "file-text",
      billing: "dollar-sign",
      system: "alert-circle",
      request: "refresh-ccw",
    };
    return icons[type] || "bell";
  }

  getNotificationIconSvg(type: string): string {
    const icon = this.getNotificationIcon(type);
    return this.getIconSvg(icon);
  }

  getIconSvg(name: string): string {
    const sizes: Record<string, number> = {
      menu: 20,
      "chevron-right": 16,
      search: 16,
      sun: 20,
      moon: 20,
      bell: 20,
      "chevron-down": 16,
      user: 16,
      settings: 16,
      "log-out": 16,
    };
    if (name === "dot") return lucideSvg("dot", 18);
    return lucideSvg(name, sizes[name] ?? 18);
  }
}

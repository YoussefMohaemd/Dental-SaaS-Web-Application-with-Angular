import { Component, computed, inject, signal, effect } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule } from "@angular/router";
import { NavigationService } from "../../../core/services/navigation.service";
import { ThemeService } from "../../../core/services/theme.service";
import { NotificationDataService } from "../../../core/services/notification-data.service";
import { SearchInputComponent } from "../../../shared/components/search-input/search-input.component";
import { AvatarComponent } from "../../../shared/components/avatar/avatar.component";
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
      menu: 18,
      "chevron-right": 14,
      search: 14,
      sun: 18,
      moon: 18,
      bell: 18,
      "chevron-down": 14,
      user: 14,
      settings: 14,
      "log-out": 14,
    };
    if (name === "dot") return lucideSvg("dot", 16);
    return lucideSvg(name, sizes[name] ?? 16);
  }
}

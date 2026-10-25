import { Component, computed, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule } from "@angular/router";
import { NavigationService } from "../../../core/services/navigation.service";
import { ThemeService } from "../../../core/services/theme.service";
import { AuthService } from "@core/services/auth.service";
import { AuthorizationService } from "@core/services/authorization.service";
import { NAV_ITEMS } from "../../../core/interfaces/navigation.interface";
import { AvatarComponent } from "../../../shared/components/avatar/avatar.component";
import { SafeHtmlPipe } from "@shared/pipes/safe-html.pipe";
import { lucideSvg } from "../../../shared/icons/lucide-icons";

@Component({
  selector: "app-sidebar",
  standalone: true,
  imports: [CommonModule, RouterModule, AvatarComponent, SafeHtmlPipe],
  templateUrl: "./sidebar.component.html",
  styleUrl: "./sidebar.component.scss",
})
export class SidebarComponent {
  readonly navigationService = inject(NavigationService);
  private readonly themeService = inject(ThemeService);
  private readonly authService = inject(AuthService);
  private readonly authorizationService = inject(AuthorizationService);

  readonly navItems = computed(() =>
    NAV_ITEMS.filter((item) => this.authorizationService.canAccessNav(item.id)),
  );
  readonly sidebarOpen = this.navigationService.sidebarOpen;
  readonly currentPage = this.navigationService.currentPage;
  readonly activeGroup = this.navigationService.activeGroup;
  readonly isMobile = this.navigationService.isMobile;
  readonly isDark = this.themeService.isDark;

  readonly userName = computed(
    () => this.authService.user()?.fullName?.trim() || "Account",
  );
  readonly userRole = computed(
    () => this.authService.user()?.roles?.[0] || "User",
  );

  readonly sidebarClasses = computed(() => {
    if (this.isMobile()) {
      return `fixed inset-y-0 left-0 z-50 flex h-screen w-72 max-w-[82vw] shrink-0 flex-col border-r border-border bg-background text-foreground sidebar-surface-separator transition-transform duration-300 ${
        this.sidebarOpen()
          ? "translate-x-0"
          : "-translate-x-full pointer-events-none"
      }`;
    }

    return `relative z-10 flex h-full shrink-0 flex-col border-r border-border bg-background text-foreground sidebar-surface-separator transition-all duration-300 ${
      this.sidebarOpen() ? "w-56" : "w-14"
    }`;
  });

  closeSidebarOnMobile(): void {
    if (this.isMobile()) {
      this.navigationService.setSidebarOpen(false);
    }
  }

  navItemClasses(item: { id: string }): string {
    const isActive =
      this.activeGroup() === item.id ||
      (item.id === "dashboard" && this.currentPage() === "dashboard");
    return `
      w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors relative rounded-r-lg border-l border-transparent
      ${isActive ? "bg-primary/10 text-primary border-primary" : "text-foreground hover:bg-muted hover:text-foreground"}
    `;
  }

  isItemActive(item: { id: string }): boolean {
    return (
      this.activeGroup() === item.id ||
      (item.id === "dashboard" && this.currentPage() === "dashboard")
    );
  }

  getIconSvg(name: string): string {
    return lucideSvg(name, 18);
  }
}

import { Injectable, inject, PLATFORM_ID } from "@angular/core";
import { CanActivate, Router } from "@angular/router";
import { isPlatformBrowser } from "@angular/common";
import { NavigationService } from "@core/services/navigation.service";
import { AuthService } from "@core/services/auth.service";

@Injectable({ providedIn: "root" })
export class AuthGuard implements CanActivate {
  private readonly navigationService = inject(NavigationService);
  private readonly router = inject(Router);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly authService = inject(AuthService);

  canActivate(): boolean {
    if (!isPlatformBrowser(this.platformId)) return false;
    const isAuthenticated = this.authService.isAuthenticated();
    if (!isAuthenticated) {
      this.router.navigate(["/login"]);
      return false;
    }
    return true;
  }
}

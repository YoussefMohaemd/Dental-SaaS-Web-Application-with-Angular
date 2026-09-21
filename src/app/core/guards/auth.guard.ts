import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { NavigationService } from '@core/services/navigation.service';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(
    private readonly navigationService: NavigationService,
    private readonly router: Router
  ) {}

  canActivate(): boolean {
    const isAuthenticated = !!localStorage.getItem('dentalab-auth');
    if (!isAuthenticated) {
      this.router.navigate(['/login']);
      return false;
    }
    return true;
  }
}
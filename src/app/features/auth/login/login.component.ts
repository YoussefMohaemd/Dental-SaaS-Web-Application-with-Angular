import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { InputComponent } from '../../../shared/components/input/input.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonComponent, InputComponent],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  readonly email = signal('jessica.ruiz@dentalab.com');
  readonly password = signal('••••••••••');
  readonly showPassword = signal(false);
  readonly loading = signal(false);
  readonly rememberMe = signal(true);

  readonly DENTAL_IMAGE = 'https://images.unsplash.com/photo-1562330743-fbc6ef07ca78?w=1200&h=1600&fit=crop&auto=format&q=80';

  readonly stats = [
    { label: 'Orders/month', value: '1,200+' },
    { label: 'On-time delivery', value: '98%' },
    { label: 'Partner clinics', value: '50+' }
  ];

  constructor(private readonly router: Router) {}

  async handleLogin(event: Event): Promise<void> {
    event.preventDefault();
    this.loading.set(true);
    await new Promise(resolve => setTimeout(resolve, 800));
    localStorage.setItem('dentalab-auth', 'true');
    localStorage.setItem('dentalab-auth-token', 'mock-jwt-token');
    this.router.navigate(['/dashboard']);
  }

  togglePasswordVisibility(): void {
    this.showPassword.update(v => !v);
  }

  get passwordType(): 'text' | 'password' {
    return this.showPassword() ? 'text' : 'password';
  }

  getEyeIconSvg(): string {
    if (this.showPassword()) {
      return '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>';
    }
    return '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>';
  }

  getLogoSvg(): string {
    return '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5z"></path><path d="M2 17l10 5 10-5"></path><path d="M2 12l10 5 10-5"></path></svg>';
  }
}
import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonComponent } from '../../../shared/components/button/button.component';
import { InputComponent } from '../../../shared/components/input/input.component';
import { SafeHtmlPipe } from '@shared/pipes/safe-html.pipe';
import { lucideSvg } from '../../../shared/icons/lucide-icons';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonComponent, InputComponent, SafeHtmlPipe],
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
    
    return lucideSvg(this.showPassword() ? 'eye-off' : 'eye', 15);
  }

  getMailIconSvg(): string {
    return lucideSvg('mail', 15);
  }

  getLockIconSvg(): string {
    return lucideSvg('lock', 15);
  }

  getLogoSvg(): string {
    return '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5z"></path><path d="M2 17l10 5 10-5"></path><path d="M2 12l10 5 10-5"></path></svg>';
  }
}
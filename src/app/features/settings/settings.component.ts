import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ThemeService } from '@core/services/theme.service';
import { ButtonComponent } from '@shared/components/button/button.component';

type SettingsSection = 'profile' | 'notifications' | 'appearance' | 'language' | 'security' | 'organization';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ButtonComponent],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss'
})
export class SettingsComponent {
  private readonly fb = inject(FormBuilder);
  protected readonly themeService = inject(ThemeService);

  readonly section = signal<SettingsSection>('profile');
  readonly saved = signal(false);
  readonly density = signal<'Compact' | 'Default' | 'Comfortable'>('Default');
  readonly twoFactor = signal(false);
  readonly notificationPrefs = signal({
    orderUpdates: true,
    changeRequests: true,
    billingAlerts: true,
    systemAlerts: false,
    weeklySummary: true
  });

  readonly sections: { id: SettingsSection; label: string }[] = [
    { id: 'profile', label: 'Profile' },
    { id: 'notifications', label: 'Notifications' },
    { id: 'appearance', label: 'Appearance' },
    { id: 'language', label: 'Language & Region' },
    { id: 'security', label: 'Security' },
    { id: 'organization', label: 'Organization' }
  ];

  readonly profileForm = this.fb.nonNullable.group({
    firstName: ['Jessica', Validators.required],
    lastName: ['Ruiz', Validators.required],
    email: ['jessica.ruiz@dentalab.com', [Validators.required, Validators.email]],
    role: ['Lab Manager'],
    phone: ['+1 (415) 555-0132']
  });

  readonly languageForm = this.fb.nonNullable.group({
    language: ['en'],
    timeZone: ['PST'],
    dateFormat: ['MM/DD/YYYY']
  });

  readonly organizationForm = this.fb.nonNullable.group({
    labName: ['DentaLab Systems Inc.', Validators.required],
    address: ['548 Market Street, San Francisco, CA'],
    license: ['DL-CA-2019-04821']
  });

  readonly securityForm = this.fb.nonNullable.group({
    currentPassword: [''],
    newPassword: ['', Validators.minLength(8)],
    confirmPassword: ['']
  });

  setSection(next: SettingsSection): void {
    this.section.set(next);
    this.saved.set(false);
  }

  togglePreference(key: keyof ReturnType<typeof this.notificationPrefs>): void {
    this.notificationPrefs.update(current => ({ ...current, [key]: !current[key] }));
  }

  setDensity(next: 'Compact' | 'Default' | 'Comfortable'): void {
    this.density.set(next);
  }

  toggleTwoFactor(): void {
    this.twoFactor.update(v => !v);
  }

  setAppearance(mode: 'light' | 'dark'): void {
    this.themeService.setTheme(mode);
  }

  saveChanges(): void {
    this.saved.set(true);
    window.setTimeout(() => this.saved.set(false), 2000);
  }

  preferenceEntries(): { key: 'orderUpdates' | 'changeRequests' | 'billingAlerts' | 'systemAlerts' | 'weeklySummary'; label: string; value: boolean }[] {
    const prefs = this.notificationPrefs();
    return [
      { key: 'orderUpdates', label: 'Order Status Updates', value: prefs.orderUpdates },
      { key: 'changeRequests', label: 'Change Requests', value: prefs.changeRequests },
      { key: 'billingAlerts', label: 'Billing Alerts', value: prefs.billingAlerts },
      { key: 'systemAlerts', label: 'System Alerts', value: prefs.systemAlerts },
      { key: 'weeklySummary', label: 'Weekly Summary', value: prefs.weeklySummary }
    ];
  }
}

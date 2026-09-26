import { Component, inject, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ReactiveFormsModule, FormBuilder, Validators } from "@angular/forms";
import { ThemeService } from "@core/services/theme.service";
import { AppButtonComponent } from "@shared/components/button/button.component";
import { AppTextFieldComponent } from "@shared/components/input/input.component";
import { AppSelectComponent } from "@shared/components/select/select.component";
import { SafeHtmlPipe } from "../../shared/pipes/safe-html.pipe";

type SettingsSection =
  | "profile"
  | "notifications"
  | "appearance"
  | "language"
  | "security"
  | "organization";

@Component({
  selector: "app-settings",
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    AppButtonComponent,
    AppTextFieldComponent,
    AppSelectComponent,
    SafeHtmlPipe,
  ],
  templateUrl: "./settings.component.html",
  styleUrl: "./settings.component.scss",
})
export class SettingsComponent {
  private readonly fb = inject(FormBuilder);
  protected readonly themeService = inject(ThemeService);

  readonly section = signal<SettingsSection>("profile");
  readonly saved = signal(false);
  readonly density = signal<"Compact" | "Default" | "Comfortable">("Default");
  readonly twoFactor = signal(false);
  readonly notificationPrefs = signal({
    orderUpdates: true,
    changeRequests: true,
    billingAlerts: true,
    systemAlerts: false,
    weeklySummary: true,
  });

  readonly sections: { id: SettingsSection; label: string; icon: string }[] = [
    { id: "profile", label: "Profile", icon: "user" },
    { id: "notifications", label: "Notifications", icon: "bell" },
    { id: "appearance", label: "Appearance", icon: "palette" },
    { id: "language", label: "Language & Region", icon: "globe" },
    { id: "security", label: "Security", icon: "shield" },
    { id: "organization", label: "Organization", icon: "building" },
  ];

  readonly profileForm = this.fb.nonNullable.group({
    firstName: ["Jessica", Validators.required],
    lastName: ["Ruiz", Validators.required],
    email: [
      "jessica.ruiz@dentalab.com",
      [Validators.required, Validators.email],
    ],
    role: ["Lab Manager"],
    phone: ["+1 (415) 555-0132"],
  });

  readonly languageForm = this.fb.nonNullable.group({
    language: ["en"],
    timeZone: ["PST"],
    dateFormat: ["MM/DD/YYYY"],
  });

  readonly organizationForm = this.fb.nonNullable.group({
    labName: ["DentaLab Systems Inc.", Validators.required],
    address: ["548 Market Street, San Francisco, CA"],
    license: ["DL-CA-2019-04821"],
  });

  readonly securityForm = this.fb.nonNullable.group({
    currentPassword: [""],
    newPassword: ["", Validators.minLength(8)],
    confirmPassword: [""],
  });

  readonly languageOptions = [
    { label: "English", value: "en" },
    { label: "Español", value: "es" },
    { label: "Français", value: "fr" },
    { label: "Deutsch", value: "de" },
  ] as const;

  readonly timeZoneOptions = [
    { label: "PST", value: "PST" },
    { label: "MST", value: "MST" },
    { label: "CST", value: "CST" },
    { label: "EST", value: "EST" },
  ] as const;

  readonly dateFormatOptions = [
    { label: "MM/DD/YYYY", value: "MM/DD/YYYY" },
    { label: "DD/MM/YYYY", value: "DD/MM/YYYY" },
    { label: "YYYY-MM-DD", value: "YYYY-MM-DD" },
  ] as const;

  setSection(next: SettingsSection): void {
    this.section.set(next);
    this.saved.set(false);
  }

  togglePreference(key: keyof ReturnType<typeof this.notificationPrefs>): void {
    this.notificationPrefs.update((current) => ({
      ...current,
      [key]: !current[key],
    }));
  }

  setDensity(next: "Compact" | "Default" | "Comfortable"): void {
    this.density.set(next);
  }

  toggleTwoFactor(): void {
    this.twoFactor.update((v) => !v);
  }

  setAppearance(mode: "light" | "dark"): void {
    this.themeService.setTheme(mode);
  }

  saveChanges(): void {
    this.saved.set(true);
    window.setTimeout(() => this.saved.set(false), 2000);
  }

  preferenceEntries(): {
    key:
      | "orderUpdates"
      | "changeRequests"
      | "billingAlerts"
      | "systemAlerts"
      | "weeklySummary";
    label: string;
    value: boolean;
  }[] {
    const prefs = this.notificationPrefs();
    return [
      {
        key: "orderUpdates",
        label: "Order Status Updates",
        value: prefs.orderUpdates,
      },
      {
        key: "changeRequests",
        label: "Change Requests",
        value: prefs.changeRequests,
      },
      {
        key: "billingAlerts",
        label: "Billing Alerts",
        value: prefs.billingAlerts,
      },
      {
        key: "systemAlerts",
        label: "System Alerts",
        value: prefs.systemAlerts,
      },
      {
        key: "weeklySummary",
        label: "Weekly Summary",
        value: prefs.weeklySummary,
      },
    ];
  }

  getIconSvg(name: string): string {
    const icons: Record<string, string> = {
      user: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
      bell: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>',
      palette:
        '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="13.5" cy="6.5" r=".5"/><circle cx="17.5" cy="10.5" r=".5"/><circle cx="8.5" cy="7.5" r=".5"/><circle cx="6.5" cy="12.5" r=".5"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.93 0 1.68-.75 1.68-1.68 0-.44-.16-.84-.44-1.15-.27-.31-.44-.71-.44-1.15 0-.93.75-1.68 1.68-1.68h2.74a5.87 5.87 0 0 0 5.87-5.87c0-4.95-4.5-8.47-10.09-8.47z"/></svg>',
      globe:
        '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>',
      shield:
        '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
      building:
        '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"/><path d="M9 22v-4h6v4"/></svg>',
      save: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>',
    };
    return icons[name] || "";
  }
}

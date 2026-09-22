import { Injectable, signal, effect, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly STORAGE_KEY = 'dentalab-theme';

  readonly isDark = signal<boolean>(false);
  readonly theme = signal<'light' | 'dark'>('light');

  constructor() {
    effect(() => {
      // Reactive mirror of applyTheme() for signal-driven updates.
      this.applyTheme(this.isDark() ? 'dark' : 'light');
    });
  }

  /** Synchronously applies the theme to the DOM and storage. Called directly
   *  (not only via effect) so toggles persist deterministically. */
  private applyTheme(theme: 'light' | 'dark'): void {
    if (!isPlatformBrowser(this.platformId)) return;
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem(this.STORAGE_KEY, theme);
    } catch {
      // storage unavailable — theme still applies to the document
    }
  }

  init(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    // React parity: the React app always starts in light mode (isDark=false).
    // Respect an explicit stored preference, otherwise default to light so
    // initial startup matches React instead of following the OS setting.
    const stored = localStorage.getItem(this.STORAGE_KEY) as 'light' | 'dark' | null;
    const initialTheme = stored ?? 'light';

    this.isDark.set(initialTheme === 'dark');
    this.theme.set(initialTheme);
    this.applyTheme(initialTheme);
  }

  toggle(): void {
    const next = !this.isDark();
    this.isDark.set(next);
    this.theme.set(next ? 'dark' : 'light');
    this.applyTheme(next ? 'dark' : 'light');
  }

  setTheme(theme: 'light' | 'dark'): void {
    this.isDark.set(theme === 'dark');
    this.theme.set(theme);
    this.applyTheme(theme);
  }
}
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
      if (isPlatformBrowser(this.platformId)) {
        const dark = this.isDark();
        document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
        localStorage.setItem(this.STORAGE_KEY, dark ? 'dark' : 'light');
      }
    });
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
  }

  toggle(): void {
    this.isDark.update(v => !v);
    this.theme.update(v => v === 'light' ? 'dark' : 'light');
  }

  setTheme(theme: 'light' | 'dark'): void {
    this.isDark.set(theme === 'dark');
    this.theme.set(theme);
  }
}
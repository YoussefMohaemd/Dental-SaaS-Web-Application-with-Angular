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

    const stored = localStorage.getItem(this.STORAGE_KEY) as 'light' | 'dark' | null;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialTheme = stored ?? (prefersDark ? 'dark' : 'light');

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
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
      
      this.applyTheme(this.isDark() ? 'dark' : 'light');
    });
  }

  
  private applyTheme(theme: 'light' | 'dark'): void {
    if (!isPlatformBrowser(this.platformId)) return;
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem(this.STORAGE_KEY, theme);
    } catch {
      
    }
  }

  init(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    
    
    
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
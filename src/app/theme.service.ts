import { Injectable, signal, effect, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export type Theme = 'light' | 'dark';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly STORAGE_KEY = 'app_theme_preference';
  
  readonly theme = signal<Theme>('light');

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.loadTheme();
      
      // Effect to apply theme changes to DOM and local storage
      effect(() => {
        const currentTheme = this.theme();
        this.saveTheme(currentTheme);
        this.applyTheme(currentTheme);
      });
    }
  }

  toggleTheme() {
    this.theme.update(current => current === 'light' ? 'dark' : 'light');
  }

  private loadTheme() {
    const savedTheme = localStorage.getItem(this.STORAGE_KEY) as Theme;
    if (savedTheme === 'light' || savedTheme === 'dark') {
      this.theme.set(savedTheme);
    } else {
      // Check system preference
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      this.theme.set(prefersDark ? 'dark' : 'light');
    }
  }

  private saveTheme(theme: Theme) {
    localStorage.setItem(this.STORAGE_KEY, theme);
  }

  private applyTheme(theme: Theme) {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }
}

export class ThemeService {
  private isDark = false;

  constructor() {
    // Check system preference or stored preference
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const storedTheme = localStorage.getItem('theme');
    
    if (storedTheme) {
      this.isDark = storedTheme === 'dark';
    } else {
      this.isDark = prefersDark;
    }
    
    this.updateTheme();
  }

  public toggleTheme(): boolean {
    this.isDark = !this.isDark;
    this.updateTheme();
    return this.isDark;
  }
  
  public getDarkMode(): boolean {
    return this.isDark;
  }

  private updateTheme() {
    // Apply to document body directly
    document.body.classList.toggle('dark', this.isDark);
    
    // Store preference
    localStorage.setItem('theme', this.isDark ? 'dark' : 'light');
    
    // Also set a CSS variable that can be used for custom styling
    document.documentElement.style.setProperty('--is-dark-theme', this.isDark ? '1' : '0');
  }
}

export const themeService = new ThemeService();
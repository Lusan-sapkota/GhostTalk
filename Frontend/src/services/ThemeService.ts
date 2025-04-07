export class ThemeService {
  private readonly SYSTEM_THEME_KEY = 'systemThemeMode';
  private themeTransitionTimeout: number | null = null;
  
  /**
   * Get the current dark mode state based on system
   */
  public getDarkMode(): boolean {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
  
  /**
   * Toggle dark mode
   */
  public toggleTheme(): boolean {
    const currentMode = this.getDarkMode();
    const newMode = !currentMode;
    
    this.setDarkMode(newMode);
    return newMode;
  }
  
  /**
   * Set dark mode to a specific state
   */
  public setDarkMode(isDark: boolean): void {
    localStorage.setItem(this.SYSTEM_THEME_KEY, String(isDark));
    
    this.applyThemeClasses(isDark);
    
    // Dispatch a custom event for other components to listen to
    window.dispatchEvent(new CustomEvent('themechange', { 
      detail: { darkMode: isDark } 
    }));
  }
  
  /**
   * Apply theme classes consistently across the app
   */
  private applyThemeClasses(isDark: boolean): void {
    if (isDark) {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
    }
    
    // Dispatch a custom event for other components to listen to
    window.dispatchEvent(new CustomEvent('themechange', { 
      detail: { darkMode: isDark } 
    }));
  }
  
  /**
   * Apply theme based on preference (system, light, or dark)
   */
  public applyThemePreference(preference: string): void {
    if (preference === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      this.setDarkMode(prefersDark);
      document.documentElement.classList.add('theme-transition');
      document.documentElement.classList.add('theme-changing');
      
      setTimeout(() => {
        document.documentElement.classList.remove('theme-changing');
      }, 500);
    } else if (preference === 'light') {
      this.setDarkMode(false);
    } else if (preference === 'dark') {
      this.setDarkMode(true);
    }
    
    localStorage.setItem('themePreference', preference);
  }
  
  /**
   * Listen for theme changes
   */
  public onThemeChange(callback: (isDark: boolean) => void): () => void {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      this.applyThemeClasses(e.matches);
      callback(e.matches);
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }
  
  /**
   * Apply initial theme from system
   */
  public applySystemTheme(): void {
    const isDark = this.getDarkMode();
    this.applyThemeClasses(isDark);
  }
}

// Create instance
const themeServiceInstance = new ThemeService();

// Provide both default and named exports
export { themeServiceInstance as themeService };
export default themeServiceInstance;
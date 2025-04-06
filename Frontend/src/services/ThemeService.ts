export class ThemeService {
  private readonly DARK_MODE_KEY = 'darkMode';
  
  /**
   * Get the current dark mode state
   */
  public getDarkMode(): boolean {
    const savedMode = localStorage.getItem(this.DARK_MODE_KEY);
    
    // If user has a saved preference, use that
    if (savedMode !== null) {
      return savedMode === 'true';
    }
    
    // Otherwise use system preference
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    // Set the initial body class based on system preference
    document.body.classList.toggle('dark', prefersDark);
    return prefersDark;
  }
  
  /**
   * Toggle dark mode
   */
  public toggleTheme(): boolean {
    const currentMode = this.getDarkMode();
    const newMode = !currentMode;
    
    localStorage.setItem(this.DARK_MODE_KEY, String(newMode));
    
    // Force remove and add for consistency
    document.body.classList.remove('dark');
    if (newMode) {
      document.body.classList.add('dark');
    }
    
    // Also set on :root to ensure everything gets the dark theme
    document.documentElement.classList.remove('dark');
    if (newMode) {
      document.documentElement.classList.add('dark');
    }
    
    // Dispatch a custom event for other components to listen to
    window.dispatchEvent(new CustomEvent('themechange', { 
      detail: { darkMode: newMode } 
    }));
    
    return newMode;
  }
  
  /**
   * Set dark mode to a specific state
   */
  public setDarkMode(isDark: boolean): void {
    localStorage.setItem(this.DARK_MODE_KEY, String(isDark));
    
    // Force remove and add for consistency
    document.body.classList.remove('dark');
    document.documentElement.classList.remove('dark');
    
    if (isDark) {
      document.body.classList.add('dark');
      document.documentElement.classList.add('dark');
    }
    
    // Dispatch a custom event for other components to listen to
    window.dispatchEvent(new CustomEvent('themechange', { 
      detail: { darkMode: isDark } 
    }));
  }
  
  /**
   * Listen for theme changes
   */
  public onThemeChange(callback: (isDark: boolean) => void): () => void {
    const handler = (event: Event) => {
      const customEvent = event as CustomEvent;
      callback(customEvent.detail.darkMode);
    };
    
    window.addEventListener('themechange', handler);
    
    // Return a cleanup function
    return () => window.removeEventListener('themechange', handler);
  }
}

// Create a singleton instance
export const themeService = new ThemeService();
export default themeService;
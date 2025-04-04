import React, { createContext, useState, useEffect, ReactNode } from 'react';

type ThemeContextType = {
  darkMode: boolean;
  toggleDarkMode: () => void;
  setThemeMode: (isDark: boolean) => void;
};

const defaultContext: ThemeContextType = {
  darkMode: false,
  toggleDarkMode: () => {},
  setThemeMode: () => {},
};

export const ThemeContext = createContext<ThemeContextType>(defaultContext);

type ThemeProviderProps = {
  children: ReactNode;
};

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [darkMode, setDarkMode] = useState(false);
  
  useEffect(() => {
    const prefersDark = localStorage.getItem('darkMode') === 'true' || 
                        window.matchMedia('(prefers-color-scheme: dark)').matches;
    setDarkMode(prefersDark);
    document.body.classList.toggle('dark', prefersDark);
  }, []);
  
  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    document.body.classList.toggle('dark', newDarkMode);
    localStorage.setItem('darkMode', String(newDarkMode));
  };
  
  const setThemeMode = (isDark: boolean) => {
    setDarkMode(isDark);
    document.body.classList.toggle('dark', isDark);
    localStorage.setItem('darkMode', String(isDark));
  };
  
  return (
    <ThemeContext.Provider value={{ darkMode, toggleDarkMode, setThemeMode }}>
      {children}
    </ThemeContext.Provider>
  );
};
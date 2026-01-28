'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

// Theme type
export type Theme = 'light' | 'dark';

// Theme context value interface
interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

// Create the context
const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

// LocalStorage key for theme persistence
const STORAGE_KEY = 'mlh-ttu-theme';

// Theme provider props
interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme?: Theme;
}

// Theme provider component
export function ThemeProvider({ children, defaultTheme = 'light' }: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(() => {
    // Initialize theme immediately on client side
    if (typeof window === 'undefined') return defaultTheme;
    
    try {
      const storedTheme = localStorage.getItem(STORAGE_KEY) as Theme | null;
      if (storedTheme === 'light' || storedTheme === 'dark') {
        // Apply theme immediately to avoid flash
        document.documentElement.setAttribute('data-theme', storedTheme);
        if (storedTheme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
        return storedTheme;
      }
      // Check system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const systemTheme = prefersDark ? 'dark' : 'light';
      // Apply system theme immediately
      document.documentElement.setAttribute('data-theme', systemTheme);
      if (systemTheme === 'dark') {
        document.documentElement.classList.add('dark');
      }
      return systemTheme;
    } catch (error) {
      console.warn('Failed to load theme from localStorage:', error);
      return defaultTheme;
    }
  });

  // Apply theme to document root whenever theme changes
  useEffect(() => {
    console.log('Applying theme:', theme);
    
    try {
      // Apply theme attribute to html element
      document.documentElement.setAttribute('data-theme', theme);
      
      // Add/remove 'dark' class for Tailwind dark mode
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
        console.log('✅ Dark class ADDED to <html>');
      } else {
        document.documentElement.classList.remove('dark');
        console.log('✅ Dark class REMOVED from <html>');
      }
      
      // Persist to localStorage
      localStorage.setItem(STORAGE_KEY, theme);
      
      // Log the current classes on html element
      console.log('HTML classes:', document.documentElement.className);
    } catch (error) {
      console.error('Failed to apply theme:', error);
    }
  }, [theme]);

  // Toggle between light and dark themes
  const toggleTheme = () => {
    console.log('toggleTheme called, current theme:', theme);
    setThemeState((prevTheme) => {
      const newTheme = prevTheme === 'light' ? 'dark' : 'light';
      console.log('Setting new theme:', newTheme);
      return newTheme;
    });
  };

  // Set specific theme
  const setTheme = (newTheme: Theme) => {
    console.log('setTheme called with:', newTheme);
    setThemeState(newTheme);
  };

  const value: ThemeContextValue = {
    theme,
    toggleTheme,
    setTheme,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

// Custom hook to use theme context
export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

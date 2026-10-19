'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext({
  theme: 'light',
  toggleTheme: () => {},
  setTheme: () => {},
});

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Read stored theme from localStorage or system preference
    const savedTheme = localStorage.getItem('devpass-theme');
    if (savedTheme === 'light' || savedTheme === 'dark') {
      setThemeState(savedTheme);
      applyTheme(savedTheme);
    } else {
      // Default to light as requested for the warm 3D bg-[#FAEBD7] experience
      setThemeState('light');
      applyTheme('light');
    }
    setMounted(true);
  }, []);

  const applyTheme = (newTheme) => {
    const root = document.documentElement;
    const body = document.body;
    
    root.setAttribute('data-theme', newTheme);
    if (body) {
      body.setAttribute('data-theme', newTheme);
      if (newTheme === 'dark') {
        body.classList.remove('theme-light');
        body.classList.add('theme-dark');
      } else {
        body.classList.remove('theme-dark');
        body.classList.add('theme-light');
      }
    }
  };

  const setTheme = (newTheme) => {
    setThemeState(newTheme);
    localStorage.setItem('devpass-theme', newTheme);
    applyTheme(newTheme);
  };

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme, mounted }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

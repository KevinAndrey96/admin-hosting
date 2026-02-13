'use client';

import { useEffect, useState } from 'react';

const THEME_KEY = 'adminator-theme';

function safeGetStorage(): string | null {
  try {
    return typeof window !== 'undefined' ? localStorage.getItem(THEME_KEY) : null;
  } catch {
    return null;
  }
}

function safeSetStorage(value: string): void {
  try {
    localStorage.setItem(THEME_KEY, value);
  } catch {
    // Private mode or localStorage unavailable - theme only for this session
  }
}

function dispatchThemeChanged(newTheme: 'light' | 'dark') {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('adminator:themeChanged', { detail: { theme: newTheme } })
    );
  }
}

export function useTheme() {
  const [theme, setThemeState] = useState<'light' | 'dark'>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = safeGetStorage();
    if (stored === 'light' || stored === 'dark') {
      setThemeState(stored);
      document.documentElement.setAttribute('data-theme', stored);
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const initial = prefersDark ? 'dark' : 'light';
      setThemeState(initial);
      document.documentElement.setAttribute('data-theme', initial);
      safeSetStorage(initial);
    }
  }, []);

  const setTheme = (newTheme: 'light' | 'dark') => {
    setThemeState(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    safeSetStorage(newTheme);
    dispatchThemeChanged(newTheme);
  };

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    return next;
  };

  return { theme, setTheme, toggleTheme, mounted };
}

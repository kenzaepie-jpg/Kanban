import { useEffect, useState } from 'react';

export type Theme = 'light' | 'dark';

const THEME_KEY = 'gostudy_theme';

// localStorage can throw (private mode, blocked site data); the theme then just isn't remembered
function readTheme(): Theme {
  try {
    return JSON.parse(localStorage.getItem(THEME_KEY) ?? '"light"') === 'dark' ? 'dark' : 'light';
  } catch {
    return 'light';
  }
}

/** Light (white & blue) by default; the choice is remembered per browser. */
export function useTheme(): [Theme, () => void] {
  const [theme, setTheme] = useState<Theme>(readTheme);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', theme === 'dark');
    root.style.colorScheme = theme;
    try {
      localStorage.setItem(THEME_KEY, JSON.stringify(theme));
    } catch {
      /* ignore */
    }
  }, [theme]);

  return [theme, () => setTheme(t => (t === 'dark' ? 'light' : 'dark'))];
}

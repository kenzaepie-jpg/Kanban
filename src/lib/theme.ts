import { useEffect, useState } from 'react';
import { readJSON, writeJSON } from './storage';

export type Theme = 'light' | 'dark';

const THEME_KEY = 'gostudy_theme';

/** Light (white & blue) by default; the choice is remembered per browser. */
export function useTheme(): [Theme, () => void] {
  const [theme, setTheme] = useState<Theme>(() => readJSON<Theme>(THEME_KEY, 'light'));

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', theme === 'dark');
    root.style.colorScheme = theme;
    writeJSON(THEME_KEY, theme);
  }, [theme]);

  return [theme, () => setTheme(t => (t === 'dark' ? 'light' : 'dark'))];
}

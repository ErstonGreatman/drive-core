import { createSignal } from 'solid-js';

export type Theme = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'drive-core-theme';

const getStoredTheme = (): Theme => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'light' || stored === 'dark' || stored === 'system') { return stored; }
  } catch {
    // localStorage unavailable
  }
  return 'system';
};

const applyThemeToDOM = (theme: Theme): void => {
  const html = document.documentElement;
  html.classList.add('theme-transitioning');
  html.classList.remove('light', 'dark');
  if (theme === 'light') { html.classList.add('light'); }
  else if (theme === 'dark') { html.classList.add('dark'); }
  setTimeout(() => html.classList.remove('theme-transitioning'), 300);
};

const [theme, setThemeSignal] = createSignal<Theme>(getStoredTheme());

export const setTheme = (newTheme: Theme): void => {
  try {
    localStorage.setItem(STORAGE_KEY, newTheme);
  } catch {
    // localStorage unavailable
  }
  setThemeSignal(newTheme);
  applyThemeToDOM(newTheme);
};

export { theme };

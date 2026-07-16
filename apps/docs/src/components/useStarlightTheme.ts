import { useCallback, useEffect, useState } from 'react';

export type StarlightTheme = 'light' | 'dark';

const STORAGE_KEY = 'starlight-theme';

declare global {
  interface Window {
    // Defined inline by @astrojs/starlight's ThemeProvider script; keeps the
    // built-in <ThemeSelect> dropdown (if present on the page) in sync when
    // we write the theme from here instead of from that dropdown.
    StarlightThemeProvider?: { updatePickers(theme?: string): void };
  }
}

// Starlight resolves `auto` at write time, so `<html data-theme>` is always
// `'light' | 'dark'`, never `'auto'` -- safe to coerce anything else to light.
function readTheme(): StarlightTheme {
  return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
}

/**
 * Bridges swatchbook's `mode` axis to Starlight's own light/dark theme, the
 * same relationship Docusaurus's `useColorMode` served in the previous doc
 * site. Starlight has no theme-change event, so external flips (the site's
 * own `<ThemeSelect>` toggle) are picked up via a MutationObserver on
 * `<html data-theme>` rather than a subscription.
 */
export function useStarlightTheme(): [StarlightTheme, (next: StarlightTheme) => void] {
  const [theme, setTheme] = useState<StarlightTheme>(() =>
    typeof document === 'undefined' ? 'light' : readTheme(),
  );

  useEffect(() => {
    setTheme(readTheme());
    const observer = new MutationObserver(() => setTheme(readTheme()));
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });
    return () => observer.disconnect();
  }, []);

  const setMode = useCallback((next: StarlightTheme) => {
    document.documentElement.dataset.theme = next;
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // localStorage full / disabled -- theme still applies for the session.
    }
    window.StarlightThemeProvider?.updatePickers(next);
    setTheme(next);
  }, []);

  return [theme, setMode];
}

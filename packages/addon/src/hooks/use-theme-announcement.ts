import { useEffect, useRef, useState } from 'react';

/**
 * Page-level theme-flip announcement for an `aria-live` region. Silent on
 * initial mount (no spurious announcement per story load), then emits
 * `Theme: <name>` whenever the active theme changes — including a return to
 * the mount-time theme. Debounced by `delayMs` so rapid axis flips collapse
 * into one announcement.
 *
 * Tracks the *previous* theme, not the initial one: keying off the mount
 * theme dropped the announcement when the user flipped back to where they
 * started, leaving screen-reader users with no signal.
 */
export function useThemeAnnouncement(themeName: string, delayMs = 250): string {
  const [announcement, setAnnouncement] = useState('');
  const prevThemeRef = useRef(themeName);
  useEffect(() => {
    if (themeName === prevThemeRef.current) return;
    prevThemeRef.current = themeName;
    const timer = setTimeout(() => {
      setAnnouncement(themeName ? `Theme: ${themeName}` : '');
    }, delayMs);
    return () => {
      clearTimeout(timer);
    };
  }, [themeName, delayMs]);
  return announcement;
}

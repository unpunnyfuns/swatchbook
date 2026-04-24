import { useEffect, useState } from 'react';

/**
 * True when rendering inside Chromatic's snapshot runner. Chromatic's
 * browser ships a recognisable user-agent string; checked here so
 * motion-looping components can fall back to their static state for
 * deterministic snapshots without needing a global Chromatic parameter
 * (globally forcing `prefersReducedMotion: true` broke Chromatic's
 * verification parser in our setup — see commit 893331f).
 */
function isChromatic(): boolean {
  if (typeof navigator === 'undefined') return false;
  return navigator.userAgent.includes('Chromatic');
}

/**
 * Reactive `prefers-reduced-motion: reduce` detector. Returns the current
 * match and updates if the user toggles the OS-level preference. Also
 * returns `true` under Chromatic to keep animated samples deterministic
 * during visual regression capture.
 */
export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (isChromatic()) {
      setReduced(true);
      return;
    }
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(query.matches);
    const onChange = (e: MediaQueryListEvent): void => setReduced(e.matches);
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);
  return reduced;
}

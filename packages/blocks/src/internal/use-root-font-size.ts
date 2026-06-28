import { useSyncExternalStore } from 'react';

// Read the rendering context's root font-size in px; 16 with no DOM or an
// unparseable value (SSR, hand-built snapshots).
function readRootFontSize(): number {
  if (typeof document === 'undefined') return 16;
  const fontSize = Number.parseFloat(getComputedStyle(document.documentElement).fontSize);
  return Number.isFinite(fontSize) && fontSize > 0 ? fontSize : 16;
}

// Re-read on viewport resize: a responsive root (a media query swapping
// `html { font-size }` at a breakpoint) changes the root after mount, and the
// `var()`-based bar re-resolves with it. `useSyncExternalStore` bails out when
// the value is unchanged, so a resize that doesn't move the root is a no-op.
function subscribe(onChange: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener('resize', onChange);
  return () => window.removeEventListener('resize', onChange);
}

/**
 * Root font-size (px) of the context a block renders in, tracked across
 * viewport changes. `rem` dimension values resolve their `var()` against this
 * root, so the cap math (`toPixels`) and value sort (`sortTokens`) must scale
 * `rem` by it rather than a literal 16: a Storybook Docs page, or a responsive
 * desktop/tablet/mobile breakpoint, can apply a different root to the same
 * token. Falls back to 16 with no DOM.
 */
export function useRootFontSize(): number {
  return useSyncExternalStore(subscribe, readRootFontSize, () => 16);
}

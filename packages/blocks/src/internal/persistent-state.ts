import { useEffect, useMemo, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';

/**
 * Block UI state that survives a docs-mode remount.
 *
 * In MDX docs mode Storybook re-renders the docs container on every
 * `updateGlobals` (axis flip), which unmounts and remounts the embedded
 * blocks — destroying any plain `useState` (expand/collapse, selection,
 * search). This is the same problem `channel-globals` solves for the
 * globals: lift the value out of React into module state so it persists
 * across the remount, and re-seed component state from it on mount.
 *
 * `usePersistedState` is a drop-in `useState` whose value is mirrored to a
 * module-level store under a caller-supplied key, and read back from it on
 * (re)mount. `useBlockKey` builds a stable key scoped to the current docs
 * page + block identity so two pages (or two distinct blocks) don't share
 * an entry.
 */

const store = new Map<string, unknown>();

/**
 * Drop all persisted block state. The store is module-global and intentionally
 * outlives React's tree (that's the whole point), so tests must clear it
 * between cases to stay isolated — wired via the browser project's setupFiles.
 */
export function clearPersistedState(): void {
  store.clear();
}

// The current docs/story id, so persisted state is scoped per page. Docs
// navigation is an SPA swap inside the preview iframe (no reload), so without
// this scope a `<TokenNavigator root="color">` on page A would inherit page
// B's expand/selection state. Falls back to the pathname, then empty (SSR).
function pageScope(): string {
  if (typeof window === 'undefined') return '';
  try {
    return new URLSearchParams(window.location.search).get('id') ?? window.location.pathname;
  } catch {
    return '';
  }
}

const SEP = '';

/**
 * Build a stable persistence key for a block's UI state: docs page + block
 * type + the props that distinguish one instance from another (and an
 * optional explicit `id` for identical-prop siblings on the same page).
 */
export function useBlockKey(
  blockType: string,
  parts: readonly (string | number | boolean | undefined)[],
): string {
  const partsKey = parts.map((p) => (p === undefined ? '' : String(p))).join(SEP);
  // pageScope() is read once per (re)mount via the memo; a docs page swap
  // remounts the block, so the scope is current for the new page.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => `${pageScope()}${SEP}${blockType}${SEP}${partsKey}`, [blockType, partsKey]);
}

/**
 * `useState`, but the value persists across remounts under `key`. `initial`
 * may be a value or a lazy initializer (used only on the first mount when the
 * store has no entry yet — never an actual `T` that's a function here).
 */
export function usePersistedState<T>(
  key: string,
  initial: T | (() => T),
): readonly [T, Dispatch<SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => {
    if (store.has(key)) return store.get(key) as T;
    return typeof initial === 'function' ? (initial as () => T)() : initial;
  });
  useEffect(() => {
    store.set(key, value);
  }, [key, value]);
  return [value, setValue] as const;
}

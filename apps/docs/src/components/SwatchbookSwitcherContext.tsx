import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
} from 'react';
import type { SwitcherAxis, SwitcherPreset } from '@unpunnyfuns/swatchbook-switcher';
// Bundled at build time by `scripts/build-tokens.mts` from the DTCG tokens
// under `apps/docs/tokens/`. Keeps the switcher in sync with the CSS the
// site's stylesheet reads — no runtime fetch needed.
import snapshot from '#/tokens.snapshot.json';

interface AxesSnapshot {
  axes: SwitcherAxis[];
  presets: SwitcherPreset[];
  defaults: Record<string, string>;
  cssVarPrefix: string;
}

/**
 * The `mode` axis is bridged to Starlight's own light/dark theme inside the
 * switcher button. This context covers every *other* axis + presets, and
 * wraps the switcher so state survives page navigations.
 */
export const MODE_AXIS = 'mode';

const LOCAL_STORAGE_KEY = 'swatchbook-docs-switcher';

const SNAPSHOT = snapshot as AxesSnapshot;

interface SwatchbookSwitcherContextValue {
  axes: SwitcherAxis[];
  presets: SwitcherPreset[];
  defaults: Record<string, string>;
  cssVarPrefix: string;
  /** Tuple of every axis except `mode`, keyed by axis name. */
  nonModeTuple: Record<string, string>;
  lastApplied: string | null;
  setNonModeAxis(axisName: string, next: string): void;
  /** Apply each non-mode axis from the preset; mode is applied by the button. */
  applyNonModeFromPreset(preset: SwitcherPreset): void;
  setLastApplied(name: string | null): void;
}

const SwatchbookSwitcherContext = createContext<SwatchbookSwitcherContextValue | null>(null);

export function useSwatchbookSwitcher(): SwatchbookSwitcherContextValue {
  const ctx = useContext(SwatchbookSwitcherContext);
  if (!ctx) {
    throw new Error('useSwatchbookSwitcher must be called inside <SwatchbookSwitcherProvider>');
  }
  return ctx;
}

function defaultNonModeTuple(): Record<string, string> {
  const tuple: Record<string, string> = {};
  for (const axis of SNAPSHOT.axes) {
    if (axis.name === MODE_AXIS) continue;
    tuple[axis.name] = SNAPSHOT.defaults[axis.name] ?? axis.default;
  }
  return tuple;
}

function readPersistedNonModeTuple(): Record<string, string> {
  const tuple = defaultNonModeTuple();
  if (typeof window === 'undefined') return tuple;
  try {
    const raw = window.localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return tuple;
    const parsed = JSON.parse(raw) as { tuple?: Record<string, unknown> };
    if (parsed && typeof parsed.tuple === 'object' && parsed.tuple !== null) {
      for (const axis of SNAPSHOT.axes) {
        if (axis.name === MODE_AXIS) continue;
        const candidate = parsed.tuple[axis.name];
        if (typeof candidate === 'string' && axis.contexts.includes(candidate)) {
          tuple[axis.name] = candidate;
        }
      }
    }
  } catch {
    // malformed payload — fall through to defaults.
  }
  return tuple;
}

function persistNonModeTuple(tuple: Record<string, string>): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({ tuple }));
  } catch {
    // localStorage full / disabled — UX still works for the session.
  }
}

/**
 * Writes each non-mode axis onto `<html>` as `data-sb-<axis>="<context>"`.
 * Mode stays on Starlight's own `[data-theme]`; the emitted compound
 * selectors in `tokens.generated.css` combine the two.
 */
function syncNonModeTupleToDocument(tuple: Record<string, string>): void {
  if (typeof document === 'undefined') return;
  for (const axis of SNAPSHOT.axes) {
    if (axis.name === MODE_AXIS) continue;
    document.documentElement.setAttribute(`data-sb-${axis.name}`, tuple[axis.name] ?? axis.default);
  }
}

interface StoreState {
  nonModeTuple: Record<string, string>;
  lastApplied: string | null;
}

/**
 * Module-level store shared by every mounted provider. The switcher renders in
 * up to three places at once — desktop header, mobile menu, reference-page demo
 * — as independent React roots, so per-instance `useState` would let brand /
 * contrast selections drift out of sync (same-document `localStorage` writes
 * don't notify other instances, and `storage` events only fire cross-tab).
 * One in-module store keeps all mounts on a single source of truth for the
 * non-mode axes; `mode` stays shared through Starlight's `[data-theme]`.
 */
const listeners = new Set<() => void>();

let store: StoreState = {
  nonModeTuple: readPersistedNonModeTuple(),
  lastApplied: null,
};

// Referentially stable snapshot for SSR / hydration — never reads storage.
const serverStore: StoreState = {
  nonModeTuple: defaultNonModeTuple(),
  lastApplied: null,
};

function emit(): void {
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): StoreState {
  return store;
}

function getServerSnapshot(): StoreState {
  return serverStore;
}

function commitNonModeTuple(next: Record<string, string>): void {
  store = { ...store, nonModeTuple: next };
  syncNonModeTupleToDocument(next);
  persistNonModeTuple(next);
  emit();
}

function setNonModeAxisInStore(axisName: string, next: string): void {
  if (axisName === MODE_AXIS) return;
  commitNonModeTuple({ ...store.nonModeTuple, [axisName]: next });
}

function applyNonModeFromPresetInStore(preset: SwitcherPreset): void {
  const next = { ...store.nonModeTuple };
  for (const axis of SNAPSHOT.axes) {
    if (axis.name === MODE_AXIS) continue;
    const candidate = preset.axes[axis.name];
    if (candidate !== undefined && axis.contexts.includes(candidate)) {
      next[axis.name] = candidate;
    }
  }
  commitNonModeTuple(next);
}

function setLastAppliedInStore(name: string | null): void {
  store = { ...store, lastApplied: name };
  emit();
}

export function SwatchbookSwitcherProvider({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  // Apply the persisted tuple to `<html>` once per load so a fresh page
  // reflects the stored selection. Idempotent across the parallel mounts.
  useEffect(() => {
    syncNonModeTupleToDocument(getSnapshot().nonModeTuple);
  }, []);

  const setLastApplied = useCallback((name: string | null) => setLastAppliedInStore(name), []);

  const value = useMemo<SwatchbookSwitcherContextValue>(
    () => ({
      axes: SNAPSHOT.axes,
      presets: SNAPSHOT.presets,
      defaults: SNAPSHOT.defaults,
      cssVarPrefix: SNAPSHOT.cssVarPrefix,
      nonModeTuple: state.nonModeTuple,
      lastApplied: state.lastApplied,
      setNonModeAxis: setNonModeAxisInStore,
      applyNonModeFromPreset: applyNonModeFromPresetInStore,
      setLastApplied,
    }),
    [state.nonModeTuple, state.lastApplied, setLastApplied],
  );

  return (
    <SwatchbookSwitcherContext.Provider value={value}>
      {children}
    </SwatchbookSwitcherContext.Provider>
  );
}

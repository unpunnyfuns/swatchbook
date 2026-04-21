import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type {
  SwitcherAxis,
  SwitcherColorFormat,
  SwitcherPreset,
} from '@unpunnyfuns/swatchbook-switcher';
// Bundled at build time by `scripts/build-tokens.mts` from the DTCG tokens
// under `apps/docs/tokens/`. Keeps the navbar switcher in sync with the CSS
// the Infima layer reads — no runtime fetch needed.
import snapshot from '../tokens.snapshot.json';

type AxesSnapshot = {
  axes: SwitcherAxis[];
  presets: SwitcherPreset[];
  defaults: Record<string, string>;
  cssVarPrefix: string;
};

/**
 * The `mode` axis is bridged to Docusaurus's `useColorMode` inside the
 * switcher button (where we're guaranteed to be under the ColorMode
 * provider). This context covers every *other* axis + presets + colour
 * format, and lives at the Root swizzle so the state survives page
 * navigations and renders before the colour-mode provider mounts.
 */
export const MODE_AXIS = 'mode';

const LOCAL_STORAGE_KEY = 'swatchbook-docs-switcher';

interface SwatchbookSwitcherContextValue {
  axes: SwitcherAxis[];
  presets: SwitcherPreset[];
  defaults: Record<string, string>;
  cssVarPrefix: string;
  /** Tuple of every axis except `mode`, keyed by axis name. */
  nonModeTuple: Record<string, string>;
  activeColorFormat: SwitcherColorFormat;
  lastApplied: string | null;
  setNonModeAxis(axisName: string, next: string): void;
  /** Apply each non-mode axis from the preset; mode is applied by the button. */
  applyNonModeFromPreset(preset: SwitcherPreset): void;
  setLastApplied(name: string | null): void;
  setColorFormat(next: SwitcherColorFormat): void;
}

const SwatchbookSwitcherContext = createContext<SwatchbookSwitcherContextValue | null>(null);

export function useSwatchbookSwitcher(): SwatchbookSwitcherContextValue {
  const ctx = useContext(SwatchbookSwitcherContext);
  if (!ctx) {
    throw new Error('useSwatchbookSwitcher must be called inside <SwatchbookSwitcherProvider>');
  }
  return ctx;
}

function readPersistedNonModeTuple(
  axes: readonly SwitcherAxis[],
  defaults: Record<string, string>,
): Record<string, string> {
  const tuple: Record<string, string> = {};
  for (const axis of axes) {
    if (axis.name === MODE_AXIS) continue;
    tuple[axis.name] = defaults[axis.name] ?? axis.default;
  }
  if (typeof window === 'undefined') return tuple;
  try {
    const raw = window.localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return tuple;
    const parsed = JSON.parse(raw) as { tuple?: Record<string, unknown> };
    if (parsed && typeof parsed.tuple === 'object' && parsed.tuple !== null) {
      for (const axis of axes) {
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
 * Mode stays on Docusaurus's own `[data-theme]`; the emitted compound
 * selectors in `tokens.generated.css` combine the two.
 */
function syncNonModeTupleToDocument(
  axes: readonly SwitcherAxis[],
  tuple: Record<string, string>,
): void {
  if (typeof document === 'undefined') return;
  for (const axis of axes) {
    if (axis.name === MODE_AXIS) continue;
    document.documentElement.setAttribute(
      `data-sb-${axis.name}`,
      tuple[axis.name] ?? axis.default,
    );
  }
}

export function SwatchbookSwitcherProvider({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  const axes = useMemo<SwitcherAxis[]>(() => (snapshot as AxesSnapshot).axes, []);
  const presets = useMemo<SwitcherPreset[]>(() => (snapshot as AxesSnapshot).presets, []);
  const defaults = useMemo<Record<string, string>>(() => (snapshot as AxesSnapshot).defaults, []);
  const cssVarPrefix = (snapshot as AxesSnapshot).cssVarPrefix;

  const [nonModeTuple, setNonModeTupleState] = useState<Record<string, string>>(() =>
    readPersistedNonModeTuple(axes, defaults),
  );
  const [activeColorFormat, setColorFormat] = useState<SwitcherColorFormat>('hex');
  const [lastApplied, setLastApplied] = useState<string | null>(null);

  useEffect(() => {
    syncNonModeTupleToDocument(axes, nonModeTuple);
    persistNonModeTuple(nonModeTuple);
  }, [axes, nonModeTuple]);

  const setNonModeAxis = useCallback((axisName: string, next: string) => {
    if (axisName === MODE_AXIS) return;
    setNonModeTupleState((prev) => ({ ...prev, [axisName]: next }));
  }, []);

  const applyNonModeFromPreset = useCallback(
    (preset: SwitcherPreset) => {
      setNonModeTupleState((prev) => {
        const next: Record<string, string> = { ...prev };
        for (const axis of axes) {
          if (axis.name === MODE_AXIS) continue;
          const candidate = preset.axes[axis.name];
          if (candidate !== undefined && axis.contexts.includes(candidate)) {
            next[axis.name] = candidate;
          }
        }
        return next;
      });
    },
    [axes],
  );

  const value = useMemo<SwatchbookSwitcherContextValue>(
    () => ({
      axes,
      presets,
      defaults,
      cssVarPrefix,
      nonModeTuple,
      activeColorFormat,
      lastApplied,
      setNonModeAxis,
      applyNonModeFromPreset,
      setLastApplied,
      setColorFormat,
    }),
    [
      axes,
      presets,
      defaults,
      cssVarPrefix,
      nonModeTuple,
      activeColorFormat,
      lastApplied,
      setNonModeAxis,
      applyNonModeFromPreset,
    ],
  );

  return (
    <SwatchbookSwitcherContext.Provider value={value}>
      {children}
    </SwatchbookSwitcherContext.Provider>
  );
}

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

const LOCAL_STORAGE_KEY = 'swatchbook-docs-switcher';

/**
 * `color.mode` is driven by Docusaurus's built-in colour-mode toggle, which
 * also controls the `[data-theme]` attribute on `<html>` plus `prefers-colour-scheme`
 * styling elsewhere in the site. The switcher keeps axis-aware UX for every
 * *other* axis (today: a11y); mode stays lowercase via Docusaurus so the
 * two don't fight over the `<html>` attribute.
 */
const DOCUSAURUS_MODE_AXIS = 'mode';

interface SwatchbookSwitcherContextValue extends AxesSnapshot {
  activeTuple: Record<string, string>;
  activeColorFormat: SwitcherColorFormat;
  lastApplied: string | null;
  setAxis(axisName: string, next: string): void;
  applyPreset(preset: SwitcherPreset): void;
  setColorFormat(next: SwitcherColorFormat): void;
}

const SwatchbookSwitcherContext = createContext<SwatchbookSwitcherContextValue | null>(null);

export function useSwatchbookSwitcher(): SwatchbookSwitcherContextValue {
  const ctx = useContext(SwatchbookSwitcherContext);
  if (!ctx) {
    throw new Error(
      'useSwatchbookSwitcher must be called inside <SwatchbookSwitcherProvider>',
    );
  }
  return ctx;
}

function readPersistedTuple(
  axes: readonly SwitcherAxis[],
  defaults: Record<string, string>,
): Record<string, string> {
  const tuple: Record<string, string> = { ...defaults };
  if (typeof window === 'undefined') return tuple;
  try {
    const raw = window.localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return tuple;
    const parsed = JSON.parse(raw) as { tuple?: Record<string, unknown> };
    if (parsed && typeof parsed.tuple === 'object' && parsed.tuple !== null) {
      for (const axis of axes) {
        if (axis.name === DOCUSAURUS_MODE_AXIS) continue;
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

function persistTuple(tuple: Record<string, string>): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({ tuple }));
  } catch {
    // localStorage full / disabled — UX still works for the session.
  }
}

/**
 * Writes each non-mode axis onto `<html>` as `data-sb-<axis>="<context>"`.
 * The emitted CSS under `src/css/tokens.generated.css` uses these
 * attributes directly (multi-axis compound selectors like
 * `[data-theme="dark"][data-sb-a11y="High-contrast"]`). Mode stays on
 * `data-theme` and is owned by Docusaurus's own colour-mode toggle.
 */
function syncTupleToDocument(
  axes: readonly SwitcherAxis[],
  tuple: Record<string, string>,
): void {
  if (typeof document === 'undefined') return;
  for (const axis of axes) {
    if (axis.name === DOCUSAURUS_MODE_AXIS) continue;
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
  const axes = useMemo<SwitcherAxis[]>(
    () => (snapshot as AxesSnapshot).axes,
    [],
  );
  const presets = useMemo<SwitcherPreset[]>(
    () => (snapshot as AxesSnapshot).presets,
    [],
  );
  const defaults = useMemo<Record<string, string>>(
    () => (snapshot as AxesSnapshot).defaults,
    [],
  );
  const cssVarPrefix = (snapshot as AxesSnapshot).cssVarPrefix;

  const [tuple, setTuple] = useState<Record<string, string>>(() =>
    readPersistedTuple(axes, defaults),
  );
  const [activeColorFormat, setColorFormat] = useState<SwitcherColorFormat>('hex');
  const [lastApplied, setLastApplied] = useState<string | null>(null);

  useEffect(() => {
    syncTupleToDocument(axes, tuple);
    persistTuple(tuple);
  }, [axes, tuple]);

  const setAxis = useCallback(
    (axisName: string, next: string) => {
      setTuple((prev) => ({ ...prev, [axisName]: next }));
    },
    [],
  );

  const applyPreset = useCallback(
    (preset: SwitcherPreset) => {
      setTuple((prev) => {
        const next: Record<string, string> = { ...prev };
        for (const axis of axes) {
          const candidate = preset.axes[axis.name];
          if (candidate !== undefined && axis.contexts.includes(candidate)) {
            next[axis.name] = candidate;
          }
        }
        return next;
      });
      setLastApplied(preset.name);
    },
    [axes],
  );

  const value = useMemo<SwatchbookSwitcherContextValue>(
    () => ({
      axes,
      presets,
      defaults,
      cssVarPrefix,
      activeTuple: tuple,
      activeColorFormat,
      lastApplied,
      setAxis,
      applyPreset,
      setColorFormat,
    }),
    [axes, presets, defaults, cssVarPrefix, tuple, activeColorFormat, lastApplied, setAxis, applyPreset],
  );

  return (
    <SwatchbookSwitcherContext.Provider value={value}>
      {children}
    </SwatchbookSwitcherContext.Provider>
  );
}

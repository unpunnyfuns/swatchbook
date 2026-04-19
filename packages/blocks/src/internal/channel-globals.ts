import { useSyncExternalStore } from 'react';
import { addons } from 'storybook/preview-api';
import { COLOR_FORMATS, type ColorFormat } from '#/internal/format-color.ts';

/**
 * Shared subscription to Storybook's globals channel, lifted out of React
 * component state so the values survive docs-mode remounts.
 *
 * On MDX docs pages, Storybook force-rerenders the docs container on every
 * `updateGlobals` (see `preview/runtime.js` → `onUpdateGlobals`), which
 * unmounts and remounts any embedded blocks. A `useState(null)` initializer
 * inside the block would reset to null on each remount — the symptom is a
 * one-frame flicker to the correct value, then revert to the defaults.
 * Module-level state persists; React reads it through `useSyncExternalStore`
 * and stays concurrent-safe.
 */

export interface ChannelGlobals {
  axes: Record<string, string> | null;
  theme: string | null;
  format: ColorFormat | null;
}

const AXES_GLOBAL_KEY = 'swatchbookAxes';
const THEME_GLOBAL_KEY = 'swatchbookTheme';
const COLOR_FORMAT_GLOBAL_KEY = 'swatchbookColorFormat';

let snapshot: ChannelGlobals = { axes: null, theme: null, format: null };
const listeners = new Set<() => void>();
let subscribed = false;

function isColorFormat(value: unknown): value is ColorFormat {
  return typeof value === 'string' && (COLOR_FORMATS as readonly string[]).includes(value);
}

function ensureSubscribed(): void {
  if (subscribed || typeof window === 'undefined') return;
  subscribed = true;
  const channel = addons.getChannel();
  const onGlobals = (payload: { globals?: Record<string, unknown> }): void => {
    const globals = payload.globals;
    if (!globals) return;
    let next = snapshot;
    const nextAxes = globals[AXES_GLOBAL_KEY];
    if (nextAxes && typeof nextAxes === 'object') {
      next = { ...next, axes: nextAxes as Record<string, string> };
    }
    const nextTheme = globals[THEME_GLOBAL_KEY];
    if (typeof nextTheme === 'string') {
      next = { ...next, theme: nextTheme };
    }
    const nextFormat = globals[COLOR_FORMAT_GLOBAL_KEY];
    if (isColorFormat(nextFormat)) {
      next = { ...next, format: nextFormat };
    }
    if (next !== snapshot) {
      snapshot = next;
      for (const cb of listeners) cb();
    }
  };
  /**
   * Intentionally not listening to `setGlobals` here. It fires once on
   * preview init carrying the current user globals — if any updates have
   * happened the manager re-emits `updateGlobals` for us. Listening to
   * `setGlobals` added no coverage in practice and risks overwriting a
   * just-toggled value with the pre-toggle snapshot in edge-case orderings.
   */
  channel.on('globalsUpdated', onGlobals);
  channel.on('updateGlobals', onGlobals);
}

function subscribe(cb: () => void): () => void {
  ensureSubscribed();
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

function getSnapshot(): ChannelGlobals {
  return snapshot;
}

function getServerSnapshot(): ChannelGlobals {
  return snapshot;
}

export function useChannelGlobals(): ChannelGlobals {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

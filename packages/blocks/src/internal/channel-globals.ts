import { useSyncExternalStore } from 'react';
import { addons } from 'storybook/preview-api';
import { COLOR_FORMATS, type ColorFormat } from '#/format-color.ts';

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
  format: ColorFormat | null;
}

const AXES_GLOBAL_KEY = 'swatchbookAxes';
const COLOR_FORMAT_GLOBAL_KEY = 'swatchbookColorFormat';

let snapshot: ChannelGlobals = { axes: null, format: null };
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
   * `setGlobals` fires once on preview init carrying the URL-persisted user
   * globals (Storybook stores toolbar selections in `?globals=…`). Without
   * this listener, deeplinking to an MDX page with a non-default axis tuple
   * or color format renders defaults for one frame before the first
   * `updateGlobals` arrives. `emitGlobals()` reads from `userGlobals.get()`
   * (current state), so the payload is never stale — safe to handle.
   */
  channel.on('globalsUpdated', onGlobals);
  channel.on('updateGlobals', onGlobals);
  channel.on('setGlobals', onGlobals);
}

/**
 * Subscribe at module load so the `SET_GLOBALS` emission from preview init
 * lands in our snapshot before any block renders. Running `useSyncExternalStore`'s
 * `subscribe` lazily on first hook call would miss the event in most cases.
 */
ensureSubscribed();

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

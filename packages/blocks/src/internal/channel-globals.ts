import { useSyncExternalStore } from 'react';
import { onChannel } from '#/internal/channel.ts';
import type { BlockChannel } from '#/internal/channel.ts';
import { COLOR_FORMATS } from '#/format-color.ts';
import type { ColorFormat } from '#/format-color.ts';

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

interface SwatchbookGlobalsPayload {
  swatchbookAxes?: Record<string, string>;
  swatchbookColorFormat?: ColorFormat;
  [key: string]: unknown;
}

// Attach the globals subscriptions once the host channel is injected.
// `subscribed` guards against an HMR re-register double-wiring listeners.
function attach(channel: BlockChannel): void {
  if (subscribed) return;
  subscribed = true;
  // Storybook fires `globalsUpdated`, `setGlobals`, and `updateGlobals`
  // for the same logical change (preview init + every toolbar tick).
  // Subscribing to all three is intentional — `setGlobals` carries the
  // initial URL-persisted globals; `updateGlobals` is the toolbar
  // signal; `globalsUpdated` is the cross-frame echo. The handler runs
  // for each but content-deduplicates: we only update the shared
  // snapshot when axes or format actually shifted, so the three events
  // per tick don't each trigger a re-render.
  let lastFingerprint = '';
  const onGlobals = (payload: { globals?: SwatchbookGlobalsPayload }): void => {
    const globals = payload.globals;
    if (!globals) return;
    const incomingAxes = globals[AXES_GLOBAL_KEY];
    const incomingFormat = globals[COLOR_FORMAT_GLOBAL_KEY];
    const nextAxes =
      incomingAxes && typeof incomingAxes === 'object' ? incomingAxes : snapshot.axes;
    const nextFormat = isColorFormat(incomingFormat) ? incomingFormat : snapshot.format;
    const fingerprint = `${nextFormat ?? ''}|${nextAxes ? JSON.stringify(nextAxes) : ''}`;
    if (fingerprint === lastFingerprint) return;
    lastFingerprint = fingerprint;
    snapshot = { axes: nextAxes, format: nextFormat };
    for (const cb of listeners) cb();
  };
  channel.on<{ globals?: SwatchbookGlobalsPayload }>('globalsUpdated', onGlobals);
  channel.on<{ globals?: SwatchbookGlobalsPayload }>('updateGlobals', onGlobals);
  channel.on<{ globals?: SwatchbookGlobalsPayload }>('setGlobals', onGlobals);
}

// Wire at module load so the init `SET_GLOBALS` emission lands in our snapshot
// before any block renders. `onChannel` runs `attach` immediately if the addon
// already injected the channel, else the moment it does.
onChannel(attach);

function subscribe(cb: () => void): () => void {
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

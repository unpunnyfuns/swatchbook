import { useSyncExternalStore } from 'react';
import { addons } from 'storybook/preview-api';
import {
  axes as initialAxes,
  cells as initialCells,
  css as initialCss,
  cssVarPrefix as initialCssVarPrefix,
  defaultTuple as initialDefaultTuple,
  diagnostics as initialDiagnostics,
  jointOverrides as initialJointOverrides,
  listing as initialListing,
  presets as initialPresets,
  varianceByPath as initialVarianceByPath,
} from 'virtual:swatchbook/tokens';
import type {
  VirtualJointOverrideShape,
  VirtualTokenListingShape,
  VirtualVarianceByPathShape,
} from '#/contexts.ts';
import type { VirtualAxis, VirtualDiagnostic, VirtualToken } from '#/types.ts';

/**
 * Live token snapshot backed by the addon's preview dev-time HMR event.
 *
 * Blocks read the virtual module at module load; without a way to notice
 * changes, edits to the source token files would flow into the addon's
 * in-memory project but nowhere else — the React tree would keep
 * rendering the old values until a full preview reload. This module
 * subscribes to `TOKENS_UPDATED_EVENT` on Storybook's channel (which the
 * addon preview re-broadcasts from its own HMR listener) and exposes
 * the latest snapshot via `useSyncExternalStore`, so hooks that read
 * through this module re-render in place on each token save.
 *
 * Outside the preview iframe (the docs-site path, unit tests) the
 * channel never receives anything, and consumers keep seeing the
 * initial values baked into the virtual module at build time.
 */

const TOKENS_UPDATED_EVENT = 'swatchbook/tokens-updated';

export interface TokenSnapshot {
  readonly axes: readonly VirtualAxis[];
  readonly presets: readonly {
    name: string;
    axes: Partial<Record<string, string>>;
    description?: string;
  }[];
  readonly diagnostics: readonly VirtualDiagnostic[];
  readonly css: string;
  readonly cssVarPrefix: string;
  readonly listing: Readonly<Record<string, VirtualTokenListingShape>>;
  readonly cells: Record<string, Record<string, Record<string, VirtualToken>>>;
  readonly jointOverrides: readonly (readonly [string, VirtualJointOverrideShape])[];
  readonly varianceByPath: VirtualVarianceByPathShape;
  readonly defaultTuple: Record<string, string>;
  /** Monotonic counter, bumped on each update. Useful as a React key. */
  readonly version: number;
}

let snapshot: TokenSnapshot = {
  axes: initialAxes,
  presets: initialPresets,
  diagnostics: initialDiagnostics,
  css: initialCss,
  cssVarPrefix: initialCssVarPrefix,
  listing: initialListing ?? {},
  cells: initialCells ?? {},
  jointOverrides: initialJointOverrides ?? [],
  varianceByPath: initialVarianceByPath ?? {},
  defaultTuple: initialDefaultTuple ?? {},
  version: 0,
};

const listeners = new Set<() => void>();
let subscribed = false;

function ensureSubscribed(): void {
  if (subscribed || typeof window === 'undefined') return;
  subscribed = true;
  const channel = addons.getChannel();
  channel.on(TOKENS_UPDATED_EVENT, (payload: Partial<TokenSnapshot>) => {
    snapshot = {
      axes: payload.axes ?? snapshot.axes,
      presets: payload.presets ?? snapshot.presets,
      diagnostics: payload.diagnostics ?? snapshot.diagnostics,
      css: payload.css ?? snapshot.css,
      cssVarPrefix: payload.cssVarPrefix ?? snapshot.cssVarPrefix,
      listing: payload.listing ?? snapshot.listing,
      cells: payload.cells ?? snapshot.cells,
      jointOverrides: payload.jointOverrides ?? snapshot.jointOverrides,
      varianceByPath: payload.varianceByPath ?? snapshot.varianceByPath,
      defaultTuple: payload.defaultTuple ?? snapshot.defaultTuple,
      version: snapshot.version + 1,
    };
    for (const cb of listeners) cb();
  });
}

ensureSubscribed();

function subscribe(cb: () => void): () => void {
  ensureSubscribed();
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

function getSnapshot(): TokenSnapshot {
  return snapshot;
}

export function useTokenSnapshot(): TokenSnapshot {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

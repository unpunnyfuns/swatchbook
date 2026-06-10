import { useSyncExternalStore } from 'react';
import { addons } from 'storybook/preview-api';
import type { VirtualTokenGraph, VirtualTokenListingShape } from '#/contexts.ts';
import type { VirtualAxis, VirtualDiagnostic } from '#/types.ts';

/**
 * Live token snapshot backed by the addon's preview dev-time HMR event.
 *
 * The initial snapshot is *injected* by the addon preview via
 * {@link registerTokenSource} rather than imported from the addon's
 * `virtual:swatchbook/tokens` build artifact — so blocks carries no
 * dependency on that module and imports cleanly standalone (outside
 * Storybook, in unit tests, in the docs site). Until something registers
 * a source, blocks render from empty defaults.
 *
 * For dev-time updates this module subscribes to `TOKENS_UPDATED_EVENT`
 * on Storybook's channel (which the addon preview re-broadcasts from its
 * own HMR listener) and exposes the latest snapshot via
 * `useSyncExternalStore`, so hooks re-render in place on each token save.
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
  readonly tokenGraph: VirtualTokenGraph;
  readonly defaultTuple: Record<string, string>;
  /** Monotonic counter, bumped on each update. Useful as a React key. */
  readonly version: number;
}

const EMPTY_TOKEN_GRAPH: VirtualTokenGraph = {
  nodes: {},
  axes: [],
  axisDefaults: {},
  axisContexts: {},
};

const EMPTY_SNAPSHOT: TokenSnapshot = {
  axes: [],
  presets: [],
  diagnostics: [],
  css: '',
  cssVarPrefix: '',
  listing: {},
  tokenGraph: EMPTY_TOKEN_GRAPH,
  defaultTuple: {},
  version: 0,
};

let snapshot: TokenSnapshot = EMPTY_SNAPSHOT;

const listeners = new Set<() => void>();
let subscribed = false;

// Merge a partial payload over the current snapshot, keeping prior values
// for omitted fields and bumping the version. Shared by the injected
// initial source and the dev-time channel updates.
function applyPatch(patch: Partial<TokenSnapshot>): void {
  snapshot = {
    axes: patch.axes ?? snapshot.axes,
    presets: patch.presets ?? snapshot.presets,
    diagnostics: patch.diagnostics ?? snapshot.diagnostics,
    css: patch.css ?? snapshot.css,
    cssVarPrefix: patch.cssVarPrefix ?? snapshot.cssVarPrefix,
    listing: patch.listing ?? snapshot.listing,
    tokenGraph: patch.tokenGraph ?? snapshot.tokenGraph,
    defaultTuple: patch.defaultTuple ?? snapshot.defaultTuple,
    version: snapshot.version + 1,
  };
  for (const cb of listeners) cb();
}

/**
 * Seed the initial token snapshot. The addon preview calls this once at
 * init with the build-time `virtual:swatchbook/tokens` data. Keeping the
 * virtual-module read on the addon side (the package that owns it) lets
 * blocks import cleanly without it. No-op fields fall back to the current
 * snapshot, so a partial source is safe.
 */
export function registerTokenSource(source: Partial<TokenSnapshot>): void {
  applyPatch(source);
}

function ensureSubscribed(): void {
  if (subscribed || typeof window === 'undefined') return;
  subscribed = true;
  const channel = addons.getChannel();
  channel.on(TOKENS_UPDATED_EVENT, (payload: Partial<TokenSnapshot>) => {
    applyPatch(payload);
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

function getServerSnapshot(): TokenSnapshot {
  return snapshot;
}

export function useTokenSnapshot(): TokenSnapshot {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

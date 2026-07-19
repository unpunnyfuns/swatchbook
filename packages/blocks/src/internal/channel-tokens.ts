import { useSyncExternalStore } from 'react';
import { onChannel } from '#/internal/channel.ts';
import type { BlockChannel } from '#/internal/channel.ts';
import type { VirtualTokenGraph, VirtualTokenListing } from '#/contexts.ts';
import type { ColorFormat } from '#/format-color.ts';
import type { VirtualAxis, VirtualDiagnostic } from '#/types.ts';

/**
 * Host adapter API — same integration tier as {@link BlockChannel} /
 * {@link registerChannel} / {@link onChannel}, distinct from the
 * components/hooks/`SwatchbookProvider` surface MDX/story authors use.
 * Most consumers never touch this; it exists for whoever builds the next
 * host integration.
 *
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

// The dev-time HMR wire event. Single source of truth: the addon preview
// emits it, this module listens — exported so the two can't drift.
export const TOKENS_UPDATED_EVENT = 'swatchbook/tokens-updated';

/** Host adapter API — see {@link registerTokenSource}. */
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
  /** Project-wide baseline for the row-indicator strip from `config.indicators`. */
  readonly indicators: Readonly<Record<string, boolean>>;
  readonly listing: Readonly<Record<string, VirtualTokenListing>>;
  readonly tokenGraph: VirtualTokenGraph;
  readonly defaultTuple: Record<string, string>;
  /**
   * Starting color format for blocks that display color values:
   * `config.defaultColorFormat` from core, forwarded from the addon's
   * `registerTokenSource` call. `useColorFormat()` falls back to this on
   * the provider-less (MDX/autodocs) path when no `ColorFormatContext`/
   * channel-globals override is active.
   */
  readonly defaultColorFormat: ColorFormat;
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
  indicators: {},
  listing: {},
  tokenGraph: EMPTY_TOKEN_GRAPH,
  defaultTuple: {},
  defaultColorFormat: 'hex',
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
    indicators: patch.indicators ?? snapshot.indicators,
    listing: patch.listing ?? snapshot.listing,
    tokenGraph: patch.tokenGraph ?? snapshot.tokenGraph,
    defaultTuple: patch.defaultTuple ?? snapshot.defaultTuple,
    defaultColorFormat: patch.defaultColorFormat ?? snapshot.defaultColorFormat,
    version: snapshot.version + 1,
  };
  for (const cb of listeners) cb();
}

/**
 * Host adapter API — same integration tier as {@link registerChannel}.
 *
 * Seed the initial token snapshot. The addon preview calls this once at
 * init with the build-time `virtual:swatchbook/tokens` data. Keeping the
 * virtual-module read on the addon side (the package that owns it) lets
 * blocks import cleanly without it. No-op fields fall back to the current
 * snapshot, so a partial source is safe.
 */
export function registerTokenSource(source: Partial<TokenSnapshot>): void {
  applyPatch(source);
}

// Attach once the host channel is injected. `subscribed` guards against an
// HMR re-register double-wiring the listener.
function attach(channel: BlockChannel): void {
  if (subscribed) return;
  subscribed = true;
  channel.on<Partial<TokenSnapshot>>(TOKENS_UPDATED_EVENT, (payload) => {
    applyPatch(payload);
  });
}

onChannel(attach);

function subscribe(cb: () => void): () => void {
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

/**
 * Host adapter API — same integration tier as {@link registerChannel}. Most
 * consumers read project data through `useSwatchbookData()` /
 * `SwatchbookProvider` instead; this is the internal subscription
 * `useProject()`'s fallback path uses to read the live channel-fed snapshot.
 */
export function useTokenSnapshot(): TokenSnapshot {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

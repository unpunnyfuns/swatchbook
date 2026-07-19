import { useSyncExternalStore } from 'react';
import type { VirtualTokenGraph, VirtualTokenListing } from '#/contexts.ts';
import type { ColorFormat } from '#/format-color.ts';
import type { VirtualAxis, VirtualDiagnostic } from '#/types.ts';

/**
 * Host adapter API: generic ambient project source. A host (an addon,
 * a plugin, a CLI preview server) decodes its own transport (Storybook
 * channel, WebSocket, whatever) and pushes decoded snapshots in via
 * {@link registerProjectSource}. This module carries no transport or
 * decoding logic of its own; that keeps blocks importable standalone
 * (outside Storybook, in unit tests, in the docs site) with no host
 * dependency. Until a host registers a source, blocks render from empty
 * defaults.
 */

/** Host adapter API: see {@link registerProjectSource}. */
export interface ProjectSource {
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
   * `config.defaultColorFormat` from core, forwarded by the host.
   * `useColorFormat()` falls back to this on the provider-less
   * (MDX/autodocs) path when no `ColorFormatContext`/channel-globals
   * override is active.
   */
  readonly defaultColorFormat: ColorFormat;
  /** The host's currently active axis tuple, or null before a host reports one. */
  readonly activeAxes: Record<string, string> | null;
  /** Monotonic counter, bumped on each update. Useful as a React key. */
  readonly version: number;
}

const EMPTY_TOKEN_GRAPH: VirtualTokenGraph = {
  nodes: {},
  axes: [],
  axisDefaults: {},
  axisContexts: {},
};

const EMPTY_SOURCE: ProjectSource = {
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
  activeAxes: null,
  version: 0,
};

let source: ProjectSource = EMPTY_SOURCE;

const listeners = new Set<() => void>();

/**
 * Host adapter API. Push a (partial) project snapshot into the ambient
 * store. Omitted fields fall back to the current source, so a host can
 * call this repeatedly with incremental patches (e.g. one per HMR event
 * or axis flip) without re-sending the whole snapshot each time.
 */
export function registerProjectSource(patch: Partial<ProjectSource>): void {
  source = {
    axes: patch.axes ?? source.axes,
    presets: patch.presets ?? source.presets,
    diagnostics: patch.diagnostics ?? source.diagnostics,
    css: patch.css ?? source.css,
    cssVarPrefix: patch.cssVarPrefix ?? source.cssVarPrefix,
    indicators: patch.indicators ?? source.indicators,
    listing: patch.listing ?? source.listing,
    tokenGraph: patch.tokenGraph ?? source.tokenGraph,
    defaultTuple: patch.defaultTuple ?? source.defaultTuple,
    defaultColorFormat: patch.defaultColorFormat ?? source.defaultColorFormat,
    // activeAxes distinguishes omitted (fall back to current) from an
    // explicit null (clear the tuple); `??` alone can't express that.
    activeAxes: 'activeAxes' in patch ? (patch.activeAxes ?? null) : source.activeAxes,
    version: source.version + 1,
  };
  for (const cb of listeners) cb();
}

function subscribe(cb: () => void): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

function getSnapshot(): ProjectSource {
  return source;
}

function getServerSnapshot(): ProjectSource {
  return source;
}

/**
 * Host adapter API. Read the live, ambient project source. Re-renders in
 * place on each {@link registerProjectSource} call.
 */
export function useProjectSource(): ProjectSource {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

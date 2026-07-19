import {
  resolveAllWithProvenanceAt,
  getVariance,
  listPaths,
} from '@unpunnyfuns/swatchbook-core/graph';
import { cssVarRef } from '@unpunnyfuns/swatchbook-core/css-var';
import {
  ensureStyleElement,
  SWATCHBOOK_STYLE_ELEMENT_ID,
} from '@unpunnyfuns/swatchbook-core/style-element';
import { tupleToName } from '@unpunnyfuns/swatchbook-core/themes';
import type { AxisVarianceResult } from '@unpunnyfuns/swatchbook-core';
import { useEffect, useMemo } from 'react';
import type { VirtualTokenGraph, VirtualTokenListing } from '#/contexts.ts';

type VirtualVarianceByPathShape = Record<string, AxisVarianceResult>;

// Pre-compute variance for every path in the graph. `getVariance` is cheap
// (O(paths × axes)); callers wrap this in `useMemo` keyed on the graph so it
// recomputes only on an HMR refresh. Shared by the provider and fallback paths.
function computeVarianceByPath(graph: VirtualTokenGraph | undefined): VirtualVarianceByPathShape {
  if (!graph) return {};
  const out: VirtualVarianceByPathShape = {};
  for (const path of listPaths(graph)) {
    out[path] = getVariance(graph, path);
  }
  return out;
}
import { useActiveAxes, useActiveTheme, useOptionalSwatchbookData } from '#/contexts.ts';
import { formatColor } from '#/format-color.ts';
import type { ColorFormat, FormatColorResult } from '#/format-color.ts';
import { useProjectSource } from '#/host.ts';
import type { ProjectSnapshot, VirtualAxis, VirtualDiagnostic, VirtualToken } from '#/types.ts';

type ResolvedTokens = Record<string, VirtualToken>;

export interface ProjectData {
  activeTheme: string;
  activeAxes: Record<string, string>;
  axes: readonly VirtualAxis[];
  resolved: ResolvedTokens;
  diagnostics: readonly VirtualDiagnostic[];
  cssVarPrefix: string;
  /**
   * Project-wide baseline for the row-indicator strip from
   * `config.indicators`. `{}` when absent. Strip-hosting blocks pass it as
   * the baseline arg to `resolveIndicators` so a per-block `indicators`
   * prop overrides it.
   */
  indicators: Readonly<Record<string, boolean>>;
  /**
   * Path-indexed Token Listing data. Empty when absent (non-resolver
   * projects, hand-built snapshots that don't populate it). Blocks read
   * authoritative CSS var names from `listing[path].names.css` and
   * preview strings from `listing[path].previewValue`.
   */
  listing: Readonly<Record<string, VirtualTokenListing>>;
  /**
   * Cached per-path `AxisVarianceResult` — blocks use this for O(1)
   * variance lookup instead of re-running the analysis on every
   * render.
   */
  varianceByPath: VirtualVarianceByPathShape;
  /**
   * Compose the resolved `TokenMap` for any tuple of axis selections.
   * Backed browser-side by `resolveAllWithProvenanceAt` over the `tokenGraph`.
   */
  resolveAt: (tuple: Record<string, string>) => ResolvedTokens;
}

function ensureStylesheet(css: string): void {
  ensureStyleElement(SWATCHBOOK_STYLE_ELEMENT_ID, css);
}

function defaultTuple(axes: readonly VirtualAxis[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const axis of axes) out[axis.name] = axis.default;
  return out;
}

// Build a `resolveAt` accessor backed by the token graph. Returns an
// empty resolver when no graph is present (test stubs, partial
// snapshots). Stable identity when memoized on `tokenGraph` — the
// graph is a module-level virtual-module export so its reference stays
// constant for the lifetime of the iframe.
function makeResolveAt(
  graph: VirtualTokenGraph | undefined,
): (tuple: Record<string, string>) => ResolvedTokens {
  if (!graph) return () => ({});
  return (tuple) => resolveAllWithProvenanceAt(graph, tuple) as unknown as ResolvedTokens;
}

// Build the `resolveAt` accessor for a snapshot. Prefers the
// snapshot's own `resolveAt` (the addon's preview decorator
// pre-builds one at module load — see `previewResolveAt` in
// `packages/addon/src/preview.tsx`), otherwise builds one from
// `tokenGraph`. Hand-built snapshots can omit `resolveAt`;
// the graph-backed fallback covers them.
function snapshotResolveAt(
  snapshot: ProjectSnapshot,
): (tuple: Record<string, string>) => ResolvedTokens {
  if (snapshot.resolveAt)
    return snapshot.resolveAt as (tuple: Record<string, string>) => ResolvedTokens;
  return makeResolveAt(snapshot.tokenGraph);
}

/**
 * Reads project data either from a mounted {@link SwatchbookProvider}
 * (preferred: the addon's preview decorator installs one around every
 * story) or, when no provider is present, from the ambient project source
 * a host pushes into via `registerProjectSource` (`#/host.ts`).
 *
 * The provider-less path is what makes the hook safe to call from MDX
 * doc blocks and autodocs renders where no story is active. It
 * self-mounts the source's per-theme CSS and tracks the active tuple via
 * the source's `activeAxes`, since a story-scoped globals hook only works
 * while a story is rendering.
 */
export function useProject(): ProjectData {
  const snapshot = useOptionalSwatchbookData();
  // Memoize against the stable underlying fields, NOT the snapshot
  // wrapper. Storybook rebuilds `context.globals` identity on every
  // render → the preview's `tuple` useMemo invalidates → the
  // provider's snapshot useMemo rebuilds. Keying off `snapshot`
  // would mean `makeResolveAt` runs on every render, producing a
  // fresh closure with a fresh internal memo, so `resolved` would
  // have a new identity each render. Downstream block
  // `useMemo([resolved, …])` calls would recompute forever; the
  // `TokenNavigator`'s focus-repair `useEffect` (deps include the
  // recomputed `flatVisible`) would `setState` in an infinite loop.
  // The underlying `tokenGraph` reference is a stable module-level
  // virtual-module export, so depending on it directly keeps `resolveAt`
  // (and the resolved map it returns) referentially stable across renders.
  const axes = snapshot?.axes;
  const activeAxes = snapshot?.activeAxes;
  const activeTheme = snapshot?.activeTheme;
  const diagnostics = snapshot?.diagnostics;
  const cssVarPrefix = snapshot?.cssVarPrefix;
  const indicators = snapshot?.indicators;
  const listing = snapshot?.listing;
  const tokenGraph = snapshot?.tokenGraph;
  const resolveAt = useMemo(() => {
    if (!snapshot) return null;
    return snapshotResolveAt(snapshot);
    // The deps below are deliberately the stable inner fields rather
    // than `snapshot` itself; see the long block comment above.
    // `tokenGraph` is a stable module-level virtual-module export, so
    // depending on it directly keeps `resolveAt` (and the resolved map
    // it returns) referentially stable across renders.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokenGraph, activeTheme]);
  const derivedVarianceByPath = useMemo(() => computeVarianceByPath(tokenGraph), [tokenGraph]);
  // Memoize the returned ProjectData against the same stable inner
  // fields — without this, blocks `useMemo([project, …])` calls
  // invalidate every render (the function returns a fresh object
  // identity), defeating the per-block memoization that
  // `TokenNavigator` / `TokenTable` / `ColorPalette` rely on.
  const providerData = useMemo<ProjectData | null>(() => {
    if (!snapshot || !resolveAt || !axes || !activeAxes) return null;
    return {
      activeTheme: activeTheme ?? '',
      activeAxes: activeAxes as Record<string, string>,
      axes,
      resolved: resolveAt(activeAxes as Record<string, string>),
      diagnostics: diagnostics ?? [],
      cssVarPrefix: cssVarPrefix ?? '',
      indicators: indicators ?? {},
      listing: listing ?? {},
      varianceByPath: derivedVarianceByPath,
      resolveAt,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    snapshot,
    resolveAt,
    axes,
    activeTheme,
    activeAxes,
    diagnostics,
    cssVarPrefix,
    indicators,
    listing,
    derivedVarianceByPath,
    tokenGraph,
  ]);
  const fallback = useVirtualModuleFallback(snapshot === null);
  return providerData ?? fallback;
}

function useVirtualModuleFallback(enabled: boolean): ProjectData {
  const contextThemeName = useActiveTheme();
  const contextAxes = useActiveAxes();
  // Subscribe to the ambient project source rather than reading the
  // virtual module's module-level exports directly. Initial values come
  // from the host's build-time seed; subsequent dev-time edits flow
  // through the host's own decoding (the addon's `host-source.ts`) and
  // update this source in place so blocks re-render without a full
  // preview reload.
  const source = useProjectSource();

  useEffect(() => {
    if (!enabled) return;
    ensureStylesheet(source.css);
  }, [enabled, source.css]);

  // Memoize against the stable identities — `contextAxes` is a
  // useContext value that's stable across renders unless the
  // provider mutates; `source.activeAxes` updates when a host pushes a
  // new tuple; `source.axes` is a stable field on the ambient source.
  // Without this memo `activeAxes` would have fresh identity per
  // render and defeat downstream `useMemo([project, …])` calls.
  const activeAxes = useMemo<Record<string, string>>(() => {
    const hasContextAxes = Object.keys(contextAxes).length > 0;
    return hasContextAxes ? { ...contextAxes } : (source.activeAxes ?? defaultTuple(source.axes));
  }, [contextAxes, source.activeAxes, source.axes]);

  const activeTheme = contextThemeName || tupleToName(source.axes, activeAxes);

  // `resolveAllWithProvenanceAt` is a pure function over the graph; the only memo
  // we need is for the outer closure so React's reference equality
  // stays stable between renders. `source.tokenGraph` keeps its prior
  // reference across a source update unless the patch actually touches
  // it (see `registerProjectSource`'s per-field merge), so this only
  // recomputes on a real token refresh.
  const resolveAt = useMemo(() => makeResolveAt(source.tokenGraph), [source.tokenGraph]);

  const fallbackVarianceByPath = useMemo(
    () => computeVarianceByPath(source.tokenGraph),
    [source.tokenGraph],
  );

  // Memoize the returned ProjectData against the stable inner fields
  // for the same reason the provider path does — fresh object identity
  // per render would defeat `useMemo([project, …])` in every block.
  return useMemo<ProjectData>(
    () => ({
      activeTheme,
      activeAxes,
      axes: source.axes,
      resolved: resolveAt(activeAxes),
      diagnostics: source.diagnostics,
      cssVarPrefix: source.cssVarPrefix,
      indicators: source.indicators,
      listing: source.listing,
      varianceByPath: fallbackVarianceByPath,
      resolveAt,
    }),
    [
      activeTheme,
      activeAxes,
      source.axes,
      source.diagnostics,
      source.cssVarPrefix,
      source.indicators,
      source.listing,
      fallbackVarianceByPath,
      resolveAt,
    ],
  );
}

/**
 * Resolve a token's CSS var reference, preferring the authoritative name
 * emitted by `@terrazzo/plugin-css` (as recorded by
 * `@terrazzo/plugin-token-listing` in the snapshot's `listing` field).
 * Falls back to `cssVarRef` when the listing lacks an entry for this
 * path — covers non-resolver projects, hand-built snapshots, and any
 * listing-plugin miss.
 */
export function resolveCssVar(
  path: string,
  project: Pick<ProjectData, 'listing' | 'cssVarPrefix'>,
): string {
  const listed = project.listing[path]?.names?.['css'];
  if (listed) return `var(${listed})`;
  return cssVarRef(path, project.cssVarPrefix);
}

/**
 * Resolve a color value's display string + gamut flag, preferring the
 * listing's `previewValue` when the user's active color-format matches
 * plugin-css's output (hex). For any other format we fall back to
 * `formatColor` so the toolbar's inspection modes (rgb / hsl / oklch /
 * raw) keep working — the listing has only one canonical format.
 *
 * Pass `path === undefined` when resolving a sub-color inside a composite
 * (shadow / border / gradient stop): composites' `previewValue` covers
 * the whole token's rendering, not the individual channel, so there's no
 * listing entry to key against.
 */
export function resolveColorValue(
  path: string | undefined,
  raw: unknown,
  colorFormat: ColorFormat,
  project: Pick<ProjectData, 'listing'>,
): FormatColorResult {
  if (path !== undefined && colorFormat === 'hex') {
    const listed = project.listing[path]?.previewValue;
    if (typeof listed === 'string') {
      return { value: listed, outOfGamut: false };
    }
  }
  return formatColor(raw, colorFormat);
}

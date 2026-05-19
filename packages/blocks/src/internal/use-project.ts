import { buildResolveAt } from '@unpunnyfuns/swatchbook-core/resolve-at';
import { makeCssVar } from '@unpunnyfuns/swatchbook-core/css-var';
import {
  ensureStyleElement,
  SWATCHBOOK_STYLE_ELEMENT_ID,
} from '@unpunnyfuns/swatchbook-core/style-element';
import { tupleToName } from '@unpunnyfuns/swatchbook-core/themes';
import type { Axis, Cells, JointOverrides } from '@unpunnyfuns/swatchbook-core';
import { useEffect, useMemo } from 'react';
import type {
  VirtualTokenGraph,
  VirtualTokenListingShape,
  VirtualVarianceByPathShape,
} from '#/contexts.ts';
import { useActiveAxes, useActiveTheme, useOptionalSwatchbookData } from '#/contexts.ts';
import { formatColor } from '#/format-color.ts';
import type { ColorFormat, FormatColorResult } from '#/format-color.ts';
import { useChannelGlobals } from '#/internal/channel-globals.ts';
import { useTokenSnapshot } from '#/internal/channel-tokens.ts';
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
   * Path-indexed Token Listing data. Empty when absent (non-resolver
   * projects, hand-built snapshots that don't populate it). Blocks read
   * authoritative CSS var names from `listing[path].names.css` and
   * preview strings from `listing[path].previewValue`.
   */
  listing: Readonly<Record<string, VirtualTokenListingShape>>;
  /**
   * Cached per-path `AxisVarianceResult` — blocks use this for O(1)
   * variance lookup instead of re-running the analysis on every
   * render.
   */
  varianceByPath: VirtualVarianceByPathShape;
  /**
   * Pre-built token graph. JSON-safe; nodes carry per-axis writes
   * plus alias edges. Phase 3 block migrations will read from this
   * instead of `cells + jointOverrides`.
   */
  tokenGraph: VirtualTokenGraph;
  /**
   * Compose the resolved `TokenMap` for any tuple of axis selections.
   * Built browser-side from `cells + jointOverrides` shipped over the
   * wire — no resolver needed.
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

/**
 * Reconstruct a `resolveAt` accessor from snapshot data. Both `cells`
 * and `jointOverrides` ship as plain JSON in the same shape core uses
 * internally — no Map reconstruction at the boundary. Stable identity
 * across calls with the same snapshot — `useMemo` keyed on the
 * snapshot fields produces a referentially stable function.
 */
function makeResolveAt(snapshot: {
  axes: readonly VirtualAxis[];
  cells?: ProjectSnapshot['cells'];
  jointOverrides?: ProjectSnapshot['jointOverrides'];
  defaultTuple?: ProjectSnapshot['defaultTuple'];
}): (tuple: Record<string, string>) => ResolvedTokens {
  const cells = (snapshot.cells ?? {}) as Cells;
  const jointOverrides = (snapshot.jointOverrides ?? []) as JointOverrides;
  const defaults = snapshot.defaultTuple ?? defaultTuple(snapshot.axes);
  const resolver = buildResolveAt(
    snapshot.axes as readonly Axis[],
    cells,
    jointOverrides,
    defaults,
  );
  return (tuple) => resolver(tuple);
}

/**
 * Build the `resolveAt` accessor for a snapshot. Prefers the
 * snapshot's own `resolveAt` (the addon's preview decorator
 * pre-builds one at module load — see `previewResolveAt` in
 * `packages/addon/src/preview.tsx`), otherwise composes one from
 * `cells` + `jointOverrides` via `makeResolveAt`. Hand-built
 * snapshots should provide both via the test `withCellsShape`
 * helper or by populating the fields directly.
 */
function snapshotResolveAt(
  snapshot: ProjectSnapshot,
): (tuple: Record<string, string>) => ResolvedTokens {
  if (snapshot.resolveAt)
    return snapshot.resolveAt as (tuple: Record<string, string>) => ResolvedTokens;
  return makeResolveAt(snapshot);
}

/**
 * Reads project data either from a mounted {@link SwatchbookProvider}
 * (preferred — the addon's preview decorator installs one around every
 * story) or, when no provider is present, from the virtual module plus
 * Storybook globals directly.
 *
 * The provider-less path is what makes the hook safe to call from MDX
 * doc blocks and autodocs renders where no story is active. It
 * self-mounts the virtual module's per-theme CSS and tracks the active
 * tuple via the `globalsUpdated` channel event; {@link useGlobals} from
 * `storybook/preview-api` would throw outside a story render.
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
  // The underlying `cells` / `jointOverrides` / `defaultTuple` /
  // `axes` references are stable module-level exports, so depending
  // on them directly keeps `resolveAt` (and the resolved map it
  // returns) referentially stable across renders.
  const axes = snapshot?.axes;
  const cells = snapshot?.cells;
  const jointOverrides = snapshot?.jointOverrides;
  const dataDefaultTuple = snapshot?.defaultTuple;
  const activeAxes = snapshot?.activeAxes;
  const activeTheme = snapshot?.activeTheme;
  const diagnostics = snapshot?.diagnostics;
  const cssVarPrefix = snapshot?.cssVarPrefix;
  const listing = snapshot?.listing;
  const varianceByPath = snapshot?.varianceByPath;
  const tokenGraph = snapshot?.tokenGraph;
  const resolveAt = useMemo(() => {
    if (!snapshot) return null;
    return snapshotResolveAt(snapshot);
    // The deps below are deliberately the stable inner fields rather
    // than `snapshot` itself; see the long block comment above.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [axes, cells, jointOverrides, dataDefaultTuple, activeTheme]);
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
      listing: listing ?? {},
      varianceByPath: varianceByPath ?? {},
      tokenGraph: tokenGraph ?? { nodes: {}, axes: [], axisDefaults: {}, axisContexts: {} },
      resolveAt,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    snapshot,
    resolveAt,
    axes,
    cells,
    jointOverrides,
    dataDefaultTuple,
    activeTheme,
    activeAxes,
    diagnostics,
    cssVarPrefix,
    listing,
    varianceByPath,
    tokenGraph,
  ]);
  const fallback = useVirtualModuleFallback(snapshot === null);
  return providerData ?? fallback;
}

function useVirtualModuleFallback(enabled: boolean): ProjectData {
  const contextPermutation = useActiveTheme();
  const contextAxes = useActiveAxes();
  const channelGlobals = useChannelGlobals();
  /**
   * Subscribe to the live token snapshot rather than reading the virtual
   * module's module-level exports directly. Initial values come from
   * `virtual:swatchbook/tokens` at load time; subsequent dev-time edits
   * flow through the addon's HMR channel and update this snapshot in
   * place so blocks re-render without a full preview reload.
   */
  const tokens = useTokenSnapshot();

  useEffect(() => {
    if (!enabled) return;
    ensureStylesheet(tokens.css);
  }, [enabled, tokens.css]);

  // Memoize against the stable identities — `contextAxes` is a
  // useContext value that's stable across renders unless the
  // provider mutates; `channelGlobals.axes` updates on channel
  // events; `tokens.axes` is a stable virtual-module export.
  // Without this memo `activeAxes` would have fresh identity per
  // render and defeat downstream `useMemo([project, …])` calls.
  const activeAxes = useMemo<Record<string, string>>(() => {
    const hasContextAxes = Object.keys(contextAxes).length > 0;
    return hasContextAxes ? { ...contextAxes } : (channelGlobals.axes ?? defaultTuple(tokens.axes));
  }, [contextAxes, channelGlobals.axes, tokens.axes]);

  const activeTheme = contextPermutation || tupleToName(tokens.axes, activeAxes);

  // `buildResolveAt` returns a closure that memoizes on the canonical
  // tuple key, so wrapping the call in another `useMemo` would be
  // redundant — the inner memo handles the per-tuple cache. We only
  // need `useMemo` for the outer `resolveAt` itself so React's
  // reference equality stays stable between renders.
  const resolveAt = useMemo(
    () =>
      makeResolveAt({
        axes: tokens.axes,
        cells: tokens.cells,
        jointOverrides: tokens.jointOverrides,
        defaultTuple: tokens.defaultTuple,
      }),
    [tokens.axes, tokens.cells, tokens.jointOverrides, tokens.defaultTuple],
  );

  // Memoize the returned ProjectData against the stable inner fields
  // for the same reason the provider path does — fresh object identity
  // per render would defeat `useMemo([project, …])` in every block.
  return useMemo<ProjectData>(
    () => ({
      activeTheme,
      activeAxes,
      axes: tokens.axes,
      resolved: resolveAt(activeAxes),
      diagnostics: tokens.diagnostics,
      cssVarPrefix: tokens.cssVarPrefix,
      listing: tokens.listing,
      varianceByPath: tokens.varianceByPath,
      tokenGraph: tokens.tokenGraph,
      resolveAt,
    }),
    [
      activeTheme,
      activeAxes,
      tokens.axes,
      tokens.diagnostics,
      tokens.cssVarPrefix,
      tokens.listing,
      tokens.varianceByPath,
      tokens.tokenGraph,
      resolveAt,
    ],
  );
}

/**
 * Resolve a token's CSS var reference, preferring the authoritative name
 * emitted by `@terrazzo/plugin-css` (as recorded by
 * `@terrazzo/plugin-token-listing` in the snapshot's `listing` field).
 * Falls back to `makeCssVar` when the listing lacks an entry for this
 * path — covers non-resolver projects, hand-built snapshots, and any
 * listing-plugin miss.
 */
export function resolveCssVar(
  path: string,
  project: Pick<ProjectData, 'listing' | 'cssVarPrefix'>,
): string {
  const listed = project.listing[path]?.names?.['css'];
  if (listed) return `var(${listed})`;
  return makeCssVar(path, project.cssVarPrefix);
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

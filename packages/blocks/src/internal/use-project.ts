import { buildResolveAt } from '@unpunnyfuns/swatchbook-core/resolve-at';
import { makeCssVar } from '@unpunnyfuns/swatchbook-core/css-var';
import type { Axis, Cells, JointOverrides, TokenMap } from '@unpunnyfuns/swatchbook-core';
import { useEffect, useMemo } from 'react';
import type { VirtualTokenListingShape, VirtualVarianceByPathShape } from '#/contexts.ts';
import { useActiveAxes, useActiveTheme, useOptionalSwatchbookData } from '#/contexts.ts';
import { type ColorFormat, formatColor, type FormatColorResult } from '#/format-color.ts';
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
   * Compose the resolved `TokenMap` for any tuple of axis selections.
   * Built browser-side from `cells + jointOverrides` shipped over the
   * wire — no resolver needed.
   */
  resolveAt: (tuple: Record<string, string>) => ResolvedTokens;
  /**
   * Synthesize a display name for a full tuple — `axisValues.join(' · ')`,
   * matching the form `permutationID` produces server-side. Used by
   * the AxisVariance grid for `data-<prefix>-theme` attribution.
   */
  themeNameForTuple: (tuple: Record<string, string>) => string | undefined;
}

const STYLE_ELEMENT_ID = 'swatchbook-tokens';

function ensureStylesheet(css: string): void {
  if (typeof document === 'undefined') return;
  let style = document.getElementById(STYLE_ELEMENT_ID) as HTMLStyleElement | null;
  if (!style) {
    style = document.createElement('style');
    style.id = STYLE_ELEMENT_ID;
    document.head.appendChild(style);
  }
  if (style.textContent !== css) style.textContent = css;
}

function defaultTuple(axes: readonly VirtualAxis[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const axis of axes) out[axis.name] = axis.default;
  return out;
}

/**
 * Synthesize a permutation name from a tuple — same form
 * `permutationID` produces server-side (axis values joined by ` · `).
 * Used by the AxisVariance grid for `data-<prefix>-theme` attribution
 * and similar display-only callers.
 */
function tupleToName(
  axes: readonly VirtualAxis[],
  tuple: Readonly<Record<string, string>>,
): string {
  return axes.map((a) => tuple[a.name] ?? a.default).join(' · ');
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
  return (tuple) => resolver(tuple) as TokenMap as ResolvedTokens;
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
      resolveAt,
      themeNameForTuple: (tuple) => tupleToName(axes, tuple),
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
      resolveAt,
      themeNameForTuple: (tuple) => tupleToName(tokens.axes, tuple),
    }),
    [
      activeTheme,
      activeAxes,
      tokens.axes,
      tokens.diagnostics,
      tokens.cssVarPrefix,
      tokens.listing,
      tokens.varianceByPath,
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
export function resolveCssVar(path: string, project: ProjectData): string {
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
  project: ProjectData,
): FormatColorResult {
  if (path !== undefined && colorFormat === 'hex') {
    const listed = project.listing[path]?.previewValue;
    if (typeof listed === 'string') {
      return { value: listed, outOfGamut: false };
    }
  }
  return formatColor(raw, colorFormat);
}

/**
 * Match a dot-separated DTCG token path against a block `filter` prop.
 *
 * **Supported shapes** (the narrow subset we need — DTCG paths don't have
 * directories, brace expansion, or regex, so we skip a full glob engine):
 *
 * | Pattern            | Matches                                             |
 * | ------------------ | --------------------------------------------------- |
 * | `undefined` / `''` | everything                                          |
 * | `*` or `**`        | everything                                          |
 * | `color`            | exact path `color`, or any descendant `color.*`     |
 * | `color.*`      | any path whose fixed prefix is `color.`         |
 * | `color**`          | any path starting with `color`                      |
 *
 * Not supported (all pass through as literal segment matchers): brace
 * expansion (`{a,b}`), mid-path globs (`color.*.bg`), negation (`!foo`),
 * character classes (`[sys]`). If you hit those, pre-filter by hand.
 */
export function globMatch(path: string, glob: string | undefined): boolean {
  if (!glob) return true;
  if (glob === '*' || glob === '**') return true;
  if (glob.endsWith('.*')) return path.startsWith(`${glob.slice(0, -2)}.`);
  if (glob.endsWith('**')) return path.startsWith(glob.slice(0, -2));
  return path === glob || path.startsWith(`${glob}.`);
}

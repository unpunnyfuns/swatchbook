import { buildResolveAt } from '@unpunnyfuns/swatchbook-core/resolve-at';
import type {
  Axis,
  Cells,
  JointOverride,
  JointOverrides,
  TokenMap,
} from '@unpunnyfuns/swatchbook-core';
import { makeCSSVar } from '@terrazzo/token-tools/css';
import { useEffect, useMemo } from 'react';
import type { VirtualTokenListingShape, VirtualVarianceByPathShape } from '#/contexts.ts';
import { useActiveAxes, useActivePermutation, useOptionalSwatchbookData } from '#/contexts.ts';
import { type ColorFormat, formatColor, type FormatColorResult } from '#/format-color.ts';
import { useChannelGlobals } from '#/internal/channel-globals.ts';
import { useTokenSnapshot } from '#/internal/channel-tokens.ts';
import type {
  ProjectSnapshot,
  VirtualAxis,
  VirtualDiagnostic,
  VirtualPermutation,
  VirtualToken,
} from '#/types.ts';

type ResolvedTokens = Record<string, VirtualToken>;

export interface ProjectData {
  activePermutation: string;
  activeAxes: Record<string, string>;
  axes: readonly VirtualAxis[];
  permutations: readonly VirtualPermutation[];
  resolved: ResolvedTokens;
  permutationsResolved: Record<string, ResolvedTokens>;
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
   * variance lookup instead of re-running the bucket analysis. Empty
   * for snapshots that pre-date the wire format change.
   */
  varianceByPath: VirtualVarianceByPathShape;
  /**
   * Compose the resolved `TokenMap` for any tuple of axis selections.
   * Built browser-side from `cells + jointOverrides` shipped over the
   * wire — no resolver needed. Replaces direct
   * `permutationsResolved[name]` reads for tuple-keyed lookups
   * (`AxisVariance` grid cells, future per-tuple block displays).
   */
  resolveAt: (tuple: Record<string, string>) => ResolvedTokens;
  /**
   * Look up the permutation name for a full tuple — `O(1)` against a
   * `Map<canonicalKey, name>` built once per snapshot. Returns
   * `undefined` when no permutation matches. Consumers that previously
   * did `permutations.find(...)` per grid cell should use this
   * instead to avoid quadratic-in-cell work as permutation counts
   * grow.
   */
  permutationNameForTuple: (tuple: Record<string, string>) => string | undefined;
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
 * Stable string key for a tuple — axes sorted by name + `:` separator.
 * Matches the key form `buildResolveAt` uses in core so both surfaces
 * agree on what counts as "the same tuple."
 */
function canonicalTupleKey(tuple: Readonly<Record<string, string>>): string {
  return Object.keys(tuple)
    .toSorted()
    .map((k) => `${k}:${tuple[k]}`)
    .join('|');
}

/**
 * Build a `Map<canonicalKey, permutationName>` once per permutations
 * list so per-tuple lookups go through O(1) `Map.get` instead of an
 * `Array.prototype.find` scan per call. Bounded by the permutations
 * count regardless of how many lookups consumers do.
 */
function buildPermutationNameByTuple(
  permutations: readonly VirtualPermutation[],
): ReadonlyMap<string, string> {
  const out = new Map<string, string>();
  for (const perm of permutations) {
    out.set(canonicalTupleKey(perm.input as Record<string, string>), perm.name);
  }
  return out;
}

function tuplesEqual(a: Record<string, string>, b: Record<string, string>): boolean {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const k of keys) {
    if (a[k] !== b[k]) return false;
  }
  return true;
}

function nameForTuple(
  themesList: readonly VirtualPermutation[],
  tuple: Record<string, string>,
): string | undefined {
  const match = themesList.find((t) => tuplesEqual(t.input as Record<string, string>, tuple));
  return match?.name;
}

/**
 * Reconstruct a `resolveAt` accessor from snapshot data. The wire
 * format ships `cells` as plain JSON and `jointOverrides` as an
 * array of `[key, entry]` pairs (Map doesn't survive JSON.stringify);
 * this hydrates them and wraps `buildResolveAt` from core. Stable
 * identity across calls with the same snapshot — `useMemo` keyed on
 * the snapshot fields produces a referentially stable function.
 */
function makeResolveAt(snapshot: {
  axes: readonly VirtualAxis[];
  cells?: ProjectSnapshot['cells'];
  jointOverrides?: ProjectSnapshot['jointOverrides'];
  defaultTuple?: ProjectSnapshot['defaultTuple'];
}): (tuple: Record<string, string>) => ResolvedTokens {
  const cells = (snapshot.cells ?? {}) as Cells;
  const jointOverrides: JointOverrides = new Map<string, JointOverride>(
    (snapshot.jointOverrides ?? []) as readonly (readonly [string, JointOverride])[],
  );
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
 * Build the `resolveAt` accessor for a snapshot, falling back to
 * indexing `permutationsResolved` by tuple name when the snapshot
 * pre-dates the wire format change and doesn't carry `cells`.
 */
function snapshotResolveAt(
  snapshot: ProjectSnapshot,
): (tuple: Record<string, string>) => ResolvedTokens {
  const hasCells = Object.keys(snapshot.cells ?? {}).length > 0;
  if (hasCells) return makeResolveAt(snapshot);
  return (tuple) => {
    const name = nameForTuple(snapshot.permutations, tuple) ?? snapshot.activePermutation;
    return snapshot.permutationsResolved[name] ?? {};
  };
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
  // The underlying `cells` / `jointOverrides` / `permutations`
  // references are stable module-level exports, so depending on
  // them directly keeps `resolveAt` (and the resolved map it
  // returns) referentially stable across renders.
  const axes = snapshot?.axes;
  const cells = snapshot?.cells;
  const jointOverrides = snapshot?.jointOverrides;
  const dataDefaultTuple = snapshot?.defaultTuple;
  const permutations = snapshot?.permutations;
  const permutationsResolved = snapshot?.permutationsResolved;
  const activePermutation = snapshot?.activePermutation;
  const resolveAt = useMemo(() => {
    if (!snapshot) return null;
    return snapshotResolveAt(snapshot);
    // The deps below are deliberately the stable inner fields rather
    // than `snapshot` itself; see the long block comment above.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    axes,
    cells,
    jointOverrides,
    dataDefaultTuple,
    permutations,
    permutationsResolved,
    activePermutation,
  ]);
  const permutationNameByTuple = useMemo(
    () => buildPermutationNameByTuple(permutations ?? []),
    [permutations],
  );
  const fallback = useVirtualModuleFallback(snapshot === null);
  if (snapshot !== null && resolveAt !== null) {
    return snapshotToData(snapshot, resolveAt, permutationNameByTuple);
  }
  return fallback;
}

function snapshotToData(
  snapshot: ProjectSnapshot,
  resolveAt: (tuple: Record<string, string>) => ResolvedTokens,
  permutationNameByTuple: ReadonlyMap<string, string>,
): ProjectData {
  return {
    activePermutation: snapshot.activePermutation,
    // Pass `snapshot.activeAxes` through directly rather than spreading
    // into a fresh object — the snapshot already exposes it as a
    // read-only record, and a new identity per render would invite
    // the same memo-stability bug `resolveAt` had.
    activeAxes: snapshot.activeAxes as Record<string, string>,
    axes: snapshot.axes,
    permutations: snapshot.permutations,
    permutationsResolved: snapshot.permutationsResolved,
    resolved: resolveAt(snapshot.activeAxes),
    diagnostics: snapshot.diagnostics,
    cssVarPrefix: snapshot.cssVarPrefix,
    listing: snapshot.listing ?? {},
    varianceByPath: snapshot.varianceByPath ?? {},
    resolveAt,
    permutationNameForTuple: (tuple) => permutationNameByTuple.get(canonicalTupleKey(tuple)),
  };
}

function useVirtualModuleFallback(enabled: boolean): ProjectData {
  const contextPermutation = useActivePermutation();
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

  const hasContextAxes = Object.keys(contextAxes).length > 0;
  const activeAxes: Record<string, string> = hasContextAxes
    ? { ...contextAxes }
    : (channelGlobals.axes ?? defaultTuple(tokens.axes));

  const derivedName = nameForTuple(tokens.permutations, activeAxes);
  const activePermutation =
    contextPermutation ||
    derivedName ||
    tokens.defaultPermutation ||
    tokens.permutations[0]?.name ||
    '';

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
  const resolved = resolveAt(activeAxes);
  const permutationNameByTuple = useMemo(
    () => buildPermutationNameByTuple(tokens.permutations),
    [tokens.permutations],
  );

  return {
    activePermutation,
    activeAxes,
    axes: tokens.axes,
    permutations: tokens.permutations,
    permutationsResolved: tokens.permutationsResolved,
    resolved,
    diagnostics: tokens.diagnostics,
    cssVarPrefix: tokens.cssVarPrefix,
    listing: tokens.listing,
    varianceByPath: tokens.varianceByPath,
    resolveAt,
    permutationNameForTuple: (tuple) => permutationNameByTuple.get(canonicalTupleKey(tuple)),
  };
}

/**
 * Thin wrapper around Terrazzo's `makeCSSVar` so the block-display surface
 * and `packages/core/src/css.ts`'s emitter share one implementation. Any
 * future naming-policy shift in Terrazzo (casing, unicode, prefix handling)
 * reaches both surfaces at once instead of needing a parallel update here.
 */
export function makeCssVar(path: string, prefix: string): string {
  return prefix ? makeCSSVar(path, { prefix, wrapVar: true }) : makeCSSVar(path, { wrapVar: true });
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

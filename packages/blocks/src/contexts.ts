import type { Axis, AxisVarianceResult, Diagnostic, Preset } from '@unpunnyfuns/swatchbook-core';
import { createContext, useContext } from 'react';
import { useChannelGlobals } from '#/internal/channel-globals.ts';
import type { ColorFormat } from '#/format-color.ts';

/**
 * Typed shape of the addon's `virtual:swatchbook/tokens` module.
 *
 * The axis / permutation / diagnostic / preset entries are deliberate
 * type-aliases of core's authoritative shapes — the virtual module
 * publishes those shapes verbatim, so single-sourcing the types prevents
 * silent drift the moment core grows a field the plugin doesn't
 * serialise.
 *
 * Token / listing shapes stay as narrowed interfaces because blocks
 * only read a subset of Terrazzo's full token / listing structure; the
 * narrower shape documents what's actually relied on.
 *
 * The ambient `declare module 'virtual:swatchbook/tokens'` declarations
 * in `packages/addon/src/virtual.d.ts` describe the same payload.
 */
export type VirtualAxisShape = Axis;

export type VirtualDiagnosticShape = Diagnostic;

export interface VirtualTokenShape {
  $type?: string;
  $value?: unknown;
  $description?: string;
  aliasOf?: string;
  aliasChain?: readonly string[];
  aliasedBy?: readonly string[];
  /**
   * Per-sub-field alias map for composite tokens whose value blends
   * primitives with aliased fragments — Terrazzo populates this when
   * one or more component fields of a composite ($type: 'border',
   * 'shadow', 'typography', 'gradient', 'transition') resolve through
   * an alias. The `CompositeBreakdown` block reads it to render the
   * source path beside each component value.
   */
  partialAliasOf?: Record<string, string | undefined>;
}

/**
 * Subset of `@terrazzo/plugin-token-listing`'s `ListedToken` that the
 * snapshot carries. Blocks read `names.css` for the authoritative CSS
 * variable name and `previewValue` for the display-ready CSS string.
 * `source.loc` enables "jump to authoring source" affordances.
 *
 * Only the fields blocks consume are typed here; the plugin's full shape
 * lives in `@unpunnyfuns/swatchbook-core`.
 */
export interface VirtualTokenListingShape {
  names: Record<string, string>;
  previewValue?: string | number;
  source?: {
    resource: string;
    loc?: {
      start: { line: number; column: number; offset: number };
      end: { line: number; column: number; offset: number };
    };
  };
}

export type VirtualPresetShape = Preset;

/**
 * Wire shape of one `Project.jointOverrides` entry — same as core's
 * `JointOverride` but with the block's `VirtualTokenShape` for the
 * token values that ship over the wire.
 */
export interface VirtualJointOverrideShape {
  axes: Record<string, string>;
  tokens: Record<string, VirtualTokenShape>;
}

/**
 * Map from path → cached `AxisVarianceResult`. Snapshot carries this
 * so the `AxisVariance` block can O(1) look up which axes affect a
 * token instead of re-running variance analysis on every render.
 */
export type VirtualVarianceByPathShape = Record<string, AxisVarianceResult>;

/**
 * Full project data read by blocks. Populated by the addon's preview
 * decorator (from the virtual module) or constructed by hand in
 * non-Storybook consumers.
 */
export interface ProjectSnapshot {
  axes: readonly VirtualAxisShape[];
  /** Axis names suppressed via `config.disabledAxes` — pinned to their defaults, hidden from the toolbar. */
  disabledAxes: readonly string[];
  presets: readonly VirtualPresetShape[];
  activePermutation: string;
  activeAxes: Readonly<Record<string, string>>;
  cssVarPrefix: string;
  diagnostics: readonly VirtualDiagnosticShape[];
  css: string;
  /**
   * Path-indexed Token Listing data produced by
   * `@terrazzo/plugin-token-listing`. Blocks prefer reading authoritative
   * CSS var names and preview values from here; empty for non-resolver
   * projects. Treat as enrichment — fall back gracefully when a path is
   * absent.
   */
  listing?: Readonly<Record<string, VirtualTokenListingShape>>;
  /**
   * Per-axis cell maps — `cells[axis][context]` is the resolved token
   * data for `{ ...defaults, [axis]: context }`. Bounded by
   * `Σ(axes × contexts)` regardless of cartesian product size.
   * Non-default cells store only the tokens whose value differs from
   * the default-cell baseline (delta cells).
   */
  cells: Record<string, Record<string, Record<string, VirtualTokenShape>>>;
  /**
   * `Project.jointOverrides` flattened to entries for wire transport.
   * Same ascending-arity iteration order the Map carries on the
   * server side. Empty array when no joint divergences exist.
   */
  jointOverrides: readonly (readonly [string, VirtualJointOverrideShape])[];
  /**
   * Cached per-path variance results. Blocks read this for O(1) axis
   * variance lookup instead of recomputing on each render.
   */
  varianceByPath?: VirtualVarianceByPathShape;
  /** The default tuple — `{ axis: axis.default }` for every axis. */
  defaultTuple: Record<string, string>;
  /**
   * Pre-built `resolveAt(tuple)` accessor. The addon's preview
   * decorator instantiates this once per iframe lifetime — the
   * underlying virtual-module exports (cells, jointOverrides, axes,
   * defaultTuple) are stable, so a single resolver instance with
   * internal per-tuple memoization is correct and avoids the
   * per-render rebuild dance the blocks side used to do. Hand-built
   * snapshots (tests, MDX) can omit this; blocks fall back to
   * building locally from `cells` / `permutationsResolved`.
   */
  resolveAt?: (tuple: Record<string, string>) => Record<string, VirtualTokenShape>;
}

/**
 * Context carrying the full {@link ProjectSnapshot}. `null` sentinel lets
 * `useSwatchbookData()` tell "provider present" from "fall back to the
 * virtual module".
 */
export const SwatchbookContext = createContext<ProjectSnapshot | null>(null);

export function useOptionalSwatchbookData(): ProjectSnapshot | null {
  return useContext(SwatchbookContext);
}

/**
 * Active swatchbook theme for the current story/docs render. Populated by
 * the addon's preview decorator and consumed by `useToken` + any future
 * consumer hooks.
 *
 * This runs through plain React context rather than Storybook's
 * `useGlobals` so the same hook works in autodocs / MDX renders where the
 * preview-hooks context isn't available.
 */
export const PermutationContext = createContext<string>('');

export function useActivePermutation(): string {
  return useContext(PermutationContext);
}

/**
 * Active axis tuple for the current story/docs render — `Record<axisName,
 * contextName>`. Derived from the same input as {@link PermutationContext}; split
 * out so consumers needing per-axis info (toolbar, panel, tuple-aware
 * blocks) don't have to reparse the composed permutation ID.
 */
export const AxesContext = createContext<Readonly<Record<string, string>>>({});

export function useActiveAxes(): Readonly<Record<string, string>> {
  return useContext(AxesContext);
}

/**
 * Active color-display format for the current story/docs render. Populated
 * by the addon's preview decorator from the `swatchbookColorFormat` global
 * (per-story `globals` or toolbar dropdown) and consumed by blocks that
 * render color-token values. Emitted CSS is unaffected.
 *
 * Runs through plain React context rather than Storybook's `useGlobals` so
 * per-story seeded globals flow through on first render and the same hook
 * is safe to call from MDX doc blocks (where the preview-hooks context
 * isn't available).
 */
export const ColorFormatContext = createContext<ColorFormat | null>(null);

export function useColorFormat(): ColorFormat {
  const contextValue = useContext(ColorFormatContext);
  const channelGlobals = useChannelGlobals();
  return contextValue ?? channelGlobals.format ?? 'hex';
}

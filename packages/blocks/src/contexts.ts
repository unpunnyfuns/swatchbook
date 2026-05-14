import { createContext, useContext } from 'react';
import { useChannelGlobals } from '#/internal/channel-globals.ts';
import type { ColorFormat } from '#/format-color.ts';

/**
 * Typed shape of the addon's `virtual:swatchbook/tokens` module, duplicated
 * as value-importable interfaces so consumers outside the addon's Vite
 * plugin (unit tests, custom React apps) can construct a snapshot by hand.
 *
 * The ambient `declare module 'virtual:swatchbook/tokens'` declarations in
 * `packages/addon/src/virtual.d.ts` describe the same payload; the two
 * stay in sync by eye.
 */
export interface VirtualAxisShape {
  name: string;
  contexts: readonly string[];
  default: string;
  description?: string;
  source: 'resolver' | 'layered' | 'synthetic';
}

export interface VirtualPermutationShape {
  name: string;
  input: Record<string, string>;
  sources: string[];
}

export interface VirtualDiagnosticShape {
  severity: 'error' | 'warn' | 'info';
  group: string;
  message: string;
  filename?: string;
  line?: number;
  column?: number;
}

export interface VirtualTokenShape {
  $type?: string;
  $value?: unknown;
  $description?: string;
  aliasOf?: string;
  aliasChain?: readonly string[];
  aliasedBy?: readonly string[];
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

export interface VirtualPresetShape {
  name: string;
  axes: Partial<Record<string, string>>;
  description?: string;
}

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
  permutations: readonly VirtualPermutationShape[];
  permutationsResolved: Record<string, Record<string, VirtualTokenShape>>;
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

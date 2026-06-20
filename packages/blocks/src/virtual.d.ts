/**
 * Typed shape of the addon's `virtual:swatchbook/tokens` module. The runtime
 * payload is produced by the addon's Vite plugin (`swatchbookTokensPlugin`)
 * and JSON-serialized, so this declaration describes the plain-data shape
 * consumers read back. Shapes are imported from `#/contexts.ts` so the
 * virtual module, the React contexts, and every blocks consumer can't
 * drift from each other — single source within the package, mirroring
 * the `addon/src/virtual.d.ts` → `addon/src/channel-types.ts` pattern.
 */
declare module 'virtual:swatchbook/tokens' {
  import type {
    VirtualAxisShape,
    VirtualDiagnosticShape,
    VirtualPresetShape,
    VirtualTokenGraph,
    VirtualTokenListingShape,
  } from '#/contexts.ts';

  export const axes: readonly VirtualAxisShape[];
  export const disabledAxes: readonly string[];
  export const presets: readonly VirtualPresetShape[];
  export const diagnostics: readonly VirtualDiagnosticShape[];
  export const css: string;
  export const cssVarPrefix: string;
  export const indicators: Readonly<Record<string, boolean>>;
  export const listing: Readonly<Record<string, VirtualTokenListingShape>>;
  export const defaultTuple: Record<string, string>;
  export const tokenGraph: VirtualTokenGraph;
}

declare module '*.css';

/**
 * Typed shape of the addon's `virtual:swatchbook/tokens` module. The runtime
 * payload is produced by the addon's Vite plugin (`swatchbookTokensPlugin`)
 * and JSON-serialized, so this declaration describes the plain-data shape
 * consumers read back. Types are imported from `#/types.ts` and
 * `#/contexts.ts` so the virtual module, the React contexts, and every
 * blocks consumer can't drift from each other — single source within the
 * package, mirroring the `addon/src/virtual.d.ts` → `addon/src/channel-types.ts`
 * pattern.
 */
declare module 'virtual:swatchbook/tokens' {
  import type { VirtualTokenGraph, VirtualTokenListing } from '#/contexts.ts';
  import type { VirtualAxis, VirtualDiagnostic, VirtualPreset } from '#/types.ts';

  export const axes: readonly VirtualAxis[];
  export const disabledAxes: readonly string[];
  export const presets: readonly VirtualPreset[];
  export const diagnostics: readonly VirtualDiagnostic[];
  export const css: string;
  export const cssVarPrefix: string;
  export const indicators: Readonly<Record<string, boolean>>;
  export const listing: Readonly<Record<string, VirtualTokenListing>>;
  export const defaultTuple: Record<string, string>;
  export const tokenGraph: VirtualTokenGraph;
}

declare module '*.css';

/**
 * Typed shape of the addon's `virtual:swatchbook/tokens` module. The runtime
 * payload is produced by this package's Vite plugin (`swatchbookTokensPlugin`)
 * and JSON-serialized, so this declaration describes the plain-data shape
 * consumers read back. Shapes are drawn from `#/channel-types.ts` so the
 * virtual module, the INIT_EVENT payload, and the manager-side consumers
 * can't drift from each other.
 */
declare module 'virtual:swatchbook/tokens' {
  import type {
    VirtualAxis,
    VirtualCells,
    VirtualDiagnostic,
    VirtualJointOverrides,
    VirtualListingEntry,
    VirtualPreset,
    VirtualPermutation,
    VirtualToken,
    VirtualVarianceByPath,
  } from '#/channel-types.ts';

  export const axes: readonly VirtualAxis[];
  export const disabledAxes: readonly string[];
  export const presets: readonly VirtualPreset[];
  export const permutations: readonly VirtualPermutation[];
  export const defaultPermutation: string | null;
  export const permutationsResolved: Record<string, Record<string, VirtualToken>>;
  export const diagnostics: readonly VirtualDiagnostic[];
  export const css: string;
  export const cssVarPrefix: string;
  export const listing: Readonly<Record<string, VirtualListingEntry>>;
  export const cells: VirtualCells;
  export const jointOverrides: VirtualJointOverrides;
  export const varianceByPath: VirtualVarianceByPath;
  export const defaultTuple: Record<string, string>;
}

declare module 'virtual:swatchbook/integration-side-effects';

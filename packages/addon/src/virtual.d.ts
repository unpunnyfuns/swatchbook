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
    VirtualDiagnostic,
    VirtualPreset,
    VirtualTheme,
    VirtualToken,
  } from '#/channel-types.ts';

  export const axes: readonly VirtualAxis[];
  export const disabledAxes: readonly string[];
  export const presets: readonly VirtualPreset[];
  export const themes: readonly VirtualTheme[];
  export const defaultTheme: string | null;
  export const themesResolved: Record<string, Record<string, VirtualToken>>;
  export const diagnostics: readonly VirtualDiagnostic[];
  export const css: string;
  export const cssVarPrefix: string;
}

/**
 * Type declarations for the virtual module served by our Vite plugin.
 * The real module is generated at preview build time — these shapes mirror
 * what `swatchbookTokensPlugin` emits in `packages/addon/src/virtual/plugin.ts`.
 */
declare module 'virtual:swatchbook/tokens' {
  import type { TokenMap } from '@unpunnyfuns/swatchbook-core';

  export interface VirtualTheme {
    name: string;
    input: Record<string, string>;
    sources: string[];
  }

  export const themes: VirtualTheme[];
  export const defaultTheme: string | null;
  export const themesResolved: Record<string, TokenMap>;
  export const diagnostics: unknown[];
  export const css: string;
  export const cssVarPrefix: string;
  export const themingMode: 'layered' | 'resolver' | 'manifest';
}

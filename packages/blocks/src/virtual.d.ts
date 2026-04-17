/**
 * Re-declaration of the addon's virtual token module so the blocks package
 * typechecks in isolation. The runtime module is provided by the addon's
 * Vite plugin when Storybook is running.
 */
declare module 'virtual:swatchbook/tokens' {
  interface VirtualTheme {
    name: string;
    input: Record<string, string>;
    sources: string[];
  }
  interface ResolvedToken {
    $type?: string;
    $value?: unknown;
    $description?: string;
  }

  export const themes: VirtualTheme[];
  export const defaultTheme: string | null;
  export const themesResolved: Record<string, Record<string, ResolvedToken>>;
  export const diagnostics: unknown[];
  export const css: string;
  export const cssVarPrefix: string;
  export const themingMode: 'layered' | 'resolver' | 'manifest';
}

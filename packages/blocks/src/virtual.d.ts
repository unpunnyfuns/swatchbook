/**
 * Typed shape of the addon's `virtual:swatchbook/tokens` module. The runtime
 * payload is produced by the addon's Vite plugin (`swatchbookTokensPlugin`)
 * and JSON-serialized, so this declaration describes the plain-data shape
 * consumers read back — a narrow subset of Terrazzo's `TokenNormalized`
 * plus core's `Theme` and `Diagnostic`.
 */
declare module 'virtual:swatchbook/tokens' {
  interface VirtualTheme {
    name: string;
    input: Record<string, string>;
    sources: string[];
  }

  interface VirtualDiagnostic {
    severity: 'error' | 'warn' | 'info';
    group: string;
    message: string;
    filename?: string;
    line?: number;
    column?: number;
  }

  interface VirtualToken {
    $type?: string;
    $value?: unknown;
    $description?: string;
    aliasOf?: string;
    aliasChain?: readonly string[];
  }

  export const themes: readonly VirtualTheme[];
  export const defaultTheme: string | null;
  export const themesResolved: Record<string, Record<string, VirtualToken>>;
  export const diagnostics: readonly VirtualDiagnostic[];
  export const css: string;
  export const cssVarPrefix: string;
}

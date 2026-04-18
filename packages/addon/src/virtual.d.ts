/**
 * Typed shape of the addon's `virtual:swatchbook/tokens` module. The runtime
 * payload is produced by this package's Vite plugin (`swatchbookTokensPlugin`)
 * and JSON-serialized, so this declaration describes the plain-data shape
 * consumers read back.
 */
declare module 'virtual:swatchbook/tokens' {
  interface VirtualAxis {
    name: string;
    contexts: readonly string[];
    default: string;
    description?: string;
    source: 'resolver' | 'synthetic';
  }

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
    aliasedBy?: readonly string[];
  }

  interface VirtualPreset {
    name: string;
    axes: Partial<Record<string, string>>;
    description?: string;
  }

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

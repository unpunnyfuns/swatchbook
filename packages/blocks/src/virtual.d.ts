/**
 * Typed shape of the addon's `virtual:swatchbook/tokens` module. The runtime
 * payload is produced by the addon's Vite plugin (`swatchbookTokensPlugin`)
 * and JSON-serialized, so this declaration describes the plain-data shape
 * consumers read back — a narrow subset of Terrazzo's `TokenNormalized`
 * plus core's `Axis` / `Diagnostic` / `Preset` shapes.
 */
declare module 'virtual:swatchbook/tokens' {
  interface VirtualAxis {
    name: string;
    contexts: readonly string[];
    default: string;
    description?: string;
    source: 'resolver' | 'layered' | 'synthetic';
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

  interface VirtualListingEntry {
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

  interface VirtualJointOverrideEntry {
    axes: Record<string, string>;
    tokens: Record<string, VirtualToken>;
  }

  type VirtualAxisVariancePerAxis = Record<
    string,
    { varying: boolean; contexts: Record<string, string> }
  >;
  type VirtualAxisVarianceEntry =
    | {
        path: string;
        kind: 'constant';
        varyingAxes: readonly [];
        constantAcrossAxes: readonly string[];
        perAxis: VirtualAxisVariancePerAxis;
      }
    | {
        path: string;
        kind: 'single';
        axis: string;
        varyingAxes: readonly [string];
        constantAcrossAxes: readonly string[];
        perAxis: VirtualAxisVariancePerAxis;
      }
    | {
        path: string;
        kind: 'multi';
        varyingAxes: readonly [string, string, ...string[]];
        constantAcrossAxes: readonly string[];
        perAxis: VirtualAxisVariancePerAxis;
      };

  export const axes: readonly VirtualAxis[];
  export const presets: readonly VirtualPreset[];
  export const diagnostics: readonly VirtualDiagnostic[];
  export const css: string;
  export const cssVarPrefix: string;
  export const listing: Readonly<Record<string, VirtualListingEntry>>;
  export const cells: Record<string, Record<string, Record<string, VirtualToken>>>;
  export const jointOverrides: readonly (readonly [string, VirtualJointOverrideEntry])[];
  export const varianceByPath: Record<string, VirtualAxisVarianceEntry>;
  export const defaultTuple: Record<string, string>;
}

declare module '*.css';

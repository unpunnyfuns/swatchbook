/**
 * Shared payload types for the INIT_EVENT channel broadcast — both the
 * preview (emitter) and the manager-side consumers (`manager.tsx`,
 * `panel.tsx`) pin their shapes here so the three don't drift.
 *
 * The types intentionally mirror what `@unpunnyfuns/swatchbook-core`
 * produces, but are re-declared locally because the manager bundle runs
 * in a Node-free environment and can't import from core at runtime (core
 * pulls `node:fs/promises` via the loader).
 */

export type DiagnosticSeverity = 'error' | 'warn' | 'info';

export interface VirtualToken {
  $type?: string;
  $value?: unknown;
  $description?: string;
}

export interface VirtualAxis {
  name: string;
  contexts: readonly string[];
  default: string;
  description?: string;
  source: 'resolver' | 'layered' | 'synthetic';
}

export interface VirtualPreset {
  name: string;
  axes: Partial<Record<string, string>>;
  description?: string;
}

export interface VirtualDiagnostic {
  severity: DiagnosticSeverity;
  group: string;
  message: string;
  filename?: string;
  line?: number;
  column?: number;
}

/**
 * The full INIT_EVENT payload. Preview emits it whole via
 * `broadcastInit`; consumers read the subset they need — manager's
 * toolbar reads axes + presets + defaultTuple, panel reads
 * additionally disabledAxes + diagnostics + cssVarPrefix.
 */
export interface InitPayload {
  axes: readonly VirtualAxis[];
  disabledAxes: readonly string[];
  presets: readonly VirtualPreset[];
  diagnostics: readonly VirtualDiagnostic[];
  cssVarPrefix: string;
  /** {@link VirtualCells} — per-axis resolved TokenMaps, bounded by Σ(axes × contexts). */
  cells: VirtualCells;
  /** {@link VirtualJointOverrides} — Map serialized as `[key, entry]` pairs. */
  jointOverrides: VirtualJointOverrides;
  /** {@link VirtualVarianceByPath} — cached `AxisVarianceResult` per path. */
  varianceByPath: VirtualVarianceByPath;
  /** The project's default tuple — `{ axis: axis.default }` for each axis. */
  defaultTuple: Record<string, string>;
}

export interface VirtualListingEntry {
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

/**
 * Wire shape of `Project.cells` — one entry per `(axis, context)`,
 * each carrying the resolved TokenMap. Plain object serialization;
 * size is bounded by `Σ(axes × contexts) × tokens`, independent of
 * the cartesian product.
 */
export type VirtualCells = Record<string, Record<string, Record<string, VirtualToken>>>;

/**
 * Wire shape of one `Project.jointOverrides` entry — a partial-tuple
 * override patching specific token values that cell composition alone
 * can't reproduce.
 */
export interface VirtualJointOverride {
  axes: Record<string, string>;
  tokens: Record<string, VirtualToken>;
}

/**
 * Wire-friendly form of `Project.jointOverrides` — a Map serialized
 * as an array of `[key, entry]` pairs so JSON round-trips don't drop
 * the iteration order or the entry structure.
 */
export type VirtualJointOverrides = readonly (readonly [string, VirtualJointOverride])[];

/**
 * Wire shape of one cached `AxisVarianceResult` entry. Mirrors the
 * core type but uses the local `VirtualToken`-style references.
 */
export interface VirtualVarianceEntry {
  path: string;
  kind: 'constant' | 'single' | 'multi';
  varyingAxes: string[];
  constantAcrossAxes: string[];
  perAxis: Record<string, { varying: boolean; contexts: Record<string, string> }>;
}

export type VirtualVarianceByPath = Record<string, VirtualVarianceEntry>;

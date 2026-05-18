/**
 * Shared payload types for the INIT_EVENT channel broadcast — both the
 * preview (emitter) and the manager-side consumers (`manager.tsx`,
 * `panel.tsx`) pin their shapes here so the three don't drift.
 *
 * Manager bundle is Node-free and can't pull core at **runtime**, but
 * type-only imports (`import type`) erase before the bundler sees them
 * under `verbatimModuleSyntax`, so the canonical shapes can come
 * directly from core for the fields that aren't blocks-narrowed.
 *
 * `VirtualToken` and the wire-cells / wire-jointOverrides shapes that
 * reference it stay local — those carry a narrower token shape than
 * core's `TokenMap` so the channel payload doesn't drag Terrazzo's full
 * `TokenNormalized` into the wire surface.
 */
import type {
  Axis,
  AxisVariancePerAxis,
  AxisVarianceResult,
  Diagnostic,
  DiagnosticSeverity,
  Preset,
} from '@unpunnyfuns/swatchbook-core';

export type { DiagnosticSeverity };
export type VirtualAxis = Axis;
export type VirtualPreset = Preset;
export type VirtualDiagnostic = Diagnostic;

export interface VirtualToken {
  $type?: string;
  $value?: unknown;
  $description?: string;
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
 * Wire-payload variance types — re-exports of core's discriminated
 * union, since the wire shape is byte-identical (the only difference
 * between server and client is `Map` ↔ `Record`, captured below).
 */
export type VirtualVariancePerAxis = AxisVariancePerAxis;
export type VirtualVarianceEntry = AxisVarianceResult;
export type VirtualVarianceByPath = Record<string, AxisVarianceResult>;

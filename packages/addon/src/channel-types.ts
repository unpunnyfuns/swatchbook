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
import type { Axis, Diagnostic, DiagnosticSeverity, Preset } from '@unpunnyfuns/swatchbook-core';

export type { DiagnosticSeverity };
export type VirtualAxis = Axis;
export type VirtualPreset = Preset;
export type VirtualDiagnostic = Diagnostic;

export interface VirtualToken {
  $type?: string | undefined;
  $value?: unknown;
  $description?: string | undefined;
  aliasOf?: string | undefined;
  aliasChain?: readonly string[] | undefined;
  aliasedBy?: readonly string[] | undefined;
  /**
   * Per-sub-field alias map for composite tokens — same shape as
   * `blocks/contexts.ts`'s `VirtualTokenShape.partialAliasOf`. Typed as
   * `unknown` because the structure varies per composite `$type`; the
   * block narrows it at the consumer.
   */
  partialAliasOf?: unknown;
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

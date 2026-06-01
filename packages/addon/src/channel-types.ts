/**
 * Shared payload types for the INIT_EVENT channel broadcast — both the
 * preview (emitter) and the manager-side consumers (`manager.tsx`,
 * `panel.tsx`) pin their shapes here so the three don't drift.
 *
 * Manager bundle is Node-free and can't pull core at **runtime**, but
 * type-only imports (`import type`) erase before the bundler sees them
 * under `verbatimModuleSyntax`, so the canonical shapes can come
 * directly from core for the fields that aren't blocks-narrowed.
 */
import type { Axis, Diagnostic, Preset } from '@unpunnyfuns/swatchbook-core';

export type VirtualAxis = Axis;
export type VirtualPreset = Preset;
export type VirtualDiagnostic = Diagnostic;

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

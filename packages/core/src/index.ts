export { defineSwatchbookConfig } from '#/config.ts';
export { loadProject, resolveTheme } from '#/load.ts';
export { projectCss, emitTypes } from '#/emit.ts';
export { dataAttr, emitCss, type EmitCssOptions } from '#/css.ts';
export { permutationID } from '#/types.ts';

export type {
  Axis,
  AxisConfig,
  Config,
  Diagnostic,
  DiagnosticSeverity,
  Preset,
  Project,
  ResolvedTheme,
  Theme,
  TokenMap,
} from '#/types.ts';

export { defineSwatchbookConfig } from '#/config.ts';
export { loadProject, resolveTheme } from '#/load.ts';
export { projectCss, emitTypes } from '#/emit.ts';
export { emitCss, type EmitCssOptions } from '#/css.ts';
export { permutationID } from '#/types.ts';

export type {
  Axis,
  Config,
  Diagnostic,
  DiagnosticSeverity,
  Project,
  ResolvedTheme,
  Theme,
  TokenMap,
} from '#/types.ts';

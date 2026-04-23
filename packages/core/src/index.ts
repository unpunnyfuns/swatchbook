export { CHROME_ROLES, DEFAULT_CHROME_MAP, type ChromeRole } from '#/chrome.ts';

export { defineSwatchbookConfig } from '#/config.ts';
export { loadProject, resolveTheme } from '#/load.ts';
export { projectCss, emitTypes } from '#/emit.ts';
export { dataAttr, emitCss, type EmitCssOptions } from '#/css.ts';
export { fuzzyFilter, fuzzyMatches, type FuzzyOptions } from '#/fuzzy.ts';
export { permutationID } from '#/types.ts';
export { analyzeAxisVariance, type AxisVarianceResult, type VarianceKind } from '#/variance.ts';
export {
  emitViaTerrazzo,
  type EmitViaTerrazzoOptions,
  type EmitSelectionEntry,
  type EmittedFile,
} from '#/emit-via-terrazzo.ts';

export type {
  Axis,
  AxisConfig,
  Config,
  Diagnostic,
  DiagnosticSeverity,
  ParserInput,
  Preset,
  Project,
  ResolvedTheme,
  SwatchbookIntegration,
  Theme,
  TokenMap,
} from '#/types.ts';

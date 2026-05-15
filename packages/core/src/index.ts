export { CHROME_ROLES, DEFAULT_CHROME_MAP, type ChromeRole } from '#/chrome.ts';

export { defineSwatchbookConfig } from '#/config.ts';
export { loadProject, resolvePermutation } from '#/load.ts';
export { projectCss, emitTypes } from '#/emit.ts';
export { dataAttr, emitCss, type EmitCssOptions } from '#/css.ts';
export { permutationID } from '#/types.ts';
export { analyzeAxisVariance, type AxisVarianceResult, type VarianceKind } from '#/variance.ts';
export {
  emitViaTerrazzo,
  type EmitViaTerrazzoOptions,
  type EmitSelectionEntry,
  type EmittedFile,
} from '#/emit-via-terrazzo.ts';
export { type ListedToken, type TokenListingByPath } from '#/token-listing.ts';

export type {
  Axis,
  AxisConfig,
  Config,
  Diagnostic,
  DiagnosticSeverity,
  ParserInput,
  Permutation,
  Preset,
  Project,
  ResolvedPermutation,
  SwatchbookIntegration,
  TokenMap,
} from '#/types.ts';

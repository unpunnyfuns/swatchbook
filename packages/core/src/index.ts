export { CHROME_ROLES, DEFAULT_CHROME_MAP, type ChromeRole } from '#/chrome.ts';

export { defineSwatchbookConfig } from '#/config.ts';
export { loadProject, resolvePermutation } from '#/load.ts';
export { projectCss } from '#/emit.ts';
export { emitAxisProjectedCss } from '#/css-axis-projected.ts';
export { jointOverrideKey } from '#/joint-overrides.ts';
export { permutationID } from '#/types.ts';
export { analyzeAxisVariance, type AxisVarianceResult, type VarianceKind } from '#/variance.ts';
export { type ListedToken, type TokenListingByPath } from '#/token-listing.ts';

export type {
  Axis,
  AxisConfig,
  Cells,
  Config,
  Diagnostic,
  DiagnosticSeverity,
  JointOverride,
  JointOverrides,
  ParserInput,
  Permutation,
  Preset,
  Project,
  ResolveAt,
  ResolvedPermutation,
  SwatchbookIntegration,
  TokenMap,
} from '#/types.ts';

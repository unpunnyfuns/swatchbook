export {
  CHROME_ROLES,
  DEFAULT_CHROME_MAP,
  buildChromeDefaultsCss,
  type ChromeRole,
} from '#/chrome.ts';

export { defineSwatchbookConfig } from '#/config.ts';
export { loadProject } from '#/load.ts';
export { emitAxisProjectedCss } from '#/css-axis-projected.ts';
export type { TupleKey } from '#/tuple-key.ts';
export { type ListedToken, type TokenListingByPath } from '#/token-listing.ts';

export type {
  Axis,
  AxisConfig,
  AxisVariancePerAxis,
  AxisVarianceResult,
  Config,
  Diagnostic,
  DiagnosticSeverity,
  LayeredConfig,
  PlainConfig,
  Preset,
  Project,
  ResolveAt,
  ResolverConfig,
  SwatchbookIntegration,
  SwatchbookToken,
  TokenMap,
  VarianceKind,
} from '#/types.ts';

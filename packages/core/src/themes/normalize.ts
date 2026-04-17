import type { Config, Theme, TokenMap } from '#/types.ts';
import type { BufferedLogger } from '#/diagnostics.ts';
import { loadResolverThemes } from '#/themes/resolver.ts';

export interface NormalizedThemes {
  themes: Theme[];
  resolved: Record<string, TokenMap>;
  defaultThemeName: string;
  /** Files loaded as source-only (not emitted to CSS). Reserved for future use. */
  sourceOnlyFiles: Set<string>;
}

/**
 * Realize themes from the DTCG 2025.10 resolver referenced by the config.
 * The resolver is the sole theming input — no fallback modes.
 */
export async function normalizeThemes(
  config: Config,
  cwd: string,
  logger: BufferedLogger,
): Promise<NormalizedThemes> {
  if (!config.resolver) {
    throw new Error('swatchbook config must specify `resolver` (path to a DTCG resolver file).');
  }
  const r = await loadResolverThemes(config.resolver, config.tokens, cwd, logger, config.default);
  return { ...r, sourceOnlyFiles: new Set() };
}

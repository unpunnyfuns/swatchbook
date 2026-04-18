import type { BufferedLogger } from '#/diagnostics.ts';
import { loadLayeredThemes } from '#/themes/layered.ts';
import { loadResolverThemes } from '#/themes/resolver.ts';
import type { Axis, Config, Theme, TokenMap } from '#/types.ts';

export interface NormalizedThemes {
  axes: Axis[];
  themes: Theme[];
  resolved: Record<string, TokenMap>;
  defaultThemeName: string;
  /** Files loaded as source-only (not emitted to CSS). Reserved for future use. */
  sourceOnlyFiles: Set<string>;
}

/**
 * Realize themes from the config. Exactly one of `resolver` or `axes` may
 * be set; if neither is set, we fall back to a single synthetic axis
 * containing the plain-parsed token files.
 */
export async function normalizeThemes(
  config: Config,
  cwd: string,
  logger: BufferedLogger,
): Promise<NormalizedThemes> {
  if (config.resolver && config.axes) {
    throw new Error('swatchbook: config must specify either `resolver` or `axes`, not both.');
  }

  if (config.axes) {
    const r = await loadLayeredThemes(config.axes, config.tokens, cwd, logger, config.default);
    return { ...r, sourceOnlyFiles: new Set() };
  }

  const r = await loadResolverThemes(config.resolver, config.tokens, cwd, logger, config.default);
  return { ...r, sourceOnlyFiles: new Set() };
}

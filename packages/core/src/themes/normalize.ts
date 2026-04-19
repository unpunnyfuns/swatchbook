import type { BufferedLogger } from '#/diagnostics.ts';
import { loadLayeredThemes } from '#/themes/layered.ts';
import { loadResolverThemes } from '#/themes/resolver.ts';
import type { Axis, Config, Theme, TokenMap } from '#/types.ts';

export interface NormalizedThemes {
  axes: Axis[];
  themes: Theme[];
  resolved: Record<string, TokenMap>;
  sourceFiles: string[];
}

/**
 * Realize themes from the config. Exactly one of `resolver` or `axes` may
 * be set; when neither is set, we fall back to a single synthetic axis
 * containing the plain-parsed token files (which then must be supplied
 * via `config.tokens`).
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
    if (!config.tokens || config.tokens.length === 0) {
      throw new Error(
        'swatchbook: config with `axes` must also supply `tokens` (the base token files the overlays layer onto).',
      );
    }
    return loadLayeredThemes(config.axes, config.tokens, cwd, logger);
  }

  return loadResolverThemes(config.resolver, config.tokens, cwd, logger);
}

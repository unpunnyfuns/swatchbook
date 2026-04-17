import type { Config, Theme, TokenMap } from '#/types.ts';
import type { BufferedLogger } from '#/diagnostics.ts';
import { resolveThemingMode } from '#/config.ts';
import { loadLayeredThemes } from '#/themes/layered.ts';
import { loadResolverThemes } from '#/themes/resolver.ts';

export interface NormalizedThemes {
  themes: Theme[];
  resolved: Record<string, TokenMap>;
  defaultThemeName: string;
  /** Files loaded as source-only (not emitted to CSS). Reserved for future use. */
  sourceOnlyFiles: Set<string>;
}

/**
 * Dispatch to the appropriate theming loader based on what the config
 * specifies. Both paths produce the same downstream shape.
 */
export async function normalizeThemes(
  config: Config,
  cwd: string,
  logger: BufferedLogger,
): Promise<NormalizedThemes> {
  const mode = resolveThemingMode(config);

  switch (mode) {
    case 'layered': {
      const r = await loadLayeredThemes(config.themes ?? [], cwd, logger, config.default);
      return { ...r, sourceOnlyFiles: new Set() };
    }
    case 'resolver': {
      if (!config.resolver) throw new Error('unreachable: resolver mode without resolver path');
      const r = await loadResolverThemes(
        config.resolver,
        config.tokens,
        cwd,
        logger,
        config.default,
      );
      return { ...r, sourceOnlyFiles: new Set() };
    }
  }
}

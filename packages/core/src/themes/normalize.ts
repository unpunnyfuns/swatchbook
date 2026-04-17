import type { Config, Theme, TokenMap } from '#/types';
import type { BufferedLogger } from '#/diagnostics';
import { resolveThemingMode } from '#/config';
import { loadLayeredThemes } from '#/themes/layered';
import { loadManifestThemes } from '#/themes/manifest';
import { loadResolverThemes } from '#/themes/resolver';

export interface NormalizedThemes {
  themes: Theme[];
  resolved: Record<string, TokenMap>;
  defaultThemeName: string;
  /** Files loaded as `source`-only (manifest mode). Emission filters these out. */
  sourceOnlyFiles: Set<string>;
}

/**
 * Dispatch to the appropriate theming loader based on what the config
 * specifies. All three paths produce the same downstream shape.
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
    case 'manifest': {
      if (!config.manifest) throw new Error('unreachable: manifest mode without manifest path');
      return loadManifestThemes(config.manifest, cwd, logger, config.default);
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

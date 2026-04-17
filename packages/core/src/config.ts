import type { Config } from '#/types';

/**
 * Identity helper for typed `swatchbook.config.ts`. Consumers write:
 *
 * ```ts
 * import { defineSwatchbookConfig } from '@unpunnyfuns/swatchbook-core';
 * export default defineSwatchbookConfig({ tokens: ['tokens/**\/*.json'], manifest: 'tokens/$themes.manifest.json' });
 * ```
 *
 * Named distinctly from Terrazzo's `defineConfig` to keep imports unambiguous.
 */
export function defineSwatchbookConfig(config: Config): Config {
  return config;
}

/**
 * Validate that exactly one theming input is set. Returns the chosen mode.
 */
export function resolveThemingMode(config: Config): 'layered' | 'resolver' | 'manifest' {
  const modes: Array<'layered' | 'resolver' | 'manifest'> = [];
  if (config.themes && config.themes.length > 0) modes.push('layered');
  if (config.resolver) modes.push('resolver');
  if (config.manifest) modes.push('manifest');

  if (modes.length === 0) {
    throw new Error(
      'swatchbook config must specify one of: `themes`, `resolver`, or `manifest`.',
    );
  }
  if (modes.length > 1) {
    throw new Error(
      `swatchbook config must specify exactly one theming input; got ${modes.join(' + ')}.`,
    );
  }
  return modes[0] as 'layered' | 'resolver' | 'manifest';
}

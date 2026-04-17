import type { Config } from '#/types.ts';

/**
 * Identity helper for typed `swatchbook.config.ts`. Consumers write:
 *
 * ```ts
 * import { defineSwatchbookConfig } from '@unpunnyfuns/swatchbook-core';
 * export default defineSwatchbookConfig({
 *   tokens: ['tokens/**\/*.json'],
 *   resolver: 'tokens/resolver.json',
 * });
 * ```
 *
 * Named distinctly from Terrazzo's `defineConfig` to keep imports unambiguous.
 */
export function defineSwatchbookConfig(config: Config): Config {
  return config;
}

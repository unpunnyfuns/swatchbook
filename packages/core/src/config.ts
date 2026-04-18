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
 * Or with authored layered axes (no resolver file):
 *
 * ```ts
 * export default defineSwatchbookConfig({
 *   tokens: ['tokens/base/**\/*.json'],
 *   axes: [
 *     {
 *       name: 'mode',
 *       contexts: { Light: [], Dark: ['tokens/modes/dark.json'] },
 *       default: 'Light',
 *     },
 *   ],
 * });
 * ```
 *
 * `resolver` and `axes` are mutually exclusive. Setting neither falls
 * back to a single synthetic theme.
 *
 * Named distinctly from Terrazzo's `defineConfig` to keep imports unambiguous.
 */
export function defineSwatchbookConfig(config: Config): Config {
  return config;
}

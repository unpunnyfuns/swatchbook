import type { Config } from '@unpunnyfuns/swatchbook-core';

/**
 * Options accepted by the swatchbook preset. Either pass a full {@link Config}
 * as `config`, or set `configPath` pointing at a module whose default export
 * is a `Config` (supports `.ts`, `.mts`, `.js`, `.mjs` via jiti).
 */
export interface AddonOptions {
  /** Inline swatchbook config. Mutually exclusive with `configPath`. */
  config?: Config;
  /** Path to a config module, relative to the Storybook `configDir`. */
  configPath?: string;
}

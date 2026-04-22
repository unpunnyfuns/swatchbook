import type { Config, SwatchbookIntegration } from '@unpunnyfuns/swatchbook-core';

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
  /**
   * Display-side integrations that plug into the addon's Vite plugin.
   * Each integration typically contributes a virtual module the
   * preview imports — e.g. the Tailwind integration serves
   * `virtual:swatchbook/tailwind.css`. The addon itself is
   * tool-agnostic; integrations ship as separate packages.
   */
  integrations?: SwatchbookIntegration[];
}

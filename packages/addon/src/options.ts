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
  /**
   * Which CSS emitter populates the `css` export of
   * `virtual:swatchbook/tokens`:
   *
   * - `'cartesian'` (default) — one block per cartesian tuple, scoped
   *   by compound `[data-<axis>="<ctx>"][data-…]` selectors. Correct
   *   for projects with joint-variant tokens (values that depend on
   *   the combination of two axes, not each independently).
   * - `'projected'` — one `:root` baseline plus one
   *   `[data-<axis>="<ctx>"]` block per non-default cell, deltas only.
   *   Composes via CSS cascade at runtime. Output size scales with
   *   `Σ(axes × non-default contexts × varying tokens)` instead of
   *   the cartesian product. Requires orthogonal axes — see
   *   `emitAxisProjectedCss`'s doc-comment for the joint-variance
   *   limitation.
   */
  emitMode?: 'cartesian' | 'projected';
}

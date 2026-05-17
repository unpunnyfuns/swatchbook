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
   * `virtual:swatchbook/tokens`. Defaults to `'projected'`.
   *
   * - `'projected'` (default) — smart axis-projected emit
   *   (`emitAxisProjectedCss`). One `:root` baseline block, one
   *   `[data-<axis>="<ctx>"]` block per non-default cell (deltas only
   *   for tokens that axis touches), and compound `[data-A][data-B]`
   *   blocks for joint-variant tokens that need cartesian-correct
   *   values at specific joint tuples. Output size scales with
   *   `Σ(axes × non-default contexts × touching tokens) + joint
   *   compound blocks` — dramatically smaller than cartesian for
   *   typical fixtures. Spec-faithful for any DTCG-compliant
   *   resolver: orthogonal tokens project, joint-variant tokens fall
   *   back to compound selectors automatically.
   * - `'cartesian'` — explicit fan-out (`projectCss`). One block per
   *   cartesian tuple, scoped by compound
   *   `[data-<axis>="<ctx>"][data-…]` selectors. Output scales with
   *   the cartesian product. Use only when the projection analysis
   *   pass is too costly for your fixture (pathological cardinality
   *   on the order of `terrazzo#752`'s 15M tuples), or when you have
   *   a specific reason to want explicit per-tuple blocks.
   */
  emitMode?: 'cartesian' | 'projected';
}

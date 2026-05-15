/**
 * Typed shapes for the slice of Storybook globals + parameters the
 * swatchbook addon reads. Storybook itself types both as broad bags
 * (`Globals` / `Parameters`) — these interfaces document the keys the
 * addon owns and pin them so the decorator + the live globals-applier
 * don't need scattered `Record<string, unknown>` casts.
 */

import type { ColorFormat } from '@unpunnyfuns/swatchbook-blocks';

/**
 * Globals keys written by the addon's toolbar and read by its decorator.
 *
 * - `swatchbookAxes` — active axis tuple (axis name → context name).
 * - `swatchbookColorFormat` — display-side color format for blocks. Does
 *   not affect emitted CSS.
 * - `swatchbookTheme` — legacy composed permutation ID, written in
 *   lockstep with `swatchbookAxes` for back-compat with consumers that
 *   only read the composed string.
 *
 * The index signature retains Storybook's other globals — consumers who
 * stash unrelated globals on the same bag don't get type errors.
 */
export interface SwatchbookGlobals {
  swatchbookAxes?: Record<string, string>;
  swatchbookColorFormat?: ColorFormat;
  swatchbookTheme?: string;
  [key: string]: unknown;
}

/**
 * Per-story `parameters.swatchbook` namespace. All fields optional — most
 * stories don't override anything.
 */
export interface SwatchbookParameters {
  /** Per-story tuple override. Highest priority input. */
  axes?: Record<string, string>;
  /** Per-story composed permutation ID. Second priority. */
  permutation?: string;
  /** Legacy alias for `permutation`. */
  theme?: string;
}

/**
 * Storybook's parameters bag, narrowed on the `swatchbook` namespace.
 */
export interface StoryParameters {
  swatchbook?: SwatchbookParameters;
  [key: string]: unknown;
}

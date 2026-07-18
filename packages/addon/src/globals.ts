import type { ColorFormat } from '@unpunnyfuns/swatchbook-blocks';

/**
 * Typed shapes for the slice of Storybook globals + parameters the
 * swatchbook addon reads. Storybook itself types both as broad bags
 * (`Globals` / `Parameters`) — these interfaces document the keys the
 * addon owns and pin them so the decorator + the live globals-applier
 * don't need scattered `Record<string, unknown>` casts.
 */

/**
 * Globals keys written by the addon's toolbar and read by its decorator.
 *
 * - `swatchbookAxes` — active axis tuple (axis name → context name).
 *
 * The index signature retains Storybook's other globals — consumers who
 * stash unrelated globals on the same bag don't get type errors.
 */
export interface SwatchbookGlobals {
  swatchbookAxes?: Record<string, string>;
  /**
   * @deprecated The toolbar no longer writes this global; blocks read
   * `Config.defaultColorFormat` for their starting color format instead.
   * Kept optional here only so the type shape doesn't shrink.
   */
  swatchbookColorFormat?: ColorFormat;
  [key: string]: unknown;
}

/**
 * Per-story `parameters.swatchbook` namespace. All fields optional — most
 * stories don't override anything.
 */
export interface SwatchbookParameters {
  /** Per-story tuple override. Highest priority input. */
  axes?: Record<string, string>;
}

/**
 * Storybook's parameters bag, narrowed on the `swatchbook` namespace.
 */
export interface StoryParameters {
  swatchbook?: SwatchbookParameters;
  [key: string]: unknown;
}

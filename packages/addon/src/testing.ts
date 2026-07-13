/**
 * Story-authoring helper exported from `@unpunnyfuns/swatchbook-addon/testing`.
 * `withAxes(base, axesOrPreset, options?)` derives a CSF-factory story variant
 * that runs the base story's full test (render + play + a11y) under a different
 * axis tuple. Assign the result to its own named export so `addon-vitest`
 * generates a test for it.
 */

import { axes as virtualAxes, presets as virtualPresets } from 'virtual:swatchbook/tokens';
import { buildAxisVariant } from '#/axis-variant.ts';
import type { FactoryStory, WithAxesOptions } from '#/axis-variant.ts';

export type { WithAxesOptions } from '#/axis-variant.ts';

/**
 * Derive an axis variant of a CSF-factory story. Pass a partial tuple
 * (`{ mode: 'Dark' }`) or a preset name (`'Brand A Dark'`); both are validated
 * against the project's axes/presets and throw on a typo. Unlisted axes fall
 * back to their defaults at render time.
 */
export function withAxes<TStory extends FactoryStory>(
  base: TStory,
  axes: Readonly<Record<string, string>> | string,
  options: WithAxesOptions = {},
): TStory {
  return buildAxisVariant(base, axes, options, { axes: virtualAxes, presets: virtualPresets });
}

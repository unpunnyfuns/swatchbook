/**
 * Story-authoring helper exported from `@unpunnyfuns/swatchbook-addon/testing`.
 * `withAxes(axesOrPreset)` returns the `.extend()` input that runs a CSF-factory
 * story's full test (render + play + a11y) under a different axis tuple. Apply it
 * at the export site so addon-vitest generates a test:
 *
 *   export const Dark = RefBlue.extend(withAxes('Brand A Dark'));
 *
 * To hide a variant from the sidebar while still testing it, add a literal tag:
 *
 *   export const Hidden = RefBlue.extend({ tags: ['!dev'], ...withAxes('Brand A Dark') });
 */

import { axes as virtualAxes, presets as virtualPresets } from 'virtual:swatchbook/tokens';
import { buildAxisInput } from '#/axis-variant.ts';
import type { AxisVariantInput } from '#/axis-variant.ts';

export type { AxisVariantInput } from '#/axis-variant.ts';

/**
 * Produce the `.extend()` input pinning a story variant to an axis tuple. Pass a
 * partial tuple (`{ mode: 'Dark' }`) or a preset name (`'Brand A Dark'`); both are
 * validated against the project's axes/presets and throw on a typo. Unlisted axes
 * fall back to their defaults at render time.
 */
export function withAxes(axes: Readonly<Record<string, string>> | string): AxisVariantInput {
  return buildAxisInput(axes, { axes: virtualAxes, presets: virtualPresets });
}

// Storybook-internal surface (fragile across Storybook MAJORS). See the
// major-bump checklist in CLAUDE.md; the import set is pinned by
// storybook-internal-surface.test.ts.
import { definePreviewAddon } from 'storybook/internal/csf';
import * as previewExports from '#/preview.tsx';

export type { AddonOptions } from '#/options.ts';

/**
 * Typed shapes for the `parameters.swatchbook.*` / `globals.swatchbook*`
 * contract the addon reads, so consumers authoring story config can check
 * it against a named type instead of relying on structural matching.
 */
export type { StoryParameters, SwatchbookGlobals, SwatchbookParameters } from '#/globals.ts';

/**
 * Public namespace constants — addon ID, parameter / global keys, the
 * canonical virtual module ID. Useful for consumer code that needs to
 * reach into the addon's namespace (custom toolbar registrations,
 * channel events, manager hooks that need a stable handle on these keys).
 */
export { ADDON_ID, AXES_GLOBAL_KEY, TOOL_ID, VIRTUAL_MODULE_ID } from '#/constants.ts';

/**
 * Re-export the full user-facing surface from `@unpunnyfuns/swatchbook-blocks`
 * and `@unpunnyfuns/swatchbook-switcher` so consumers can
 * `import { TokenTable, ThemeSwitcher, useToken } from '@unpunnyfuns/swatchbook-addon'`
 * without adding the sibling packages to their own package.json. Both are
 * declared as regular dependencies of the addon, so they come along for the
 * ride. Subpath entries (`./preset`, `./manager`, `./preview`, `./hooks`)
 * still exist for Storybook's preset loader — this meta re-export is just
 * for the React / MDX consumer path.
 */
export * from '@unpunnyfuns/swatchbook-blocks';
export * from '@unpunnyfuns/swatchbook-switcher';

/**
 * Blocks and switcher each declare their own `ColorFormat` / `COLOR_FORMATS`
 * (switcher's copy avoids a runtime dependency on core — see its
 * `types.ts`), so the two wildcard re-exports above collide on these names.
 * Pin the addon's public surface to blocks' canonical definitions, the ones
 * every other blocks-facing type on this barrel already comes from.
 */
export { COLOR_FORMATS } from '@unpunnyfuns/swatchbook-blocks';
export type { ColorFormat } from '@unpunnyfuns/swatchbook-blocks';

/**
 * CSF Next factory. Consumers call this inside
 * `definePreview({ addons: [swatchbookAddon()] })` so the preview annotations
 * (decorator, globalTypes, initialGlobals) are added to the preview bundle.
 */
export default function swatchbookAddon(): ReturnType<typeof definePreviewAddon> {
  return definePreviewAddon(previewExports);
}

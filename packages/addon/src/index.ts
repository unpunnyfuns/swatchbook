import { definePreviewAddon } from 'storybook/internal/csf';
import * as previewExports from './preview.tsx';

export {
  ADDON_ID,
  AXES_GLOBAL_KEY,
  GLOBAL_KEY,
  PARAM_KEY,
  VIRTUAL_MODULE_ID,
} from '#/constants.ts';
export type { AddonOptions } from '#/options.ts';

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
 * CSF Next factory. Consumers call this inside
 * `definePreview({ addons: [swatchbookAddon()] })` so the preview annotations
 * (decorator, globalTypes, initialGlobals) are added to the preview bundle.
 */
export default function swatchbookAddon(): ReturnType<typeof definePreviewAddon> {
  return definePreviewAddon(previewExports);
}

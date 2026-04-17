import { definePreviewAddon } from 'storybook/internal/csf';
import * as previewExports from './preview';

export { ADDON_ID, GLOBAL_KEY, PARAM_KEY, VIRTUAL_MODULE_ID } from '#/constants';
export type { AddonOptions } from '#/options';

/**
 * CSF Next factory. Consumers call this inside
 * `definePreview({ addons: [swatchbookAddon()] })` so the preview annotations
 * (decorator, globalTypes, initialGlobals) are added to the preview bundle.
 */
export default function swatchbookAddon(): ReturnType<typeof definePreviewAddon> {
  return definePreviewAddon(previewExports);
}

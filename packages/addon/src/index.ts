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
 * CSF Next factory. Consumers call this inside
 * `definePreview({ addons: [swatchbookAddon()] })` so the preview annotations
 * (decorator, globalTypes, initialGlobals) are added to the preview bundle.
 */
export default function swatchbookAddon(): ReturnType<typeof definePreviewAddon> {
  return definePreviewAddon(previewExports);
}

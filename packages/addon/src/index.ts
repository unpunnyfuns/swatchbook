import { definePreviewAddon } from 'storybook/internal/csf';
import * as previewExports from './preview.tsx';

export {
  ADDON_ID,
  AXES_GLOBAL_KEY,
  GLOBAL_KEY,
  PARAM_KEY,
  VIRTUAL_MODULE_ID,
} from '#/constants.ts';
export { AxesContext, ThemeContext, useActiveAxes, useActiveTheme } from '#/theme-context.ts';
export type { AddonOptions } from '#/options.ts';
export {
  type ProjectSnapshot,
  SwatchbookContext,
  useOptionalSwatchbookData,
  type VirtualAxisShape,
  type VirtualDiagnosticShape,
  type VirtualPresetShape,
  type VirtualThemeShape,
  type VirtualTokenShape,
} from '#/swatchbook-context.ts';

/**
 * CSF Next factory. Consumers call this inside
 * `definePreview({ addons: [swatchbookAddon()] })` so the preview annotations
 * (decorator, globalTypes, initialGlobals) are added to the preview bundle.
 */
export default function swatchbookAddon(): ReturnType<typeof definePreviewAddon> {
  return definePreviewAddon(previewExports);
}

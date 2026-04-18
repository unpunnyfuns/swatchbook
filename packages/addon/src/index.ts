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
 * Provider, contexts, and hooks live canonically in
 * `@unpunnyfuns/swatchbook-blocks`. They are re-exported here for
 * back-compat with consumers that imported them from the addon prior to
 * the dep-flip; prefer importing from `@unpunnyfuns/swatchbook-blocks`
 * going forward.
 */
export {
  AxesContext,
  type ProjectSnapshot,
  SwatchbookContext,
  ThemeContext,
  useActiveAxes,
  useActiveTheme,
  useOptionalSwatchbookData,
  type VirtualAxisShape,
  type VirtualDiagnosticShape,
  type VirtualPresetShape,
  type VirtualThemeShape,
  type VirtualTokenShape,
} from '@unpunnyfuns/swatchbook-blocks';

/**
 * CSF Next factory. Consumers call this inside
 * `definePreview({ addons: [swatchbookAddon()] })` so the preview annotations
 * (decorator, globalTypes, initialGlobals) are added to the preview bundle.
 */
export default function swatchbookAddon(): ReturnType<typeof definePreviewAddon> {
  return definePreviewAddon(previewExports);
}

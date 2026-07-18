export const ADDON_ID = 'swatchbook';
export const TOOL_ID = `${ADDON_ID}/theme-switcher`;
/** Canonical active-permutation tuple: `Record<axisName, contextName>`. Read by toolbar, panel, blocks. */
export const AXES_GLOBAL_KEY = 'swatchbookAxes';

export const VIRTUAL_MODULE_ID = 'virtual:swatchbook/tokens';
export const RESOLVED_VIRTUAL_MODULE_ID = `\0${VIRTUAL_MODULE_ID}`;

/**
 * Aggregate virtual module the addon's preview always imports. Its body
 * is a sequence of side-effect imports — one per integration that
 * declared `virtualModule.autoInject: true`. Integrations contributing
 * global stylesheets (Tailwind's `@theme` block, a rules-heavy CSS
 * file) can opt into this path so consumers never hand-write an
 * `import 'virtual:swatchbook/…'` line themselves; the body is empty
 * when no integration opts in.
 */
export const INTEGRATION_SIDE_EFFECTS_VIRTUAL_ID = 'virtual:swatchbook/integration-side-effects';
export const RESOLVED_INTEGRATION_SIDE_EFFECTS_VIRTUAL_ID = `\0${INTEGRATION_SIDE_EFFECTS_VIRTUAL_ID}`;

export const STYLE_ELEMENT_ID = 'swatchbook-tokens';

/** Channel event: preview → manager, carries the init payload:
 * axes / presets / disabledAxes / diagnostics / cssVarPrefix /
 * defaultTuple. */
export const INIT_EVENT = 'swatchbook/init';
/** Channel event: manager → preview, asks preview to re-emit INIT_EVENT.
 * Covers the race where the manager subscribes after the preview's
 * initial broadcast — without it the toolbar stays in "loading…" until
 * the user triggers anything that re-fires INIT_EVENT. */
export const INIT_REQUEST_EVENT = 'swatchbook/init-request';
/** Channel event: preview → manager, fires once per `mousedown` on the
 * preview document. The toolbar popover listens for it so clicks landing
 * inside the preview iframe close the popover — a plain document-level
 * listener on the manager can't see iframe events. */
export const PREVIEW_MOUSEDOWN_EVENT = 'swatchbook/preview-mousedown';

/** Custom Vite HMR event: plugin → preview. Preview forwards it to the
 * Storybook channel as `TOKENS_UPDATED_EVENT` (exported from
 * `@unpunnyfuns/swatchbook-blocks`, the single source of truth for that
 * wire string, which blocks also listen on) so blocks can update their
 * snapshot. A distinct wire string from the channel event so the plugin
 * doesn't need a Storybook-channel dependency. */
export const HMR_EVENT = 'swatchbook/hmr-tokens';

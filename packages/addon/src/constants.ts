export const ADDON_ID = 'swatchbook';
export const TOOL_ID = `${ADDON_ID}/theme-switcher`;
export const PARAM_KEY = 'swatchbook';
/** Canonical active-permutation tuple: `Record<axisName, contextName>`. Read by toolbar, panel, blocks. */
export const AXES_GLOBAL_KEY = 'swatchbookAxes';
/** Display-only color format for blocks (`hex` | `rgb` | `hsl` | `oklch` | `raw`). Emitted CSS is unaffected. */
export const COLOR_FORMAT_GLOBAL_KEY = 'swatchbookColorFormat';

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

/** Channel event: preview → manager, carries theme list + mode. */
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

/** Channel event: preview → blocks, carries the fresh virtual-module
 * payload after a dev-time token refresh so blocks can re-render in
 * place without a full iframe reload. Fired by the preview in response
 * to the `HMR_EVENT` below. */
export const TOKENS_UPDATED_EVENT = 'swatchbook/tokens-updated';

/** Custom Vite HMR event: plugin → preview. Preview forwards it to the
 * Storybook channel as {@link TOKENS_UPDATED_EVENT} so blocks can
 * update their snapshot. Kept distinct from the channel event so the
 * plugin doesn't need a Storybook-channel dependency. */
export const HMR_EVENT = 'swatchbook/tokens-updated';

export const ADDON_ID = 'swatchbook';
export const TOOL_ID = `${ADDON_ID}/theme-switcher`;
export const PARAM_KEY = 'swatchbook';
/** Canonical active-theme global: composed permutation ID (string). Read by toolbar, panel, blocks. */
export const GLOBAL_KEY = 'swatchbookTheme';
/** Tuple companion: `Record<axisName, contextName>`. Optional — when present, takes precedence over the string global. */
export const AXES_GLOBAL_KEY = 'swatchbookAxes';
/** Display-only color format for blocks (`hex` | `rgb` | `hsl` | `oklch` | `raw`). Emitted CSS is unaffected. */
export const COLOR_FORMAT_GLOBAL_KEY = 'swatchbookColorFormat';

export const VIRTUAL_MODULE_ID = 'virtual:swatchbook/tokens';
export const RESOLVED_VIRTUAL_MODULE_ID = `\0${VIRTUAL_MODULE_ID}`;

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

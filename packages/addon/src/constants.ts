export const ADDON_ID = 'swatchbook';
export const TOOL_ID = `${ADDON_ID}/theme-switcher`;
export const PANEL_ID = `${ADDON_ID}/panel`;
export const PANEL_TOKENS_TAB = `${ADDON_ID}/tokens`;
export const PANEL_DIAGNOSTICS_TAB = `${ADDON_ID}/diagnostics`;
export const PARAM_KEY = 'swatchbook';
/** Canonical active-theme global: composed permutation ID (string). Read by toolbar, panel, blocks. */
export const GLOBAL_KEY = 'swatchbookTheme';
/** Tuple companion: `Record<axisName, contextName>`. Optional — when present, takes precedence over the string global. */
export const AXES_GLOBAL_KEY = 'swatchbookAxes';

export const VIRTUAL_MODULE_ID = 'virtual:swatchbook/tokens';
export const RESOLVED_VIRTUAL_MODULE_ID = `\0${VIRTUAL_MODULE_ID}`;

export const DATA_THEME_ATTR = 'data-theme';
export const STYLE_ELEMENT_ID = 'swatchbook-tokens';

/** Channel event: preview → manager, carries theme list + mode. */
export const INIT_EVENT = 'swatchbook/init';

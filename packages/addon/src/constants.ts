export const ADDON_ID = 'swatchbook';
export const TOOL_ID = `${ADDON_ID}/theme-switcher`;
export const PARAM_KEY = 'swatchbook';
export const GLOBAL_KEY = 'swatchbookTheme';

export const VIRTUAL_MODULE_ID = 'virtual:swatchbook/tokens';
export const RESOLVED_VIRTUAL_MODULE_ID = `\0${VIRTUAL_MODULE_ID}`;

export const DATA_THEME_ATTR = 'data-theme';
export const STYLE_ELEMENT_ID = 'swatchbook-tokens';

/** Channel event: preview → manager, carries theme list + mode. */
export const INIT_EVENT = 'swatchbook/init';

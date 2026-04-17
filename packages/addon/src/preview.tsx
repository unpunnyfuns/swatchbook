import type { Decorator, Preview } from '@storybook/react-vite';
import { useEffect } from 'react';
import { addons } from 'storybook/preview-api';
import {
  css,
  cssVarPrefix,
  defaultTheme,
  diagnostics,
  themes,
  themesResolved,
  themingMode,
} from 'virtual:swatchbook/tokens';
import {
  DATA_THEME_ATTR,
  GLOBAL_KEY,
  INIT_EVENT,
  PARAM_KEY,
  STYLE_ELEMENT_ID,
} from '#/constants.ts';
import { ThemeContext } from '#/theme-context.ts';

/** CSS var name with the active prefix applied. */
function v(name: string): string {
  return cssVarPrefix ? `--${cssVarPrefix}-${name}` : `--${name}`;
}

/**
 * Inject the per-theme stylesheet plus a tiny `html, body { ... }` block so
 * the iframe's own chrome (outside any decorator wrapper — Docs mode,
 * autodocs, empty gutters) also picks up the active theme.
 */
function ensureStylesheet(): void {
  if (typeof document === 'undefined') return;
  const bodyRules = `
html, body {
  background: var(${v('color-sys-surface-default')}, Canvas);
  color: var(${v('color-sys-text-default')}, CanvasText);
  margin: 0;
}
`;
  const text = `${css}\n${bodyRules}`;
  let style = document.getElementById(STYLE_ELEMENT_ID) as HTMLStyleElement | null;
  if (!style) {
    style = document.createElement('style');
    style.id = STYLE_ELEMENT_ID;
    document.head.appendChild(style);
  }
  if (style.textContent !== text) style.textContent = text;
}

/** Keep <html data-theme=…> in sync so the whole iframe inherits the theme. */
function setRootTheme(theme: string): void {
  if (typeof document === 'undefined') return;
  document.documentElement.setAttribute(DATA_THEME_ATTR, theme);
}

/**
 * Emit the full virtual-module payload to the manager over Storybook's
 * channel so the toolbar + panel (which run in the manager bundle and
 * can't import our virtual module) can render from it.
 */
function broadcastInit(): void {
  const channel = addons.getChannel();
  channel.emit(INIT_EVENT, {
    themes,
    defaultTheme,
    mode: themingMode,
    themesResolved,
    diagnostics,
    cssVarPrefix,
  });
}

const themedDecorator: Decorator = (Story, context) => {
  const globalTheme = (context.globals as Record<string, unknown>)[GLOBAL_KEY];
  const parameterTheme = (context.parameters as Record<string, Record<string, unknown>>)[
    PARAM_KEY
  ]?.['theme'];
  const theme = (parameterTheme ?? globalTheme ?? defaultTheme ?? 'Light') as string;

  useEffect(() => {
    ensureStylesheet();
    broadcastInit();
  }, []);

  useEffect(() => {
    setRootTheme(theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={theme}>
      <div
        {...{ [DATA_THEME_ATTR]: theme }}
        style={{
          padding: '1rem',
          minHeight: '100%',
        }}
      >
        <Story />
      </div>
    </ThemeContext.Provider>
  );
};

/**
 * Named exports consumed by `definePreviewAddon(previewExports)` in the
 * addon's CSF Next factory (`src/index.ts`).
 */
export const decorators: NonNullable<Preview['decorators']> = [themedDecorator];

export const globalTypes: NonNullable<Preview['globalTypes']> = {
  [GLOBAL_KEY]: {
    name: 'Theme',
    description: 'Active swatchbook theme. UI lives in the manager toolbar tool.',
  },
};

export const initialGlobals: NonNullable<Preview['initialGlobals']> = {
  [GLOBAL_KEY]: defaultTheme ?? themes[0]?.name ?? 'Light',
};

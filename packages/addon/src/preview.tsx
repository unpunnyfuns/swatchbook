import type { Decorator, Preview } from '@storybook/react-vite';
import { useEffect } from 'react';
import { addons } from 'storybook/preview-api';
import {
  css as generatedCss,
  cssVarPrefix,
  defaultTheme,
  themes,
  themingMode,
} from 'virtual:swatchbook/tokens';
import { DATA_THEME_ATTR, GLOBAL_KEY, INIT_EVENT, PARAM_KEY, STYLE_ELEMENT_ID } from '#/constants';

interface ThemeEntry {
  name: string;
  input: Record<string, string>;
  sources: string[];
}

const typedThemes = themes as ThemeEntry[];
const typedCss = generatedCss as string;
const typedDefaultTheme = defaultTheme as string | null;
const typedPrefix = (cssVarPrefix ?? '') as string;
const typedMode = themingMode as 'layered' | 'resolver' | 'manifest';

/** CSS var name with the active prefix applied. */
function v(name: string): string {
  return typedPrefix ? `--${typedPrefix}-${name}` : `--${name}`;
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
  const text = `${typedCss}\n${bodyRules}`;
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
 * Emit themes to the manager over Storybook's channel so the toolbar tool
 * (in the manager bundle, which can't import our virtual module) gets the
 * theme list, default, and mode.
 */
function broadcastThemes(): void {
  const channel = addons.getChannel();
  channel.emit(INIT_EVENT, {
    themes: typedThemes,
    defaultTheme: typedDefaultTheme,
    mode: typedMode,
  });
}

const themedDecorator: Decorator = (Story, context) => {
  const globalTheme = (context.globals as Record<string, unknown>)[GLOBAL_KEY];
  const parameterTheme = (context.parameters as Record<string, Record<string, unknown>>)[
    PARAM_KEY
  ]?.['theme'];
  const theme = (parameterTheme ?? globalTheme ?? typedDefaultTheme ?? 'Light') as string;

  useEffect(() => {
    ensureStylesheet();
    broadcastThemes();
  }, []);

  useEffect(() => {
    setRootTheme(theme);
  }, [theme]);

  return (
    <div
      {...{ [DATA_THEME_ATTR]: theme }}
      style={{
        padding: '1rem',
        minHeight: '100%',
      }}
    >
      <Story />
    </div>
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
  [GLOBAL_KEY]: typedDefaultTheme ?? typedThemes[0]?.name ?? 'Light',
};

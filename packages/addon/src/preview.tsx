import type { Decorator, Preview } from '@storybook/react-vite';
import { useEffect } from 'react';
// @ts-expect-error — virtual module resolved by the Vite plugin at preview build time
import { css as generatedCss, cssVarPrefix, defaultTheme, themes } from 'virtual:swatchbook/tokens';
import { DATA_THEME_ATTR, GLOBAL_KEY, PARAM_KEY, STYLE_ELEMENT_ID } from '#/constants';

interface ThemeEntry {
  name: string;
}

const typedThemes = themes as ThemeEntry[];
const typedCss = generatedCss as string;
const typedDefaultTheme = defaultTheme as string | null;
const typedPrefix = (cssVarPrefix ?? '') as string;

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

const decorator: Decorator = (Story, context) => {
  const globalTheme = (context.globals as Record<string, unknown>)[GLOBAL_KEY];
  const parameterTheme = (context.parameters as Record<string, Record<string, unknown>>)[
    PARAM_KEY
  ]?.['theme'];
  const theme = (parameterTheme ?? globalTheme ?? typedDefaultTheme ?? 'Light') as string;

  useEffect(() => {
    ensureStylesheet();
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

const preview: Preview = {
  decorators: [decorator],
  globalTypes: {
    [GLOBAL_KEY]: {
      name: 'Theme',
      description: 'Active swatchbook theme.',
      toolbar: {
        icon: 'paintbrush',
        items: typedThemes.map((t) => ({ value: t.name, title: t.name })),
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: { [GLOBAL_KEY]: typedDefaultTheme ?? typedThemes[0]?.name ?? 'Light' },
};

export default preview;

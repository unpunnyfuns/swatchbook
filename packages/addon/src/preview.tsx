import type { Decorator, Preview } from '@storybook/react-vite';
import { useEffect } from 'react';
// @ts-expect-error — virtual module resolved by the Vite plugin at preview build time
import { css as generatedCss, defaultTheme, themes } from 'virtual:swatchbook/tokens';
import { DATA_THEME_ATTR, GLOBAL_KEY, PARAM_KEY, STYLE_ELEMENT_ID } from '#/constants';

interface ThemeEntry {
  name: string;
}

const typedThemes = themes as ThemeEntry[];
const typedCss = generatedCss as string;
const typedDefaultTheme = defaultTheme as string | null;

function ensureStylesheet(): void {
  if (typeof document === 'undefined') return;
  let style = document.getElementById(STYLE_ELEMENT_ID) as HTMLStyleElement | null;
  if (!style) {
    style = document.createElement('style');
    style.id = STYLE_ELEMENT_ID;
    document.head.appendChild(style);
  }
  if (style.textContent !== typedCss) style.textContent = typedCss;
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

  return (
    <div
      {...{ [DATA_THEME_ATTR]: theme }}
      style={{
        background: 'var(--sb-color-sys-surface-default, white)',
        color: 'var(--sb-color-sys-text-default, black)',
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

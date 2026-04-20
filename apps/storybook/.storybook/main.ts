import { defineMain } from '@storybook/react-vite/node';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolverPath } from '@unpunnyfuns/swatchbook-tokens-reference';

function pkg(name: string): string {
  return dirname(fileURLToPath(import.meta.resolve(`${name}/package.json`)));
}

export default defineMain({
  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(ts|tsx)'],
  addons: [
    pkg('@chromatic-com/storybook'),
    pkg('@storybook/addon-vitest'),
    pkg('@storybook/addon-a11y'),
    pkg('@storybook/addon-docs'),
    pkg('@storybook/addon-mcp'),
    {
      name: '@unpunnyfuns/swatchbook-addon',
      options: {
        config: {
          resolver: resolverPath,
          default: { mode: 'Light', brand: 'Default', contrast: 'Normal' },
          // Uncomment to suppress the `contrast` axis from this Storybook —
          // the toolbar dropdown disappears, CSS emission drops it from
          // compound selectors, and the Design Tokens panel shows a pinned indicator.
          // disabledAxes: ['contrast'],
          cssVarPrefix: 'sb',
          chrome: {
            surfaceDefault: 'color.sys.surface.default',
            surfaceMuted: 'color.sys.surface.muted',
            surfaceRaised: 'color.sys.surface.raised',
            textDefault: 'color.sys.text.default',
            textMuted: 'color.sys.text.muted',
            borderDefault: 'color.sys.border.default',
            accentBg: 'color.sys.accent.bg',
            accentFg: 'color.sys.accent.fg',
            bodyFontFamily: 'typography.sys.body.font-family',
            bodyFontSize: 'typography.sys.body.font-size',
          },
          presets: [
            {
              name: 'Default Light',
              axes: { mode: 'Light', brand: 'Default', contrast: 'Normal' },
              description: 'Baseline light mode with the stock accent.',
            },
            {
              name: 'Brand A Dark',
              axes: { mode: 'Dark', brand: 'Brand A', contrast: 'Normal' },
              description: 'Dark surfaces paired with the violet Brand A accent.',
            },
            {
              name: 'A11y High Contrast',
              axes: { mode: 'Light', contrast: 'High' },
              description: 'High-contrast borders on the light baseline.',
            },
          ],
        },
      },
    },
  ],
  framework: pkg('@storybook/react-vite'),
});

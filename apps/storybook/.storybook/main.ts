import { defineMain } from '@storybook/react-vite/node';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolverPath } from '@unpunnyfuns/swatchbook-tokens-reference';

function pkg(name: string): string {
  return dirname(fileURLToPath(import.meta.resolve(`${name}/package.json`)));
}

export default defineMain({
  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(ts|tsx)'],
  staticDirs: ['./assets'],
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
          // Dogfood: wire block chrome to the reference tokens. Without this
          // map, chrome falls back to the hard-coded `light-dark()` defaults
          // in `DEFAULT_CHROME_MAP` — readable, but deaf to our Brand A /
          // contrast axes. Mapping to `color.*` / `typography.*`
          // makes block chrome track every toolbar flip.
          chrome: {
            surfaceDefault: 'color.surface.default',
            surfaceMuted: 'color.surface.muted',
            surfaceRaised: 'color.surface.raised',
            textDefault: 'color.text.default',
            textMuted: 'color.text.muted',
            borderDefault: 'color.border.default',
            accentBg: 'color.accent.bg',
            accentFg: 'color.accent.fg',
            bodyFontFamily: 'typography.body.font-family',
            bodyFontSize: 'typography.body.font-size',
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

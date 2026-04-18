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
          default: { mode: 'Light', brand: 'Default' },
          cssVarPrefix: 'sb',
          presets: [
            {
              name: 'Default Light',
              axes: { mode: 'Light', brand: 'Default' },
              description: 'Baseline light mode with the stock accent.',
            },
            {
              name: 'Brand A Dark',
              axes: { mode: 'Dark', brand: 'Brand A' },
              description: 'Dark surfaces paired with the violet Brand A accent.',
            },
          ],
        },
      },
    },
  ],
  framework: pkg('@storybook/react-vite'),
});

import { defineMain } from '@storybook/react-vite/node';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

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
        configPath: '../swatchbook.config.ts',
      },
    },
  ],
  framework: pkg('@storybook/react-vite'),
});

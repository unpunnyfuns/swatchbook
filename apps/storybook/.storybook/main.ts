import tailwindcss from '@tailwindcss/vite';
import { defineMain } from '@storybook/react-vite/node';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import cssInJsIntegration from '@unpunnyfuns/swatchbook-integrations/css-in-js';
import tailwindIntegration from '@unpunnyfuns/swatchbook-integrations/tailwind';

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
        configPath: '../swatchbook.config.ts',
        // Dogfood both integrations side by side: the Tailwind
        // integration contributes `virtual:swatchbook/tailwind.css`
        // (aliases Tailwind utility scales to our `--sb-*` vars) and
        // the CSS-in-JS integration contributes `virtual:swatchbook/theme`
        // (typed JS accessor consumed by styled-components / emotion /
        // any ThemeProvider). Both stay in lockstep with `cssVarPrefix`
        // because their outputs are rendered from the loaded project.
        integrations: [tailwindIntegration(), cssInJsIntegration()],
      },
    },
  ],
  framework: pkg('@storybook/react-vite'),
  // Tailwind v4 Vite plugin — processes the `@theme` block the addon's
  // virtual module serves. The addon knows nothing about Tailwind
  // directly; the integration package does.
  viteFinal(config) {
    const plugins = Array.isArray(config.plugins) ? [...config.plugins] : [];
    plugins.push(tailwindcss());
    return { ...config, plugins };
  },
});

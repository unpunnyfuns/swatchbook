import type { Preview } from '@storybook/react-vite';

/**
 * Swatchbook's preview decorator + theme toolbar come from
 * `@unpunnyfuns/swatchbook-addon` (registered in main.ts). This file carries
 * only app-level parameters.
 */
const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    a11y: { test: 'error' },
    backgrounds: { disable: true },
  },
};

export default preview;

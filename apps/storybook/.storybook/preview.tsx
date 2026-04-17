import addonDocs from '@storybook/addon-docs';
import addonA11y from '@storybook/addon-a11y';
import { definePreview } from '@storybook/react-vite';

export default definePreview({
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

  addons: [addonA11y(), addonDocs()],
});

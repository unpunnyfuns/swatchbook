import addonA11y from '@storybook/addon-a11y';
import addonDocs from '@storybook/addon-docs';
import { definePreview } from '@storybook/react-vite';
import swatchbookAddon from '@unpunnyfuns/swatchbook-addon';

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
    options: {
      storySort: {
        order: [
          'Docs',
          [
            'Dashboard',
            'Introduction',
            'Colors',
            'Typography',
            'Fonts',
            'Dimensions',
            'Shadows',
            'Borders',
            'Gradients',
            'Motion',
            'StrokeStyles',
          ],
          '*',
        ],
      },
    },
  },
  addons: [addonA11y(), addonDocs(), swatchbookAddon()],
});

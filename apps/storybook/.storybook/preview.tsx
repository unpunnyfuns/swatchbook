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
    // Chromatic snapshots capture a single frame; any animated element
    // can land on a different pixel each run and surface as a false
    // "visual change" on every PR. `pauseAnimationAtEnd: true` runs CSS
    // animations / transitions through and holds on the end frame, so
    // snapshots of motion / transition / cubicBezier demos are
    // deterministic. Doesn't affect interactive stories or assertion
    // play functions — only Chromatic's capture phase.
    chromatic: { pauseAnimationAtEnd: true },
    options: {
      storySort: {
        order: [
          'Introduction',
          'Docs',
          [
            'Dashboard',
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

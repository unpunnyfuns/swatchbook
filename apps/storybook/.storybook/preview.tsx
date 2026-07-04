// Aliasing scheme: the story files import this module via a deep relative
// path (`../../.storybook/preview.tsx`). A `#storybook/*` subpath import —
// `"#storybook/*": "./.storybook/*"` in package.json#imports, parallel to the
// existing `"#/*": "./src/*"` — would let them write `#storybook/preview.tsx`
// instead, dropping the `../../` climb. Not wired yet; see issue #1284.
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
    // Chromatic snapshots capture a single frame; animated elements
    // land on a different pixel each run and surface as a false
    // "visual change" on every PR. `pauseAnimationAtEnd: true` holds
    // CSS animations / transitions on the final frame for deterministic
    // capture. Capture-phase only.
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
          'Tokens',
          [
            'Introduction',
            'Overview',
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
          'Blocks',
          ['Introduction', '*'],
          '*',
        ],
      },
    },
  },
  addons: [addonA11y(), addonDocs(), swatchbookAddon()],
});

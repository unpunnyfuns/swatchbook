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
    // "visual change" on every PR. Two layers:
    //
    //   - `pauseAnimationAtEnd: true` holds CSS animations / transitions
    //     on the final frame — fine for transitions that have a defined
    //     end (FadeIn, slide-to-rest, etc.).
    //   - `prefersReducedMotion: true` forces the OS-level reduce-motion
    //     hint, which MotionSample / MotionPreview already respect by
    //     rendering a static fallback instead of the looping ball. Covers
    //     JS-driven loops (`setInterval`-based ping-pong) that have no
    //     "end" for pauseAnimationAtEnd to hook.
    //
    // Both are capture-phase only — no effect on local dev, addon-vitest
    // play functions, or the manual Storybook experience.
    chromatic: { pauseAnimationAtEnd: true, prefersReducedMotion: true },
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

import { addons } from 'storybook/manager-api';
import { create, themes } from 'storybook/theming';

/**
 * Manager-side theming for the Storybook UI chrome (sidebar, toolbar,
 * panel tabs) — separate from the preview-side swatchbook addon that
 * themes stories. This just brands the manager with the swatchbook logo
 * + lowercase wordmark so readers know where they are.
 *
 * Light theme only for now; the stock light chrome reads cleanly under
 * both preview color-schemes.
 */
addons.setConfig({
  theme: create({
    ...themes.light,
    base: 'light',
    brandTitle: 'swatchbook',
    brandUrl: 'https://unpunnyfuns.github.io/swatchbook/',
    brandImage: './logo.svg',
    brandTarget: '_self',
  }),
});

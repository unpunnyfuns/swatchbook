import { addons } from 'storybook/manager-api';
import { create, themes } from 'storybook/theming';

/**
 * Manager-side theming for the Storybook UI chrome (sidebar, toolbar,
 * panel tabs) — separate from the preview-side swatchbook addon that
 * themes stories. Brands the manager with the swatchbook logo + lowercase
 * wordmark, and follows the user's OS `prefers-color-scheme` so dark-mode
 * readers don't get a white chrome against their dark OS.
 *
 * Storybook doesn't ship a built-in interactive manager-theme toggle;
 * `storybook-dark-mode` is the closest community option but it only
 * manipulates DOM classes, not the `addons.setConfig` theme. The
 * prefers-color-scheme check here runs once at manager load — consumers
 * who want a different theme can flip their OS setting and reload.
 */
const preferDark =
  typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;

addons.setConfig({
  theme: create({
    ...(preferDark ? themes.dark : themes.light),
    base: preferDark ? 'dark' : 'light',
    brandTitle: 'swatchbook',
    brandUrl: 'https://unpunnyfuns.github.io/swatchbook/',
    brandImage: './logo.svg',
    brandTarget: '_self',
  }),
});

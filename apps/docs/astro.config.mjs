import react from '@astrojs/react';
import starlight from '@astrojs/starlight';
import { defineConfig } from 'astro/config';
import starlightVersions from 'starlight-versions';

export default defineConfig({
  site: 'https://unpunnyfuns.github.io',
  base: '/swatchbook',
  integrations: [
    react(),
    starlight({
      title: 'swatchbook',
      social: [
        { icon: 'storybook', label: 'Live Storybook', href: '/swatchbook/storybook/' },
        { icon: 'github', label: 'GitHub', href: 'https://github.com/unpunnyfuns/swatchbook' },
      ],
      plugins: [starlightVersions({ versions: [{ slug: '1.0' }] })],
      // Mirrors sidebars.ts (Docusaurus), one group per top-nav section: Guides
      // for task-oriented walkthroughs, Reference grouped by kind (Packages /
      // Blocks) so it reads as an index rather than a flat page list, Concepts
      // for the mental model, Developers for contributor-facing internals.
      sidebar: [
        {
          label: 'Guides',
          items: [
            'guides/quickstart',
            'guides/authoring-doc-stories',
            'guides/displaying-tokens-as-stories',
            'guides/consuming-the-active-theme',
            {
              label: 'Integrations',
              items: [
                'guides/integrations',
                'guides/integrations/tailwind',
                'guides/integrations/css-in-js',
              ],
            },
            'guides/terrazzo-dependencies',
            'guides/sharing-terrazzo-options',
          ],
        },
        {
          label: 'Reference',
          items: [
            {
              label: 'Packages',
              items: [
                'reference/addon',
                'reference/core',
                'reference/config',
                'reference/switcher',
                'reference/mcp',
                'reference/integrations',
              ],
            },
            {
              label: 'Blocks',
              items: [
                'reference/blocks',
                'reference/blocks/overview',
                'reference/blocks/inspector',
                'reference/blocks/samples',
                'reference/blocks/utility',
                'reference/blocks/hooks',
              ],
            },
            'reference/diagnostics',
            'reference/with-axes',
          ],
        },
        {
          label: 'Concepts',
          items: [
            'concepts/overview',
            'concepts/concepts',
            'concepts/axes',
            'concepts/token-pipeline',
          ],
        },
        {
          label: 'Developers',
          items: [
            'developers',
            'developers/architecture',
            'developers/sharp-corners',
            'developers/built-with-ai',
          ],
        },
      ],
    }),
  ],
  // The 3 Docusaurus client-redirects (docusaurus.config.ts's
  // plugin-client-redirects entry), preserved so existing inbound links
  // to the old reference/* paths keep resolving after the concepts/ move.
  // The 4th preserves quickstart's Docusaurus root-level `slug: /quickstart`
  // override, which Starlight's path-derived slugs don't reproduce now that
  // the file lives under guides/.
  //
  // Destinations carry the `/swatchbook` base by hand: unlike every in-page
  // Starlight link, Astro's static redirect-page generator burns the
  // destination string as-is into the meta-refresh/canonical tags without
  // consulting `base`, so an unprefixed target 404s once deployed.
  redirects: {
    '/reference/concepts': '/swatchbook/concepts/',
    '/reference/axes': '/swatchbook/concepts/axes',
    '/reference/token-pipeline': '/swatchbook/concepts/token-pipeline',
    '/quickstart': '/swatchbook/guides/quickstart',
  },
});

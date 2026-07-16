import react from '@astrojs/react';
import starlight from '@astrojs/starlight';
import { defineConfig } from 'astro/config';
import { rehypeBaseLinks } from './src/plugins/rehype-base-links.mjs';

const base = '/swatchbook';

export default defineConfig({
  site: 'https://unpunnyfuns.github.io',
  base,
  markdown: {
    // Root-absolute doc links in MDX bodies (`/reference/config`) are
    // written unprefixed; Astro doesn't base-prefix markdown-authored
    // links itself, only the nav/sidebar it generates. This rewrites them
    // at build time so the source stays plain and portable.
    rehypePlugins: [[rehypeBaseLinks, { base }]],
  },
  integrations: [
    react(),
    starlight({
      title: 'swatchbook',
      logo: { src: './src/assets/logo.svg', alt: 'swatchbook logo' },
      customCss: ['./src/css/custom.css'],
      social: [
        { icon: 'storybook', label: 'Live Storybook', href: '/swatchbook/storybook/' },
        { icon: 'github', label: 'GitHub', href: 'https://github.com/unpunnyfuns/swatchbook' },
      ],
      // One group per top-nav section: Guides for task-oriented walkthroughs,
      // Reference grouped by kind (Packages / Blocks) so it reads as an index
      // rather than a flat page list, Concepts for the mental model,
      // Developers for contributor-facing internals.
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
  // The first 3 preserve existing inbound links to the old reference/*
  // paths after the concepts/ move. The 4th preserves quickstart's
  // root-level `/quickstart` URL, which Starlight's path-derived slugs
  // don't reproduce now that the file lives under guides/.
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

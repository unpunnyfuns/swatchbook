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
      logo: {
        light: './src/assets/light-logo.svg',
        dark: './src/assets/dark-logo.svg',
        alt: 'swatchbook logo',
      },
      customCss: ['./src/css/custom.css'],
      // Preload the self-hosted Geist variable fonts so the browser
      // fetches them before custom.css's @font-face is parsed, avoiding
      // a flash of the fallback stack.
      head: [
        {
          tag: 'link',
          attrs: {
            rel: 'preload',
            href: '/swatchbook/fonts/GeistVF.woff2',
            as: 'font',
            type: 'font/woff2',
            crossorigin: true,
          },
        },
        {
          tag: 'link',
          attrs: {
            rel: 'preload',
            href: '/swatchbook/fonts/GeistMonoVF.woff2',
            as: 'font',
            type: 'font/woff2',
            crossorigin: true,
          },
        },
      ],
      // Replace the stock light/dark toggle with the swatchbook switcher —
      // one control for every axis (mode/brand/contrast). Dogfoods the
      // product's own thesis: the switcher supersedes a plain theme toggle.
      components: { ThemeSelect: './src/components/ThemeSelect.astro' },
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
            'guides/creating-story-variants',
            'guides/consuming-the-active-theme',
            'guides/rendering-blocks-standalone',
            {
              label: 'Integrations',
              items: [
                'guides/integrations',
                'guides/integrations/tailwind',
                'guides/integrations/css-in-js',
              ],
            },
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
              ],
            },
            {
              label: 'Blocks',
              items: [
                'reference/blocks',
                'reference/blocks/provider',
                'reference/blocks/overview',
                'reference/blocks/inspector',
                'reference/blocks/presenters',
                'reference/blocks/hooks',
                'reference/blocks/utility',
              ],
            },
            'reference/diagnostics',
          ],
        },
        {
          label: 'Concepts',
          items: ['concepts', 'concepts/axes', 'concepts/token-pipeline'],
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
  // don't reproduce now that the file lives under guides/. The next 5
  // cover the docs consolidation: terrazzo-dependencies merged into
  // sharing-terrazzo-options, displaying-tokens-as-stories merged into
  // authoring-doc-stories, concepts/overview and concepts/concepts merged
  // into concepts/index (which also makes '/reference/concepts' above
  // resolve to a real page instead of 404ing), and reference/integrations
  // cut in favor of the guides/integrations index. The samples entry
  // covers the blocks-reference restructure: samples merged into presenters.
  //
  // Destinations carry the `/swatchbook` base by hand: unlike every in-page
  // Starlight link, Astro's static redirect-page generator burns the
  // destination string as-is into the meta-refresh/canonical tags without
  // consulting `base`, so an unprefixed target 404s once deployed.
  redirects: {
    '/reference/concepts': '/swatchbook/concepts/',
    '/reference/axes': '/swatchbook/concepts/axes/',
    '/reference/token-pipeline': '/swatchbook/concepts/token-pipeline/',
    '/quickstart': '/swatchbook/guides/quickstart/',
    '/guides/terrazzo-dependencies': '/swatchbook/guides/sharing-terrazzo-options/',
    '/guides/displaying-tokens-as-stories': '/swatchbook/guides/authoring-doc-stories/',
    '/concepts/overview': '/swatchbook/concepts/',
    '/concepts/concepts': '/swatchbook/concepts/',
    '/reference/integrations': '/swatchbook/guides/integrations/',
    '/reference/with-axes': '/swatchbook/guides/creating-story-variants/',
    '/reference/blocks/samples': '/swatchbook/reference/blocks/presenters/',
  },
});

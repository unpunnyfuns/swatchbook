import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { themes as prismThemes } from 'prism-react-renderer';
import type { Config } from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

// Docs versioning: current (main) renders as "Next 🚧" at /next/ with an
// unreleased banner, and the newest snapshot under versioned_docs/ serves as
// the default at /. Before the first snapshot exists, skip the versions map
// entirely so current keeps serving at /.
//
// Resolve relative to the config file itself — `./versions.json` vs
// `process.cwd()` is brittle in CI (Turbo / docusaurus CLI can shift cwd),
// and an empty `hasReleasedVersion` silently collapses the version routing.
const here = dirname(fileURLToPath(import.meta.url));
const versionsPath = resolve(here, 'versions.json');
const hasReleasedVersion =
  existsSync(versionsPath) && JSON.parse(readFileSync(versionsPath, 'utf8')).length > 0;

const config: Config = {
  title: 'Swatchbook',
  tagline: 'Storybook addon for DTCG design tokens',
  favicon: 'img/favicon.ico',

  future: {
    v4: {
      siteStorageNamespacing: true,
      fasterByDefault: false,
      mdx1CompatDisabledByDefault: true,
      useCssCascadeLayers: true,
      removeLegacyPostBuildHeadAttribute: true,
    },
  },

  url: 'https://unpunnyfuns.github.io',
  baseUrl: '/swatchbook/',

  organizationName: 'unpunnyfuns',
  projectName: 'swatchbook',

  onBrokenLinks: 'warn',

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          routeBasePath: '/',
          sidebarPath: './sidebars.ts',
          editUrl: 'https://github.com/unpunnyfuns/swatchbook/tree/main/apps/docs/',
          includeCurrentVersion: true,
          ...(hasReleasedVersion && {
            versions: {
              current: { label: 'Next 🚧', path: 'next', banner: 'unreleased' },
            },
          }),
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    colorMode: {
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: 'Swatchbook',
      items: [
        { type: 'docSidebar', sidebarId: 'docs', position: 'left', label: 'Docs' },
        { href: 'pathname:///storybook/', label: 'Live Storybook', position: 'left' },
        ...(hasReleasedVersion
          ? [{ type: 'docsVersionDropdown' as const, position: 'right' as const }]
          : []),
        {
          href: 'https://github.com/unpunnyfuns/swatchbook',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Docs',
          items: [
            { label: 'Introduction', to: '/' },
            { label: 'Quickstart', to: '/quickstart' },
          ],
        },
        {
          title: 'Project',
          items: [
            { label: 'GitHub', href: 'https://github.com/unpunnyfuns/swatchbook' },
            { label: 'DTCG spec', href: 'https://design-tokens.org/tr/2025/drafts/' },
          ],
        },
      ],
      copyright: `MIT © ${new Date().getFullYear()} unpunnyfuns`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['bash', 'json'],
    },
  } satisfies Preset.ThemeConfig,
};

export default config;

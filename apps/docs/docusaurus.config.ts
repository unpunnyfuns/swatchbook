import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { themes as prismThemes } from 'prism-react-renderer';
import type { Config } from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

// Docs versioning: current (main) is the default at /. Released snapshots
// under versioned_docs/ each mount at /<version>/ and stay browsable via the
// version dropdown. Before the first snapshot exists, skip the versions map
// entirely so current keeps serving at / without the dropdown.
//
// Resolve relative to the config file itself — `./versions.json` vs
// `process.cwd()` is brittle in CI (Turbo / docusaurus CLI can shift cwd),
// and an empty `hasReleasedVersion` silently collapses the version routing.
const here = dirname(fileURLToPath(import.meta.url));
const versionsPath = resolve(here, 'versions.json');
const hasReleasedVersion =
  existsSync(versionsPath) && JSON.parse(readFileSync(versionsPath, 'utf8')).length > 0;

const config: Config = {
  title: 'swatchbook',
  tagline: 'Storybook addon for DTCG design tokens',
  favicon: 'img/logo.svg',

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

  // The Storybook build is stitched into apps/docs/build/storybook by the
  // deploy workflow (see .github/workflows/docs.yml), so links to
  // `/storybook/` work at runtime but Docusaurus's compile-time broken-link
  // checker can't see the stitched route. Leave this as 'warn' — the
  // per-link hook only runs for markdown links, not the build-end check
  // that reports every route, so there's no way to allowlist just that
  // path without silencing the whole check.
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
            // Once a snapshot exists, the newest released version in
            // versions.json becomes the implicit lastVersion and serves at /,
            // so visitors shipping against `@unpunnyfuns/swatchbook-*@X.Y.Z`
            // land on docs that match their installed code. Main-branch docs
            // move to /next/ with an "unreleased" banner that warns visitors
            // they're on pre-release content.
            versions: {
              current: { label: 'Next', path: 'next', banner: 'unreleased' },
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
      title: 'swatchbook',
      logo: {
        alt: 'swatchbook logo',
        src: 'img/logo.svg',
        href: '/',
      },
      items: [
        // Quickstart lives in the `home` sidebar reachable via the
        // logo/title; every other section gets a navbar pill.
        { type: 'docSidebar', sidebarId: 'guides', position: 'left', label: 'Guides' },
        { type: 'docSidebar', sidebarId: 'reference', position: 'left', label: 'Reference' },
        { type: 'docSidebar', sidebarId: 'developers', position: 'left', label: 'Developers' },
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

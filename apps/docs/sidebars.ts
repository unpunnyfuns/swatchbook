import type { SidebarsConfig } from '@docusaurus/plugin-content-docs';

/**
 * One sidebar per top-nav section. The navbar uses `type: 'docSidebar'`
 * entries bound by `sidebarId`, which auto-link to each sidebar's first
 * doc and keep the nav pill active across all docs in that sidebar.
 * Per-section sidebars keep category headers out of the doc tree — the
 * navbar already labels each section.
 *
 * `home` covers just the landing — Introduction + Quickstart — reachable
 * from the navbar logo. Every other section gets its own navbar pill.
 */
const sidebars: SidebarsConfig = {
  home: ['intro', 'quickstart'],
  concepts: [
    'concepts/axes-vs-themes',
    'concepts/theming-inputs',
    'concepts/axes',
    'concepts/presets',
    'concepts/token-pipeline',
  ],
  blocks: [
    'reference/blocks/blocks',
    'reference/blocks/overview',
    'reference/blocks/inspector',
    'reference/blocks/samples',
    'reference/blocks/utility',
    'reference/blocks/hooks',
  ],
  guides: [
    'guides/authoring-doc-stories',
    'guides/token-dashboard',
    'guides/multi-axis-walkthrough',
    'guides/consuming-the-active-theme',
    'guides/migrating-from-addon-themes',
  ],
  integrations: [
    'integrations/integrations',
    'integrations/tailwind',
    'integrations/css-in-js',
  ],
  reference: ['reference/addon', 'reference/core', 'reference/config', 'reference/mcp'],
  developers: [
    'developers/developers',
    'developers/architecture',
    'developers/sharp-corners',
  ],
};

export default sidebars;

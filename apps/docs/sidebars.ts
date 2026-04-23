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
  guides: [
    'guides/authoring-doc-stories',
    'guides/consuming-the-active-theme',
    'guides/integrations',
    'guides/sharing-terrazzo-options',
  ],
  reference: [
    'reference/addon',
    'reference/blocks/blocks',
    'reference/blocks/overview',
    'reference/blocks/inspector',
    'reference/blocks/samples',
    'reference/blocks/utility',
    'reference/blocks/hooks',
    'reference/core',
    'reference/config',
    'reference/axes',
    'reference/token-pipeline',
    'reference/mcp',
  ],
  developers: ['developers/developers', 'developers/architecture', 'developers/sharp-corners'],
};

export default sidebars;

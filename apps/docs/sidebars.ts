import type { SidebarsConfig } from '@docusaurus/plugin-content-docs';

/**
 * One sidebar per top-nav section. The navbar uses `type: 'docSidebar'`
 * entries bound by `sidebarId`, which auto-link to each sidebar's first
 * doc and keep the nav pill active across all docs in that sidebar.
 * Splitting the sidebar per section removes the category-header
 * redundancy the old single `docs` sidebar had (the navbar already
 * names the section).
 *
 * `home` covers the landing — Introduction, Quickstart, and the
 * concept pages — all reachable from the navbar logo since Quickstart
 * + Concepts aren't pulled out as separate navbar entries. Three
 * bookending top-level nav items (Blocks / Guides / Reference) plus
 * the logo-home group keeps the bar light.
 */
const sidebars: SidebarsConfig = {
  home: [
    'intro',
    'quickstart',
    {
      type: 'category',
      label: 'Concepts',
      collapsed: false,
      items: [
        'concepts/theming-inputs',
        'concepts/axes',
        'concepts/presets',
        'concepts/diagnostics',
      ],
    },
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
  ],
  reference: ['reference/addon', 'reference/core', 'reference/config', 'reference/mcp'],
};

export default sidebars;

import type { SidebarsConfig } from '@docusaurus/plugin-content-docs';

/**
 * One sidebar per top-nav section. The navbar uses `type: 'docSidebar'`
 * entries bound by `sidebarId`, which auto-link to each sidebar's first
 * doc and keep the nav pill active across all docs in that sidebar.
 * Splitting the sidebar per section removes the category-header
 * redundancy the old single `docs` sidebar had (the navbar already
 * names the section).
 *
 * `home` covers the landing pages — Introduction and Quickstart — so
 * visitors on `/` or `/quickstart` get a minimal two-item sidebar
 * instead of the full flattened graph.
 */
const sidebars: SidebarsConfig = {
  home: ['intro', 'quickstart'],
  concepts: [
    'concepts/theming-inputs',
    'concepts/axes',
    'concepts/presets',
    'concepts/diagnostics',
  ],
  blocks: [
    'reference/blocks/blocks',
    'reference/blocks/overview',
    'reference/blocks/inspector',
    'reference/blocks/samples',
    'reference/blocks/utility',
    'guides/authoring-doc-stories',
    'guides/token-dashboard',
  ],
  guides: ['guides/multi-axis-walkthrough'],
  reference: ['reference/addon', 'reference/core', 'reference/config'],
};

export default sidebars;

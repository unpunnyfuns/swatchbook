import type { SidebarsConfig } from '@docusaurus/plugin-content-docs';

/**
 * One sidebar per top-nav section. The navbar uses `type: 'docSidebar'`
 * entries bound by `sidebarId`, which auto-link to each sidebar's first
 * doc and keep the nav pill active across all docs in that sidebar.
 *
 * `home` covers just the landing — Introduction + Quickstart — reachable
 * from the navbar logo. Every other section gets its own navbar pill.
 * Reference groups its pages by kind (Packages / Blocks) so the
 * sidebar reads as an index, not a flat list of everything at once.
 */
const sidebars: SidebarsConfig = {
  home: ['intro'],
  guides: [
    'guides/quickstart',
    'guides/authoring-doc-stories',
    'guides/consuming-the-active-theme',
    {
      type: 'category',
      label: 'Integrations',
      link: { type: 'doc', id: 'guides/integrations/integrations' },
      collapsed: false,
      items: ['guides/integrations/tailwind', 'guides/integrations/css-in-js'],
    },
    'guides/sharing-terrazzo-options',
  ],
  reference: [
    {
      type: 'category',
      label: 'Packages',
      collapsed: false,
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
      type: 'category',
      label: 'Blocks',
      collapsed: false,
      items: [
        'reference/blocks/blocks',
        'reference/blocks/overview',
        'reference/blocks/inspector',
        'reference/blocks/samples',
        'reference/blocks/utility',
        'reference/blocks/hooks',
      ],
    },
    'reference/diagnostics',
  ],
  concepts: [
    'concepts/overview',
    'concepts/concepts',
    'concepts/axes',
    'concepts/token-pipeline',
  ],
  developers: [
    'developers/developers',
    'developers/architecture',
    'developers/sharp-corners',
    'developers/built-with-ai',
  ],
};

export default sidebars;

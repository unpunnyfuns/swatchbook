import type { SidebarsConfig } from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  docs: [
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
    {
      type: 'category',
      label: 'Guides',
      collapsed: false,
      items: ['guides/authoring-doc-stories', 'guides/multi-axis-walkthrough'],
    },
    {
      type: 'category',
      label: 'Reference',
      collapsed: false,
      // Blocks lead — after initial setup, authoring pages with blocks is
      // the primary day-to-day swatchbook interaction. Addon is peer-of-
      // blocks; core is for build-time consumers; config is rarely read
      // end-to-end so it goes last.
      items: ['reference/blocks', 'reference/addon', 'reference/core', 'reference/config'],
    },
  ],
};

export default sidebars;

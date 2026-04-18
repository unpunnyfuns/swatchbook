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
      items: ['guides/multi-axis-walkthrough', 'guides/authoring-doc-stories'],
    },
    {
      type: 'category',
      label: 'Reference',
      collapsed: false,
      items: ['reference/core', 'reference/addon', 'reference/blocks'],
    },
  ],
};

export default sidebars;

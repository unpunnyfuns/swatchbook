import type { SidebarsConfig } from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  docs: [
    // `intro` is intentionally not in this sidebar. It's exposed as a
    // top-level navbar link ("Introduction") so the landing page lives
    // outside the Docs tree — visitors hitting the site hero first, then
    // entering Docs when they want to read the manual.
    'quickstart',
    // Blocks promoted to the top level. After initial setup, authoring
    // pages with the doc blocks is the primary swatchbook interaction —
    // the reference (what's available) and the authoring guide (how to
    // compose them) land right below the quickstart rather than buried
    // under Reference / Guides.
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
        'guides/authoring-doc-stories',
        'guides/token-dashboard',
      ],
    },
    {
      type: 'category',
      label: 'Concepts',
      collapsed: false,
      items: [
        'concepts/axes-vs-themes',
        'concepts/theming-inputs',
        'concepts/axes',
        'concepts/presets',
        'concepts/theme-reactivity',
        'concepts/diagnostics',
      ],
    },
    {
      type: 'category',
      label: 'Guides',
      collapsed: false,
      items: ['guides/multi-axis-walkthrough'],
    },
    {
      type: 'category',
      label: 'Reference',
      collapsed: false,
      items: ['reference/addon', 'reference/core', 'reference/config'],
    },
  ],
};

export default sidebars;

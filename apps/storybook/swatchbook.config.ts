import { defineSwatchbookConfig } from '@unpunnyfuns/swatchbook-core';
import { resolverPath } from '@unpunnyfuns/swatchbook-tokens-reference';

export default defineSwatchbookConfig({
  resolver: resolverPath,
  default: { mode: 'Light', brand: 'Default' },
  cssVarPrefix: 'sb',
  presets: [
    {
      name: 'Default Light',
      axes: { mode: 'Light', brand: 'Default' },
      description: 'Baseline light mode with the stock accent.',
    },
    {
      name: 'Brand A Dark',
      axes: { mode: 'Dark', brand: 'Brand A' },
      description: 'Dark surfaces paired with the violet Brand A accent.',
    },
  ],
});

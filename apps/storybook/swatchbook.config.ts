import { defineSwatchbookConfig } from '@unpunnyfuns/swatchbook-core';
import { tokensDir } from '@unpunnyfuns/swatchbook-tokens-reference';

const common = [
  `${tokensDir}/ref/**/*.json`,
  `${tokensDir}/sys/**/*.json`,
  `${tokensDir}/cmp/**/*.json`,
];

export default defineSwatchbookConfig({
  tokens: [`${tokensDir}/**/*.json`],
  themes: [
    { name: 'Light', layers: [...common, `${tokensDir}/themes/light.json`] },
    { name: 'Dark', layers: [...common, `${tokensDir}/themes/dark.json`] },
    {
      name: 'Light · Brand A',
      layers: [...common, `${tokensDir}/themes/light.json`, `${tokensDir}/themes/brand-a.json`],
    },
    {
      name: 'Dark · Brand A',
      layers: [...common, `${tokensDir}/themes/dark.json`, `${tokensDir}/themes/brand-a.json`],
    },
    {
      name: 'High Contrast',
      layers: [...common, `${tokensDir}/themes/high-contrast.json`],
    },
  ],
  default: 'Light',
  cssVarPrefix: 'sb',
});

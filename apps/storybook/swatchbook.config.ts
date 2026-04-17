import { defineSwatchbookConfig } from '@unpunnyfuns/swatchbook-core';
import { manifestPath, tokensDir } from '@unpunnyfuns/swatchbook-tokens-reference';

export default defineSwatchbookConfig({
  tokens: [`${tokensDir}/**/*.json`],
  manifest: manifestPath,
  default: 'Light',
  cssVarPrefix: 'sb',
});

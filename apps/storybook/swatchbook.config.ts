import { defineSwatchbookConfig } from '@unpunnyfuns/swatchbook-core';
import { resolverPath, tokensDir } from '@unpunnyfuns/swatchbook-tokens-reference';

export default defineSwatchbookConfig({
  tokens: [`${tokensDir}/**/*.json`],
  resolver: resolverPath,
  default: 'Light',
  cssVarPrefix: 'sb',
});

import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadProject, projectCss } from '@unpunnyfuns/swatchbook-core';
import { manifestPath, tokensDir } from '@unpunnyfuns/swatchbook-tokens-reference';

const here = dirname(fileURLToPath(import.meta.url));
const appRoot = resolve(here, '..');
const out = resolve(appRoot, 'src/generated/tokens.css');

const project = await loadProject(
  {
    tokens: ['tokens/**/*.json'],
    manifest: manifestPath,
    default: 'Light',
    cssVarPrefix: 'sb',
  },
  resolve(tokensDir, '..'),
);

await mkdir(dirname(out), { recursive: true });
await writeFile(out, projectCss(project));

console.log(`storybook: generated tokens.css with ${project.themes.length} themes`);

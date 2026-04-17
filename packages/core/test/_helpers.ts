import { dirname } from 'node:path';
import { resolverPath, tokensDir } from '@unpunnyfuns/swatchbook-tokens-reference';
import { loadProject } from '#/load';
import type { Project } from '#/types';

export const fixtureCwd = dirname(tokensDir);

export async function loadWithPrefix(prefix: string | undefined): Promise<Project> {
  return loadProject(
    {
      tokens: ['tokens/**/*.json'],
      resolver: resolverPath,
      default: 'Light',
      ...(prefix !== undefined && { cssVarPrefix: prefix }),
    },
    fixtureCwd,
  );
}

export function extractBlock(css: string, themeName: string): string {
  const start = css.indexOf(`[data-theme="${themeName}"]`);
  if (start < 0) return '';
  const braceStart = css.indexOf('{', start);
  const braceEnd = css.indexOf('\n}', braceStart);
  return css.slice(braceStart + 1, braceEnd);
}

export function grep(block: string, needle: string): string | undefined {
  return block.split('\n').find((l) => l.includes(needle))?.trim();
}

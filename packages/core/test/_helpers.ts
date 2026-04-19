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
      default: { mode: 'Light', brand: 'Default', contrast: 'Normal' },
      ...(prefix !== undefined && { cssVarPrefix: prefix }),
    },
    fixtureCwd,
  );
}

/**
 * Extract the body of a block by matching on any selector fragment. Pass the
 * literal selector you want to find (`:root`, `[data-theme="Light"]`,
 * `[data-mode="Dark"][data-brand="Default"]`) — the match is a substring scan
 * so as long as the fragment is unique in the stylesheet, the surrounding
 * block returns.
 */
export function extractBlock(css: string, selector: string): string {
  const start = css.indexOf(selector);
  if (start < 0) return '';
  const braceStart = css.indexOf('{', start);
  const braceEnd = css.indexOf('\n}', braceStart);
  return css.slice(braceStart + 1, braceEnd);
}

/**
 * Compose a compound attribute selector for a tuple in the supplied key order.
 * `{ mode: 'Dark', brand: 'Default' }` with prefix `'sb'` becomes
 * `[data-sb-mode="Dark"][data-sb-brand="Default"]`. Empty prefix keeps the
 * bare `data-<axis>` form.
 */
export function tupleSelector(
  tuple: Readonly<Record<string, string>>,
  prefix: string = 'sb',
): string {
  const attr = prefix ? `data-${prefix}-` : 'data-';
  return Object.entries(tuple)
    .map(([k, v]) => `[${attr}${k}="${v}"]`)
    .join('');
}

export function grep(block: string, needle: string): string | undefined {
  return block.split('\n').find((l) => l.includes(needle))?.trim();
}

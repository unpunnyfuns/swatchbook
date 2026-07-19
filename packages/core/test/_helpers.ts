import { dirname } from 'node:path';
import { resolverPath, tokensDir } from '@unpunnyfuns/swatchbook-tokens';
import { BufferedLogger } from '#/diagnostics.ts';
import { loadProject } from '#/load.ts';
import { resolveDefaultTuple } from '#/permutations/default.ts';
import { normalizePermutations } from '#/permutations/normalize.ts';
import type { Axis, ParserInput, Project } from '#/types.ts';

export const fixtureCwd = dirname(tokensDir);

export async function loadWithPrefix(prefix: string | undefined): Promise<Project> {
  return loadProject(
    {
      tokens: ['tokens/**/*.json'],
      resolver: resolverPath,
      default: { mode: 'Light', brand: 'Default', a11y: 'Normal' },
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
export function tupleSelector(tuple: Readonly<Record<string, string>>, prefix = 'sb'): string {
  const attr = prefix ? `data-${prefix}-` : 'data-';
  return Object.entries(tuple)
    .map(([k, v]) => `[${attr}${k}="${v}"]`)
    .join('');
}

export function grep(block: string, needle: string): string | undefined {
  return block
    .split('\n')
    .find((l) => l.includes(needle))
    ?.trim();
}

export async function loadReferenceFixtureParserInput(): Promise<{
  parserInput: ParserInput;
  axes: readonly Axis[];
  defaultTuple: Record<string, string>;
}> {
  const logger = new BufferedLogger({ level: 'warn' });
  const normalized = await normalizePermutations(
    {
      tokens: ['tokens/**/*.json'],
      resolver: resolverPath,
      default: { mode: 'Light', brand: 'Default', a11y: 'Normal' },
    },
    fixtureCwd,
    logger,
  );
  if (!normalized.parserInput) {
    throw new Error('reference fixture has no parserInput — resolver did not load');
  }
  const { tuple: defaultTuple } = resolveDefaultTuple(
    { mode: 'Light', brand: 'Default', a11y: 'Normal' },
    normalized.axes,
  );
  return { parserInput: normalized.parserInput, axes: normalized.axes, defaultTuple };
}

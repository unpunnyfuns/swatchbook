import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { expect, it } from 'vitest';

const SRC = new URL('../src', import.meta.url).pathname;
const BANNED = [
  'globalsUpdated',
  'setGlobals',
  'updateGlobals',
  'swatchbookAxes',
  'swatchbookColorFormat',
  'BlockChannel',
  'registerChannel',
];

function walk(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = join(dir, e.name);
    return e.isDirectory() ? walk(p) : p.endsWith('.ts') || p.endsWith('.tsx') ? [p] : [];
  });
}

it('blocks/src carries no Storybook host vocabulary', () => {
  const hits: string[] = [];
  for (const f of walk(SRC)) {
    const text = readFileSync(f, 'utf8');
    for (const term of BANNED) if (text.includes(term)) hits.push(`${f}: ${term}`);
  }
  expect(hits).toEqual([]);
});

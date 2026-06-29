import { globSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { buildChromeDefaultsCss } from '@unpunnyfuns/swatchbook-core';
import { expect, it } from 'vitest';

it('block CSS references only real --swatchbook-* chrome roles', () => {
  const dir = fileURLToPath(new URL('../src', import.meta.url));
  // Canonical role var names, taken from the single source rather than re-derived.
  const known = new Set(
    [...buildChromeDefaultsCss().matchAll(/(--swatchbook-[a-z-]+):/g)].map((m) => m[1]),
  );
  const offenders: string[] = [];
  for (const f of globSync('**/*.css', { cwd: dir })) {
    const text = readFileSync(`${dir}/${f}`, 'utf8');
    for (const m of text.matchAll(/var\((--swatchbook-[a-z-]+)/g)) {
      if (!known.has(m[1])) offenders.push(`${f}: ${m[1]}`);
    }
  }
  expect(offenders).toEqual([]);
});

import { globSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { buildChromeDefaultsCss } from '@unpunnyfuns/swatchbook-core';
import { expect, it } from 'vitest';

it('block CSS references only --swatchbook-* vars defined in a shipped base layer', () => {
  const dir = fileURLToPath(new URL('../src', import.meta.url));
  // Known names = the canonical chrome roles plus the internal block-UI tokens,
  // each defined in a stylesheet the provider ships. A reference to anything
  // not defined in a base layer is a phantom var.
  const declarations = [
    buildChromeDefaultsCss(),
    readFileSync(`${dir}/internal/internal-tokens.css`, 'utf8'),
    readFileSync(`${dir}/internal/internal-dimensions.css`, 'utf8'),
  ].join('\n');
  const known = new Set([...declarations.matchAll(/(--swatchbook-[a-z0-9-]+):/g)].map((m) => m[1]));
  const offenders: string[] = [];
  for (const f of globSync('**/*.css', { cwd: dir })) {
    const text = readFileSync(`${dir}/${f}`, 'utf8');
    for (const m of text.matchAll(/var\((--swatchbook-[a-z0-9-]+)/g)) {
      if (!known.has(m[1])) offenders.push(`${f}: ${m[1]}`);
    }
  }
  expect(offenders).toEqual([]);
});

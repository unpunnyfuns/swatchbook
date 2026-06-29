import { globSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { buildChromeDefaultsCss } from '@unpunnyfuns/swatchbook-core';
import { expect, it } from 'vitest';

it('block CSS references only --swatchbook-* vars defined in a base layer or inline', () => {
  const dir = fileURLToPath(new URL('../src', import.meta.url));
  // Known names = the canonical chrome roles plus the internal block-UI tokens,
  // each defined in a stylesheet the provider ships...
  const declarations = [
    buildChromeDefaultsCss(),
    readFileSync(`${dir}/internal/internal-tokens.css`, 'utf8'),
    readFileSync(`${dir}/internal/internal-dimensions.css`, 'utf8'),
  ].join('\n');
  const known = new Set([...declarations.matchAll(/(--swatchbook-[a-z0-9-]+):/g)].map((m) => m[1]));
  // ...plus vars a component injects inline as a style-object key — per-instance
  // runtime values (e.g. the opacity sample's color/alpha) that can't live in a
  // static base layer but are just as defined. Match the `'--swatchbook-x':` key
  // form, not `var(...)` references.
  for (const f of globSync('**/*.{ts,tsx}', { cwd: dir })) {
    const text = readFileSync(`${dir}/${f}`, 'utf8');
    for (const m of text.matchAll(/['"](--swatchbook-[a-z0-9-]+)['"]\s*:/g)) known.add(m[1]);
  }
  const offenders: string[] = [];
  for (const f of globSync('**/*.css', { cwd: dir })) {
    const text = readFileSync(`${dir}/${f}`, 'utf8');
    for (const m of text.matchAll(/var\((--swatchbook-[a-z0-9-]+)/g)) {
      if (!known.has(m[1])) offenders.push(`${f}: ${m[1]}`);
    }
  }
  expect(offenders).toEqual([]);
});

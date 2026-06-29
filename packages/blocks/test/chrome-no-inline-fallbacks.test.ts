import { readFileSync, globSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { expect, it } from 'vitest';

it('no block CSS uses an inline fallback on a --swatchbook-* var (base layer owns defaults)', () => {
  const dir = fileURLToPath(new URL('../src', import.meta.url));
  const offenders: string[] = [];
  for (const f of globSync('**/*.css', { cwd: dir })) {
    if (f.endsWith('chrome-base.css')) continue;
    const text = readFileSync(`${dir}/${f}`, 'utf8');
    // var(--swatchbook-role , <something>)  — a comma inside the var() = a fallback
    for (const m of text.matchAll(/var\(--swatchbook-[a-z-]+\s*,/g))
      offenders.push(`${f}: ${m[0]}`);
  }
  expect(offenders).toEqual([]);
});

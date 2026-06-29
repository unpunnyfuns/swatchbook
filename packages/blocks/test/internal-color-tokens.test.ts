import { globSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { expect, it } from 'vitest';

const dir = fileURLToPath(new URL('../src', import.meta.url));
const cssFiles = (): string[] => globSync('**/*.css', { cwd: dir });
// Read a CSS file with `/* … */` comments stripped, so a comment that merely
// names a banned construct (e.g. documenting "no light-dark()") isn't a hit.
const readCss = (f: string): string =>
  readFileSync(`${dir}/${f}`, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');

it('no block CSS uses light-dark() — colors are owned flat values, not OS-coupled', () => {
  const offenders: string[] = [];
  for (const f of cssFiles()) {
    if (readCss(f).includes('light-dark(')) offenders.push(f);
  }
  expect(offenders).toEqual([]);
});

it('no block CSS hardcodes status/deprecated colors — they come from internal tokens', () => {
  const literals = ['#30a46c', '#d64545', '#b08900', '#92400e', '#fbbf24'];
  const offenders: string[] = [];
  for (const f of cssFiles()) {
    if (f.endsWith('internal-tokens.css')) continue;
    const text = readCss(f);
    for (const hex of literals) if (text.includes(hex)) offenders.push(`${f}: ${hex}`);
  }
  expect(offenders).toEqual([]);
});

it('internal-tokens.css defines the status and deprecated vars', () => {
  const text = readFileSync(`${dir}/internal/internal-tokens.css`, 'utf8');
  for (const v of [
    '--swatchbook-status-success',
    '--swatchbook-status-warning',
    '--swatchbook-status-danger',
    '--swatchbook-deprecated',
    '--swatchbook-deprecated-bg',
  ]) {
    expect(text).toContain(v);
  }
});

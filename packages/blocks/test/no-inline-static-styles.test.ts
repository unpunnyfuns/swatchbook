import { globSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { expect, it } from 'vitest';

const dir = fileURLToPath(new URL('../src', import.meta.url));
const tsx = () => globSync('**/*.tsx', { cwd: dir });

it('no block component declares a static style object', () => {
  const offenders = tsx().filter((f) =>
    readFileSync(`${dir}/${f}`, 'utf8').includes('satisfies CSSProperties'),
  );
  expect(offenders).toEqual([]);
});

it('inline style binds only dynamic expressions, never static literals', () => {
  // Flag `style={{ prop: 'literal' }}` or `style={{ prop: 12 }}` — static values
  // that belong in CSS. Dynamic binds (`style={{ background: x }}`,
  // `style={{ width: f() }}`) carry an identifier/call and pass.
  const literal = /style=\{\{[^}]*:\s*('[^']*'|"[^"]*"|[0-9.]+)\s*[,}]/;
  const offenders: string[] = [];
  for (const f of tsx()) {
    const text = readFileSync(`${dir}/${f}`, 'utf8');
    for (const m of text.matchAll(/style=\{\{[^}]*\}\}/g)) {
      if (literal.test(m[0])) offenders.push(`${f}: ${m[0]}`);
    }
  }
  expect(offenders).toEqual([]);
});

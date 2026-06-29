import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { buildChromeDefaultsCss } from '@unpunnyfuns/swatchbook-core';
import { expect, it } from 'vitest';

it('chrome-base.css matches the canonical chrome defaults (no drift)', () => {
  const path = fileURLToPath(new URL('../src/internal/chrome-base.css', import.meta.url));
  const file = readFileSync(path, 'utf8').trim();
  expect(file).toBe(buildChromeDefaultsCss());
});

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { beforeAll, expect, it } from 'vitest';
import { generateScales } from '../scripts/generate-internal-scales.mts';

// loadProject is ~1s — resolve once for both assertions (perf escape hatch).
let out!: { dimensions: string; typography: string };
beforeAll(async () => {
  out = await generateScales();
});

const read = (f: string) =>
  readFileSync(fileURLToPath(new URL(`../src/internal/${f}`, import.meta.url)), 'utf8');

it('internal-dimensions.css matches the generator (run pnpm generate:scales if this fails)', () => {
  expect(read('internal-dimensions.css')).toBe(out.dimensions);
});

it('internal-typography.css matches the generator (run pnpm generate:scales if this fails)', () => {
  expect(read('internal-typography.css')).toBe(out.typography);
});

import { expect, it } from 'vitest';
import { axisDefaultTuple, normalizeTuple, resolveTuple } from '#/tuple-resolve.ts';
import type { ResolveAxis } from '#/tuple-resolve.ts';

const AXES: readonly ResolveAxis[] = [
  { name: 'mode', default: 'Light', contexts: ['Light', 'Dark'] },
  { name: 'brand', default: 'Acme', contexts: ['Acme', 'Globex'] },
];

it('axisDefaultTuple yields every axis at its default', () => {
  expect(axisDefaultTuple(AXES)).toEqual({ mode: 'Light', brand: 'Acme' });
});

it('normalizeTuple fills omitted axes from defaults and keeps valid contexts', () => {
  expect(normalizeTuple({ mode: 'Dark' }, AXES)).toEqual({ mode: 'Dark', brand: 'Acme' });
});

it('normalizeTuple drops an out-of-context value back to the default', () => {
  expect(normalizeTuple({ mode: 'Sepia' }, AXES)).toEqual({ mode: 'Light', brand: 'Acme' });
});

it('normalizeTuple drops keys for axes the project does not have', () => {
  expect(normalizeTuple({ density: 'Compact' }, AXES)).toEqual({ mode: 'Light', brand: 'Acme' });
});

it('resolveTuple prefers a per-story axes override over globals', () => {
  // param axes win; the globals tuple ({ mode: Dark }) is ignored.
  expect(resolveTuple({ mode: 'Dark' }, { axes: { brand: 'Globex' } }, AXES)).toEqual({
    mode: 'Light',
    brand: 'Globex',
  });
});

it('resolveTuple uses the toolbar globals tuple when no per-story override', () => {
  expect(resolveTuple({ mode: 'Dark' }, undefined, AXES)).toEqual({ mode: 'Dark', brand: 'Acme' });
});

it('resolveTuple falls back to axis defaults when nothing is set', () => {
  expect(resolveTuple(undefined, undefined, AXES)).toEqual({ mode: 'Light', brand: 'Acme' });
});

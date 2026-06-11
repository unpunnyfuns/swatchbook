import { expect, it } from 'vitest';
import { axisDefaultTuple, normalizeTuple, resolveTuple, tupleForName } from '#/tuple-resolve.ts';
import type { ResolveAxis } from '#/tuple-resolve.ts';

const AXES: readonly ResolveAxis[] = [
  { name: 'mode', default: 'Light', contexts: ['Light', 'Dark'] },
  { name: 'brand', default: 'Acme', contexts: ['Acme', 'Globex'] },
];

it('axisDefaultTuple yields every axis at its default', () => {
  expect(axisDefaultTuple(AXES)).toEqual({ mode: 'Light', brand: 'Acme' });
});

it('tupleForName reverses a " · "-joined theme name in axis order', () => {
  expect(tupleForName('Dark · Globex', AXES)).toEqual({ mode: 'Dark', brand: 'Globex' });
});

it('tupleForName returns undefined when the segment count does not match the axes', () => {
  expect(tupleForName('Dark', AXES)).toBeUndefined();
  expect(tupleForName('', AXES)).toBeUndefined();
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

it('resolveTuple falls to a per-story themeName when there is no axes override', () => {
  expect(resolveTuple({ mode: 'Dark' }, { themeName: 'Dark · Globex' }, AXES)).toEqual({
    mode: 'Dark',
    brand: 'Globex',
  });
});

it('resolveTuple ignores an unparseable themeName and falls through to globals', () => {
  expect(resolveTuple({ brand: 'Globex' }, { themeName: 'nope' }, AXES)).toEqual({
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

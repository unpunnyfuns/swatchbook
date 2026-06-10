import { expect, it } from 'vitest';
import { enumerateThemes, tupleToName } from '#/themes.ts';
import type { ThemeEnumAxis } from '#/themes.ts';

const AXES: readonly ThemeEnumAxis[] = [
  { name: 'mode', default: 'Light', contexts: ['Light', 'Dark'] },
  { name: 'brand', default: 'Acme', contexts: ['Acme', 'Globex'] },
];
const DEFAULTS = { mode: 'Light', brand: 'Acme' };

it('joins axis values by " · " in axis declaration order', () => {
  expect(tupleToName(AXES, { mode: 'Dark', brand: 'Globex' })).toBe('Dark · Globex');
});

it('fills axes the tuple omits with their defaults when naming', () => {
  expect(tupleToName(AXES, { brand: 'Globex' })).toBe('Light · Globex');
});

it('lists the default tuple first, then one singleton per non-default context', () => {
  const themes = enumerateThemes({ axes: AXES, presets: [], defaultTuple: DEFAULTS });
  expect(themes.map((t) => t.name)).toEqual(['Light · Acme', 'Dark · Acme', 'Light · Globex']);
  expect(themes[0]).toEqual({ name: 'Light · Acme', tuple: { mode: 'Light', brand: 'Acme' } });
});

it('appends presets with omitted axes filled from defaults', () => {
  const themes = enumerateThemes({
    axes: AXES,
    presets: [{ name: 'Globex Dark', axes: { mode: 'Dark', brand: 'Globex' } }],
    defaultTuple: DEFAULTS,
  });
  expect(themes.at(-1)).toEqual({
    name: 'Dark · Globex',
    tuple: { mode: 'Dark', brand: 'Globex' },
  });
});

it('collapses a preset that resolves to an already-enumerated singleton', () => {
  // { mode: Dark } fills to { mode: Dark, brand: Acme } — the mode singleton.
  const themes = enumerateThemes({
    axes: AXES,
    presets: [{ name: 'dupe', axes: { mode: 'Dark' } }],
    defaultTuple: DEFAULTS,
  });
  expect(themes.filter((t) => t.name === 'Dark · Acme')).toHaveLength(1);
});

it('ignores an undefined preset axis value, leaving that axis at its default', () => {
  const themes = enumerateThemes({
    axes: AXES,
    presets: [{ name: 'sparse', axes: { mode: undefined, brand: 'Globex' } }],
    defaultTuple: DEFAULTS,
  });
  // Collapses into the brand singleton (Light · Globex) rather than erroring.
  expect(themes.filter((t) => t.name === 'Light · Globex')).toHaveLength(1);
});

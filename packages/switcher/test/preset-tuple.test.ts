import { expect, it } from 'vitest';
import { presetTuple } from '#/preset-tuple.ts';
import type { SwitcherAxis } from '#/types.ts';

const AXES: readonly SwitcherAxis[] = [
  { name: 'mode', contexts: ['Light', 'Dark'], default: 'Light', source: 'resolver' },
  { name: 'brand', contexts: ['Acme', 'Globex'], default: 'Acme', source: 'resolver' },
];

it('fills axes the preset omits from the defaults', () => {
  const result = presetTuple({ name: 'Dark only', axes: { mode: 'Dark' } }, AXES, {
    mode: 'Light',
    brand: 'Acme',
  });
  expect(result).toEqual({ mode: 'Dark', brand: 'Acme' });
});

it('applies a named axis value when it is a valid context', () => {
  const result = presetTuple(
    { name: 'Globex Dark', axes: { mode: 'Dark', brand: 'Globex' } },
    AXES,
    {
      mode: 'Light',
      brand: 'Acme',
    },
  );
  expect(result).toEqual({ mode: 'Dark', brand: 'Globex' });
});

it('ignores a preset value that is not a context of its axis, keeping the default', () => {
  const result = presetTuple({ name: 'Bogus', axes: { mode: 'Sepia' } }, AXES, {
    mode: 'Light',
    brand: 'Acme',
  });
  expect(result['mode']).toBe('Light');
});

it('drops preset entries for axis names the project does not have', () => {
  const result = presetTuple({ name: 'Stray', axes: { density: 'Compact' } }, AXES, {
    mode: 'Light',
    brand: 'Acme',
  });
  expect(result).toEqual({ mode: 'Light', brand: 'Acme' });
});

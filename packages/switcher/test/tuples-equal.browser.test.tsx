import { expect, it } from 'vitest';
import { tuplesEqual } from '#/ThemeSwitcher.tsx';
import type { SwitcherAxis } from '#/types.ts';

// Browser-mode because ThemeSwitcher.tsx pulls its CSS; tuplesEqual itself
// is a pure comparison helper.
const axes: readonly SwitcherAxis[] = [
  { name: 'mode', contexts: ['Light', 'Dark'], default: 'Light' },
  { name: 'brand', contexts: ['Default', 'BrandA'], default: 'Default' },
];

it('treats a sparse active tuple (omitted axis = default) as equal to a fully-defaulted preset tuple', () => {
  // The axis pills render `activeTuple[axis] ?? default`, so the active tuple
  // can omit axes sitting at their default; the preset tuple is always full.
  expect(tuplesEqual({ mode: 'Light', brand: 'Default' }, { mode: 'Light' }, axes)).toBe(true);
});

it('still reports a genuine difference', () => {
  expect(tuplesEqual({ mode: 'Dark' }, { mode: 'Light' }, axes)).toBe(false);
  expect(tuplesEqual({ mode: 'Light', brand: 'BrandA' }, { mode: 'Light' }, axes)).toBe(false);
});

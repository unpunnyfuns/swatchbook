import { expect, it } from 'vitest';
import { cssVarRef } from '#/css-var.ts';

it('wraps the property in var() with the prefix segment', () => {
  expect(cssVarRef('color.brand.primary', 'sb')).toBe('var(--sb-color-brand-primary)');
});

it('omits the prefix segment when the prefix is empty', () => {
  expect(cssVarRef('color.brand.primary', '')).toBe('var(--color-brand-primary)');
});

it('kebab-cases camelCase path segments', () => {
  expect(cssVarRef('color.brandPrimary', 'sb')).toBe('var(--sb-color-brand-primary)');
});

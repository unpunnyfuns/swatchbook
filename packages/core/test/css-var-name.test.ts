import { expect, it } from 'vitest';
import { cssVarName } from '#/css-var.ts';
import type { Project } from '#/types.ts';

function fakeProject(
  listing: Record<string, unknown>,
  prefix?: string,
): Pick<Project, 'listing' | 'config'> {
  return {
    listing,
    config: prefix === undefined ? {} : { cssVarPrefix: prefix },
  } as unknown as Pick<Project, 'listing' | 'config'>;
}

it('prefers the listing name when the project carries one', () => {
  const project = fakeProject(
    {
      'color.brand.primary': {
        $extensions: { 'app.terrazzo.listing': { names: { css: '--from-the-listing' } } },
      },
    },
    'sb',
  );
  expect(cssVarName('color.brand.primary', project)).toBe('--from-the-listing');
});

it('falls back to Terrazzo derivation, kebab-casing camelCase segments', () => {
  expect(cssVarName('color.brandPrimary', fakeProject({}, 'sb'))).toBe('--sb-color-brand-primary');
});

it('omits the prefix segment when cssVarPrefix is unset', () => {
  expect(cssVarName('color.brandPrimary', fakeProject({}))).toBe('--color-brand-primary');
});

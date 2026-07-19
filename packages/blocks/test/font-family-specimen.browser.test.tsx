import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import type { RealisedToken } from '@unpunnyfuns/swatchbook-core/token-value-types';
import { FontFamilySpecimen } from '#/presenters/FontFamilySpecimen.tsx';

const token: RealisedToken<'fontFamily'> = {
  $type: 'fontFamily',
  $value: ['Arial', 'sans-serif'],
};

afterEach(() => cleanup());

it('styles the sample from the realised value when no cssVar is given', () => {
  const { container } = render(
    <FontFamilySpecimen path="font.family.mono" token={token} colorFormat="hex" />,
  );
  const sample = container.querySelector<HTMLElement>('.sb-font-family-specimen__sample');
  expect(sample?.style.fontFamily).toBe('Arial, sans-serif');
  expect(sample?.style.fontFamily).not.toContain('var(');
});

it('shows the path, the joined stack, and the sample text', () => {
  render(<FontFamilySpecimen path="font.family.mono" token={token} colorFormat="hex" />);
  screen.getByText('font.family.mono');
  screen.getByText('Arial, sans-serif');
  screen.getByText('The quick brown fox jumps over the lazy dog.');
});

it('honors an options.sample override', () => {
  render(
    <FontFamilySpecimen
      path="font.family.mono"
      token={token}
      colorFormat="hex"
      options={{ sample: 'Sphinx of black quartz' }}
    />,
  );
  screen.getByText('Sphinx of black quartz');
});

it('applies cssVar to the sample instead of the realised value', () => {
  const { container } = render(
    <FontFamilySpecimen
      path="font.family.mono"
      token={token}
      cssVar="var(--sb-font-family-mono)"
      colorFormat="hex"
    />,
  );
  const sample = container.querySelector<HTMLElement>('.sb-font-family-specimen__sample');
  expect(sample?.style.fontFamily).toBe('var(--sb-font-family-mono)');
  screen.getByText('var(--sb-font-family-mono)');
});

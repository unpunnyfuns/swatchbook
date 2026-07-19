import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import type { RealisedToken } from '@unpunnyfuns/swatchbook-core/token-value-types';
import { FontWeightSpecimen } from '#/presenters/FontWeightSpecimen.tsx';

const token: RealisedToken<'fontWeight'> = { $type: 'fontWeight', $value: 700 };

afterEach(() => cleanup());

it('styles the sample from the realised value when no cssVar is given', () => {
  const { container } = render(
    <FontWeightSpecimen path="font.weight.bold" token={token} colorFormat="hex" />,
  );
  const sample = container.querySelector<HTMLElement>('.sb-font-weight-specimen__sample');
  expect(sample?.style.fontWeight).toBe('700');
  expect(sample?.style.fontWeight).not.toContain('var(');
});

it('shows the path, the weight value, and the sample text', () => {
  render(<FontWeightSpecimen path="font.weight.bold" token={token} colorFormat="hex" />);
  screen.getByText('font.weight.bold');
  screen.getByText('700');
  screen.getByText('Aa');
});

it('honors an options.sample override', () => {
  render(
    <FontWeightSpecimen
      path="font.weight.bold"
      token={token}
      colorFormat="hex"
      options={{ sample: 'Sphinx of black quartz' }}
    />,
  );
  screen.getByText('Sphinx of black quartz');
});

it('falls back to the default sample when options.sample is not a string', () => {
  render(
    <FontWeightSpecimen
      path="font.weight.bold"
      token={token}
      colorFormat="hex"
      options={{ sample: {} }}
    />,
  );
  screen.getByText('Aa');
});

it('applies cssVar to the sample instead of the realised value', () => {
  const { container } = render(
    <FontWeightSpecimen
      path="font.weight.bold"
      token={token}
      cssVar="var(--sb-font-weight-bold)"
      colorFormat="hex"
    />,
  );
  const sample = container.querySelector<HTMLElement>('.sb-font-weight-specimen__sample');
  expect(sample?.style.fontWeight).toBe('var(--sb-font-weight-bold)');
  screen.getByText('var(--sb-font-weight-bold)');
});

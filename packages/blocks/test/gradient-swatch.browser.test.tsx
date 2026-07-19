import { cleanup, render } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import type { RealisedToken } from '@unpunnyfuns/swatchbook-core/token-value-types';
import { GradientSwatch } from '#/presenters/GradientSwatch.tsx';

const token: RealisedToken<'gradient'> = {
  $type: 'gradient',
  $value: [
    { color: '#000', position: 0 },
    { color: '#fff', position: 1 },
  ],
};

afterEach(() => cleanup());

it('renders a linear-gradient built from $value stops when no cssVar', () => {
  const { container } = render(
    <GradientSwatch path="gradient.brand" token={token} colorFormat="hex" />,
  );
  const chip = container.querySelector<HTMLElement>('.sb-gradient-swatch__chip');
  expect(chip?.style.background).toContain('linear-gradient(');
  expect(chip?.style.background).not.toContain('var(');
});

it('wraps cssVar in a linear-gradient when supplied, since a gradient css var is a bare stop list, not a full CSS value', () => {
  const { container } = render(
    <GradientSwatch
      path="gradient.brand"
      token={token}
      cssVar="var(--sb-gradient-brand)"
      colorFormat="hex"
    />,
  );
  expect(container.querySelector<HTMLElement>('.sb-gradient-swatch__chip')?.style.background).toBe(
    'linear-gradient(90deg, var(--sb-gradient-brand))',
  );
});

it('falls back to hex for a raw colorFormat so the realised branch stays valid CSS', () => {
  const rawColorToken: RealisedToken<'gradient'> = {
    $type: 'gradient',
    $value: [
      { color: { colorSpace: 'srgb', components: [0, 0, 0] }, position: 0 },
      { color: { colorSpace: 'srgb', components: [1, 1, 1] }, position: 1 },
    ],
  };
  const { container } = render(
    <GradientSwatch path="gradient.brand" token={rawColorToken} colorFormat="raw" />,
  );
  const chip = container.querySelector<HTMLElement>('.sb-gradient-swatch__chip');
  expect(chip?.style.background).toContain('linear-gradient(');
  expect(chip?.style.background).not.toContain('var(');
  expect(chip?.style.background).not.toContain('{');
});

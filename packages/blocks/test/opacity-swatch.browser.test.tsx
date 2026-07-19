import { cleanup, render } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import type { RealisedToken } from '@unpunnyfuns/swatchbook-core/token-value-types';
import { OpacitySwatch } from '#/presenters/OpacitySwatch.tsx';

const token: RealisedToken<'number'> = {
  $type: 'number',
  $value: 0.4,
};

afterEach(() => cleanup());

it('renders the realised $value as opacity when no cssVar', () => {
  const { container } = render(
    <OpacitySwatch path="number.opacity.subtle" token={token} colorFormat="hex" />,
  );
  const el = container.querySelector<HTMLElement>('.sb-opacity-swatch__chip');
  expect(el?.style.opacity).not.toBe('');
  expect(el?.style.opacity).not.toContain('var(');
  expect(el?.style.opacity).toBe('0.4');
});

it('prefers cssVar for the visual when supplied', () => {
  const { container } = render(
    <OpacitySwatch
      path="number.opacity.subtle"
      token={token}
      cssVar="var(--sb-number-opacity-subtle)"
      colorFormat="hex"
    />,
  );
  const el = container.querySelector<HTMLElement>('.sb-opacity-swatch__chip');
  expect(el?.style.opacity).toBe('var(--sb-number-opacity-subtle)');
});

it('falls back to the default accent sample color when none is given via options', () => {
  const { container } = render(
    <OpacitySwatch path="number.opacity.subtle" token={token} colorFormat="hex" />,
  );
  const el = container.querySelector<HTMLElement>('.sb-opacity-swatch__chip');
  expect(el?.style.background).toBe('var(--swatchbook-accent-bg)');
});

it('honors an options.sampleColorVar override', () => {
  const { container } = render(
    <OpacitySwatch
      path="number.opacity.subtle"
      token={token}
      colorFormat="hex"
      options={{ sampleColorVar: 'var(--sb-color-accent-bg)' }}
    />,
  );
  const el = container.querySelector<HTMLElement>('.sb-opacity-swatch__chip');
  expect(el?.style.background).toBe('var(--sb-color-accent-bg)');
});

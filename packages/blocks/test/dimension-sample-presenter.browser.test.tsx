import { cleanup, render } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import type { RealisedToken } from '@unpunnyfuns/swatchbook-core/token-value-types';
import { DimensionSample } from '#/dimension-scale/DimensionSample.tsx';

const token: RealisedToken<'dimension'> = {
  $type: 'dimension',
  $value: { value: 32, unit: 'px' },
};

afterEach(() => cleanup());

it('renders the realised $value as a length when no cssVar', () => {
  const { container } = render(
    <DimensionSample path="space.lg" token={token} colorFormat="hex" visual="length" />,
  );
  const el = container.querySelector<HTMLElement>('.sb-dimension-sample__bar');
  expect(el?.style.width).not.toBe('');
  expect(el?.style.width).not.toContain('var(');
  expect(el?.style.width).toBe('32px');
});

it('prefers cssVar for the visual when supplied', () => {
  const { container } = render(
    <DimensionSample
      path="space.lg"
      token={token}
      cssVar="var(--sb-space-lg)"
      colorFormat="hex"
      visual="length"
    />,
  );
  const el = container.querySelector<HTMLElement>('.sb-dimension-sample__bar');
  expect(el?.style.width).toBe('var(--sb-space-lg)');
});

it('caps an oversized realised value at MAX_RENDER_PX regardless of cssVar', () => {
  const wide: RealisedToken<'dimension'> = {
    $type: 'dimension',
    $value: { value: 600, unit: 'px' },
  };
  const { container } = render(
    <DimensionSample path="space.wide" token={wide} colorFormat="hex" visual="length" />,
  );
  const bar = container.querySelector<HTMLElement>('.sb-dimension-sample--capped div');
  expect(bar?.style.width).toBe('480px');
  expect(container.querySelector('.sb-dimension-sample__cap')).not.toBeNull();
});

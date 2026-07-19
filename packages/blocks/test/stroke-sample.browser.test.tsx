import { cleanup, render } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import type { RealisedToken } from '@unpunnyfuns/swatchbook-core/token-value-types';
import { StrokeSample } from '#/presenters/StrokeSample.tsx';

const stringToken: RealisedToken<'strokeStyle'> = {
  $type: 'strokeStyle',
  $value: 'dashed',
};

const objectToken: RealisedToken<'strokeStyle'> = {
  $type: 'strokeStyle',
  $value: {
    dashArray: [
      { value: 4, unit: 'px' },
      { value: 2, unit: 'px' },
    ],
    lineCap: 'round',
  },
};

afterEach(() => cleanup());

it('renders the realised string $value as a border-top-style when no cssVar', () => {
  const { container } = render(
    <StrokeSample path="stroke.style.dashed" token={stringToken} colorFormat="hex" />,
  );
  const el = container.querySelector<HTMLElement>('.sb-stroke-sample__line');
  expect(el?.style.borderTopStyle).not.toBe('');
  expect(el?.style.borderTopStyle).not.toContain('var(');
  expect(el?.style.borderTopStyle).toBe('dashed');
});

it('prefers cssVar for the visual when supplied, for the string form', () => {
  const { container } = render(
    <StrokeSample
      path="stroke.style.dashed"
      token={stringToken}
      cssVar="var(--sb-stroke-style-dashed)"
      colorFormat="hex"
    />,
  );
  const el = container.querySelector<HTMLElement>('.sb-stroke-sample__line');
  expect(el?.style.borderTopStyle).toBe('var(--sb-stroke-style-dashed)');
});

it('falls back to the object-form message when $value is a dash-pattern object and no cssVar', () => {
  const { container } = render(
    <StrokeSample path="stroke.style.custom" token={objectToken} colorFormat="hex" />,
  );
  expect(container.querySelector('.sb-stroke-sample__line')).toBeNull();
  const fallback = container.querySelector<HTMLElement>('.sb-stroke-sample__object-fallback');
  expect(fallback?.textContent).toContain('Object-form');
});

it('keeps the object-form fallback even when cssVar is supplied, since no var is a valid border-style for a dash pattern', () => {
  const { container } = render(
    <StrokeSample
      path="stroke.style.custom"
      token={objectToken}
      cssVar="var(--sb-stroke-style-custom)"
      colorFormat="hex"
    />,
  );
  expect(container.querySelector('.sb-stroke-sample__line')).toBeNull();
  expect(container.querySelector('.sb-stroke-sample__object-fallback')).not.toBeNull();
});

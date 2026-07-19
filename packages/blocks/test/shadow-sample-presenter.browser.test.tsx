import { cleanup, render } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import type { RealisedToken } from '@unpunnyfuns/swatchbook-core/token-value-types';
import { ShadowSample } from '#/shadow-preview/ShadowSample.tsx';

const token: RealisedToken<'shadow'> = {
  $type: 'shadow',
  $value: { offsetX: '0px', offsetY: '1px', blur: '3px', spread: '0px', color: '#00000019' },
};

afterEach(() => cleanup());

it('renders the realised $value as box-shadow when no cssVar', () => {
  const { container } = render(<ShadowSample path="shadow.sm" token={token} colorFormat="hex" />);
  const el = container.querySelector<HTMLElement>('.sb-shadow-sample');
  expect(el?.style.boxShadow).not.toBe('');
  expect(el?.style.boxShadow).not.toContain('var(');
});

it('prefers cssVar for the visual when supplied', () => {
  const { container } = render(
    <ShadowSample path="shadow.sm" token={token} cssVar="var(--sb-shadow-sm)" colorFormat="hex" />,
  );
  const el = container.querySelector<HTMLElement>('.sb-shadow-sample');
  expect(el?.style.boxShadow).toBe('var(--sb-shadow-sm)');
});

it('falls back to hex for a raw colorFormat so the realised branch stays valid CSS', () => {
  const { container } = render(<ShadowSample path="shadow.sm" token={token} colorFormat="raw" />);
  const el = container.querySelector<HTMLElement>('.sb-shadow-sample');
  expect(el?.style.boxShadow).not.toBe('');
  expect(el?.style.boxShadow).not.toContain('{');
});

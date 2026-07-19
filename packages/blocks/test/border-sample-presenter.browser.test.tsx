import { cleanup, render } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import type { RealisedToken } from '@unpunnyfuns/swatchbook-core/token-value-types';
import { BorderSample } from '#/border-preview/BorderSample.tsx';

const token: RealisedToken<'border'> = {
  $type: 'border',
  $value: { width: { value: 2, unit: 'px' }, style: 'dashed', color: '#0066ff' },
};

afterEach(() => cleanup());

it('renders the realised $value as border when no cssVar', () => {
  const { container } = render(
    <BorderSample path="border.focus" token={token} colorFormat="hex" />,
  );
  const el = container.querySelector<HTMLElement>('.sb-border-sample');
  expect(el?.style.border).not.toBe('');
  expect(el?.style.border).not.toContain('var(');
});

it('prefers cssVar for the visual when supplied', () => {
  const { container } = render(
    <BorderSample
      path="border.focus"
      token={token}
      cssVar="var(--sb-border-focus)"
      colorFormat="hex"
    />,
  );
  const el = container.querySelector<HTMLElement>('.sb-border-sample');
  expect(el?.style.border).toBe('var(--sb-border-focus)');
});

it('falls back to hex for a raw colorFormat so the realised branch stays valid CSS', () => {
  const { container } = render(
    <BorderSample path="border.focus" token={token} colorFormat="raw" />,
  );
  const el = container.querySelector<HTMLElement>('.sb-border-sample');
  expect(el?.style.border).not.toBe('');
  expect(el?.style.border).not.toContain('{');
});

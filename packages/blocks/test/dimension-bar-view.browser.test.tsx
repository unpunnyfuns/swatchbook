import { cleanup, render } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import { DimensionBarView } from '#/dimension-scale/DimensionBar.tsx';
import type { DimensionBarViewProps } from '#/dimension-scale/DimensionBar.tsx';

// The View renders from plain props — no provider, no store.
function setup(extra: Partial<DimensionBarViewProps> = {}) {
  return render(
    <DimensionBarView
      cssVar="var(--sb-space-lg)"
      capped={false}
      cappedValue="var(--sb-space-lg)"
      visual="length"
      {...extra}
    />,
  );
}

afterEach(() => {
  cleanup();
});

it('renders a length bar sized to the (possibly capped) value', () => {
  const { container } = setup();
  const bar = container.querySelector<HTMLElement>('.sb-dimension-bar__bar');
  expect(bar?.style.width).toBe('var(--sb-space-lg)');
});

it('renders a radius sample using the css var as border-radius', () => {
  const { container } = setup({ visual: 'radius' });
  const sample = container.querySelector<HTMLElement>('.sb-dimension-bar__radius-sample');
  expect(sample?.style.borderRadius).toBe('var(--sb-space-lg)');
});

it('renders a size sample sized to width and height', () => {
  const { container } = setup({ visual: 'size' });
  const sample = container.querySelector<HTMLElement>('.sb-dimension-bar__size-sample');
  expect(sample?.style.width).toBe('var(--sb-space-lg)');
  expect(sample?.style.height).toBe('var(--sb-space-lg)');
});

it('shows the cap marker with a title when capped', () => {
  const { container } = setup({ capped: true, cappedValue: '480px' });
  const wrap = container.querySelector('.sb-dimension-bar--capped');
  expect(wrap?.getAttribute('title')).toContain('capped at 480px');
  expect(container.querySelector('.sb-dimension-bar__cap')).not.toBeNull();
  const bar = wrap?.querySelector<HTMLElement>('div');
  expect(bar?.style.width).toBe('480px');
});

it('renders no cap marker when under the cap', () => {
  const { container } = setup();
  expect(container.querySelector('.sb-dimension-bar--capped')).toBeNull();
  expect(container.querySelector('.sb-dimension-bar__cap')).toBeNull();
});

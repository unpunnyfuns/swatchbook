import { cleanup, render } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import { DimensionSampleView } from '#/dimension-scale/DimensionSample.tsx';
import type { DimensionSampleViewProps } from '#/dimension-scale/DimensionSample.tsx';

// The View renders from plain props — no provider, no store.
function setup(extra: Partial<DimensionSampleViewProps> = {}) {
  return render(
    <DimensionSampleView
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
  const bar = container.querySelector<HTMLElement>('.sb-dimension-sample__bar');
  expect(bar?.style.width).toBe('var(--sb-space-lg)');
});

it('renders a radius sample using the css var as border-radius', () => {
  const { container } = setup({ visual: 'radius' });
  const sample = container.querySelector<HTMLElement>('.sb-dimension-sample__radius-sample');
  expect(sample?.style.borderRadius).toBe('var(--sb-space-lg)');
});

it('renders a size sample sized to width and height', () => {
  const { container } = setup({ visual: 'size' });
  const sample = container.querySelector<HTMLElement>('.sb-dimension-sample__size-sample');
  expect(sample?.style.width).toBe('var(--sb-space-lg)');
  expect(sample?.style.height).toBe('var(--sb-space-lg)');
});

it('shows the cap marker with a title when capped', () => {
  const { container } = setup({ capped: true, cappedValue: '480px' });
  const wrap = container.querySelector('.sb-dimension-sample--capped');
  expect(wrap?.getAttribute('title')).toContain('capped at 480px');
  expect(container.querySelector('.sb-dimension-sample__cap')).not.toBeNull();
  const bar = wrap?.querySelector<HTMLElement>('div');
  expect(bar?.style.width).toBe('480px');
});

it('renders no cap marker when under the cap', () => {
  const { container } = setup();
  expect(container.querySelector('.sb-dimension-sample--capped')).toBeNull();
  expect(container.querySelector('.sb-dimension-sample__cap')).toBeNull();
});

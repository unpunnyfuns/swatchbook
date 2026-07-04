import { cleanup, render } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import { ShadowSampleView } from '#/shadow-preview/ShadowSample.tsx';

// The View renders from plain props — no provider, no store.
function setup(cssVar = 'var(--sb-shadow-default)') {
  return render(<ShadowSampleView cssVar={cssVar} />);
}

afterEach(() => {
  cleanup();
});

it('renders a sample with the css var applied as the box-shadow', () => {
  const { container } = setup();
  const sample = container.querySelector<HTMLElement>('.sb-shadow-sample');
  expect(sample?.style.boxShadow).toBe('var(--sb-shadow-default)');
});

it('is decorative', () => {
  const { container } = setup();
  const sample = container.querySelector<HTMLElement>('.sb-shadow-sample');
  expect(sample?.getAttribute('aria-hidden')).toBe('true');
});

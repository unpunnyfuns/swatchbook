import { cleanup, render } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import { BorderSampleView } from '#/border-preview/BorderSample.tsx';

// The View renders from plain props — no provider, no store.
function setup(cssVar = 'var(--sb-border-focus)') {
  return render(<BorderSampleView cssVar={cssVar} />);
}

afterEach(() => {
  cleanup();
});

it('renders a sample with the css var applied as the border', () => {
  const { container } = setup();
  const sample = container.querySelector<HTMLElement>('.sb-border-sample');
  expect(sample?.style.border).toBe('var(--sb-border-focus)');
});

it('is decorative', () => {
  const { container } = setup();
  const sample = container.querySelector<HTMLElement>('.sb-border-sample');
  expect(sample?.getAttribute('aria-hidden')).toBe('true');
});

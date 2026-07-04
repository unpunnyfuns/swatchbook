import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import { DiagnosticsView } from '#/Diagnostics.tsx';

afterEach(() => {
  cleanup();
});

// The View renders from plain props — no SwatchbookProvider, no snapshot,
// no channel. That is the whole point of the split.
it('renders rows and auto-expands on errors, from plain props', () => {
  render(
    <DiagnosticsView
      diagnostics={[{ severity: 'error', group: 'parser', message: 'boom' }]}
      cssVarPrefix="sb"
      activeAxes={{ theme: 'Light' }}
    />,
  );
  screen.getByText('boom');
  const details = screen.getByText(/✖ 1 error/).closest('details');
  expect(details?.hasAttribute('open')).toBe(true);
});

it('honors the caption override', () => {
  render(<DiagnosticsView diagnostics={[]} cssVarPrefix="sb" activeAxes={{}} caption="Health" />);
  screen.getByText('Health');
});

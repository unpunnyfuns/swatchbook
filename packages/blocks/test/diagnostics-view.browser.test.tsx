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

it('shows the rule id in the meta line so a reader knows which rule to configure', () => {
  render(
    <DiagnosticsView
      diagnostics={[
        {
          severity: 'error',
          group: 'lint',
          label: 'core/valid-color',
          message: 'Migrate to the new object format',
          filename: '/tokens/color.json',
          line: 3,
        },
      ]}
      cssVarPrefix="sb"
      activeAxes={{}}
    />,
  );
  screen.getByText('lint · core/valid-color · /tokens/color.json · :3');
});

it('honors the caption override', () => {
  render(<DiagnosticsView diagnostics={[]} cssVarPrefix="sb" activeAxes={{}} caption="Health" />);
  screen.getByText('Health');
});

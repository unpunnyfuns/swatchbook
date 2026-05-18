import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { Diagnostics, type ProjectSnapshot, SwatchbookProvider } from '#/index.ts';

function makeSnapshot(diagnostics: ProjectSnapshot['diagnostics'] = []): ProjectSnapshot {
  return {
    axes: [{ name: 'theme', contexts: ['Light'], default: 'Light', source: 'synthetic' }],
    disabledAxes: [],
    presets: [],
    cells: { theme: { Light: {} } },
    jointOverrides: [],
    defaultTuple: { theme: 'Light' },
    activeTheme: 'Light',
    activeAxes: { theme: 'Light' },
    cssVarPrefix: 'sb',
    diagnostics,
    css: '',
  };
}

describe('Diagnostics', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders an OK summary when the project carries no diagnostics', () => {
    render(
      <SwatchbookProvider value={makeSnapshot()}>
        <Diagnostics />
      </SwatchbookProvider>,
    );
    screen.getByText(/✔ OK · no diagnostics/);
  });

  it('auto-expands when there are errors and lists each row', () => {
    render(
      <SwatchbookProvider
        value={makeSnapshot([
          {
            severity: 'error',
            group: 'parser',
            message: 'Missing $value on color.bg',
            filename: '/proj/tokens.json',
            line: 4,
          },
          { severity: 'warn', group: 'swatchbook/resolver', message: 'modifier unusable' },
        ])}
      >
        <Diagnostics />
      </SwatchbookProvider>,
    );

    // Summary shows the aggregated count.
    screen.getByText(/✖ 1 error · ⚠ 1 warning/);

    // <details> auto-opens when errors exist — rows visible.
    const details = screen.getByText(/✖ 1 error · ⚠ 1 warning/).closest('details');
    expect(details?.hasAttribute('open')).toBe(true);

    screen.getByText('Missing $value on color.bg');
    screen.getByText('modifier unusable');
    screen.getByText(/parser · \/proj\/tokens.json · :4/);
  });

  it('stays collapsed when only info-level diagnostics are present', () => {
    render(
      <SwatchbookProvider
        value={makeSnapshot([{ severity: 'info', group: 'parser', message: 'loaded 20 files' }])}
      >
        <Diagnostics />
      </SwatchbookProvider>,
    );
    const details = screen.getByText(/1 info/).closest('details');
    expect(details?.hasAttribute('open')).toBe(false);
  });

  it('honors the caption override', () => {
    render(
      <SwatchbookProvider value={makeSnapshot()}>
        <Diagnostics caption="Project health" />
      </SwatchbookProvider>,
    );
    screen.getByText('Project health');
  });
});

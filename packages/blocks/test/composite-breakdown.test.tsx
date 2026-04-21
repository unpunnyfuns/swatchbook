import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { CompositeBreakdown, type ProjectSnapshot, SwatchbookProvider } from '#/index.ts';

function makeSnapshot(): ProjectSnapshot {
  const themesResolved = {
    Light: {
      'color.palette.blue.500': { $type: 'color', $value: { hex: '#3b82f6' } },
      'color.border.default': {
        $type: 'color',
        $value: { hex: '#3b82f6' },
        aliasOf: 'color.palette.blue.500',
        aliasChain: ['color.palette.blue.500'],
      },
      'border.default': {
        $type: 'border',
        $value: {
          color: { hex: '#3b82f6' },
          width: { value: 1, unit: 'px' },
          style: 'solid',
        },
        partialAliasOf: {
          color: 'color.border.default',
          width: undefined,
          style: undefined,
        },
      },
    },
  };
  return {
    axes: [{ name: 'theme', contexts: ['Light'], default: 'Light', source: 'synthetic' }],
    disabledAxes: [],
    presets: [],
    themes: [{ name: 'Light', input: { theme: 'Light' }, sources: [] }],
    themesResolved,
    activeTheme: 'Light',
    activeAxes: { theme: 'Light' },
    cssVarPrefix: 'sb',
    diagnostics: [],
    css: '',
  };
}

describe('CompositeBreakdown', () => {
  afterEach(() => {
    cleanup();
  });

  it('surfaces the full alias chain for each aliased sub-value on a composite token', () => {
    render(
      <SwatchbookProvider value={makeSnapshot()}>
        <CompositeBreakdown path="border.default" />
      </SwatchbookProvider>,
    );

    const aliasAnnotations = screen.getAllByTestId('breakdown-alias');
    expect(aliasAnnotations.length).toBe(1);

    const chain = aliasAnnotations[0];
    expect(chain).toBeDefined();
    expect(within(chain as HTMLElement).getByText('color.border.default')).toBeDefined();
    expect(within(chain as HTMLElement).getByText('color.palette.blue.500')).toBeDefined();
  });

  it('omits the alias annotation on sub-values that are literal (not aliases)', () => {
    render(
      <SwatchbookProvider value={makeSnapshot()}>
        <CompositeBreakdown path="border.default" />
      </SwatchbookProvider>,
    );

    // border.default has partialAliasOf only on `color`; `width` and `style`
    // are literals and should render without the alias chain span.
    const annotations = screen.queryAllByTestId('breakdown-alias');
    expect(annotations.length).toBe(1);
  });
});

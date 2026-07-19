/**
 * Regression for the MDX-embedded, provider-less path: a block rendered
 * with no `<SwatchbookProvider>` (the shape blocks take when embedded
 * directly in an MDX doc with no `<Story/>`) must still honor
 * `Config.defaultColorFormat` via the channel-fed `TokenSnapshot` that
 * `registerTokenSource` seeds, not silently fall back to `'hex'`.
 */
import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import { ColorTable, registerTokenSource } from '#/index.ts';
import type { VirtualTokenGraph } from '#/index.ts';

function graph(): VirtualTokenGraph {
  return {
    axes: ['mode'],
    axisDefaults: { mode: 'light' },
    axisContexts: { mode: ['light'] },
    nodes: {
      'color.text.default': {
        baselineValue: { $value: { hex: '#111111' }, $type: 'color' },
        baselineKind: 'literal',
        writes: {},
        affectedBy: [],
        aliases: [],
        aliasedBy: [],
      },
    },
  };
}

afterEach(() => {
  cleanup();
  // `registerTokenSource` patches are partial and retain omitted fields, so
  // resetting only `defaultColorFormat` left `axes` / `defaultTuple` /
  // `cssVarPrefix` / `tokenGraph` from this test's patch on the module-level
  // store for later files sharing the same worker. Restore the full baseline
  // snapshot instead.
  registerTokenSource({
    axes: [],
    presets: [],
    diagnostics: [],
    css: '',
    cssVarPrefix: '',
    indicators: {},
    listing: {},
    tokenGraph: { nodes: {}, axes: [], axisDefaults: {}, axisContexts: {} },
    defaultTuple: {},
    defaultColorFormat: 'hex',
  });
});

it('honors defaultColorFormat from the channel token source with no provider mounted', () => {
  registerTokenSource({
    axes: [{ name: 'mode', contexts: ['light'], default: 'light', source: 'resolver' }],
    defaultTuple: { mode: 'light' },
    cssVarPrefix: 'sb',
    tokenGraph: graph(),
    defaultColorFormat: 'oklch',
  });

  render(<ColorTable filter="color.text.default" />);

  const row = screen.getByTestId('color-table-row');
  within(row).getByText(/^oklch\(/);
  expect(within(row).queryByText('#111111')).toBeNull();
});

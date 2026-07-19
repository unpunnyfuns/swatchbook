/**
 * Regression: a varying alias must show its per-tuple forward chain.
 *
 * `surface` aliases `palette.light` in Light and `palette.dark` in Dark.
 * In the Dark theme, `surface`'s row indicator must name `palette.dark`,
 * not `palette.light`. This test is graph-backed (no `resolveAt` on the
 * snapshot) so it exercises the `resolveAllWithProvenanceAt` path in
 * `use-project`.
 */
import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import { SwatchbookContext, TokenNavigator } from '#/index.ts';
import type { ProjectSnapshot } from '#/index.ts';
import type { VirtualTokenGraph } from '#/contexts.ts';

function graph(): VirtualTokenGraph {
  return {
    axes: ['mode'],
    axisDefaults: { mode: 'Light' },
    axisContexts: { mode: ['Light', 'Dark'] },
    nodes: {
      'palette.light': {
        baselineValue: { $value: { hex: '#ffffff' }, $type: 'color' },
        baselineKind: 'literal',
        writes: {},
        affectedBy: [],
        aliases: [],
        aliasedBy: ['surface'],
      },
      'palette.dark': {
        baselineValue: { $value: { hex: '#000000' }, $type: 'color' },
        baselineKind: 'literal',
        writes: {},
        affectedBy: [],
        aliases: [],
        aliasedBy: ['surface'],
      },
      surface: {
        baselineValue: { $value: { hex: '#ffffff' }, $type: 'color' },
        baselineKind: 'alias',
        baselineAliasTarget: 'palette.light',
        writes: { mode: { Dark: { kind: 'alias', target: 'palette.dark' } } },
        affectedBy: ['mode'],
        aliases: ['palette.light'],
        aliasedBy: [],
      },
    },
  };
}

function darkSnapshot(): ProjectSnapshot {
  return {
    axes: [{ name: 'mode', contexts: ['Light', 'Dark'], default: 'Light', source: 'synthetic' }],
    defaultTuple: { mode: 'Light' },
    activeTheme: 'Dark',
    activeAxes: { mode: 'Dark' },
    cssVarPrefix: 'sb',
    diagnostics: [],
    css: '',
    tokenGraph: graph(),
  };
}

afterEach(cleanup);

it('a varying alias shows its per-tuple forward chain in the dark theme', async () => {
  render(
    <SwatchbookContext.Provider value={darkSnapshot()}>
      <TokenNavigator searchable={false} />
    </SwatchbookContext.Provider>,
  );
  const leaves = await screen.findAllByTestId('token-navigator-leaf');
  const surfaceLeaf = leaves.find((el) => el.getAttribute('data-path') === 'surface')!;
  const forward = within(surfaceLeaf).getByTestId('row-indicator-alias-forward');
  expect(forward).toHaveAttribute('aria-label', expect.stringContaining('palette.dark'));
});

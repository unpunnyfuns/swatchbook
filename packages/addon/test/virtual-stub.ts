/**
 * Stand-in for `virtual:swatchbook/tokens` under test. The fixture is
 * deliberately tiny — one axis with two contexts, two tokens — so tests
 * stay focused on hook behavior rather than fixture shape.
 *
 * Tests that need a different payload swap module state via
 * `vi.doMock('virtual:swatchbook/tokens', () => …)` ahead of importing
 * the unit under test.
 */
import type { TokenGraph } from '@unpunnyfuns/swatchbook-core/graph';

export const axes = [
  {
    name: 'mode',
    contexts: ['Light', 'Dark'],
    default: 'Light',
    source: 'resolver' as const,
  },
];
export const disabledAxes = [] as readonly string[];
export const presets = [] as const;
export const diagnostics = [] as const;
export const css = '';
export const cssVarPrefix = 'sb';
export const listing = {};
export const defaultTuple: Record<string, string> = { mode: 'Light' };
export const tokenGraph: TokenGraph = {
  nodes: {
    'color.accent.bg': {
      baselineValue: {
        $type: 'color',
        $value: { colorSpace: 'srgb', components: [0, 0.4, 1] },
        $description: 'Accent background',
      },
      baselineKind: 'literal',
      writes: {
        mode: {
          Dark: {
            kind: 'literal',
            value: {
              $type: 'color',
              $value: { colorSpace: 'srgb', components: [0, 0.2, 0.8] },
              $description: 'Accent background',
            },
          },
        },
      },
      aliases: [],
      aliasedBy: [],
      affectedBy: ['mode'],
    },
    'space.md': {
      baselineValue: {
        $type: 'dimension',
        $value: '16px',
      },
      baselineKind: 'literal',
      writes: {},
      aliases: [],
      aliasedBy: [],
      affectedBy: [],
    },
  },
  axes: ['mode'],
  axisDefaults: { mode: 'Light' },
  axisContexts: { mode: ['Light', 'Dark'] },
};

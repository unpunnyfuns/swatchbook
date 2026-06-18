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
    'color.palette.blue': {
      baselineValue: {
        $type: 'color',
        $value: { colorSpace: 'srgb', components: [0, 0, 1] },
        $description: 'Palette blue',
      },
      baselineKind: 'literal',
      writes: {},
      aliases: [],
      aliasedBy: ['color.surface'],
      affectedBy: [],
    },
    'color.palette.ink': {
      baselineValue: {
        $type: 'color',
        $value: { colorSpace: 'srgb', components: [0, 0, 0] },
        $description: 'Palette ink',
      },
      baselineKind: 'literal',
      writes: {},
      aliases: [],
      aliasedBy: ['color.surface'],
      affectedBy: [],
    },
    // Axis-varying alias: aliases palette.blue at baseline (Light), re-points
    // to palette.ink in Dark. Carries its OWN $description; the raw leaf
    // resolver would substitute the target's, the provenance resolver keeps
    // the source's. Regression fixture for the addon provenance bypass.
    'color.surface': {
      baselineValue: {
        $type: 'color',
        $value: { colorSpace: 'srgb', components: [0, 0, 1] },
        $description: 'Semantic surface',
        aliasOf: 'color.palette.blue',
        aliasChain: ['color.palette.blue'],
      },
      baselineKind: 'alias',
      baselineAliasTarget: 'color.palette.blue',
      writes: {
        mode: {
          Dark: { kind: 'alias', target: 'color.palette.ink' },
        },
      },
      aliases: ['color.palette.blue'],
      aliasedBy: [],
      affectedBy: ['mode'],
    },
  },
  axes: ['mode'],
  axisDefaults: { mode: 'Light' },
  axisContexts: { mode: ['Light', 'Dark'] },
};

/**
 * Stand-in for `virtual:swatchbook/tokens` under test. The fixture is
 * deliberately tiny — one axis with two contexts, two tokens — so tests
 * stay focused on hook behavior rather than fixture shape.
 *
 * Tests that need a different payload swap module state via
 * `vi.doMock('virtual:swatchbook/tokens', () => …)` ahead of importing
 * the unit under test.
 */
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
export const cells: Record<string, Record<string, Record<string, unknown>>> = {
  mode: {
    Light: {
      'color.accent.bg': {
        $type: 'color',
        $value: { colorSpace: 'srgb', components: [0, 0.4, 1] },
        $description: 'Accent background',
      },
      'space.md': {
        $type: 'dimension',
        $value: '16px',
      },
    },
    Dark: {
      'color.accent.bg': {
        $type: 'color',
        $value: { colorSpace: 'srgb', components: [0.3, 0.6, 1] },
        $description: 'Accent background',
      },
      'space.md': {
        $type: 'dimension',
        $value: '16px',
      },
    },
  },
};
export const jointOverrides: readonly (readonly [string, unknown])[] = [];
export const varianceByPath: Record<string, unknown> = {};
export const defaultTuple: Record<string, string> = { mode: 'Light' };

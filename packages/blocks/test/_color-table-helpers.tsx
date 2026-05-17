import type { ProjectSnapshot, VirtualTokenShape } from '#/index.ts';

/**
 * Test snapshot using the legacy `permutationsResolved` shape — the
 * `snapshotResolveAt` fallback path in `use-project` covers this for
 * hand-built snapshots. `permutationsResolved` is typed as the wider
 * `Record<…>` rather than inferred from the literal so tests can
 * extend the map with extra paths after construction.
 */
export interface ColorTableSnapshot extends ProjectSnapshot {
  permutationsResolved: Record<string, Record<string, VirtualTokenShape>>;
}

export function makeColorTableSnapshot(): ColorTableSnapshot {
  return {
    axes: [{ name: 'mode', contexts: ['light'], default: 'light', source: 'resolver' }],
    disabledAxes: [],
    presets: [],
    permutations: [{ name: 'Light', input: { mode: 'light' }, sources: [] }],
    permutationsResolved: {
      Light: {
        'color.surface.default': {
          $type: 'color',
          $value: { hex: '#ffffff' },
        },
        'color.text.default': {
          $type: 'color',
          $value: { hex: '#111111' },
          $description: 'Primary text on default surfaces.',
          aliasOf: 'color.palette.neutral.900',
          aliasChain: ['color.palette.neutral.900'],
        },
        'color.palette.neutral.900': {
          $type: 'color',
          $value: { hex: '#111111' },
        },
        'space.md': {
          $type: 'dimension',
          $value: { value: 16, unit: 'px' },
        },
      },
    },
    activePermutation: 'Light',
    activeAxes: { mode: 'light' },
    cssVarPrefix: 'sb',
    diagnostics: [],
    css: '',
  };
}

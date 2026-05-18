import type { ProjectSnapshot } from '#/index.ts';

/**
 * Hand-built test snapshot for ColorTable scenarios. Single-axis
 * (mode/light), single cell. Tests that append tokens after
 * construction mutate `snap.cells.mode.light` directly.
 */
export function makeColorTableSnapshot(): ProjectSnapshot {
  return {
    axes: [{ name: 'mode', contexts: ['light'], default: 'light', source: 'resolver' }],
    disabledAxes: [],
    presets: [],
    cells: {
      mode: {
        light: {
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
    },
    jointOverrides: [],
    defaultTuple: { mode: 'light' },
    activeTheme: 'Light',
    activeAxes: { mode: 'light' },
    cssVarPrefix: 'sb',
    diagnostics: [],
    css: '',
  };
}

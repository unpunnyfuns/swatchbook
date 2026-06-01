import type { ProjectSnapshot, VirtualTokenShape } from '#/index.ts';
import { makeResolveAt } from './_snapshot-helpers.ts';

const BASE_TOKENS: Record<string, VirtualTokenShape> = {
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
};

/**
 * Hand-built test snapshot for ColorTable scenarios. Single-axis
 * (mode/light), single resolved view. Pass `extraTokens` to include
 * additional tokens in the resolved map.
 */
export function makeColorTableSnapshot(
  extraTokens?: Record<string, VirtualTokenShape>,
): ProjectSnapshot {
  const tokens = { ...BASE_TOKENS, ...extraTokens };
  const snap: ProjectSnapshot = {
    axes: [{ name: 'mode', contexts: ['light'], default: 'light', source: 'resolver' }],
    defaultTuple: { mode: 'light' },
    activeTheme: 'Light',
    activeAxes: { mode: 'light' },
    cssVarPrefix: 'sb',
    diagnostics: [],
    css: '',
  };
  snap.resolveAt = makeResolveAt(tokens);
  return snap;
}

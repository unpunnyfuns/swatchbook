import type { SnapshotForWire } from '@unpunnyfuns/swatchbook-core/snapshot-for-wire';
import type { VirtualTokenGraph } from '#/contexts.ts';
import type { VirtualToken } from '#/types.ts';

/**
 * Build a literal-only `VirtualTokenGraph` from a flat token map, all under
 * one axis. Mirrors `_snapshot-helpers.ts`'s `makeResolveAt` shape (same
 * tokens, single context) but resolves through the real graph-walker path
 * (`resolveAllWithProvenanceAt`) rather than a constant-returning stub:
 * for tests exercising `SwatchbookProvider`'s wire-assembly, where
 * `resolveAt` is deliberately left unset.
 */
export function makeTokenGraph(
  tokens: Record<string, VirtualToken>,
  axisName = 'mode',
  contexts: readonly string[] = ['Light', 'Dark'],
  defaultContext = contexts[0],
): VirtualTokenGraph {
  const nodes: VirtualTokenGraph['nodes'] = {};
  for (const [path, token] of Object.entries(tokens)) {
    nodes[path] = {
      baselineValue: token,
      baselineKind: 'literal',
      writes: {},
      aliases: [],
      aliasedBy: [],
      affectedBy: [],
    };
  }
  return {
    nodes,
    axes: [axisName],
    axisDefaults: { [axisName]: defaultContext ?? '' },
    axisContexts: { [axisName]: contexts },
  };
}

/**
 * Minimal `SnapshotForWire` fixture: one axis (`mode`: `Light`/`Dark`), one
 * color token, `cssVarPrefix: 'sb'`. Pass `overrides` to replace individual
 * fields (e.g. a richer `tokenGraph` built from {@link makeTokenGraph}).
 */
export function makeWireSnapshot(overrides?: Partial<SnapshotForWire>): SnapshotForWire {
  const base: SnapshotForWire = {
    axes: [{ name: 'mode', contexts: ['Light', 'Dark'], default: 'Light', source: 'synthetic' }],
    disabledAxes: [],
    presets: [],
    diagnostics: [],
    cssVarPrefix: 'sb',
    indicators: {},
    defaultColorFormat: 'hex',
    css: '',
    listing: {},
    defaultTuple: { mode: 'Light' },
    tokenGraph: makeTokenGraph({
      'color.brand.primary': { $type: 'color', $value: { hex: '#3b82f6' } },
    }),
  };
  return { ...base, ...overrides };
}

import { expect, it } from 'vitest';
import { buildTokenGraphFromLayered } from '#/token-graph/build.ts';
import { resolveAllAt } from '#/token-graph/walk.ts';
import type { TokenMap } from '#/types.ts';

// A constant (axis-free) token carrying $deprecated must keep the field on
// its graph baseline AND on the browser-side resolved value. $deprecated is
// gated by SLIM_KEYS in the graph builder — without the allowlist entry it
// is stripped at build time and never reaches blocks.
function fixture(): TokenMap {
  return {
    'color.old': {
      $type: 'color',
      $value: { colorSpace: 'srgb', components: [1, 0, 0], alpha: 1 },
      $deprecated: 'use color.new instead',
    },
    'color.live': {
      $type: 'color',
      $value: { colorSpace: 'srgb', components: [0, 1, 0], alpha: 1 },
    },
    'flag.gone': {
      $type: 'color',
      $value: { colorSpace: 'srgb', components: [0, 0, 1], alpha: 1 },
      $deprecated: true,
    },
  };
}

it('keeps $deprecated on the graph baseline and resolved output', () => {
  const { graph } = buildTokenGraphFromLayered([], fixture(), {}, {});

  expect(graph.nodes['color.old']?.baselineValue.$deprecated).toBe('use color.new instead');
  expect(graph.nodes['flag.gone']?.baselineValue.$deprecated).toBe(true);
  expect(graph.nodes['color.live']?.baselineValue.$deprecated).toBeUndefined();

  const resolved = resolveAllAt(graph, {});
  expect(resolved['color.old']?.$deprecated).toBe('use color.new instead');
  expect(resolved['flag.gone']?.$deprecated).toBe(true);
  expect(resolved['color.live']?.$deprecated).toBeUndefined();
});

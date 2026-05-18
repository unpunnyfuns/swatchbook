/**
 * Alias-graph build + connectivity tests.
 *
 * The graph captures, per axis A and per non-default context c, the
 * set of token paths A's overlay declares (`pathsByAxisContext`) plus
 * the per-path transitive alias closure (`reachableFromPath`). Two
 * axes are "connected" iff the union of their per-context declared
 * paths overlaps (under alias closure). `probeJointOverrides` uses
 * the connectivity to skip orthogonal axis combinations.
 */
import { describe, expect, it } from 'vitest';
import { buildAliasGraph, isAxisComboConnected } from '#/alias-graph.ts';
import type { Axis, TokenMap } from '#/types.ts';

describe('alias-graph', () => {
  it('extracts paths from resolver.source.modifiers literal walk', () => {
    const axes: Axis[] = [
      { name: 'mode', contexts: ['light', 'dark'], default: 'light', source: 'resolver' },
    ];
    const resolverModifiers = {
      mode: {
        default: 'light',
        contexts: {
          light: [],
          dark: [
            {
              color: {
                $type: 'color',
                bg: { $value: { colorSpace: 'srgb', components: [0, 0, 0] } },
                fg: { $value: { colorSpace: 'srgb', components: [1, 1, 1] } },
              },
            },
          ],
        },
      },
    };
    const graph = buildAliasGraph({ axes, resolverModifiers, baseline: {} });
    expect(graph.pathsByAxisContext.get('mode')?.get('dark')).toEqual(
      new Set(['color.bg', 'color.fg']),
    );
    // Default context isn't walked — by construction it's the
    // baseline the probe compares against.
    expect(graph.pathsByAxisContext.get('mode')?.get('light')).toBeUndefined();
  });

  it('reachableFromPath unions aliasChain and partialAliasOf', () => {
    const baseline: TokenMap = {
      'color.fg': {
        $type: 'color',
        $value: { colorSpace: 'srgb', components: [0, 0, 0] },
        aliasOf: 'color.palette.black',
        aliasChain: ['color.intermediate', 'color.palette.black'],
      } as never,
      'color.palette.black': {
        $type: 'color',
        $value: { colorSpace: 'srgb', components: [0, 0, 0] },
      },
      'border.default': {
        $type: 'border',
        $value: {
          color: '#000',
          width: { value: 1, unit: 'px' },
          style: 'solid',
        },
        partialAliasOf: { color: 'color.fg' },
      } as never,
    };
    const graph = buildAliasGraph({ axes: [], resolverModifiers: {}, baseline });
    expect(graph.reachableFromPath.get('color.fg')).toEqual(
      new Set(['color.fg', 'color.intermediate', 'color.palette.black']),
    );
    expect(graph.reachableFromPath.get('border.default')).toEqual(
      new Set(['border.default', 'color.fg']),
    );
  });

  it('partialAliasOf handles shadow composite (array of objects)', () => {
    const baseline: TokenMap = {
      'shadow.lg': {
        $type: 'shadow',
        $value: [
          {
            color: '#000',
            offsetX: { value: 0, unit: 'px' },
            offsetY: { value: 1, unit: 'px' },
            blur: { value: 2, unit: 'px' },
            spread: { value: 0, unit: 'px' },
          },
          {
            color: '#000',
            offsetX: { value: 0, unit: 'px' },
            offsetY: { value: 4, unit: 'px' },
            blur: { value: 8, unit: 'px' },
            spread: { value: 0, unit: 'px' },
          },
        ],
        partialAliasOf: [
          { color: 'color.palette.neutral.900' },
          { color: 'color.palette.neutral.900' },
        ],
      } as never,
    };
    const graph = buildAliasGraph({ axes: [], resolverModifiers: {}, baseline });
    expect(graph.reachableFromPath.get('shadow.lg')).toEqual(
      new Set(['shadow.lg', 'color.palette.neutral.900']),
    );
  });

  it('connectedAxes via direct-write overlap', () => {
    const axes: Axis[] = [
      { name: 'mode', contexts: ['light', 'dark'], default: 'light', source: 'resolver' },
      { name: 'brand', contexts: ['default', 'a'], default: 'default', source: 'resolver' },
    ];
    const baseline: TokenMap = {
      'color.surface': {
        $type: 'color',
        $value: { colorSpace: 'srgb', components: [1, 1, 1] },
      },
    };
    const resolverModifiers = {
      mode: {
        default: 'light',
        contexts: {
          light: [],
          dark: [
            {
              color: {
                $type: 'color',
                surface: { $value: { colorSpace: 'srgb', components: [0, 0, 0] } },
              },
            },
          ],
        },
      },
      brand: {
        default: 'default',
        contexts: {
          default: [],
          a: [
            {
              color: {
                $type: 'color',
                surface: { $value: { colorSpace: 'srgb', components: [0.2, 0.2, 0.2] } },
              },
            },
          ],
        },
      },
    };
    const graph = buildAliasGraph({ axes, resolverModifiers, baseline });
    expect(graph.connectedAxes.get('mode')?.has('brand')).toBe(true);
    expect(graph.connectedAxes.get('brand')?.has('mode')).toBe(true);
  });

  it('connectedAxes via alias-mediated overlap', () => {
    // mode/dark writes color.surface (which baseline aliases to
    // color.palette.neutral.0). brand/a writes color.palette.neutral.0
    // directly. Reach of mode through color.surface's alias chain
    // includes color.palette.neutral.0 — so the two axes overlap.
    const axes: Axis[] = [
      { name: 'mode', contexts: ['light', 'dark'], default: 'light', source: 'resolver' },
      { name: 'brand', contexts: ['default', 'a'], default: 'default', source: 'resolver' },
    ];
    const baseline: TokenMap = {
      'color.surface': {
        $type: 'color',
        $value: { colorSpace: 'srgb', components: [1, 1, 1] },
        aliasOf: 'color.palette.neutral.0',
        aliasChain: ['color.palette.neutral.0'],
      } as never,
      'color.palette.neutral.0': {
        $type: 'color',
        $value: { colorSpace: 'srgb', components: [1, 1, 1] },
      },
    };
    const resolverModifiers = {
      mode: {
        default: 'light',
        contexts: {
          light: [],
          dark: [
            {
              color: {
                $type: 'color',
                surface: { $value: { colorSpace: 'srgb', components: [0, 0, 0] } },
              },
            },
          ],
        },
      },
      brand: {
        default: 'default',
        contexts: {
          default: [],
          a: [
            {
              color: {
                $type: 'color',
                palette: {
                  neutral: {
                    '0': { $value: { colorSpace: 'srgb', components: [0.95, 0.95, 0.95] } },
                  },
                },
              },
            },
          ],
        },
      },
    };
    const graph = buildAliasGraph({ axes, resolverModifiers, baseline });
    expect(graph.connectedAxes.get('mode')?.has('brand')).toBe(true);
    expect(graph.connectedAxes.get('brand')?.has('mode')).toBe(true);
  });

  it('connectedAxes returns disconnected for axes with disjoint path sets', () => {
    const axes: Axis[] = [
      { name: 'mode', contexts: ['light', 'dark'], default: 'light', source: 'resolver' },
      {
        name: 'density',
        contexts: ['comfortable', 'compact'],
        default: 'comfortable',
        source: 'resolver',
      },
    ];
    const resolverModifiers = {
      mode: {
        default: 'light',
        contexts: {
          light: [],
          dark: [
            {
              color: {
                $type: 'color',
                bg: { $value: { colorSpace: 'srgb', components: [0, 0, 0] } },
              },
            },
          ],
        },
      },
      density: {
        default: 'comfortable',
        contexts: {
          comfortable: [],
          compact: [
            {
              dimension: {
                $type: 'dimension',
                md: { $value: { value: 12, unit: 'px' } },
              },
            },
          ],
        },
      },
    };
    const graph = buildAliasGraph({ axes, resolverModifiers, baseline: {} });
    expect(graph.connectedAxes.get('mode')?.has('density') ?? false).toBe(false);
    expect(graph.connectedAxes.get('density')?.has('mode') ?? false).toBe(false);
  });

  it('isAxisComboConnected: every axis must have >=1 in-combo connection', () => {
    const axes: Axis[] = [
      { name: 'mode', contexts: ['light', 'dark'], default: 'light', source: 'resolver' },
      { name: 'brand', contexts: ['default', 'a'], default: 'default', source: 'resolver' },
      {
        name: 'density',
        contexts: ['comfortable', 'compact'],
        default: 'comfortable',
        source: 'resolver',
      },
    ];
    const resolverModifiers = {
      mode: {
        default: 'light',
        contexts: {
          light: [],
          dark: [
            {
              color: {
                $type: 'color',
                bg: { $value: { colorSpace: 'srgb', components: [0, 0, 0] } },
              },
            },
          ],
        },
      },
      brand: {
        default: 'default',
        contexts: {
          default: [],
          a: [
            {
              color: {
                $type: 'color',
                bg: { $value: { colorSpace: 'srgb', components: [0.1, 0, 0] } },
              },
            },
          ],
        },
      },
      density: {
        default: 'comfortable',
        contexts: {
          comfortable: [],
          compact: [
            {
              dimension: {
                $type: 'dimension',
                md: { $value: { value: 12, unit: 'px' } },
              },
            },
          ],
        },
      },
    };
    const graph = buildAliasGraph({ axes, resolverModifiers, baseline: {} });

    // mode + brand connected (both write color.bg).
    expect(isAxisComboConnected(graph, [axes[0]!, axes[1]!])).toBe(true);
    // mode + density disjoint.
    expect(isAxisComboConnected(graph, [axes[0]!, axes[2]!])).toBe(false);
    // All three: density has no in-combo partner, so the combo
    // is rejected even though mode and brand are connected.
    expect(isAxisComboConnected(graph, axes)).toBe(false);
  });

  it('axis becomes wildcard-connected when its modifier uses $extends', () => {
    // Terrazzo's `loadResolver` does NOT pre-flatten `$extends` in
    // `resolver.source.modifiers[A].contexts[c]` — flattening only
    // happens lazily during `apply()`. A literal walk of the context
    // Groups therefore misses inherited paths. To avoid silently
    // mis-culling a real joint divergence, an axis that uses
    // `$extends` anywhere in its overlays is marked as connected to
    // every other axis (conservative bail; gives up speedup but keeps
    // correctness).
    const axes: Axis[] = [
      { name: 'mode', contexts: ['light', 'dark'], default: 'light', source: 'resolver' },
      { name: 'brand', contexts: ['default', 'a'], default: 'default', source: 'resolver' },
      {
        name: 'density',
        contexts: ['comfortable', 'compact'],
        default: 'comfortable',
        source: 'resolver',
      },
    ];
    const resolverModifiers = {
      mode: {
        default: 'light',
        contexts: {
          light: [],
          dark: [
            {
              color: {
                $extends: '{base.dark-palette}',
                $type: 'color',
              },
            },
          ],
        },
      },
      brand: {
        default: 'default',
        contexts: {
          default: [],
          a: [
            {
              spacing: {
                $type: 'dimension',
                md: { $value: { value: 16, unit: 'px' } },
              },
            },
          ],
        },
      },
      density: {
        default: 'comfortable',
        contexts: {
          comfortable: [],
          compact: [
            {
              radius: {
                $type: 'dimension',
                sm: { $value: { value: 4, unit: 'px' } },
              },
            },
          ],
        },
      },
    };
    const graph = buildAliasGraph({ axes, resolverModifiers, baseline: {} });
    // mode used $extends — wildcard-connect to brand and density even
    // though brand+density write strictly disjoint paths.
    expect(graph.connectedAxes.get('mode')?.has('brand')).toBe(true);
    expect(graph.connectedAxes.get('mode')?.has('density')).toBe(true);
    // brand vs density remain disconnected — neither used $extends and
    // their paths don't overlap.
    expect(graph.connectedAxes.get('brand')?.has('density') ?? false).toBe(false);
  });

  it('isAxisComboConnected returns true trivially for arity < 2', () => {
    const graph = buildAliasGraph({ axes: [], resolverModifiers: {}, baseline: {} });
    expect(isAxisComboConnected(graph, [])).toBe(true);
    expect(
      isAxisComboConnected(graph, [
        { name: 'x', contexts: ['a'], default: 'a', source: 'resolver' },
      ]),
    ).toBe(true);
  });
});

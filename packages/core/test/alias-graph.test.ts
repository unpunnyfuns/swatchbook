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
    // border.default's reach now includes color.fg's onward chain
    // — `expandReach` recurses into partialAliasOf targets so the
    // composite picks up its sub-field's transitive alias closure.
    expect(graph.reachableFromPath.get('border.default')).toEqual(
      new Set(['border.default', 'color.fg', 'color.intermediate', 'color.palette.black']),
    );
  });

  it('partialAliasOf handles typography composite (object map)', () => {
    // Empirically pinned from `@terrazzo/parser` 2.1: typography
    // tokens whose `$value.fontFamily` / `$value.fontWeight` reference
    // other tokens produce a flat object-map `partialAliasOf` of the
    // same shape as border tokens.
    const baseline: TokenMap = {
      'family.sans': {
        $type: 'fontFamily',
        $value: ['Inter'],
      } as never,
      'weight.bold': {
        $type: 'fontWeight',
        $value: 700,
      } as never,
      heading: {
        $type: 'typography',
        $value: {
          fontFamily: ['Inter'],
          fontWeight: 700,
          fontSize: { value: 24, unit: 'px' },
          lineHeight: { value: 32, unit: 'px' },
          letterSpacing: { value: 0, unit: 'px' },
        },
        partialAliasOf: { fontFamily: 'family.sans', fontWeight: 'weight.bold' },
      } as never,
    };
    const graph = buildAliasGraph({ axes: [], resolverModifiers: {}, baseline });
    expect(graph.reachableFromPath.get('heading')).toEqual(
      new Set(['heading', 'family.sans', 'weight.bold']),
    );
  });

  it('partialAliasOf handles transition composite (object map)', () => {
    // Empirically pinned: transition tokens with aliased `duration` /
    // `timingFunction` produce an object-map `partialAliasOf` —
    // structurally identical to typography and border. The walker's
    // generic recursive descent handles all three uniformly.
    const baseline: TokenMap = {
      'dur.short': {
        $type: 'duration',
        $value: { value: 100, unit: 'ms' },
      } as never,
      'ease.standard': {
        $type: 'cubicBezier',
        $value: [0.4, 0, 0.2, 1],
      } as never,
      enter: {
        $type: 'transition',
        $value: {
          duration: { value: 100, unit: 'ms' },
          timingFunction: [0.4, 0, 0.2, 1],
          delay: { value: 0, unit: 'ms' },
        },
        partialAliasOf: { duration: 'dur.short', timingFunction: 'ease.standard' },
      } as never,
    };
    const graph = buildAliasGraph({ axes: [], resolverModifiers: {}, baseline });
    expect(graph.reachableFromPath.get('enter')).toEqual(
      new Set(['enter', 'dur.short', 'ease.standard']),
    );
  });

  it('partialAliasOf handles gradient composite (array of objects)', () => {
    // Empirically pinned: gradient tokens whose `$value` is an array
    // of stops with aliased `color` produce an array-of-object-maps
    // `partialAliasOf` — structurally identical to shadow. The
    // recursive walker treats both the same way.
    const baseline: TokenMap = {
      'color.red': {
        $type: 'color',
        $value: { colorSpace: 'srgb', components: [1, 0, 0], alpha: 1 },
      } as never,
      'color.blue': {
        $type: 'color',
        $value: { colorSpace: 'srgb', components: [0, 0, 1], alpha: 1 },
      } as never,
      bg: {
        $type: 'gradient',
        $value: [
          { color: { colorSpace: 'srgb', components: [1, 0, 0], alpha: 1 }, position: 0 },
          { color: { colorSpace: 'srgb', components: [0, 0, 1], alpha: 1 }, position: 1 },
        ],
        partialAliasOf: [{ color: 'color.red' }, { color: 'color.blue' }],
      } as never,
    };
    const graph = buildAliasGraph({ axes: [], resolverModifiers: {}, baseline });
    expect(graph.reachableFromPath.get('bg')).toEqual(new Set(['bg', 'color.red', 'color.blue']));
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

  it('reachableFromPath transits aliasChain through partialAliasOf targets', () => {
    // Designer indirection pattern:
    //   border.default → partialAliasOf.color = 'color.fg'
    //   color.fg → aliasChain = ['color.palette.brand', 'color.palette.neutral.0']
    // Without transitive reach, border.default's reach is {self, color.fg};
    // a sibling axis writing color.palette.brand would be falsely classified
    // as orthogonal because the aliasChain past color.fg never enters
    // border.default's reach set. Transitive expansion recursively chases
    // each partialAliasOf target through its own aliasChain + partialAliasOf.
    const baseline: TokenMap = {
      'border.default': {
        $type: 'border',
        $value: {
          color: '#000',
          width: { value: 1, unit: 'px' },
          style: 'solid',
        },
        partialAliasOf: { color: 'color.fg' },
      } as never,
      'color.fg': {
        $type: 'color',
        $value: { colorSpace: 'srgb', components: [0, 0, 0] },
        aliasOf: 'color.palette.brand',
        aliasChain: ['color.palette.brand', 'color.palette.neutral.0'],
      } as never,
      'color.palette.brand': {
        $type: 'color',
        $value: { colorSpace: 'srgb', components: [0, 0, 0] },
        aliasOf: 'color.palette.neutral.0',
        aliasChain: ['color.palette.neutral.0'],
      } as never,
      'color.palette.neutral.0': {
        $type: 'color',
        $value: { colorSpace: 'srgb', components: [0, 0, 0] },
      },
    };
    const graph = buildAliasGraph({ axes: [], resolverModifiers: {}, baseline });
    expect(graph.reachableFromPath.get('border.default')).toEqual(
      new Set(['border.default', 'color.fg', 'color.palette.brand', 'color.palette.neutral.0']),
    );
  });

  it('connectedAxes mediated by composite partialAliasOf transitivity', () => {
    // Axis A writes only the composite token; axis B writes the
    // terminal node of A's transitive partialAliasOf chain. Without
    // transitive expansion, A and B classify as disconnected and the
    // probe silently skips a real joint divergence. With transitivity,
    // A's axisReach includes the terminal node and B intersects.
    const axes: Axis[] = [
      { name: 'theme', contexts: ['light', 'dark'], default: 'light', source: 'resolver' },
      { name: 'brand', contexts: ['default', 'a'], default: 'default', source: 'resolver' },
    ];
    const baseline: TokenMap = {
      'border.default': {
        $type: 'border',
        $value: {
          color: '#000',
          width: { value: 1, unit: 'px' },
          style: 'solid',
        },
        partialAliasOf: { color: 'color.fg' },
      } as never,
      'color.fg': {
        $type: 'color',
        $value: { colorSpace: 'srgb', components: [0, 0, 0] },
        aliasOf: 'color.palette.brand',
        aliasChain: ['color.palette.brand'],
      } as never,
      'color.palette.brand': {
        $type: 'color',
        $value: { colorSpace: 'srgb', components: [0, 0, 0] },
      },
    };
    const resolverModifiers = {
      theme: {
        default: 'light',
        contexts: {
          light: [],
          dark: [
            {
              border: {
                $type: 'border',
                default: {
                  $value: {
                    color: '#fff',
                    width: { value: 1, unit: 'px' },
                    style: 'solid',
                  },
                },
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
                  brand: { $value: { colorSpace: 'srgb', components: [0.3, 0, 0.5] } },
                },
              },
            },
          ],
        },
      },
    };
    const graph = buildAliasGraph({ axes, resolverModifiers, baseline });
    expect(graph.connectedAxes.get('theme')?.has('brand')).toBe(true);
    expect(graph.connectedAxes.get('brand')?.has('theme')).toBe(true);
  });

  it('reachableFromPath handles cyclic partialAliasOf without infinite recursion', () => {
    // Synthetic cycle: A.partialAliasOf → B, B.partialAliasOf → A.
    // Should terminate via reach-set dedup; both paths' reach sets
    // converge to {A, B}.
    const baseline: TokenMap = {
      'border.a': {
        $type: 'border',
        $value: { color: '#000', width: { value: 1, unit: 'px' }, style: 'solid' },
        partialAliasOf: { color: 'border.b' },
      } as never,
      'border.b': {
        $type: 'border',
        $value: { color: '#000', width: { value: 1, unit: 'px' }, style: 'solid' },
        partialAliasOf: { color: 'border.a' },
      } as never,
    };
    const graph = buildAliasGraph({ axes: [], resolverModifiers: {}, baseline });
    expect(graph.reachableFromPath.get('border.a')).toEqual(new Set(['border.a', 'border.b']));
    expect(graph.reachableFromPath.get('border.b')).toEqual(new Set(['border.a', 'border.b']));
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

  it('isAxisComboConnected rejects combos with a fully-isolated axis', () => {
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
    // All three: density has no edge at all — BFS from mode reaches
    // {mode, brand} but never density. The combo is rejected.
    expect(isAxisComboConnected(graph, axes)).toBe(false);
  });

  it('isAxisComboConnected rejects combos spanning disjoint clusters', () => {
    // 4 axes in two disjoint clusters:
    //   {mode, brand} share `color.bg`.
    //   {density, motion} share `dimension.md`.
    //   No edges between clusters.
    // Combo of all four: every axis has an in-combo partner, but the
    // induced subgraph has two components. The probe can't produce a
    // joint divergence here — a tuple `{mode, brand, density, motion}`
    // is the cross-product of two independent groups whose value sets
    // never interact. Strict-component test correctly rejects.
    const axes: Axis[] = [
      { name: 'mode', contexts: ['light', 'dark'], default: 'light', source: 'resolver' },
      { name: 'brand', contexts: ['default', 'a'], default: 'default', source: 'resolver' },
      {
        name: 'density',
        contexts: ['comfortable', 'compact'],
        default: 'comfortable',
        source: 'resolver',
      },
      { name: 'motion', contexts: ['normal', 'fast'], default: 'normal', source: 'resolver' },
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
      motion: {
        default: 'normal',
        contexts: {
          normal: [],
          fast: [
            {
              dimension: {
                $type: 'dimension',
                md: { $value: { value: 8, unit: 'px' } },
              },
            },
          ],
        },
      },
    };
    const graph = buildAliasGraph({ axes, resolverModifiers, baseline: {} });

    // Sub-clusters are connected on their own.
    expect(isAxisComboConnected(graph, [axes[0]!, axes[1]!])).toBe(true);
    expect(isAxisComboConnected(graph, [axes[2]!, axes[3]!])).toBe(true);
    // Cross-cluster pairs disconnected.
    expect(isAxisComboConnected(graph, [axes[0]!, axes[2]!])).toBe(false);
    // Full combo: two components — strict test rejects.
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

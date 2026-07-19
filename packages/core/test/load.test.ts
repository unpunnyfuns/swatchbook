import { dirname } from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';
import { resolverPath, tokensDir } from '@unpunnyfuns/swatchbook-tokens';
import { loadProject } from '#/load.ts';
import type { Project } from '#/types.ts';

const fixtureCwd = dirname(tokensDir);

describe('loadProject — resolver mode', () => {
  let project: Project;

  // beforeAll: loadProject runs the parser + resolver evaluation against
  // the full fixture once (~1s); per-test reload would dominate runtime.
  beforeAll(async () => {
    project = await loadProject(
      {
        tokens: ['tokens/**/*.json'],
        resolver: resolverPath,
        default: { mode: 'Light', brand: 'Default', a11y: 'Normal' },
      },
      fixtureCwd,
    );
  }, 30_000);

  it('enumerates singletons only — default tuple + one per `(axis, non-default-context)`', () => {
    // Bounded by `Σ(axes × contexts)`, independent of the cartesian
    // product. For the reference fixture (mode ×2, brand ×2, typography
    // ×3, a11y ×2): 1 default + (1 + 1 + 2 + 1) non-default ctx = 6 singletons.
    const expected = 1 + project.axes.reduce((acc, a) => acc + (a.contexts.length - 1), 0);
    expect(expected).toBe(6);
    // Graph records every context for each axis.
    for (const axis of project.axes) {
      for (const ctx of axis.contexts) {
        expect(project.tokenGraph.axisContexts[axis.name]).toContain(ctx);
      }
    }
    expect(Object.keys(project.defaultTokens).length).toBeGreaterThan(100);
  });

  it('serves defaultTokens in the slim SwatchbookToken shape, not raw TokenNormalized', () => {
    // defaultTokens flows through the graph-backed resolveAt, so it must not
    // leak the resolver's internal fields the SwatchbookToken contract omits.
    const leaked = ['id', 'source', 'originalValue', 'mode', 'group', '$extensions'];
    for (const [path, token] of Object.entries(project.defaultTokens)) {
      for (const field of leaked) {
        expect(token, `${path} leaked ${field}`).not.toHaveProperty(field);
      }
    }
  });

  it('surfaces resolver modifiers as independent axes', () => {
    expect(project.axes).toEqual([
      {
        name: 'mode',
        contexts: ['Light', 'Dark'],
        default: 'Light',
        description: 'Light/dark surface + text baseline.',
        source: 'resolver',
      },
      {
        name: 'brand',
        contexts: ['Default', 'ACME'],
        default: 'Default',
        description:
          'Accent palette. `Default` leaves the baseline alone; `ACME` overrides the accent scale.',
        source: 'resolver',
      },
      {
        name: 'typography',
        contexts: ['Sans', 'Mono', 'Comic'],
        default: 'Sans',
        description:
          'Type-family axis. `Sans` leaves the baseline alone; `Mono` and `Comic` swap the proportional base family.',
        source: 'resolver',
      },
      {
        name: 'a11y',
        contexts: ['Normal', 'High-contrast'],
        default: 'Normal',
        description:
          'Border + focus emphasis + base weight. `Normal` leaves the baseline alone; `High-contrast` thickens borders, boosts the focus ring, and bumps the base font weight. The font-family stays whatever the `typography` modifier set.',
        source: 'resolver',
      },
    ]);
  });

  it('resolveAt composes any tuple from the token graph — no listPermutations needed', () => {
    const light = project.resolveAt({ mode: 'Light', brand: 'Default', a11y: 'Normal' });
    const accentBg = light['color.accent.bg'];
    expect(accentBg).toBeDefined();
    expect(accentBg?.$type).toBe('color');
  });

  it('produces different surface values for Light vs Dark at the same brand', () => {
    const light = project.resolveAt({ mode: 'Light', brand: 'Default', a11y: 'Normal' })[
      'color.surface.default'
    ];
    const dark = project.resolveAt({ mode: 'Dark', brand: 'Default', a11y: 'Normal' })[
      'color.surface.default'
    ];
    expect(light).toBeDefined();
    expect(dark).toBeDefined();
    expect(JSON.stringify(light?.$value)).not.toEqual(JSON.stringify(dark?.$value));
  });
});

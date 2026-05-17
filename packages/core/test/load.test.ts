import { dirname } from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';
import { resolverPath, tokensDir } from '@unpunnyfuns/swatchbook-tokens';
import { loadProject } from '#/load';
import type { Project } from '#/types';

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
        default: { mode: 'Light', brand: 'Default', contrast: 'Normal' },
      },
      fixtureCwd,
    );
  }, 30_000);

  it('enumerates singletons only — default tuple + one per `(axis, non-default-context)`', () => {
    // Bounded by `Σ(axes × contexts)`, independent of the cartesian
    // product. For the reference fixture (3 axes × 2 contexts each):
    // 1 default + 3 axes × 1 non-default ctx = 4 singletons.
    expect(project.permutations.map((t) => t.name).toSorted()).toEqual(
      [
        'Light · Default · Normal',
        'Dark · Default · Normal',
        'Light · Brand A · Normal',
        'Light · Default · High',
      ].toSorted(),
    );
    expect(Object.keys(project.graph).length).toBeGreaterThan(100);
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
        contexts: ['Default', 'Brand A'],
        default: 'Default',
        description:
          'Accent palette. `Default` leaves the baseline alone; `Brand A` overrides the accent scale.',
        source: 'resolver',
      },
      {
        name: 'contrast',
        contexts: ['Normal', 'High'],
        default: 'Normal',
        description:
          'Border + focus emphasis. `Normal` leaves the baseline alone; `High` thickens borders and boosts the focus ring.',
        source: 'resolver',
      },
    ]);
  });

  it('resolveAt composes any tuple from cells + jointOverrides — no listPermutations needed', () => {
    const light = project.resolveAt({ mode: 'Light', brand: 'Default', contrast: 'Normal' });
    const accentBg = light['color.accent.bg'];
    expect(accentBg).toBeDefined();
    expect(accentBg?.$type).toBe('color');
  });

  it('produces different surface values for Light vs Dark at the same brand', () => {
    const light = project.resolveAt({ mode: 'Light', brand: 'Default', contrast: 'Normal' })[
      'color.surface.default'
    ];
    const dark = project.resolveAt({ mode: 'Dark', brand: 'Default', contrast: 'Normal' })[
      'color.surface.default'
    ];
    expect(light).toBeDefined();
    expect(dark).toBeDefined();
    expect(JSON.stringify(light?.$value)).not.toEqual(JSON.stringify(dark?.$value));
  });
});

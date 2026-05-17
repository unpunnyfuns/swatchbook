import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';
import { loadProject } from '#/load.ts';
import type { Config, Project } from '#/types.ts';

const here = dirname(fileURLToPath(import.meta.url));
const fixtureCwd = resolve(here, 'fixtures/layered');

function layeredConfig(overrides: Partial<Config> = {}): Config {
  return {
    tokens: ['base/*.json'],
    axes: [
      {
        name: 'mode',
        contexts: {
          Light: [],
          Dark: ['modes/dark.json'],
        },
        default: 'Light',
      },
      {
        name: 'brand',
        contexts: {
          Default: [],
          'Brand A': ['brands/brand-a.json'],
        },
        default: 'Default',
      },
    ],
    ...overrides,
  };
}

describe('loadProject — layered axes', () => {
  // beforeAll: every test below reads from the same layered fixture
  // project; per-test reload would re-parse the same files repeatedly.
  let project: Project;
  beforeAll(async () => {
    project = await loadProject(layeredConfig(), fixtureCwd);
  }, 30_000);

  it('surfaces axes[] as independent axes with source "layered"', () => {
    expect(project.axes).toEqual([
      {
        name: 'mode',
        contexts: ['Light', 'Dark'],
        default: 'Light',
        source: 'layered',
      },
      {
        name: 'brand',
        contexts: ['Default', 'Brand A'],
        default: 'Default',
        source: 'layered',
      },
    ]);
  });

  it('cells per (axis, context) cover every singleton tuple', () => {
    // Singleton enumeration: default tuple + Σ(contexts - 1) per-axis
    // non-default singletons. For mode (Light, Dark) × brand (Default,
    // Brand A) that's 1 + 1 + 1 = 3 singletons; the joint Dark · Brand A
    // tuple is not materialized — composeAt produces it from per-axis cells.
    for (const axis of project.axes) {
      for (const ctx of axis.contexts) {
        expect(project.cells[axis.name]?.[ctx]).toBeDefined();
      }
    }
  });

  it('default tokens reflect the axis-defaults baseline', () => {
    expect(project.defaultTokens['color.surface']?.$value).toMatchObject({
      components: [1, 1, 1],
    });
  });

  it('applies overlay layers in order — last write wins on same path (mode=Dark)', () => {
    const dark = project.resolveAt({ mode: 'Dark', brand: 'Default' });
    expect(dark['color.surface']?.$value).toMatchObject({ components: [0, 0, 0] });
    expect(dark['color.text']?.$value).toMatchObject({ components: [1, 1, 1] });
    expect(dark['color.accent']?.$value).toMatchObject({ components: [0.1, 0.3, 0.9] });
  });

  it('brand overlay overrides sys.accent while leaving surface alone', () => {
    const brand = project.resolveAt({ mode: 'Light', brand: 'Brand A' });
    expect(brand['color.accent']?.$value).toMatchObject({ components: [0.9, 0.2, 0.2] });
    expect(brand['color.surface']?.$value).toMatchObject({ components: [1, 1, 1] });
  });

  it('multi-axis tuples compose via resolveAt over per-axis cells (Dark + Brand A)', async () => {
    // The joint Dark · Brand A tuple isn't materialized in
    // permutationsResolved — composeAt projects mode=Dark + brand=BrandA
    // cells over the baseline. Last-axis-wins on the same path means
    // brand's accent overrides what mode would've passed through.
    const tokens = project.resolveAt({ mode: 'Dark', brand: 'Brand A' });
    expect(tokens['color.surface']?.$value).toMatchObject({ components: [0, 0, 0] });
    expect(tokens['color.accent']?.$value).toMatchObject({ components: [0.9, 0.2, 0.2] });
  });

  it('empty context arrays are legal (no-override case)', async () => {
    const config: Config = {
      tokens: ['base/*.json'],
      axes: [
        {
          name: 'brand',
          contexts: { Default: [], 'Brand A': ['brands/brand-a.json'] },
          default: 'Default',
        },
      ],
    };
    const p = await loadProject(config, fixtureCwd);
    expect(Object.keys(p.cells['brand'] ?? {}).toSorted()).toEqual(['Brand A', 'Default']);
    expect(p.defaultTokens['color.accent']?.$value).toMatchObject({
      components: [0.1, 0.3, 0.9],
    });
  });
});


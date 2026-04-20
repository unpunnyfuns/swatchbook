import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { loadProject, resolveTheme } from '#/load.ts';
import type { Config } from '#/types.ts';

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
  it('surfaces axes[] as independent axes with source "layered"', async () => {
    const project = await loadProject(layeredConfig(), fixtureCwd);
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

  it('enumerates the cartesian product of mode × brand', async () => {
    const project = await loadProject(layeredConfig(), fixtureCwd);
    expect(project.themes.map((t) => t.name)).toEqual([
      'Light · Default',
      'Light · Brand A',
      'Dark · Default',
      'Dark · Brand A',
    ]);
  });

  it('default theme is the tuple of axis defaults', async () => {
    const project = await loadProject(layeredConfig(), fixtureCwd);
    expect(project.themesResolved['Light · Default']).toBeDefined();
    const def = resolveTheme(project, 'Light · Default').tokens;
    expect(def['color.surface']?.$value).toMatchObject({ components: [1, 1, 1] });
  });

  it('applies overlay layers in order — last write wins on same path', async () => {
    const project = await loadProject(layeredConfig(), fixtureCwd);
    const dark = resolveTheme(project, 'Dark · Default').tokens;
    expect(dark['color.surface']?.$value).toMatchObject({ components: [0, 0, 0] });
    expect(dark['color.text']?.$value).toMatchObject({ components: [1, 1, 1] });
    expect(dark['color.accent']?.$value).toMatchObject({ components: [0.1, 0.3, 0.9] });
  });

  it('brand overlay overrides sys.accent while leaving surface alone', async () => {
    const project = await loadProject(layeredConfig(), fixtureCwd);
    const brand = resolveTheme(project, 'Light · Brand A').tokens;
    expect(brand['color.accent']?.$value).toMatchObject({ components: [0.9, 0.2, 0.2] });
    expect(brand['color.surface']?.$value).toMatchObject({ components: [1, 1, 1] });
  });

  it('multi-axis overlays compose (Dark + Brand A)', async () => {
    const project = await loadProject(layeredConfig(), fixtureCwd);
    const tokens = resolveTheme(project, 'Dark · Brand A').tokens;
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
    const project = await loadProject(config, fixtureCwd);
    expect(project.themes.map((t) => t.name).toSorted()).toEqual(['Brand A', 'Default']);
    const def = resolveTheme(project, 'Default').tokens;
    expect(def['color.accent']?.$value).toMatchObject({ components: [0.1, 0.3, 0.9] });
  });
});

describe('loadProject — config validation', () => {
  it('throws when both resolver and axes are set', async () => {
    const config = {
      tokens: ['base/*.json'],
      resolver: 'resolver.json',
      axes: [{ name: 'mode', contexts: { Light: [] }, default: 'Light' }],
    } satisfies Config;
    await expect(loadProject(config, fixtureCwd)).rejects.toThrow(
      /either `resolver` or `axes`, not both/,
    );
  });

  it('accepts a tokens-only config and synthesizes a single theme axis', async () => {
    const project = await loadProject({ tokens: ['base/*.json'] }, fixtureCwd);
    expect(project.axes).toEqual([
      { name: 'theme', contexts: ['default'], default: 'default', source: 'synthetic' },
    ]);
    expect(project.themes.map((t) => t.name)).toEqual(['default']);
  });
});

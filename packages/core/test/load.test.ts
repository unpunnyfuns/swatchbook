import { dirname } from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';
import { resolverPath, tokensDir } from '@unpunnyfuns/swatchbook-tokens-reference';
import { loadProject, resolveTheme } from '#/load';
import type { Project } from '#/types';

const fixtureCwd = dirname(tokensDir);

const LAYER_SETS = {
  common: ['tokens/ref/**/*.json', 'tokens/sys/**/*.json', 'tokens/cmp/**/*.json'],
};

describe('loadProject — layered mode', () => {
  let project: Project;

  beforeAll(async () => {
    project = await loadProject(
      {
        tokens: ['tokens/**/*.json'],
        themes: [
          { name: 'Light', layers: [...LAYER_SETS.common, 'tokens/themes/light.json'] },
          { name: 'Dark', layers: [...LAYER_SETS.common, 'tokens/themes/dark.json'] },
        ],
        default: 'Light',
      },
      fixtureCwd,
    );
  }, 30_000);

  it('loads the explicit themes in order', () => {
    expect(project.themes.map((t) => t.name)).toEqual(['Light', 'Dark']);
    expect(project.themes[0]?.sources.length).toBeGreaterThan(10);
    expect(Object.keys(project.graph).length).toBeGreaterThan(100);
  });

  it('resolves deep alias chains (cmp → sys → ref)', () => {
    const light = resolveTheme(project, 'Light').tokens;
    const buttonBg = light['cmp.button.bg'];
    expect(buttonBg).toBeDefined();
    expect(buttonBg?.$type).toBe('color');
  });

  it('produces different surface values for Light vs Dark', () => {
    const light = resolveTheme(project, 'Light').tokens['color.sys.surface.default'];
    const dark = resolveTheme(project, 'Dark').tokens['color.sys.surface.default'];
    expect(light).toBeDefined();
    expect(dark).toBeDefined();
    expect(JSON.stringify(light?.$value)).not.toEqual(JSON.stringify(dark?.$value));
  });

  it('throws on unknown theme name', () => {
    expect(() => resolveTheme(project, 'Nope')).toThrow(/unknown theme/i);
  });
});

describe('loadProject — resolver mode', () => {
  it('enumerates the full permutation cross-product from the DTCG resolver', async () => {
    const project = await loadProject(
      { tokens: ['tokens/**/*.json'], resolver: resolverPath },
      fixtureCwd,
    );
    // appearance (3) × brand (2) = 6 permutations
    expect(project.themes).toHaveLength(6);
  });
});

describe('loadProject — validation', () => {
  it('throws when no theming input is set', async () => {
    await expect(loadProject({ tokens: [] } as never, fixtureCwd)).rejects.toThrow(
      /must specify one of/,
    );
  });

  it('throws when multiple theming inputs are set', async () => {
    await expect(
      loadProject(
        {
          tokens: [],
          themes: [{ name: 'x', layers: [] }],
          resolver: 'r.json',
        } as never,
        fixtureCwd,
      ),
    ).rejects.toThrow(/exactly one theming input/);
  });
});

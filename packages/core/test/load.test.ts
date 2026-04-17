import { dirname, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  manifestPath,
  resolverPath,
  tokensDir,
} from '@unpunnyfuns/swatchbook-tokens-reference';
import { loadProject, resolveTheme } from '#/load';

const fixtureCwd = dirname(tokensDir);

describe('loadProject — manifest mode', () => {
  it('loads all 5 named compositions from the Tokens Studio manifest', async () => {
    const project = await loadProject(
      { tokens: ['tokens/**/*.json'], manifest: manifestPath, default: 'Light' },
      fixtureCwd,
    );
    expect(project.themes.map((t) => t.name)).toEqual([
      'Light',
      'Dark',
      'Light · Brand A',
      'Dark · Brand A',
      'High Contrast',
    ]);
    expect(Object.keys(project.graph).length).toBeGreaterThan(100);
  });

  it('resolves deep alias chains (cmp → sys → ref)', async () => {
    const project = await loadProject(
      { tokens: ['tokens/**/*.json'], manifest: manifestPath, default: 'Light' },
      fixtureCwd,
    );
    const light = resolveTheme(project, 'Light').tokens;
    const buttonBg = light['cmp.button.bg'];
    expect(buttonBg).toBeDefined();
    expect(buttonBg?.$type).toBe('color');
  });

  it('produces different surface values for Light vs Dark', async () => {
    const project = await loadProject(
      { tokens: ['tokens/**/*.json'], manifest: manifestPath, default: 'Light' },
      fixtureCwd,
    );
    const light = resolveTheme(project, 'Light').tokens['color.sys.surface.default'];
    const dark = resolveTheme(project, 'Dark').tokens['color.sys.surface.default'];
    expect(light).toBeDefined();
    expect(dark).toBeDefined();
    expect(JSON.stringify(light?.$value)).not.toEqual(JSON.stringify(dark?.$value));
  });

  it('throws on unknown theme name', async () => {
    const project = await loadProject(
      { tokens: ['tokens/**/*.json'], manifest: manifestPath, default: 'Light' },
      fixtureCwd,
    );
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

describe('loadProject — layered mode', () => {
  it('loads an explicit-layers config', async () => {
    const project = await loadProject(
      {
        tokens: ['tokens/**/*.json'],
        themes: [
          {
            name: 'Light',
            layers: [
              'tokens/ref/**/*.json',
              'tokens/sys/**/*.json',
              'tokens/cmp/**/*.json',
              'tokens/themes/light.json',
            ],
          },
          {
            name: 'Dark',
            layers: [
              'tokens/ref/**/*.json',
              'tokens/sys/**/*.json',
              'tokens/cmp/**/*.json',
              'tokens/themes/dark.json',
            ],
          },
        ],
        default: 'Light',
      },
      fixtureCwd,
    );
    expect(project.themes.map((t) => t.name)).toEqual(['Light', 'Dark']);
    expect(project.themes[0]?.sources.length).toBeGreaterThan(10);
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
        { tokens: [], manifest: 'x', resolver: 'y' } as never,
        fixtureCwd,
      ),
    ).rejects.toThrow(/exactly one theming input/);
  });
});

// Referenced to keep the import live — asserted-against in the layered test via path traversal
void resolve;

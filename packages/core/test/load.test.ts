import { dirname } from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';
import { resolverPath, tokensDir } from '@unpunnyfuns/swatchbook-tokens-reference';
import { loadProject, resolveTheme } from '#/load';
import type { Project } from '#/types';

const fixtureCwd = dirname(tokensDir);

describe('loadProject — resolver mode', () => {
  let project: Project;

  beforeAll(async () => {
    project = await loadProject(
      { tokens: ['tokens/**/*.json'], resolver: resolverPath, default: 'Light · Default' },
      fixtureCwd,
    );
  }, 30_000);

  it('enumerates the cartesian product of mode × brand', () => {
    expect(project.themes.map((t) => t.name)).toEqual([
      'Light · Default',
      'Dark · Default',
      'Light · Brand A',
      'Dark · Brand A',
    ]);
    expect(Object.keys(project.graph).length).toBeGreaterThan(100);
  });

  it('resolves deep alias chains (cmp → sys → ref)', () => {
    const light = resolveTheme(project, 'Light · Default').tokens;
    const buttonBg = light['cmp.button.bg'];
    expect(buttonBg).toBeDefined();
    expect(buttonBg?.$type).toBe('color');
  });

  it('produces different surface values for Light vs Dark at the same brand', () => {
    const light = resolveTheme(project, 'Light · Default').tokens['color.sys.surface.default'];
    const dark = resolveTheme(project, 'Dark · Default').tokens['color.sys.surface.default'];
    expect(light).toBeDefined();
    expect(dark).toBeDefined();
    expect(JSON.stringify(light?.$value)).not.toEqual(JSON.stringify(dark?.$value));
  });

  it('throws on unknown theme name', () => {
    expect(() => resolveTheme(project, 'Nope')).toThrow(/unknown theme/i);
  });
});

describe('loadProject — validation', () => {
  it('throws when resolver is not set', async () => {
    await expect(loadProject({ tokens: [] } as never, fixtureCwd)).rejects.toThrow(
      /must specify `resolver`/,
    );
  });
});

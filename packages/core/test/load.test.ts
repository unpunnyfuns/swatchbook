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
      {
        tokens: ['tokens/**/*.json'],
        resolver: resolverPath,
        default: { mode: 'Light', brand: 'Default', contrast: 'Normal' },
      },
      fixtureCwd,
    );
  }, 30_000);

  it('enumerates the cartesian product of mode × brand × contrast', () => {
    expect(project.themes.map((t) => t.name)).toEqual([
      'Light · Default · Normal',
      'Dark · Default · Normal',
      'Light · Brand A · Normal',
      'Dark · Brand A · Normal',
      'Light · Default · High',
      'Dark · Default · High',
      'Light · Brand A · High',
      'Dark · Brand A · High',
    ]);
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

  it('cartesian product of axis contexts matches the theme count', () => {
    const cartesian = project.axes.reduce((n, axis) => n * axis.contexts.length, 1);
    expect(project.themes.length).toBe(cartesian);
  });

  it('resolves alias chains (sys → ref)', () => {
    const light = resolveTheme(project, 'Light · Default · Normal').tokens;
    const accentBg = light['color.accent.bg'];
    expect(accentBg).toBeDefined();
    expect(accentBg?.$type).toBe('color');
  });

  it('produces different surface values for Light vs Dark at the same brand', () => {
    const light = resolveTheme(project, 'Light · Default · Normal').tokens['color.surface.default'];
    const dark = resolveTheme(project, 'Dark · Default · Normal').tokens['color.surface.default'];
    expect(light).toBeDefined();
    expect(dark).toBeDefined();
    expect(JSON.stringify(light?.$value)).not.toEqual(JSON.stringify(dark?.$value));
  });

  it('throws on unknown theme name', () => {
    expect(() => resolveTheme(project, 'Nope')).toThrow(/unknown theme/i);
  });
});

describe('loadProject — validation', () => {
  it('throws when both `resolver` and `axes` are set', async () => {
    await expect(
      loadProject(
        {
          tokens: [],
          resolver: resolverPath,
          axes: [{ name: 'mode', contexts: { Light: [] }, default: 'Light' }],
        },
        fixtureCwd,
      ),
    ).rejects.toThrow(/either `resolver` or `axes`, not both/);
  });
});

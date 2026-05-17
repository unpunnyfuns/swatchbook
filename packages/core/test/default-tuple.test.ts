import { describe, expect, it } from 'vitest';
import { resolverPath } from '@unpunnyfuns/swatchbook-tokens';
import { loadProject } from '#/load';
import { fixtureCwd } from './_helpers';

// Under singleton enumeration, only the axes-defaults tuple and per-axis
// non-default singletons land in `permutationsResolved`. Joint default
// tuples (e.g. `{Dark, BrandA, High}`) are resolved on the side for
// `project.graph` but not grafted into the map (would break the
// `keys == permutations.map(name)` invariant). Tests compare via
// `resolveAt(project.defaultTuple)` which is the load-time-built
// composer over cells + joint overrides — the public way to get the
// TokenMap at any tuple.
describe('Config.default tuple resolution', () => {
  it('sets the starting tuple when every axis is specified', async () => {
    const project = await loadProject(
      {
        tokens: ['tokens/**/*.json'],
        resolver: resolverPath,
        default: { mode: 'Dark', brand: 'Brand A', contrast: 'High' },
      },
      fixtureCwd,
    );
    // `Project.defaultTuple` is the axis-defaults baseline that
    // `cells` / `resolveAt` are built against — always the axes' own
    // defaults, independent of `config.default`. `config.default` only
    // steers `project.graph`.
    expect(project.defaultTuple).toEqual({ mode: 'Light', brand: 'Default', contrast: 'Normal' });
    expect(Object.keys(project.graph).length).toBeGreaterThan(0);
  });

  it("fills omitted axes from each axis's own default", async () => {
    const project = await loadProject(
      {
        tokens: ['tokens/**/*.json'],
        resolver: resolverPath,
        default: { mode: 'Dark' },
      },
      fixtureCwd,
    );
    expect(project.graph).toBe(project.permutationsResolved['Dark · Default · Normal']);
  });

  it('resolves to the all-axis-defaults tuple when default is absent', async () => {
    const project = await loadProject(
      { tokens: ['tokens/**/*.json'], resolver: resolverPath },
      fixtureCwd,
    );
    expect(project.graph).toBe(project.permutationsResolved['Light · Default · Normal']);
  });

  it('drops unknown axis keys with a warn diagnostic and falls back to the axis default', async () => {
    const project = await loadProject(
      {
        tokens: ['tokens/**/*.json'],
        resolver: resolverPath,
        default: { mode: 'Dark', notAnAxis: 'Whatever' },
      },
      fixtureCwd,
    );
    const warn = project.diagnostics.find(
      (d) => d.group === 'swatchbook/default' && d.message.includes('notAnAxis'),
    );
    expect(warn?.severity).toBe('warn');
    expect(project.graph).toBe(project.permutationsResolved['Dark · Default · Normal']);
  });

  it('drops invalid context values with a warn diagnostic and falls back to the axis default', async () => {
    const project = await loadProject(
      {
        tokens: ['tokens/**/*.json'],
        resolver: resolverPath,
        default: { mode: 'NopeMode' },
      },
      fixtureCwd,
    );
    const warn = project.diagnostics.find(
      (d) => d.group === 'swatchbook/default' && d.message.includes('NopeMode'),
    );
    expect(warn?.severity).toBe('warn');
    expect(project.graph).toBe(project.permutationsResolved['Light · Default · Normal']);
  });
});

import { describe, expect, it } from 'vitest';
import { resolverPath } from '@unpunnyfuns/swatchbook-tokens';
import { loadProject } from '#/load.ts';
import { fixtureCwd } from './_helpers';

// `Project.defaultTuple` is the axis-defaults baseline that `cells` /
// `resolveAt` are built against — always the axes' own defaults,
// independent of `config.default`. `config.default` only steers
// `project.defaultTokens`. Tests compare structurally via
// `project.resolveAt(tuple)` since there's no longer a per-tuple
// `permutationsResolved` map to identity-compare against.
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
    expect(project.defaultTuple).toEqual({ mode: 'Light', brand: 'Default', contrast: 'Normal' });
    expect(Object.keys(project.defaultTokens).length).toBeGreaterThan(0);
    // Structural equality with resolveAt at the user-specified default.
    const expected = project.resolveAt({ mode: 'Dark', brand: 'Brand A', contrast: 'High' });
    expect(Object.keys(project.defaultTokens).toSorted()).toEqual(Object.keys(expected).toSorted());
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
    const dark = project.resolveAt({ mode: 'Dark', brand: 'Default', contrast: 'Normal' });
    expect(project.defaultTokens['color.text.default']?.$value).toEqual(
      dark['color.text.default']?.$value,
    );
  });

  it('resolves to the all-axis-defaults tuple when default is absent', async () => {
    const project = await loadProject(
      { tokens: ['tokens/**/*.json'], resolver: resolverPath },
      fixtureCwd,
    );
    const light = project.resolveAt({ mode: 'Light', brand: 'Default', contrast: 'Normal' });
    expect(project.defaultTokens['color.text.default']?.$value).toEqual(
      light['color.text.default']?.$value,
    );
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
    const dark = project.resolveAt({ mode: 'Dark', brand: 'Default', contrast: 'Normal' });
    expect(project.defaultTokens['color.text.default']?.$value).toEqual(
      dark['color.text.default']?.$value,
    );
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
    const light = project.resolveAt({ mode: 'Light', brand: 'Default', contrast: 'Normal' });
    expect(project.defaultTokens['color.text.default']?.$value).toEqual(
      light['color.text.default']?.$value,
    );
  });
});

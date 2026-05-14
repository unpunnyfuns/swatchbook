import { describe, expect, it } from 'vitest';
import { resolverPath } from '@unpunnyfuns/swatchbook-tokens';
import { loadProject } from '#/load';
import { fixtureCwd } from './_helpers';

describe('maxPermutations guard', () => {
  it('loads the full cartesian product when the count is under the cap', async () => {
    const project = await loadProject(
      {
        resolver: resolverPath,
        default: { mode: 'Light', brand: 'Default', contrast: 'Normal' },
      },
      fixtureCwd,
    );
    expect(project.permutations.length).toBe(8);
    expect(project.diagnostics.filter((d) => d.group === 'swatchbook/permutations')).toHaveLength(
      0,
    );
  });

  it('loads only the default permutation when the cartesian exceeds the cap', async () => {
    // Reference fixture has 8 permutations; force the guard with cap=4.
    const project = await loadProject(
      {
        resolver: resolverPath,
        default: { mode: 'Light', brand: 'Default', contrast: 'Normal' },
        maxPermutations: 4,
      },
      fixtureCwd,
    );

    expect(project.permutations).toHaveLength(1);
    expect(project.permutations[0]?.name).toBe('Light · Default · Normal');
    expect(project.permutations[0]?.input).toEqual({
      mode: 'Light',
      brand: 'Default',
      contrast: 'Normal',
    });
    expect(Object.keys(project.permutationsResolved)).toEqual(['Light · Default · Normal']);

    const guard = project.diagnostics.find((d) => d.group === 'swatchbook/permutations');
    expect(guard?.severity).toBe('warn');
    expect(guard?.message).toMatch(/8 cartesian permutations/);
    expect(guard?.message).toMatch(/exceeds the `maxPermutations` guard \(4\)/);
  });

  it('disables the guard when maxPermutations is 0', async () => {
    const project = await loadProject(
      {
        resolver: resolverPath,
        default: { mode: 'Light', brand: 'Default', contrast: 'Normal' },
        maxPermutations: 0,
      },
      fixtureCwd,
    );
    expect(project.permutations.length).toBe(8);
    expect(project.diagnostics.filter((d) => d.group === 'swatchbook/permutations')).toHaveLength(
      0,
    );
  });

  it('materializes preset tuples on demand under the guard', async () => {
    // Cap at 4 forces the guard. Without preset materialization, only the
    // default permutation would be in permutationsResolved and clicking
    // the "Brand A Dark" preset pill would render the default's tokens.
    const project = await loadProject(
      {
        resolver: resolverPath,
        default: { mode: 'Light', brand: 'Default', contrast: 'Normal' },
        maxPermutations: 4,
        presets: [
          { name: 'Brand A Dark', axes: { mode: 'Dark', brand: 'Brand A' } },
          { name: 'A11y High', axes: { contrast: 'High' } },
        ],
      },
      fixtureCwd,
    );

    // Default + both preset tuples = 3 permutations resolved.
    expect(project.permutations.length).toBe(3);
    const names = project.permutations.map((p) => p.name).toSorted();
    expect(names).toEqual([
      'Dark · Brand A · Normal',
      'Light · Default · High',
      'Light · Default · Normal',
    ]);
    expect(project.permutationsResolved['Dark · Brand A · Normal']).toBeDefined();
    expect(project.permutationsResolved['Light · Default · High']).toBeDefined();

    // Guard still fires — only the default + presets are present, not
    // the full cartesian.
    expect(project.diagnostics.filter((d) => d.group === 'swatchbook/permutations')).toHaveLength(
      1,
    );
  });
});

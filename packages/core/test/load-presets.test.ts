import { dirname } from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';
import { resolverPath, tokensDir } from '@unpunnyfuns/swatchbook-tokens';
import { loadProject } from '#/load';
import type { Project } from '#/types';

const fixtureCwd = dirname(tokensDir);

describe('loadProject — presets', () => {
  let project: Project;

  // beforeAll: full loadProject against the fixture (~1s) is shared by
  // every assertion in this describe; per-test reload would dominate.
  beforeAll(async () => {
    project = await loadProject(
      {
        tokens: ['tokens/**/*.json'],
        resolver: resolverPath,
        default: { mode: 'Light', brand: 'Default', contrast: 'Normal' },
        presets: [
          { name: 'Brand A Dark', axes: { mode: 'Dark', brand: 'Brand A' } },
          { name: 'Default Light', axes: { mode: 'Light' } },
        ],
      },
      fixtureCwd,
    );
  }, 30_000);

  it('exposes validated presets on the project', () => {
    expect(project.presets).toEqual([
      { name: 'Brand A Dark', axes: { mode: 'Dark', brand: 'Brand A' } },
      { name: 'Default Light', axes: { mode: 'Light' } },
    ]);
  });

  it('defaults to an empty presets array when config.presets is absent', async () => {
    const p = await loadProject(
      {
        tokens: ['tokens/**/*.json'],
        resolver: resolverPath,
        default: { mode: 'Light', brand: 'Default' },
      },
      fixtureCwd,
    );
    expect(p.presets).toEqual([]);
  });
});

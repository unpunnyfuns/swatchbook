import { beforeAll, describe, expect, it } from 'vitest';
import { loadProject } from '#/load.ts';
import type { Project } from '#/types.ts';
import { fixtureCwd, layeredConfig } from './_load-layered-helpers.ts';

describe('loadProject — layered axes with disabledAxes', () => {
  // Regression for the disabledAxes + layered key mismatch: when brand is
  // disabled, applyDisabledAxes must re-key filteredResolved to the
  // filtered-axes-only shape so buildTokenGraphFromLayered can look up the
  // Dark singleton by permutationID({ mode: 'Dark' }) = "Dark" rather than
  // the original "Dark · Default" multi-axis key.
  let project: Project;
  beforeAll(async () => {
    project = await loadProject(layeredConfig({ disabledAxes: ['brand'] }), fixtureCwd);
  }, 30_000);

  it('brand axis is absent from project.axes after disabledAxes filter', () => {
    expect(project.axes.map((a) => a.name)).toEqual(['mode']);
    expect(project.disabledAxes).toEqual(['brand']);
  });

  it('Dark mode writes are correctly extracted — color.surface resolves to black', () => {
    const dark = project.resolveAt({ mode: 'Dark' });
    expect(dark['color.surface']?.$value).toMatchObject({ components: [0, 0, 0] });
  });

  it('default tuple resolves to the Light baseline', () => {
    expect(project.defaultTokens['color.surface']?.$value).toMatchObject({ components: [1, 1, 1] });
  });
});

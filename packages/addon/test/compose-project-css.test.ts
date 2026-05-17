// `composeProjectCss` is the plugin's emit-mode dispatch helper. The
// plugin defaults to `'projected'` and the addon documents that as the
// public default; these tests pin both that dispatch table and the
// observable shape difference between the two emitters at the fixture
// scale.
//
// Exported for tests only; not part of the public API.
import { dirname } from 'node:path';
import { loadProject } from '@unpunnyfuns/swatchbook-core';
import type { Project } from '@unpunnyfuns/swatchbook-core';
import { resolverPath } from '@unpunnyfuns/swatchbook-tokens';
import { beforeAll, expect, it } from 'vitest';
import { composeProjectCss } from '#/virtual/plugin.ts';

let fixtureProject: Project;

// `loadProject` for the reference fixture is ~1s. `beforeAll` is the
// documented perf-escape hatch for genuinely expensive shared setup;
// every test reads from the same project.
beforeAll(async () => {
  fixtureProject = await loadProject({ resolver: resolverPath }, dirname(resolverPath));
}, 30_000);

it("defaults to projected emit when no mode is passed (matches the addon's documented default)", () => {
  expect(composeProjectCss(fixtureProject)).toBe(composeProjectCss(fixtureProject, 'projected'));
});

it("mode='projected' routes through the smart axis-projected emitter — output is meaningfully smaller than cartesian for the fixture", () => {
  const projected = composeProjectCss(fixtureProject, 'projected');
  const cartesian = composeProjectCss(fixtureProject, 'cartesian');
  expect(projected.length).toBeLessThan(cartesian.length / 2);
});

it("mode='cartesian' fans every non-default tuple into a compound selector — the fixture's three axes × two contexts each produce the joint Dark+Brand A+High block", () => {
  const cartesian = composeProjectCss(fixtureProject, 'cartesian');
  expect(cartesian).toMatch(
    /\[data-swatch-mode="Dark"\]\[data-swatch-brand="Brand A"\]\[data-swatch-contrast="High"\]/,
  );
});

it('both modes terminate with a trailing newline and include the chrome alias block (shape parity at the tail)', () => {
  for (const mode of ['projected', 'cartesian'] as const) {
    const css = composeProjectCss(fixtureProject, mode);
    expect(css.endsWith('\n')).toBe(true);
    expect(css).toContain('--swatchbook-surface-default:');
  }
});

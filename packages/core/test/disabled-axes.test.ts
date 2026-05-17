import { dirname } from 'node:path';
import { beforeAll, expect, it } from 'vitest';
import { resolverPath, tokensDir } from '@unpunnyfuns/swatchbook-tokens';
import { emitAxisProjectedCss } from '#/css-axis-projected';
import { loadProject } from '#/load';
import { validateDisabledAxes } from '#/disabled-axes';
import type { Axis, Project } from '#/types';

const fixtureCwd = dirname(tokensDir);

const axes: Axis[] = [
  { name: 'mode', contexts: ['Light', 'Dark'], default: 'Light', source: 'resolver' },
  {
    name: 'brand',
    contexts: ['Default', 'Brand A'],
    default: 'Default',
    source: 'resolver',
  },
  {
    name: 'contrast',
    contexts: ['Normal', 'High'],
    default: 'Normal',
    source: 'resolver',
  },
];

it('validateDisabledAxes passes a known axis name through unchanged', () => {
  const { names, diagnostics } = validateDisabledAxes(['contrast'], axes);
  expect(names).toEqual(['contrast']);
  expect(diagnostics).toEqual([]);
});

it('validateDisabledAxes drops unknown names with a warn diagnostic', () => {
  const { names, diagnostics } = validateDisabledAxes(['contrast', 'density'], axes);
  expect(names).toEqual(['contrast']);
  expect(diagnostics).toHaveLength(1);
  expect(diagnostics[0]?.severity).toBe('warn');
  expect(diagnostics[0]?.group).toBe('swatchbook/disabled-axes');
  expect(diagnostics[0]?.message).toMatch(/unknown axis "density"/);
});

it('validateDisabledAxes dedupes repeated entries silently', () => {
  const { names, diagnostics } = validateDisabledAxes(['contrast', 'contrast'], axes);
  expect(names).toEqual(['contrast']);
  expect(diagnostics).toEqual([]);
});

it('validateDisabledAxes returns empty arrays when input is undefined', () => {
  const { names, diagnostics } = validateDisabledAxes(undefined, axes);
  expect(names).toEqual([]);
  expect(diagnostics).toEqual([]);
});

// beforeAll is a perf escape hatch: loadProject over the reference fixture
// takes ~1s; per-test reload would blow the default timeout. All `loadProject`
// specs below read from the same filtered project.
let project: Project;
let css: string;

beforeAll(async () => {
  project = await loadProject(
    {
      tokens: ['tokens/**/*.json'],
      resolver: resolverPath,
      disabledAxes: ['contrast'],
      default: { mode: 'Light', brand: 'Default' },
      cssVarPrefix: 'sb',
    },
    fixtureCwd,
  );
  css = emitAxisProjectedCss(project);
}, 30_000);

it('filters disabled axes out of Project.axes', () => {
  expect(project.axes.map((a) => a.name)).toEqual(['mode', 'brand']);
});

it('carries the filtered-out names on Project.disabledAxes', () => {
  expect(project.disabledAxes).toEqual(['contrast']);
});

it('drops the disabled axis from the project axes list and defaultTuple', () => {
  // Singleton enumeration over surviving axes: 1 default tuple + 1 per
  // non-default cell on each surviving axis (mode=Dark, brand=Brand A) = 3.
  expect(project.axes.map((a) => a.name)).not.toContain('contrast');
  expect(project.defaultTuple).not.toHaveProperty('contrast');
});

it('emits CSS with no data-contrast selectors', () => {
  expect(css).not.toMatch(/data-contrast/);
});

it('keeps cells keyed against the surviving axes only', () => {
  const cellAxes = Object.keys(project.cells).toSorted();
  const projectAxes = project.axes.map((a) => a.name).toSorted();
  expect(cellAxes).toEqual(projectAxes);
});

it('surfaces a warn diagnostic when disabledAxes references an unknown axis', async () => {
  const p = await loadProject(
    {
      tokens: ['tokens/**/*.json'],
      resolver: resolverPath,
      disabledAxes: ['contrast', 'density'],
      default: { mode: 'Light', brand: 'Default' },
    },
    fixtureCwd,
  );
  expect(p.disabledAxes).toEqual(['contrast']);
  const warn = p.diagnostics.find(
    (d) => d.group === 'swatchbook/disabled-axes' && d.severity === 'warn',
  );
  expect(warn).toBeDefined();
  expect(warn?.message).toMatch(/unknown axis "density"/);
});

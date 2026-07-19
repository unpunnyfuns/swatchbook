import { dirname } from 'node:path';
import { beforeAll, expect, it } from 'vitest';
import { resolverPath, tokensDir } from '@unpunnyfuns/swatchbook-tokens';
import { emitAxisProjectedCss } from '#/css-axis-projected.ts';
import { loadProject } from '#/load.ts';
import { validateDisabledAxes } from '#/disabled-axes.ts';
import type { Axis, Project } from '#/types.ts';

const fixtureCwd = dirname(tokensDir);

const axes: Axis[] = [
  { name: 'mode', contexts: ['Light', 'Dark'], default: 'Light', source: 'resolver' },
  {
    name: 'brand',
    contexts: ['Default', 'ACME'],
    default: 'Default',
    source: 'resolver',
  },
  {
    name: 'a11y',
    contexts: ['Normal', 'High-contrast'],
    default: 'Normal',
    source: 'resolver',
  },
];

it('validateDisabledAxes passes a known axis name through unchanged', () => {
  const { names, diagnostics } = validateDisabledAxes(['a11y'], axes);
  expect(names).toEqual(['a11y']);
  expect(diagnostics).toEqual([]);
});

it('validateDisabledAxes drops unknown names with a warn diagnostic', () => {
  const { names, diagnostics } = validateDisabledAxes(['a11y', 'density'], axes);
  expect(names).toEqual(['a11y']);
  expect(diagnostics).toHaveLength(1);
  expect(diagnostics[0]?.severity).toBe('warn');
  expect(diagnostics[0]?.group).toBe('swatchbook/disabled-axes');
  expect(diagnostics[0]?.message).toMatch(/unknown axis "density"/);
});

it('validateDisabledAxes dedupes repeated entries silently', () => {
  const { names, diagnostics } = validateDisabledAxes(['a11y', 'a11y'], axes);
  expect(names).toEqual(['a11y']);
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
      disabledAxes: ['a11y'],
      default: { mode: 'Light', brand: 'Default' },
      cssVarPrefix: 'sb',
    },
    fixtureCwd,
  );
  css = emitAxisProjectedCss(project);
}, 30_000);

it('filters disabled axes out of Project.axes', () => {
  expect(project.axes.map((a) => a.name)).toEqual(['mode', 'brand', 'typography']);
});

it('carries the filtered-out names on Project.disabledAxes', () => {
  expect(project.disabledAxes).toEqual(['a11y']);
});

it('drops the disabled axis from the project axes list and defaultTuple', () => {
  // Singleton enumeration over surviving axes: 1 default tuple + 1 per
  // non-default cell on each surviving axis (mode=Dark, brand=ACME,
  // typography=Mono/Comic).
  expect(project.axes.map((a) => a.name)).not.toContain('a11y');
  expect(project.defaultTuple).not.toHaveProperty('a11y');
});

it('emits CSS with no data-a11y selectors', () => {
  expect(css).not.toMatch(/data-a11y/);
});

it('keeps graph axisContexts keyed against the surviving axes only', () => {
  const graphAxes = Object.keys(project.tokenGraph.axisContexts).toSorted();
  const projectAxes = project.axes.map((a) => a.name).toSorted();
  expect(graphAxes).toEqual(projectAxes);
});

it('surfaces a warn diagnostic when disabledAxes references an unknown axis', async () => {
  const p = await loadProject(
    {
      tokens: ['tokens/**/*.json'],
      resolver: resolverPath,
      disabledAxes: ['a11y', 'density'],
      default: { mode: 'Light', brand: 'Default' },
    },
    fixtureCwd,
  );
  expect(p.disabledAxes).toEqual(['a11y']);
  const warn = p.diagnostics.find(
    (d) => d.group === 'swatchbook/disabled-axes' && d.severity === 'warn',
  );
  expect(warn).toBeDefined();
  expect(warn?.message).toMatch(/unknown axis "density"/);
});

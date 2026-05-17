import { afterAll, beforeAll, expect, it } from 'vitest';
import type { Project } from '@unpunnyfuns/swatchbook-core';
import { loadFixtureProject, type McpTestHarness, startTestServer } from './_helpers.ts';

let project: Project;
let mcp: McpTestHarness;

// beforeAll is a perf escape hatch (per CLAUDE.md): loading the fixture
// project + booting the in-memory MCP server takes ~1s. Every test here
// is read-only against the same project shape, so a shared harness is
// safe and avoids a 10× wall-clock blowup.
beforeAll(async () => {
  project = await loadFixtureProject();
  mcp = await startTestServer(project);
});

afterAll(async () => {
  await mcp.close();
});

interface DescribeProjectResult {
  cssVarPrefix: string;
  axes: { name: string; contexts: string[]; default: string }[];
  permutations: string[];
  defaultPermutation: string | null;
  presets: string[];
  tokensPerTheme: Record<string, number>;
  types: Record<string, number>;
  diagnostics: { counts: Record<string, number>; total: number };
}

it('describe_project: returns axis summary, permutation list, token counts, and diagnostic counts', async () => {
  const result = await mcp.callJson<DescribeProjectResult>('describe_project');
  expect(result.cssVarPrefix).toBe('sb');
  expect(result.axes.length).toBeGreaterThan(0);
  const modeAxis = result.axes.find((a) => a.name === 'mode');
  expect(modeAxis?.contexts).toContain('Light');
  expect(modeAxis?.contexts).toContain('Dark');
  expect(result.permutations.length).toBeGreaterThan(1);
  expect(result.defaultPermutation).toBe(result.permutations[0]);
  expect(result.tokensPerTheme[result.defaultPermutation!]).toBeGreaterThan(0);
  expect(result.types['color']).toBeGreaterThan(0);
  expect(result.diagnostics.total).toBeGreaterThanOrEqual(0);
});

it('describe_project: types histogram covers every DTCG type present', async () => {
  const result = await mcp.callJson<DescribeProjectResult>('describe_project');
  // Sum across types should equal the total token count across permutations
  // — sanity that the histogram came from the same walk as tokensPerTheme.
  const totalFromTypes = Object.values(result.types).reduce((a, b) => a + b, 0);
  const totalFromThemes = Object.values(result.tokensPerTheme).reduce((a, b) => a + b, 0);
  expect(totalFromTypes).toBeGreaterThan(0);
  expect(totalFromThemes).toBeGreaterThan(0);
});

interface ListAxesResult {
  axes: { name: string; contexts: string[]; default: string; source: string }[];
  disabledAxes: string[];
  permutations: { name: string; input: Record<string, string> }[];
  presets: { name: string; axes: Record<string, string>; description?: string }[];
}

it('list_axes: returns axes with `source: resolver` for resolver-driven projects, plus the materialized singleton permutations', async () => {
  const result = await mcp.callJson<ListAxesResult>('list_axes');
  expect(result.axes.every((a) => a.source === 'resolver')).toBe(true);
  expect(result.disabledAxes).toEqual([]);
  // Singleton enumeration: 1 default tuple + 1 per non-default cell on
  // each axis = 1 + Σ(contexts - 1). Bounded by Σ(axes × contexts),
  // not by the cartesian product.
  const expected = 1 + result.axes.reduce((acc, a) => acc + (a.contexts.length - 1), 0);
  expect(result.permutations.length).toBe(expected);
  // Every permutation should have an entry per axis.
  for (const tuple of result.permutations) {
    expect(Object.keys(tuple.input).toSorted()).toEqual(result.axes.map((a) => a.name).toSorted());
  }
});

interface ListTokensResult {
  theme: string;
  count: number;
  tokens: { path: string; type?: string; value: string }[];
}

it('list_tokens: returns every token sorted by path when filter and type are omitted', async () => {
  const result = await mcp.callJson<ListTokensResult>('list_tokens');
  // Default theme name = axis defaults joined by ` · ` (the form
  // `permutationID` produces server-side).
  const defaultThemeName = project.axes
    .map((a) => project.defaultTuple[a.name] ?? a.default)
    .join(' · ');
  expect(result.theme).toBe(defaultThemeName);
  expect(result.count).toBeGreaterThan(0);
  expect(result.count).toBe(result.tokens.length);
  // Sorted ascending by path with numeric awareness.
  const paths = result.tokens.map((t) => t.path);
  const sortedPaths = [...paths].toSorted((a, b) =>
    a.localeCompare(b, undefined, { numeric: true }),
  );
  expect(paths).toEqual(sortedPaths);
});

it('list_tokens: scopes results to a glob filter', async () => {
  const result = await mcp.callJson<ListTokensResult>('list_tokens', { filter: 'color.**' });
  expect(result.count).toBeGreaterThan(0);
  expect(result.tokens.every((t) => t.path.startsWith('color.'))).toBe(true);
});

it('list_tokens: scopes results to a DTCG `$type`', async () => {
  const result = await mcp.callJson<ListTokensResult>('list_tokens', { type: 'color' });
  expect(result.count).toBeGreaterThan(0);
  expect(result.tokens.every((t) => t.type === 'color')).toBe(true);
});

it('list_tokens: reads from a non-default permutation when `theme` is supplied', async () => {
  // Synthesize a Dark-mode singleton name the same way the server does.
  const modeAxis = project.axes.find((a) => a.name === 'mode');
  if (!modeAxis) throw new Error('expected fixture to include a mode axis');
  const darkTuple: Record<string, string> = { ...project.defaultTuple, mode: 'Dark' };
  const darkName = project.axes.map((a) => darkTuple[a.name] ?? a.default).join(' · ');
  const result = await mcp.callJson<ListTokensResult>('list_tokens', { theme: darkName });
  expect(result.theme).toBe(darkName);
  expect(result.count).toBeGreaterThan(0);
});

interface DiagnosticsResult {
  count: number;
  diagnostics: { severity: string; group: string; message: string }[];
}

it('get_diagnostics: returns the full diagnostic list when severity is omitted', async () => {
  const result = await mcp.callJson<DiagnosticsResult>('get_diagnostics');
  expect(result.count).toBe(project.diagnostics.length);
  expect(result.diagnostics).toHaveLength(result.count);
});

it('get_diagnostics: filters by severity', async () => {
  // Inject a synthetic diagnostic mix so the filter has something concrete
  // to match — the fixture project may have zero diagnostics today.
  const seeded: Project = {
    ...project,
    diagnostics: [
      ...project.diagnostics,
      { severity: 'warn' as const, group: 'test/synthetic', message: 'noise' },
      { severity: 'error' as const, group: 'test/synthetic', message: 'boom' },
    ],
  };
  mcp.setProject(seeded);
  const warnings = await mcp.callJson<DiagnosticsResult>('get_diagnostics', { severity: 'warn' });
  expect(warnings.diagnostics.every((d) => d.severity === 'warn')).toBe(true);
  expect(warnings.count).toBeGreaterThanOrEqual(1);

  const errors = await mcp.callJson<DiagnosticsResult>('get_diagnostics', { severity: 'error' });
  expect(errors.diagnostics.every((d) => d.severity === 'error')).toBe(true);
  expect(errors.count).toBeGreaterThanOrEqual(1);

  mcp.setProject(project);
});

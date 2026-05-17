import { afterAll, beforeAll, expect, it } from 'vitest';
import type { Project } from '@unpunnyfuns/swatchbook-core';
import { loadFixtureProject, type McpTestHarness, startTestServer } from './_helpers.ts';

let project: Project;
let mcp: McpTestHarness;

// beforeAll perf escape hatch (per CLAUDE.md): fixture + server boot ~1s.
beforeAll(async () => {
  project = await loadFixtureProject();
  mcp = await startTestServer(project);
});

afterAll(async () => {
  await mcp.close();
});

// Fixture invariants (see packages/tokens/tokens/):
//   color.surface.default — alias to a palette neutral; color $type
//   color.palette.neutral.0 — primitive color
const COLOR_TOKEN = 'color.surface.default';
const NEUTRAL_FG = 'color.palette.neutral.900';
const NEUTRAL_BG = 'color.palette.neutral.0';

interface ColorFormatsResult {
  path: string;
  theme: string;
  formats: Record<string, { format: string; value: string; outOfGamut: boolean }>;
}

it('get_color_formats: returns hex / rgb / hsl / oklch / raw entries for a color token', async () => {
  const result = await mcp.callJson<ColorFormatsResult>('get_color_formats', { path: COLOR_TOKEN });
  expect(result.path).toBe(COLOR_TOKEN);
  expect(result.formats['hex']?.value).toMatch(/^#|^rgb\(/);
  expect(result.formats['rgb']?.value).toMatch(/^rgb\(/);
  expect(result.formats['oklch']?.value).toMatch(/^oklch\(/);
  expect(result.formats['raw']).toBeDefined();
});

it('get_color_formats: returns text fallback for a non-color $type', async () => {
  // Pick a size token from the fixture.
  const sizeEntry = Object.entries(project.defaultTokens).find(([, t]) => t.$type === 'dimension');
  expect(sizeEntry).toBeDefined();
  const [sizePath] = sizeEntry!;
  const text = await mcp.callText('get_color_formats', { path: sizePath });
  expect(text).toMatch(/^Token .* is not a color/);
});

it('get_color_formats: returns text fallback for an unknown path', async () => {
  const text = await mcp.callText('get_color_formats', { path: 'never.heard.of.it' });
  expect(text).toBe('Token not found: never.heard.of.it');
});

interface ContrastResult {
  theme: string;
  foreground: { path: string; value: string };
  background: { path: string; value: string };
  algorithm: 'wcag21' | 'apca';
  ratio: number;
  wcag?: { aa: { normal: boolean; large: boolean }; aaa: { normal: boolean; large: boolean } };
  apca?: { lc: number; body: boolean; largeText: boolean; nonText: boolean };
}

it('get_color_contrast: defaults to WCAG and returns AA/AAA passes for high-contrast pairings', async () => {
  const result = await mcp.callJson<ContrastResult>('get_color_contrast', {
    foreground: NEUTRAL_FG,
    background: NEUTRAL_BG,
  });
  expect(result.algorithm).toBe('wcag21');
  expect(result.ratio).toBeGreaterThan(4.5);
  expect(result.wcag?.aa.normal).toBe(true);
  expect(result.apca).toBeUndefined();
});

it('get_color_contrast: honors the algorithm flag (APCA returns signed Lc + bronze-tier passes)', async () => {
  const result = await mcp.callJson<ContrastResult>('get_color_contrast', {
    foreground: NEUTRAL_FG,
    background: NEUTRAL_BG,
    algorithm: 'apca',
  });
  expect(result.algorithm).toBe('apca');
  expect(result.apca).toBeDefined();
  expect(result.wcag).toBeUndefined();
});

it('get_color_contrast: returns text fallback when either token is not a color', async () => {
  const sizeEntry = Object.entries(project.defaultTokens).find(([, t]) => t.$type === 'dimension');
  const [sizePath] = sizeEntry!;
  const text = await mcp.callText('get_color_contrast', {
    foreground: sizePath,
    background: NEUTRAL_BG,
  });
  expect(text).toMatch(/Foreground .* is not a color/);
});

it('get_color_contrast: returns text fallback when either token is missing', async () => {
  const missingFg = await mcp.callText('get_color_contrast', {
    foreground: 'no.such.path',
    background: NEUTRAL_BG,
  });
  expect(missingFg).toBe('Foreground token not found: no.such.path');
  const missingBg = await mcp.callText('get_color_contrast', {
    foreground: NEUTRAL_FG,
    background: 'no.such.path',
  });
  expect(missingBg).toBe('Background token not found: no.such.path');
});

interface AxisVarianceResult {
  path: string;
  kind: 'constant' | 'single' | 'multi';
  varyingAxes: string[];
  constantAcrossAxes: string[];
  perAxis: Record<string, { varying: boolean; contexts: Record<string, string> }>;
}

it('get_axis_variance: classifies a mode-only token as `single` varying on `mode`', async () => {
  const result = await mcp.callJson<AxisVarianceResult>('get_axis_variance', { path: COLOR_TOKEN });
  expect(result.path).toBe(COLOR_TOKEN);
  // color.surface.default is themed by Light/Dark — at least `mode` varies.
  expect(result.varyingAxes).toContain('mode');
  // Every axis is keyed in perAxis, regardless of varying.
  expect(Object.keys(result.perAxis).toSorted()).toEqual(
    project.axes.map((a) => a.name).toSorted(),
  );
});

it('get_axis_variance: classifies a primitive as `constant` across every axis', async () => {
  const result = await mcp.callJson<AxisVarianceResult>('get_axis_variance', {
    path: 'color.palette.neutral.0',
  });
  expect(result.kind).toBe('constant');
  expect(result.varyingAxes).toEqual([]);
  expect(result.constantAcrossAxes.length).toBe(project.axes.length);
});

it('get_axis_variance: returns text fallback for unknown paths', async () => {
  const text = await mcp.callText('get_axis_variance', { path: 'no.such.token' });
  expect(text).toBe('Token not found in any theme: no.such.token');
});

interface ResolveThemeResult {
  theme: string;
  tuple: Record<string, string>;
  count: number;
  tokens: Record<string, { value: string; type?: string }>;
}

it('resolve_theme: returns the full token map for a partial tuple, filling axis defaults', async () => {
  const result = await mcp.callJson<ResolveThemeResult>('resolve_theme', {
    tuple: { mode: 'Dark' },
  });
  expect(result.tuple['mode']).toBe('Dark');
  // Other axes filled from their defaults.
  for (const axis of project.axes) {
    expect(result.tuple[axis.name]).toBeTruthy();
  }
  expect(result.count).toBeGreaterThan(0);
});

it("resolve_theme: invalid axis context falls back to that axis's default", async () => {
  const result = await mcp.callJson<ResolveThemeResult>('resolve_theme', {
    tuple: { mode: 'NotARealMode' },
  });
  const modeAxis = project.axes.find((a) => a.name === 'mode')!;
  expect(result.tuple['mode']).toBe(modeAxis.default);
});

it('resolve_theme: scopes the returned map via filter and $type', async () => {
  const result = await mcp.callJson<ResolveThemeResult>('resolve_theme', {
    tuple: {},
    filter: 'color.**',
    type: 'color',
  });
  expect(result.count).toBe(Object.keys(result.tokens).length);
  for (const [path, entry] of Object.entries(result.tokens)) {
    expect(path).toMatch(/^color\./);
    expect(entry.type).toBe('color');
  }
});

it('emit_css: returns a stylesheet with :root + per-tuple selectors', async () => {
  const css = await mcp.callText('emit_css');
  expect(css).toContain(':root');
  // The non-default permutations get attribute selectors with the data-sb-* prefix.
  expect(css).toMatch(/data-sb-mode/);
  // CSS vars use the project prefix.
  expect(css).toMatch(/--sb-color-/);
});

interface ConsumerOutputResult {
  path: string;
  cssVar: string;
  value: string;
  type?: string;
  theme: string;
  tuple: Record<string, string>;
  attrs: Record<string, string>;
  selector: string;
  usageSnippet: string;
}

it('get_consumer_output: returns cssVar + attrs + selector for a token at the default tuple', async () => {
  const result = await mcp.callJson<ConsumerOutputResult>('get_consumer_output', {
    path: COLOR_TOKEN,
  });
  expect(result.cssVar).toBe(`var(--sb-${COLOR_TOKEN.replaceAll('.', '-')})`);
  expect(result.usageSnippet).toBe(`color: ${result.cssVar};`);
  expect(result.selector).toContain('data-sb-');
  for (const axis of project.axes) {
    expect(result.tuple[axis.name]).toBe(axis.default);
    expect(result.attrs[`data-sb-${axis.name}`]).toBe(axis.default);
  }
});

it('get_consumer_output: composes the selector from a supplied non-default tuple', async () => {
  const result = await mcp.callJson<ConsumerOutputResult>('get_consumer_output', {
    path: COLOR_TOKEN,
    tuple: { mode: 'Dark' },
  });
  expect(result.tuple['mode']).toBe('Dark');
  expect(result.selector).toContain('[data-sb-mode="Dark"]');
});

it('get_consumer_output: returns text fallback for unknown paths', async () => {
  const text = await mcp.callText('get_consumer_output', { path: 'nope.gone.away' });
  expect(text).toBe('Token not found: nope.gone.away');
});

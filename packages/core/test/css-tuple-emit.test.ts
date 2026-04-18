import { beforeAll, expect, it } from 'vitest';
import { projectCss } from '#/emit';
import type { Project } from '#/types';
import { extractBlock, grep, loadWithPrefix, tupleSelector } from './_helpers';

// beforeAll is a perf escape hatch here: loadProject over the reference
// fixture takes ~1s, so running it per-test would blow the default timeout.
// All tests in this file read from the same projectCss output.
let project: Project;
let css: string;

beforeAll(async () => {
  project = await loadWithPrefix('sb');
  css = projectCss(project);
}, 30_000);

it('emits exactly one :root block plus N-1 per-tuple blocks', () => {
  const rootMatches = css.match(/(^|\n):root\s*\{/g) ?? [];
  expect(rootMatches).toHaveLength(1);
  const tupleBlocks = (css.match(/\n\[data-[^\]]+\][^{]*\{/g) ?? []).length;
  expect(tupleBlocks).toBe(project.themes.length - 1);
});

it('compound selector order matches Project.axes order', () => {
  const axisNames = project.axes.map((a) => a.name);
  const selectorMatches = css.match(/\[data-[^\]]+\](?:\[data-[^\]]+\])+/g) ?? [];
  expect(selectorMatches.length).toBeGreaterThan(0);
  for (const selector of selectorMatches) {
    const order = [...selector.matchAll(/\[data-([^=]+)=/g)].map((m) => m[1]);
    expect(order).toEqual(axisNames);
  }
});

it('redeclares every var per tuple (flat emission, not nested cascading)', () => {
  const lightDefault = extractBlock(css, ':root');
  const darkDefault = extractBlock(css, tupleSelector({ mode: 'Dark', brand: 'Default', contrast: 'Normal' }));
  expect(lightDefault).toBeTruthy();
  expect(darkDefault).toBeTruthy();

  const lightVars = new Set(
    lightDefault
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.startsWith('--'))
      .map((l) => l.split(':')[0]),
  );
  const darkVars = new Set(
    darkDefault
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.startsWith('--'))
      .map((l) => l.split(':')[0]),
  );
  expect(darkVars).toEqual(lightVars);
});

it('holds brand-invariant tokens stable across mode at the same brand', () => {
  const lightDefault = extractBlock(css, ':root');
  const darkDefault = extractBlock(css, tupleSelector({ mode: 'Dark', brand: 'Default', contrast: 'Normal' }));
  const lightSize = grep(lightDefault, '--sb-size-ref-400:');
  const darkSize = grep(darkDefault, '--sb-size-ref-400:');
  expect(lightSize).toBeDefined();
  expect(darkSize).toBeDefined();
  expect(lightSize).toEqual(darkSize);
});

it('emits no [data-theme="…"] selector in multi-axis mode', () => {
  expect(css).not.toMatch(/\[data-theme="/);
});

it('stays well under 100KB uncompressed for the reference fixture', () => {
  expect(Buffer.byteLength(css, 'utf8')).toBeLessThan(100_000);
});

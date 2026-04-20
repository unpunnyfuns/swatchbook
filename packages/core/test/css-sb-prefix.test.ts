import { beforeAll, expect, it } from 'vitest';
import { projectCss } from '#/emit';
import type { Project } from '#/types';
import { extractBlock, grep, loadWithPrefix, tupleSelector } from './_helpers';

// beforeAll is a perf escape hatch here: loadProject over the reference
// fixture takes ~1s, so running it per-test would blow the 5s default timeout
// six-fold. All tests in this file read from the same projectCss output.
let project: Project;
let css: string;

beforeAll(async () => {
  project = await loadWithPrefix('sb');
  css = projectCss(project);
}, 30_000);

it('emits :root for the default tuple plus compound selectors for the rest', () => {
  expect(css).toContain(':root {');
  for (const theme of project.themes) {
    const isDefault = project.axes.every((a) => theme.input[a.name] === a.default);
    if (isDefault) continue;
    expect(css).toContain(tupleSelector(theme.input));
  }
});

it('terminates with a trailing newline', () => {
  expect(css.endsWith('\n')).toBe(true);
});

it('applies the prefix to variable names', () => {
  expect(css).toContain('--sb-color-surface-default:');
  expect(css).not.toMatch(/^\s*--color-surface-default:/m);
});

it('applies the prefix to aliased var(…) references inside values', () => {
  const line = css.split('\n').find((l) => l.includes('--sb-color-accent-bg:'));
  expect(line).toBeDefined();
  expect(line).toMatch(/var\(--sb-color-/);
});


it('emits every primitive + composite type covered by the fixture', () => {
  expect(css).toMatch(/--sb-color-blue-500:\s*rgb\(/i);
  expect(css).toMatch(/--sb-size-100:\s*4px/);
  expect(css).toMatch(/--sb-font-family-sans:/);
  expect(css).toMatch(/--sb-font-weight-bold:\s*700/);
  expect(css).toMatch(/--sb-duration-fast:\s*120ms/);
  expect(css).toMatch(/--sb-cubic-bezier-standard:\s*cubic-bezier\(/);
  expect(css).toMatch(/--sb-typography-body-font-family:/);
  expect(css).toMatch(/--sb-typography-body-font-size:/);
  expect(css).toMatch(/--sb-typography-body-font-weight:/);
  expect(css).toMatch(/--sb-shadow-md/);
  expect(css).toMatch(/--sb-border-default/);
  expect(css).toMatch(/--sb-transition-enter/);
});

it('keeps sparse overrides: Dark flips surface, size scale identical', () => {
  const lightBlock = extractBlock(css, ':root');
  const darkBlock = extractBlock(css, tupleSelector({ mode: 'Dark', brand: 'Default', contrast: 'Normal' }));
  expect(lightBlock).toBeTruthy();
  expect(darkBlock).toBeTruthy();
  const lightSize = grep(lightBlock, '--sb-size-400:');
  const darkSize = grep(darkBlock, '--sb-size-400:');
  expect(lightSize).toEqual(darkSize);

  const lightSurface = grep(lightBlock, '--sb-color-surface-default:');
  const darkSurface = grep(darkBlock, '--sb-color-surface-default:');
  expect(lightSurface).not.toEqual(darkSurface);
});

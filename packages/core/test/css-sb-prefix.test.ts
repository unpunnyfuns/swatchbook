import { beforeAll, expect, it } from 'vitest';
import { projectCss } from '#/emit';
import type { Project } from '#/types';
import { extractBlock, grep, loadWithPrefix } from './_helpers';

// beforeAll is a perf escape hatch here: loadProject over the reference
// fixture takes ~1s, so running it per-test would blow the 5s default timeout
// six-fold. All six tests in this file read from the same projectCss output.
let project: Project;
let css: string;

beforeAll(async () => {
  project = await loadWithPrefix('sb');
  css = projectCss(project);
}, 30_000);

it('emits one [data-theme] block per theme', () => {
  for (const theme of project.themes) {
    expect(css).toContain(`[data-theme="${theme.name}"]`);
  }
});

it('terminates with a trailing newline', () => {
  expect(css.endsWith('\n')).toBe(true);
});

it('applies the prefix to variable names', () => {
  expect(css).toContain('--sb-color-sys-surface-default:');
  expect(css).not.toMatch(/^\s*--color-sys-surface-default:/m);
});

it('applies the prefix to aliased var(…) references inside values', () => {
  const line = css.split('\n').find((l) => l.includes('--sb-cmp-button-bg:'));
  expect(line).toBeDefined();
  expect(line).toMatch(/var\(--sb-color-sys-accent-bg\)/);
});

it('emits every primitive + composite type covered by the fixture', () => {
  expect(css).toMatch(/--sb-color-ref-blue-500:\s*rgb\(/i);
  expect(css).toMatch(/--sb-size-ref-100:\s*4px/);
  expect(css).toMatch(/--sb-font-ref-family-sans:/);
  expect(css).toMatch(/--sb-font-ref-weight-bold:\s*700/);
  expect(css).toMatch(/--sb-duration-ref-fast:\s*120ms/);
  expect(css).toMatch(/--sb-easing-ref-standard:\s*cubic-bezier\(/);
  expect(css).toMatch(/--sb-typography-sys-body-font-family:/);
  expect(css).toMatch(/--sb-typography-sys-body-font-size:/);
  expect(css).toMatch(/--sb-typography-sys-body-font-weight:/);
  expect(css).toMatch(/--sb-shadow-sys-md/);
  expect(css).toMatch(/--sb-border-sys-default/);
  expect(css).toMatch(/--sb-motion-sys-enter/);
});

it('keeps sparse overrides: Dark flips surface, size scale identical', () => {
  const lightBlock = extractBlock(css, 'Light · Default');
  const darkBlock = extractBlock(css, 'Dark · Default');
  expect(lightBlock).toBeTruthy();
  expect(darkBlock).toBeTruthy();
  const lightSize = grep(lightBlock, '--sb-size-ref-400:');
  const darkSize = grep(darkBlock, '--sb-size-ref-400:');
  expect(lightSize).toEqual(darkSize);

  const lightSurface = grep(lightBlock, '--sb-color-sys-surface-default:');
  const darkSurface = grep(darkBlock, '--sb-color-sys-surface-default:');
  expect(lightSurface).not.toEqual(darkSurface);
});

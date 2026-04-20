import { beforeAll, expect, it } from 'vitest';
import { projectCss } from '#/emit';
import type { Project } from '#/types';
import { extractBlock, loadWithPrefix } from './_helpers';

// beforeAll is a perf escape hatch: loadProject over the reference fixture
// takes ~1s. All per-type assertions read from the same :root block, so one
// load covers the file.
let project: Project;
let root: string;

beforeAll(async () => {
  project = await loadWithPrefix('sb');
  const css = projectCss(project);
  root = extractBlock(css, ':root');
}, 30_000);

it('emits color tokens as rgb() values with the full component triple', () => {
  const line = root.split('\n').find((l) => l.includes('--sb-color-blue-500:'));
  expect(line).toMatch(/rgb\([\d.%\s]+\)/);
});

it('emits dimension tokens with their unit preserved', () => {
  const line = root.split('\n').find((l) => l.includes('--sb-size-100:'));
  expect(line).toMatch(/:\s*4px;$/);
});

it('emits fontFamily tokens with the full font stack', () => {
  const line = root.split('\n').find((l) => l.includes('--sb-font-family-sans:'));
  expect(line).toBeDefined();
  expect(line).toContain(',');
});

it('emits fontWeight tokens as a numeric value', () => {
  const line = root.split('\n').find((l) => l.includes('--sb-font-weight-bold:'));
  expect(line).toMatch(/:\s*700;$/);
});

it('emits duration tokens with the ms unit', () => {
  const line = root.split('\n').find((l) => l.includes('--sb-duration-fast:'));
  expect(line).toMatch(/:\s*120ms;$/);
});

it('emits cubicBezier tokens as a cubic-bezier() expression', () => {
  const line = root.split('\n').find((l) => l.includes('--sb-cubic-bezier-standard:'));
  expect(line).toMatch(/cubic-bezier\(\s*[\d.]+,\s*[\d.]+,\s*[\d.]+,\s*[\d.]+\s*\)/);
});

it('emits typography tokens as an expanded set of per-field custom properties', () => {
  const family = root.split('\n').find((l) => l.includes('--sb-typography-body-font-family:'));
  const size = root.split('\n').find((l) => l.includes('--sb-typography-body-font-size:'));
  const weight = root.split('\n').find((l) => l.includes('--sb-typography-body-font-weight:'));
  expect(family).toBeDefined();
  expect(size).toBeDefined();
  expect(weight).toBeDefined();
});

it('emits shadow tokens as a box-shadow-compatible string (offsets + color)', () => {
  const line = root.split('\n').find((l) => l.match(/--sb-shadow-md:[^-]/));
  expect(line).toBeDefined();
  // Shadow shorthand: offsetX offsetY blur spread color — at least two
  // dimension tokens followed by something color-shaped.
  expect(line).toMatch(/\d+px\s+\d+px/);
});

it('emits border tokens as a CSS border shorthand (width style color)', () => {
  const line = root.split('\n').find((l) => l.match(/--sb-border-default:[^-]/));
  expect(line).toBeDefined();
  expect(line).toMatch(/\d+px\s+(solid|dashed|dotted|double)\s+/);
});

it('emits transition tokens with duration + easing material', () => {
  const line = root.split('\n').find((l) => l.match(/--sb-transition-enter:[^-]/));
  expect(line).toBeDefined();
  expect(line).toMatch(/var\(--sb-duration-/);
  expect(line).toMatch(/var\(--sb-cubic-bezier-/);
});

it('emits gradient tokens as a list of stops', () => {
  const keys = root
    .split('\n')
    .filter((l) => l.includes('--sb-gradient-'))
    .map((l) => l.trim());
  expect(keys.length).toBeGreaterThan(0);
});

it('emits strokeStyle string form directly', () => {
  const line = root
    .split('\n')
    .find((l) => l.match(/--sb-stroke-style-[a-z-]+:\s*(solid|dashed|dotted|double);$/i));
  expect(line).toBeDefined();
});

it('emits number tokens as a bare number (no unit)', () => {
  // fontWeight is emitted as a number; use it as the representative number-typed test.
  const line = root.split('\n').find((l) => l.includes('--sb-font-weight-regular:'));
  expect(line).toMatch(/:\s*\d+;$/);
});

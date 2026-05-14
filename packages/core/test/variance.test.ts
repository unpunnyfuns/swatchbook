import { beforeAll, expect, it } from 'vitest';
import { analyzeAxisVariance } from '#/variance.ts';
import type { Project } from '#/types.ts';
import { loadWithPrefix } from './_helpers.ts';

let project: Project;

beforeAll(async () => {
  project = await loadWithPrefix(undefined);
});

it('classifies a token constant across every axis', () => {
  const result = analyzeAxisVariance(
    'color.palette.neutral.500',
    project.axes,
    project.permutations,
    project.permutationsResolved,
  );
  expect(result.kind).toBe('constant');
  expect(result.varyingAxes).toEqual([]);
  expect(result.constantAcrossAxes.toSorted()).toEqual(['brand', 'contrast', 'mode'].toSorted());
});

it('classifies a single-axis role token (surface varies with mode only)', () => {
  const result = analyzeAxisVariance(
    'color.surface.default',
    project.axes,
    project.permutations,
    project.permutationsResolved,
  );
  expect(result.kind).toBe('single');
  expect(result.varyingAxes).toEqual(['mode']);
  expect(result.perAxis.mode?.varying).toBe(true);
  expect(result.perAxis.brand?.varying).toBe(false);
});

it('returns constant with no varying axes when the token is absent from every theme', () => {
  const result = analyzeAxisVariance(
    'color.does.not.exist',
    project.axes,
    project.permutations,
    project.permutationsResolved,
  );
  expect(result.kind).toBe('constant');
  expect(result.varyingAxes).toEqual([]);
});

it('per-axis contexts record the value seen at every context', () => {
  const result = analyzeAxisVariance(
    'color.surface.default',
    project.axes,
    project.permutations,
    project.permutationsResolved,
  );
  const modeCtx = result.perAxis.mode?.contexts ?? {};
  expect(Object.keys(modeCtx).toSorted()).toEqual(['Dark', 'Light'].toSorted());
  expect(modeCtx.Light).not.toBe(modeCtx.Dark);
});

/**
 * `dedupeDiagnostics` collapses the repeats a multi-tuple load produces, since
 * every singleton tuple parses against one shared logger. The end-to-end
 * companion below pins that the count no longer scales with axis cardinality.
 */
import { resolve } from 'node:path';
import { expect, it } from 'vitest';
import { dedupeDiagnostics } from '#/diagnostics.ts';
import { loadProject } from '#/load.ts';
import type { Diagnostic } from '#/types.ts';

const lintFixtureCwd = resolve(import.meta.dirname, 'fixtures/layered-legacy-color');

const lintCount = (p: { diagnostics: readonly Diagnostic[] }) =>
  p.diagnostics.filter((d) => d.group === 'lint').length;

const err = (over: Partial<Diagnostic> = {}): Diagnostic => ({
  severity: 'error',
  group: 'lint',
  label: 'core/valid-color',
  message: 'Migrate to the new object format',
  ...over,
});

it('collapses diagnostics identical in every field', () => {
  expect(dedupeDiagnostics([err(), err(), err()])).toHaveLength(1);
});

it('preserves first-seen order', () => {
  const out = dedupeDiagnostics([
    err({ message: 'first' }),
    err({ message: 'second' }),
    err({ message: 'first' }),
  ]);
  expect(out.map((d) => d.message)).toEqual(['first', 'second']);
});

it('keeps diagnostics that differ only in source location', () => {
  const out = dedupeDiagnostics([
    err({ filename: '/a.json', line: 3 }),
    err({ filename: '/a.json', line: 9 }),
    err({ filename: '/b.json', line: 3 }),
  ]);
  expect(out).toHaveLength(3);
});

it('keeps diagnostics that differ only by rule label', () => {
  const out = dedupeDiagnostics([err({ label: 'core/valid-color' }), err({ label: 'core/other' })]);
  expect(out).toHaveLength(2);
});

it('reports one lint diagnostic per problem regardless of how many tuples parse', async () => {
  const oneAxis = await loadProject(
    {
      tokens: ['base/*.json'],
      axes: [{ name: 'mode', contexts: { Light: [], Dark: ['modes/dark.json'] }, default: 'Light' }],
    },
    lintFixtureCwd,
  );
  const twoAxes = await loadProject(
    {
      tokens: ['base/*.json'],
      axes: [
        { name: 'mode', contexts: { Light: [], Dark: ['modes/dark.json'] }, default: 'Light' },
        { name: 'brand', contexts: { A: [], B: ['modes/dark.json'] }, default: 'A' },
      ],
    },
    lintFixtureCwd,
  );

  expect(lintCount(oneAxis)).toBeGreaterThan(0);
  expect(lintCount(twoAxes)).toBe(lintCount(oneAxis));
});

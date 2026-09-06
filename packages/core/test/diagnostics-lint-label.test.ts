/**
 * End-to-end companion to `diagnostics-to-diagnostics.test.ts`: that file pins
 * the projection in isolation, this one pins that a real lint diagnostic
 * reaches `Project.diagnostics` carrying the rule id a consumer needs in order
 * to configure or silence it.
 */
import { resolve } from 'node:path';
import { expect, it } from 'vitest';
import { loadProject } from '#/load.ts';

const fixtureCwd = resolve(import.meta.dirname, 'fixtures/css-options-legacyhex');

it('surfaces the lint rule id on diagnostics produced by a real load', async () => {
  const project = await loadProject({ tokens: ['tokens/*.json'] }, fixtureCwd);
  const lint = project.diagnostics.filter((d) => d.group === 'lint');

  expect(lint.length).toBeGreaterThan(0);
  expect(lint.some((d) => d.label === 'core/valid-color')).toBe(true);
});

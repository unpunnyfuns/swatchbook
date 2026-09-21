/**
 * Resolver-backed projects load through `loadResolver`, which does not lint;
 * only `parse()` does. These pin that swatchbook runs the pass itself, so a
 * resolver project reports the same lint state as its `terrazzo build`.
 */
import { resolve } from 'node:path';
import { expect, it } from 'vitest';
import { loadProject } from '#/load.ts';
import type { Diagnostic } from '#/types.ts';

// The fixture's tokens use legacy hex strings, which `core/valid-color` flags.
const fixtureCwd = resolve(import.meta.dirname, 'fixtures/alias-literal-flip/tokens');

const lintOf = (diagnostics: readonly Diagnostic[]) => diagnostics.filter((d) => d.group === 'lint');

it('lints a resolver-backed project under the recommended rules', async () => {
  const project = await loadProject(
    { resolver: 'resolver.json', default: { mode: 'Light' } },
    fixtureCwd,
  );
  const lint = lintOf(project.diagnostics);
  expect(lint.length).toBeGreaterThan(0);
  expect(lint.some((d) => d.message.includes('object format'))).toBe(true);
});

it('honours lintOptions on the resolver path', async () => {
  const project = await loadProject(
    {
      resolver: 'resolver.json',
      default: { mode: 'Light' },
      lintOptions: { rules: { 'core/valid-color': ['error', { legacyFormat: true }] } },
    },
    fixtureCwd,
  );
  expect(lintOf(project.diagnostics)).toHaveLength(0);
});

it('skips the resolver lint pass under lintOptions.build.enabled: false', async () => {
  const project = await loadProject(
    {
      resolver: 'resolver.json',
      default: { mode: 'Light' },
      lintOptions: { build: { enabled: false }, rules: { 'core/valid-color': ['error', {}] } },
    },
    fixtureCwd,
  );
  expect(lintOf(project.diagnostics)).toHaveLength(0);
});

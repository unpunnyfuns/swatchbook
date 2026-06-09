/**
 * Alias-baseline → write flips through the emitter. The alias-literal-flip
 * fixture's Dark mode replaces alias baselines with literals (and one alias
 * with a different alias); the Dark cell must emit the written value, not a
 * var() reference to the baseline's old alias target. Terrazzo's transforms
 * route on aliasChain before $value, so leaked baseline metadata shows up
 * here as a wrong var() — this file pins the consequence end to end.
 */
import { fileURLToPath } from 'node:url';
import { beforeAll, expect, it } from 'vitest';
import { emitAxisProjectedCss } from '#/css-axis-projected.ts';
import { loadProject } from '#/load.ts';
import type { Project } from '#/types.ts';
import { extractBlock, grep } from './_helpers.ts';

const fixtureCwd = fileURLToPath(new URL('./fixtures/alias-literal-flip', import.meta.url));

let css: string;
let darkCell: string;

// beforeAll: loadProject is the expensive step; every test reads the same emitted CSS.
beforeAll(async () => {
  const project: Project = await loadProject(
    {
      tokens: ['tokens/**/*.json'],
      resolver: 'tokens/resolver.json',
      default: { mode: 'Light' },
      cssVarPrefix: 't',
    },
    fixtureCwd,
  );
  css = emitAxisProjectedCss(project);
  darkCell = extractBlock(css, '[data-t-mode="Dark"]');
}, 30_000);

it('a literal write over an alias baseline emits the literal, not the old alias target', () => {
  const line = grep(darkCell, '--t-color-text:');
  expect(line).toBeDefined();
  expect(line).not.toContain('var(');
  // White in whatever serialization the transform picks (hex or rgb()).
  expect(line).toMatch(/#ffffff|#fff\b|rgb\(100% 100% 100%\)/i);
});

it('an alias write over an alias baseline emits the new target, not the baseline one', () => {
  expect(grep(darkCell, '--t-color-border-focus:')).toBe(
    '--t-color-border-focus: var(--t-color-text);',
  );
});

it('a composite literal write over a partial-alias baseline emits no stale sub-field var()', () => {
  // Pins only the metadata leak (no var() to the baseline's alias target).
  // The width sub-field currently emits garbage because literal composite
  // writes carry raw (un-normalized) sub-values into the transform — a
  // separate pre-existing bug, tracked independently.
  const line = grep(darkCell, '--t-border-input:');
  expect(line).toBeDefined();
  expect(line).not.toContain('var(');
});

it('the baseline cell still aliases through', () => {
  const root = extractBlock(css, ':root');
  expect(grep(root, '--t-color-text:')).toBe('--t-color-text: var(--t-color-a);');
});

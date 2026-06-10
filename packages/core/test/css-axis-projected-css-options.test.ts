/**
 * cssOptions must shape the emitter's value output, not just the listing's.
 * plugin-css (which builds Project.listing) applies cssOptions like
 * `legacyHex` and a user `transform`; the axis-projected emitter calls the
 * same transformCSSValue and so must apply them too, or the preview CSS the
 * blocks render diverges from the listing previewValue they display.
 */
import { fileURLToPath } from 'node:url';
import { expect, it } from 'vitest';
import { emitAxisProjectedCss } from '#/css-axis-projected.ts';
import { loadProject } from '#/load.ts';
import type { Config } from '#/types.ts';
import { extractBlock, grep } from './_helpers.ts';

const cwd = fileURLToPath(new URL('./fixtures/css-options-legacyhex', import.meta.url));

async function load(cssOptions: Config['cssOptions']) {
  return loadProject({ tokens: ['tokens/**/*.json'], cssVarPrefix: 't', cssOptions }, cwd);
}

function previewValue(project: Awaited<ReturnType<typeof load>>, path: string): string | undefined {
  return project.listing[path]?.$extensions['app.terrazzo.listing'].previewValue;
}

it('legacyHex makes the emitter output hex, matching the listing previewValue', async () => {
  const project = await load({ legacyHex: true });
  const css = emitAxisProjectedCss(project);
  const emitted = grep(extractBlock(css, ':root'), '--t-color-brand:');
  expect(emitted).toBe('--t-color-brand: #3b82f6;');
  // The block-side previewValue and the emitted CSS come from one option set.
  expect(emitted).toBe(`--t-color-brand: ${previewValue(project, 'color.brand')};`);
});

it('a user cssOptions.transform reaches the emitter', async () => {
  const project = await load({ transform: (token) => (token.$type === 'color' ? 'tomato' : undefined) });
  const css = emitAxisProjectedCss(project);
  expect(grep(extractBlock(css, ':root'), '--t-color-brand:')).toBe('--t-color-brand: tomato;');
});

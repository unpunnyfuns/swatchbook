import cssInJsPlugin from '@terrazzo/plugin-css-in-js';
import { beforeAll, expect, it } from 'vitest';
import { emitViaTerrazzo } from '#/emit-via-terrazzo.ts';
import { loadProject } from '#/load.ts';
import { DEFAULT_CSS_VAR_PREFIX } from '#/load.ts';
import type { Project } from '#/types.ts';
import { fixtureCwd, loadWithPrefix } from './_helpers.ts';

let project: Project;

// beforeAll: loadProject against the full fixture (~1s) feeds every
// emitViaTerrazzo assertion below; per-test reload would dominate.
beforeAll(async () => {
  project = await loadWithPrefix('sb');
});

it('emits CSS with compound selectors + prefixed vars from the loaded project', async () => {
  const files = await emitViaTerrazzo(project, {
    cssOptions: { filename: 'tokens.css' },
  });
  const css = files.find((f) => f.filename === 'tokens.css');
  expect(css).toBeTruthy();
  const text = String(css!.contents);
  expect(text).toContain('--sb-color-surface-default');
  expect(text).toContain('[data-sb-mode="Dark"]');
  expect(text).toContain('[data-sb-brand="Brand A"]');
});

it('runs extra Terrazzo plugins alongside plugin-css', async () => {
  const files = await emitViaTerrazzo(project, {
    cssOptions: { filename: 'tokens.css' },
    plugins: [cssInJsPlugin({ filename: 'tokens.js' })],
  });
  const js = files.find((f) => f.filename === 'tokens.js');
  const dts = files.find((f) => f.filename === 'tokens.d.ts');
  expect(js).toBeTruthy();
  expect(dts).toBeTruthy();
  const jsText = String(js!.contents);
  // Patched plugin-css-in-js camelCases dashed segments (number.line-height → number.lineHeight).
  expect(jsText).toContain('export const number');
  expect(jsText).toContain('lineHeight');
});

it("selection 'permutations' (default) fans out to every cartesian tuple", async () => {
  const files = await emitViaTerrazzo(project, { cssOptions: { filename: 'tokens.css' } });
  const text = String(files.find((f) => f.filename === 'tokens.css')!.contents);
  // Every theme.name should appear as an attribute-value fragment.
  for (const theme of project.permutations) {
    for (const [axisName, contextValue] of Object.entries(theme.input)) {
      expect(text).toContain(`data-sb-${axisName}="${contextValue}"`);
    }
  }
});

it("selection 'presets' emits one block per declared preset, with defaults filling omitted axes", async () => {
  const withPresets = await loadProject(
    {
      tokens: ['tokens/**/*.json'],
      resolver: 'tokens/resolver.json',
      cssVarPrefix: 'sb',
      presets: [
        { name: 'Brand A Dark', axes: { brand: 'Brand A', mode: 'Dark' } },
        { name: 'Default HC', axes: { contrast: 'High' } },
      ],
    },
    fixtureCwd,
  );
  const files = await emitViaTerrazzo(withPresets, {
    cssOptions: { filename: 'tokens.css' },
    selection: 'presets',
  });
  const text = String(files.find((f) => f.filename === 'tokens.css')!.contents);
  // Explicitly-named axis values must appear; omitted axes get each axis's
  // own default (we don't assert on those because they're implied).
  expect(text).toContain('data-sb-brand="Brand A"');
  expect(text).toContain('data-sb-mode="Dark"');
  expect(text).toContain('data-sb-contrast="High"');
});

it("selection 'presets' with no presets declared throws", async () => {
  const bare = await loadProject(
    {
      tokens: ['tokens/**/*.json'],
      resolver: 'tokens/resolver.json',
      cssVarPrefix: 'sb',
      // presets omitted
    },
    fixtureCwd,
  );
  expect(bare.presets).toHaveLength(0);
  await expect(emitViaTerrazzo(bare, { selection: 'presets' })).rejects.toThrow(
    /at least one preset/,
  );
});

it('throws when the project has no retained parser input (layered path)', async () => {
  // Layered projects don't retain parserInput yet; calling emitViaTerrazzo
  // on one should fail loudly rather than silently emitting nothing.
  const layered: Project = { ...project, parserInput: undefined as never };
  await expect(emitViaTerrazzo(layered)).rejects.toThrow(/no retained Terrazzo parser input/);
});

it('honors an empty cssVarPrefix by dropping the dash in variable names', async () => {
  const barePrefix = await loadWithPrefix('');
  const files = await emitViaTerrazzo(barePrefix, { cssOptions: { filename: 'tokens.css' } });
  const text = String(files.find((f) => f.filename === 'tokens.css')!.contents);
  expect(text).toContain('--color-surface-default');
  expect(text).not.toContain('--sb-color-surface-default');
  // Data attribute also drops the prefix segment: `[data-mode=...]` not `[data-sb-mode=...]`.
  expect(text).toMatch(/\[data-mode="/);
  expect(DEFAULT_CSS_VAR_PREFIX).toBe('swatch');
});

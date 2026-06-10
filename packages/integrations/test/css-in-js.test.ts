import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { loadProject } from '@unpunnyfuns/swatchbook-core';
import { resolverPath, tokensDir } from '@unpunnyfuns/swatchbook-tokens';
import { beforeAll, expect, it } from 'vitest';
import cssInJsIntegration, { buildTree, uniqueIdents } from '#/css-in-js.ts';
import type { Project } from '@unpunnyfuns/swatchbook-core';

let project: Project;

// beforeAll: loadProject against the full fixture (~1s) is shared by
// every render-output assertion below; per-test reload would dominate.
beforeAll(async () => {
  project = await loadProject({ resolver: resolverPath, cssVarPrefix: 'sb' }, dirname(tokensDir));
});

function render(p: Project): string {
  const integration = cssInJsIntegration();
  const out = integration.virtualModule?.render(p);
  if (typeof out !== 'string') throw new Error('integration did not emit a string');
  return out;
}

it('integration exposes virtual:swatchbook/theme by default', () => {
  const integration = cssInJsIntegration();
  expect(integration.name).toBe('css-in-js');
  expect(integration.virtualModule?.virtualId).toBe('virtual:swatchbook/theme');
});

it('emits top-level exports per $type group, plus an aggregate `theme`', () => {
  const js = render(project);
  expect(js).toMatch(/^export const color =/m);
  expect(js).toMatch(/^export const typography =/m);
  expect(js).toMatch(/^export const theme = \{ /m);
  expect(js).toContain('color');
  expect(js).toContain('typography');
});

it('leaves resolve to var() references carrying the project prefix', () => {
  const js = render(project);
  expect(js).toContain('"var(--sb-color-surface-default)"');
  expect(js).toContain('"var(--sb-color-palette-neutral-500)"');
});

it('drops the dash when cssVarPrefix is empty', async () => {
  const bare = await loadProject({ resolver: resolverPath, cssVarPrefix: '' }, dirname(tokensDir));
  const js = render(bare);
  expect(js).toContain('"var(--color-surface-default)"');
  expect(js).not.toContain('--sb-');
});

it('quotes dashed keys and leaves numeric-canonical keys bare', () => {
  const js = render(project);
  expect(js).toContain('"bg-hover":');
  expect(js).toMatch(/\b500: "var\(--sb-color-palette-neutral-500\)"/);
});

it('output opens with a preview-framed banner pointing at the package', () => {
  const js = render(project);
  expect(js).toMatch(
    /^\/\* Synthesized by @unpunnyfuns\/swatchbook-integrations\/css-in-js for preview\./,
  );
});

it('derives accessor var() names with Terrazzo naming for camelCase paths', async () => {
  const cwd = mkdtempSync(join(tmpdir(), 'sb-cssinjs-camel-'));
  mkdirSync(join(cwd, 'tokens'));
  writeFileSync(
    join(cwd, 'tokens', 't.json'),
    JSON.stringify({ color: { $type: 'color', brandPrimary: { $value: '#3b82f6' } } }),
  );
  const p = await loadProject({ tokens: ['tokens/**/*.json'], cssVarPrefix: 't' }, cwd);
  const js = render(p);
  // plugin-css kebab-cases camelCase segments; the accessor must reference
  // the var that actually gets emitted, not a dot-to-dash respelling.
  expect(js).toContain('"var(--t-color-brand-primary)"');
  expect(js).not.toContain('var(--t-color-brandPrimary)');
});

it('buildTree drops a deeper path colliding with a leaf instead of misfiling it', () => {
  // 'color' is a token (leaf) and 'color.brand' a deeper token — a key can't
  // be both string and object, so the deeper path is dropped, not misfiled
  // under root.brand (the truncated key the loop used to stop on).
  expect(buildTree(['color', 'color.brand'], (p) => `<${p}>`)).toEqual({ color: '<color>' });
});

it('buildTree nests normal branch paths', () => {
  expect(buildTree(['color.brand.primary', 'space.md'], (p) => `<${p}>`)).toEqual({
    color: { brand: { primary: '<color.brand.primary>' } },
    space: { md: '<space.md>' },
  });
});

it('buildTree does not pollute Object.prototype via a __proto__ path segment', () => {
  buildTree(['__proto__.polluted', 'color.brand'], (p) => `<${p}>`);
  expect(({} as Record<string, unknown>)['polluted']).toBeUndefined();
});

it('uniqueIdents suffixes names that sanitize to the same identifier', () => {
  // 'a-b' and 'a.b' both sanitize to '_a_b' — they must not collide into
  // duplicate top-level exports.
  const m = uniqueIdents(['a-b', 'a.b', 'plain']);
  expect(m.get('a-b')).toBe('_a_b');
  expect(m.get('a.b')).toBe('_a_b_2');
  expect(m.get('plain')).toBe('plain');
  expect(new Set(m.values()).size).toBe(3);
});

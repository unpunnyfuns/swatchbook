import { dirname } from 'node:path';
import { loadProject } from '@unpunnyfuns/swatchbook-core';
import { resolverPath, tokensDir } from '@unpunnyfuns/swatchbook-tokens';
import { beforeAll, expect, it } from 'vitest';
import tailwindIntegration from '#/tailwind.ts';
import type { Project } from '@unpunnyfuns/swatchbook-core';

let project: Project;

// beforeAll: loadProject against the full fixture (~1s) is shared by
// every render-output assertion below; per-test reload would dominate.
beforeAll(async () => {
  project = await loadProject({ resolver: resolverPath, cssVarPrefix: 'sb' }, dirname(tokensDir));
});

function render(p: Project, options?: Parameters<typeof tailwindIntegration>[0]): string {
  const integration = tailwindIntegration(options);
  const out = integration.virtualModule?.render(p);
  if (typeof out !== 'string') throw new Error('integration did not emit a string');
  return out;
}

it('integration exposes virtual:swatchbook/tailwind.css by default', () => {
  const integration = tailwindIntegration();
  expect(integration.name).toBe('tailwind');
  expect(integration.virtualModule?.virtualId).toBe('virtual:swatchbook/tailwind.css');
});

it('@theme block carries cssVarPrefix on both sides of every alias', () => {
  const css = render(project);
  expect(css).toContain('--color-sb-surface-default: var(--sb-color-surface-default);');
  expect(css).toContain('--spacing-sb-md: var(--sb-space-md);');
  expect(css).toContain('--radius-sb-lg: var(--sb-radius-lg);');
  expect(css).toContain('--shadow-sb-md: var(--sb-shadow-md);');
});

it('output opens with a preview-framed banner and @import tailwindcss', () => {
  const css = render(project);
  expect(css).toMatch(/^\/\* Synthesized by @unpunnyfuns\/swatchbook-integrations\/tailwind/);
  expect(css).toContain("@import 'tailwindcss';");
  expect(css).toContain('@theme {');
  expect(css).toContain('}');
});

it('drops the dash when cssVarPrefix is empty', async () => {
  const bare = await loadProject({ resolver: resolverPath, cssVarPrefix: '' }, dirname(tokensDir));
  const css = render(bare);
  expect(css).toContain('--color-surface-default: var(--color-surface-default);');
  expect(css).not.toContain('--sb-');
});

it('accepts a custom role map replacing the derived default', () => {
  const css = render(project, {
    roles: { color: [['only-accent', 'color.accent.bg']] },
  });
  expect(css).toContain('--color-sb-only-accent: var(--sb-color-accent-bg);');
  expect(css).not.toContain('--color-sb-surface-default:');
  expect(css).not.toContain('--spacing-sb-md:');
});

it('derives color entries from every `$type: color` token in the project', () => {
  const css = render(project);
  // Semantic colors (authored under color.surface.*)
  expect(css).toContain('--color-sb-surface-default: var(--sb-color-surface-default);');
  // Palette tokens land in the derivation too — consumers get the raw scale by default.
  expect(css).toMatch(/--color-sb-palette-neutral-\d+: var\(--sb-color-palette-neutral-\d+\);/);
});

it('routes `$type: dimension` tokens under spacing or radius by path root', () => {
  const css = render(project);
  // `space.md` → spacing scale
  expect(css).toContain('--spacing-sb-md: var(--sb-space-md);');
  // `radius.pill` → radius scale (not spacing)
  expect(css).toContain('--radius-sb-pill: var(--sb-radius-pill);');
  expect(css).not.toContain('--spacing-sb-pill: var(--sb-radius-pill);');
});

it('derived scales are sorted deterministically', () => {
  const css = render(project);
  const spacingMatches = [...css.matchAll(/--spacing-sb-([\w-]+): /g)].map((m) => m[1]!);
  const sorted = spacingMatches.toSorted((a, b) => a.localeCompare(b, 'en'));
  expect(spacingMatches).toEqual(sorted);
});

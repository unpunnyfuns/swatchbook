/**
 * `Config.maxJointArity` caps the per-token joint-divergence arity
 * probing. Default 4. Lower values trade correctness at higher-arity
 * tuples for less load-time work; raising allows compound blocks for
 * 5+-axis joint divergences in richer multi-axis systems.
 *
 * Asserted against the reference fixture, which has one arity-3 joint
 * (mode + brand + a11y on `color.accent.fg`). Capping at 2 should
 * drop the arity-3 block; the default (4) and an explicit 3 keep it.
 */
import { beforeAll, expect, it } from 'vitest';
import { dirname } from 'node:path';
import { resolverPath, tokensDir } from '@unpunnyfuns/swatchbook-tokens';
import { loadProject } from '#/load.ts';
import { emitAxisProjectedCss } from '#/css-axis-projected.ts';
import type { Project } from '#/types.ts';

const fixtureCwd = dirname(tokensDir);

const baseConfig = {
  tokens: ['tokens/**/*.json'],
  resolver: resolverPath,
  default: { mode: 'Light', brand: 'Default', a11y: 'Normal' },
  cssVarPrefix: 'sb',
};

let projectDefault: Project;
let projectArity2: Project;
let projectArity3: Project;
let projectArity1: Project;

beforeAll(async () => {
  [projectDefault, projectArity2, projectArity3, projectArity1] = await Promise.all([
    loadProject(baseConfig, fixtureCwd),
    loadProject({ ...baseConfig, maxJointArity: 2 }, fixtureCwd),
    loadProject({ ...baseConfig, maxJointArity: 3 }, fixtureCwd),
    loadProject({ ...baseConfig, maxJointArity: 1 }, fixtureCwd),
  ]);
}, 30_000);

it('default emits the arity-3 compound block for the reference fixture', () => {
  const css = emitAxisProjectedCss(projectDefault);
  expect(css).toContain(
    '[data-sb-mode="Dark"][data-sb-brand="ACME"][data-sb-a11y="High-contrast"]',
  );
});

it('explicit maxJointArity=3 keeps the arity-3 block (same as default)', () => {
  const css = emitAxisProjectedCss(projectArity3);
  expect(css).toContain(
    '[data-sb-mode="Dark"][data-sb-brand="ACME"][data-sb-a11y="High-contrast"]',
  );
});

it('maxJointArity=2 drops the arity-3 block but keeps arity-2 blocks', () => {
  const css = emitAxisProjectedCss(projectArity2);
  expect(css).not.toContain(
    '[data-sb-mode="Dark"][data-sb-brand="ACME"][data-sb-a11y="High-contrast"]',
  );
  // Arity-2 blocks still present.
  expect(css).toContain('[data-sb-mode="Dark"][data-sb-brand="ACME"]');
  expect(css).toContain('[data-sb-mode="Dark"][data-sb-a11y="High-contrast"]');
});

it('maxJointArity=1 disables all joint-block emission', () => {
  const css = emitAxisProjectedCss(projectArity1);
  // No 2-attribute or higher compound selectors anywhere.
  expect(css).not.toMatch(/\[data-sb-[^\]]+\]\[data-sb-/);
});

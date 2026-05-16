// Pragmatic exception: `collectWatchPaths` and `composeProjectCss` are
// not part of the public API, but their real "surface" is plugin
// behavior — Vite HMR file-watching + virtual-module CSS emission —
// which is impractical to test end-to-end (tmp fs, watcher events,
// dev server). Testing the pure functions directly catches the common
// regressions at a fraction of the cost.
import { dirname } from 'node:path';
import { loadProject } from '@unpunnyfuns/swatchbook-core';
import type { Config, Project } from '@unpunnyfuns/swatchbook-core';
import { resolverPath, tokensDir } from '@unpunnyfuns/swatchbook-tokens';
import { beforeAll, describe, expect, it } from 'vitest';
import { collectWatchPaths, composeProjectCss } from '#/virtual/plugin.ts';

const CWD = '/project';

function project(sourceFiles: string[]): Project {
  return {
    config: {},
    axes: [],
    disabledAxes: [],
    presets: [],
    permutations: [],
    permutationsResolved: {},
    graph: {},
    sourceFiles,
    diagnostics: [],
  } as Project;
}

describe('collectWatchPaths', () => {
  it('uses config.tokens via picomatch.scan base when provided', () => {
    const config: Config = { tokens: ['tokens/**/*.json'] };
    const paths = collectWatchPaths(config, undefined, CWD);
    expect(paths).toEqual(['/project/tokens']);
  });

  it('resolves the base dir for brace-expansion patterns', () => {
    const config: Config = { tokens: ['tokens/{base,overlays}/**/*.json'] };
    const paths = collectWatchPaths(config, undefined, CWD);
    expect(paths).toEqual(['/project/tokens']);
  });

  it('falls back to sourceFiles dirnames when config.tokens is absent', () => {
    const config: Config = { resolver: 'tokens/resolver.json' };
    const paths = collectWatchPaths(
      config,
      project(['/project/tokens/ref.json', '/project/tokens/sys.json', '/project/custom/x.json']),
      CWD,
    );
    expect(paths).toContain('/project/tokens');
    expect(paths).toContain('/project/custom');
  });

  it('adds the resolver path when set', () => {
    const config: Config = { resolver: 'tokens/resolver.json' };
    const paths = collectWatchPaths(config, project([]), CWD);
    expect(paths).toContain('/project/tokens/resolver.json');
  });

  it('deduplicates overlapping paths', () => {
    const config: Config = {
      tokens: ['tokens/**/*.json'],
      resolver: 'tokens/resolver.json',
    };
    const paths = collectWatchPaths(config, undefined, CWD);
    const unique = new Set(paths);
    expect(paths.length).toBe(unique.size);
  });

  it('handles absolute paths untouched', () => {
    const config: Config = { tokens: ['/abs/tokens/**/*.json'] };
    const paths = collectWatchPaths(config, undefined, CWD);
    expect(paths).toEqual(['/abs/tokens']);
  });
});

describe('composeProjectCss', () => {
  // beforeAll: loadProject takes ~1s; every test reads from the same project.
  let fixtureProject: Project;
  beforeAll(async () => {
    fixtureProject = await loadProject(
      {
        tokens: ['tokens/**/*.json'],
        resolver: resolverPath,
        default: { mode: 'Light', brand: 'Default', contrast: 'Normal' },
        cssVarPrefix: 'sb',
      },
      dirname(tokensDir),
    );
  }, 30_000);

  it('defaults to cartesian — compound selectors present for the fixture', () => {
    const css = composeProjectCss(fixtureProject);
    // Cartesian emission produces compound selectors when the project
    // has multiple axes (mode × brand × contrast in the fixture).
    expect(css).toMatch(/\[data-sb-[^\]]+\]\[data-sb-/);
  });

  it("'projected' emits single-attribute selectors only — no compound selectors anywhere", () => {
    const css = composeProjectCss(fixtureProject, 'projected');
    expect(css).not.toMatch(/\[data-sb-[^\]]+\]\[data-sb-/);
    // And the projection-specific single-attribute selector IS present.
    expect(css).toMatch(/\[data-sb-mode="Dark"\]/);
  });

  it("'projected' produces a stylesheet noticeably smaller than 'cartesian' for the fixture", () => {
    const cartesian = composeProjectCss(fixtureProject, 'cartesian');
    const projected = composeProjectCss(fixtureProject, 'projected');
    // Same size relationship the core unit test pins — projection is
    // under 1/3 the cartesian length for the reference fixture.
    expect(projected.length).toBeLessThan(cartesian.length / 3);
  });

  it('both modes emit the chrome alias block at the tail', () => {
    for (const mode of ['cartesian', 'projected'] as const) {
      const css = composeProjectCss(fixtureProject, mode);
      expect(css).toContain('--swatchbook-surface-default:');
      expect(css).toContain('color-scheme: light dark;');
    }
  });
});

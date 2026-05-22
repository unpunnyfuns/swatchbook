// Pragmatic exception: `collectWatchPaths` is not part of the public API,
// but its real "surface" is Vite HMR file-watching behavior — which is
// impractical to test end-to-end (tmp fs, watcher events, dev server).
// Testing the pure function directly catches the common regressions
// (brace expansion, absolute paths, sourceFiles fallback) at a fraction
// of the cost.
import type { Config, Project } from '@unpunnyfuns/swatchbook-core';
import { expect, it } from 'vitest';
import { collectWatchPaths, swatchbookTokensPlugin } from '#/virtual/plugin.ts';

const CWD = '/project';

function project(sourceFiles: string[]): Project {
  return {
    config: {},
    axes: [],
    disabledAxes: [],
    presets: [],
    sourceFiles,
    diagnostics: [],
  } as Project;
}

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

it('excludes the addon virtual IDs from Vite optimizeDeps pre-bundling', () => {
  // Vite uses esbuild for optimizeDeps, which doesn't see Rollup-style
  // `resolveId` hooks. The config hook tells Vite to route the virtuals
  // through the dev-time plugin pipeline instead of esbuild's bundler.
  const plugin = swatchbookTokensPlugin({
    config: { tokens: ['tokens/**/*.json'] },
    cwd: '/project',
  });
  const configResult =
    typeof plugin.config === 'function'
      ? plugin.config({}, { command: 'serve', mode: 'development' })
      : undefined;
  const exclude =
    configResult && 'optimizeDeps' in configResult ? configResult.optimizeDeps?.exclude : undefined;
  expect(exclude).toEqual(
    expect.arrayContaining([
      'virtual:swatchbook/tokens',
      'virtual:swatchbook/integration-side-effects',
    ]),
  );
});

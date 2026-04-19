import type { Config, Project } from '@unpunnyfuns/swatchbook-core';
import { describe, expect, it } from 'vitest';
import { collectWatchPaths } from '#/virtual/plugin.ts';

const CWD = '/project';

function project(sourceFiles: string[]): Project {
  return {
    config: {},
    axes: [],
    disabledAxes: [],
    presets: [],
    themes: [],
    themesResolved: {},
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

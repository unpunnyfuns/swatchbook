import { dirname } from 'node:path';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { resolverPath, tokensDir } from '@unpunnyfuns/swatchbook-tokens';
import { loadProject } from '#/load.ts';
import type { Project } from '#/types.ts';

const fixtureCwd = dirname(tokensDir);

vi.mock('#/token-graph/build.ts', async (importOriginal) => {
  const original = await importOriginal<typeof import('#/token-graph/build.ts')>();
  return {
    ...original,
    buildTokenGraph: () => {
      throw new Error('synthetic build failure for testing');
    },
  };
});

describe('loadProject — graph build failure recovery', () => {
  let project: Project;

  beforeAll(async () => {
    project = await loadProject(
      {
        tokens: ['tokens/**/*.json'],
        resolver: resolverPath,
        default: { mode: 'Light', brand: 'Default', a11y: 'Normal' },
      },
      fixtureCwd,
    );
  }, 30_000);

  it('does not reject — surfaces failure as a swatchbook/token-graph diagnostic', () => {
    const graphDiag = project.diagnostics.find((d) => d.group === 'swatchbook/token-graph');
    expect(graphDiag).toBeDefined();
    expect(graphDiag?.severity).toBe('error');
    expect(graphDiag?.message).toContain('synthetic build failure for testing');
  });

  it('tokenGraph.nodes is empty when build threw', () => {
    expect(Object.keys(project.tokenGraph.nodes)).toHaveLength(0);
  });
});

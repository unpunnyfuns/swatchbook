// get_token / get_consumer_output must report the CSS var name plugin-css
// actually emits. plugin-css kebab-cases camelCase path segments, so a
// dot-to-dash respelling diverges on any camelCase path.
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadProject } from '@unpunnyfuns/swatchbook-core';
import type { Project } from '@unpunnyfuns/swatchbook-core';
import { expect, it } from 'vitest';
import { startTestServer } from './_helpers.ts';

async function camelCaseProject(): Promise<Project> {
  const cwd = mkdtempSync(join(tmpdir(), 'sb-mcp-camel-'));
  mkdirSync(join(cwd, 'tokens'));
  writeFileSync(
    join(cwd, 'tokens', 't.json'),
    JSON.stringify({ color: { $type: 'color', brandPrimary: { $value: '#3b82f6' } } }),
  );
  return loadProject({ tokens: ['tokens/**/*.json'], cssVarPrefix: 't' }, cwd);
}

it('get_token reports the Terrazzo-derived var name for camelCase paths', async () => {
  const mcp = await startTestServer(await camelCaseProject());
  try {
    const result = await mcp.callJson<{ cssVar: string }>('get_token', {
      path: 'color.brandPrimary',
    });
    expect(result.cssVar).toBe('var(--t-color-brand-primary)');
  } finally {
    await mcp.close();
  }
});

it('get_consumer_output reports the Terrazzo-derived var name for camelCase paths', async () => {
  const mcp = await startTestServer(await camelCaseProject());
  try {
    const result = await mcp.callJson<{ cssVar: string }>('get_consumer_output', {
      path: 'color.brandPrimary',
    });
    expect(result.cssVar).toBe('var(--t-color-brand-primary)');
  } finally {
    await mcp.close();
  }
});

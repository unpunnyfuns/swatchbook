import { afterAll, beforeAll, expect, it } from 'vitest';
import type { Project } from '@unpunnyfuns/swatchbook-core';
import { loadFixtureProject, startTestServer } from './_helpers.ts';
import type { McpTestHarness } from './_helpers.ts';

let mcp: McpTestHarness;

// beforeAll perf escape hatch: fixture + server boot is ~1s; tests are read-only.
beforeAll(async () => {
  const project: Project = await loadFixtureProject();
  mcp = await startTestServer(project);
});

afterAll(async () => {
  await mcp.close();
});

const COLOR_TOKEN = 'color.surface.default';

it('list_tokens errors on an unknown theme instead of silently using the default', async () => {
  const text = await mcp.callText('list_tokens', { theme: 'Nonexistent' });
  expect(text).toContain('Unknown theme');
  expect(text).toContain('Nonexistent');
});

it('get_color_formats errors on an unknown theme', async () => {
  const text = await mcp.callText('get_color_formats', {
    path: COLOR_TOKEN,
    theme: 'Nope',
  });
  expect(text).toContain('Unknown theme');
});

it('a real (non-default) theme name still resolves', async () => {
  const meta = await mcp.callJson<{ themes: string[]; defaultTheme: string }>(
    'describe_project',
    {},
  );
  const nonDefault = meta.themes.find((t) => t !== meta.defaultTheme);
  if (!nonDefault) throw new Error('fixture should surface a non-default theme');
  const result = await mcp.callJson<{ theme: string }>('list_tokens', { theme: nonDefault });
  expect(result.theme).toBe(nonDefault);
});

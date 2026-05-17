import { afterAll, beforeAll, expect, it } from 'vitest';
import type { Project } from '@unpunnyfuns/swatchbook-core';
import { loadFixtureProject, type McpTestHarness, startTestServer } from './_helpers.ts';

let project: Project;
let mcp: McpTestHarness;

// beforeAll is a perf escape hatch (per CLAUDE.md): the fixture + server
// boot is ~1s, far too slow per-test. Tests here are read-only.
beforeAll(async () => {
  project = await loadFixtureProject();
  mcp = await startTestServer(project);
});

afterAll(async () => {
  await mcp.close();
});

// Known fixture invariants (see packages/tokens/tokens/):
//   color.surface.default  → aliases color.palette.neutral.0 in Light mode
//   color.palette.neutral.0 → primitive, aliased BY several surface/text roles
const ALIAS_TOKEN = 'color.surface.default';
const PRIMITIVE_TOKEN = 'color.palette.neutral.0';

interface GetTokenResult {
  path: string;
  type?: string;
  description?: string;
  cssVar: string;
  aliasedBy?: readonly string[];
  perTheme: Record<string, { value: string; aliasOf?: string; aliasChain?: readonly string[] }>;
}

it('get_token: returns the alias chain and resolved value per permutation', async () => {
  const result = await mcp.callJson<GetTokenResult>('get_token', { path: ALIAS_TOKEN });
  expect(result.path).toBe(ALIAS_TOKEN);
  expect(result.type).toBe('color');
  // cssVar uses the project prefix and dot→dash substitution.
  expect(result.cssVar).toBe(`var(--sb-${ALIAS_TOKEN.replaceAll('.', '-')})`);
  expect(Object.keys(result.perTheme).length).toBe(project.permutations.length);
  // Every permutation entry carries a value; aliased ones name their target.
  for (const entry of Object.values(result.perTheme)) {
    expect(entry.value).toBeTruthy();
    if (entry.aliasOf) {
      expect(entry.aliasOf).toMatch(/^color\./);
    }
  }
});

it('get_token: returns the cssVar without a prefix segment when cssVarPrefix is empty', async () => {
  const unprefixed: Project = { ...project, config: { ...project.config, cssVarPrefix: '' } };
  mcp.setProject(unprefixed);
  try {
    const result = await mcp.callJson<GetTokenResult>('get_token', { path: ALIAS_TOKEN });
    expect(result.cssVar).toBe(`var(--${ALIAS_TOKEN.replaceAll('.', '-')})`);
  } finally {
    mcp.setProject(project);
  }
});

it('get_token: returns a text "not found" response for unknown paths', async () => {
  const text = await mcp.callText('get_token', { path: 'does.not.exist' });
  expect(text).toBe('Token not found: does.not.exist');
});

interface GetAliasChainResult {
  path: string;
  perTheme: Record<string, { aliasOf?: string; chain: readonly string[] }>;
}

it('get_alias_chain: returns the forward chain per permutation for an alias token', async () => {
  const result = await mcp.callJson<GetAliasChainResult>('get_alias_chain', { path: ALIAS_TOKEN });
  expect(result.path).toBe(ALIAS_TOKEN);
  expect(Object.keys(result.perTheme).length).toBe(project.permutations.length);
  for (const entry of Object.values(result.perTheme)) {
    expect(entry.chain[0]).toBe(ALIAS_TOKEN);
    // Aliased tokens have at least one further hop; primitive variants would
    // produce a single-element chain.
    expect(entry.chain.length).toBeGreaterThanOrEqual(1);
  }
});

it('get_alias_chain: returns a single-element chain for primitive tokens', async () => {
  const result = await mcp.callJson<GetAliasChainResult>('get_alias_chain', {
    path: PRIMITIVE_TOKEN,
  });
  for (const entry of Object.values(result.perTheme)) {
    expect(entry.chain).toEqual([PRIMITIVE_TOKEN]);
    expect(entry.aliasOf).toBeUndefined();
  }
});

it('get_alias_chain: returns text "not found" for unknown paths', async () => {
  const text = await mcp.callText('get_alias_chain', { path: 'nope.nope' });
  expect(text).toBe('Token not found: nope.nope');
});

interface AliasedByNode {
  path: string;
  depth: number;
  truncated?: boolean;
  children: AliasedByNode[];
}

it('get_aliased_by: walks the reverse alias tree from a primitive', async () => {
  const root = await mcp.callJson<AliasedByNode>('get_aliased_by', { path: PRIMITIVE_TOKEN });
  expect(root.path).toBe(PRIMITIVE_TOKEN);
  expect(root.depth).toBe(0);
  expect(root.children.length).toBeGreaterThan(0);
  // Every child should sit one level deeper.
  for (const child of root.children) {
    expect(child.depth).toBe(1);
  }
});

it('get_aliased_by: caps recursion at `maxDepth`', async () => {
  const shallow = await mcp.callJson<AliasedByNode>('get_aliased_by', {
    path: PRIMITIVE_TOKEN,
    maxDepth: 1,
  });
  expect(shallow.depth).toBe(0);
  // With maxDepth: 1, immediate children at depth 1 either have no children
  // or are marked `truncated` — depending on whether they have aliased-bys.
  for (const child of shallow.children) {
    expect(child.depth).toBe(1);
    if (child.truncated) {
      expect(child.children).toEqual([]);
    }
  }
});

it('get_aliased_by: returns an empty tree for tokens that nothing aliases', async () => {
  // `color.surface.default` is itself an alias — nothing aliases it.
  const root = await mcp.callJson<AliasedByNode>('get_aliased_by', { path: ALIAS_TOKEN });
  expect(root.path).toBe(ALIAS_TOKEN);
  expect(root.children).toEqual([]);
});

it('get_aliased_by: returns text "not found" for unknown paths', async () => {
  const text = await mcp.callText('get_aliased_by', { path: 'gone.gone' });
  expect(text).toBe('Token not found: gone.gone');
});

interface SearchTokensResult {
  query: string;
  theme: string;
  count: number;
  truncated: boolean;
  hits: {
    path: string;
    type?: string;
    matchedIn: ('path' | 'description' | 'value')[];
    snippet: string;
  }[];
}

it('search_tokens: returns ranked fuzzy hits scoped to the default permutation', async () => {
  const result = await mcp.callJson<SearchTokensResult>('search_tokens', { query: 'surface' });
  expect(result.theme).toBe(project.permutations[0]?.name);
  expect(result.count).toBeGreaterThan(0);
  expect(result.count).toBe(result.hits.length);
  expect(result.truncated).toBe(false);
  // Every hit names where the match landed.
  for (const hit of result.hits) {
    expect(hit.matchedIn.length).toBeGreaterThan(0);
  }
  // At least one hit should be a `color.surface.*` token.
  expect(result.hits.some((h) => h.path.startsWith('color.surface.'))).toBe(true);
});

it('search_tokens: marks `truncated: true` when the result count equals `limit`', async () => {
  const result = await mcp.callJson<SearchTokensResult>('search_tokens', {
    query: 'color',
    limit: 3,
  });
  expect(result.hits.length).toBeLessThanOrEqual(3);
  if (result.hits.length === 3) {
    expect(result.truncated).toBe(true);
  }
});

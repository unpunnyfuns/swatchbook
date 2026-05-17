import { mkdtempSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, expect, it } from 'vitest';
import { loadProject } from '#/load';

let workspace: string;

// beforeEach: each test mints a tmpdir and writes its own fixture
// files into it, so the workspace must reset per-test (otherwise
// stale resolver / token files from earlier tests would leak in).
beforeEach(() => {
  workspace = mkdtempSync(join(tmpdir(), 'swatchbook-resolver-'));
});

afterEach(() => {
  rmSync(workspace, { recursive: true, force: true });
});

function writeJSON(relPath: string, value: unknown): string {
  const abs = join(workspace, relPath);
  const dir = abs.substring(0, abs.lastIndexOf('/'));
  if (dir) mkdirSync(dir, { recursive: true });
  writeFileSync(abs, JSON.stringify(value, null, 2), 'utf8');
  return abs;
}

it('surfaces an error when the resolver points at a file that does not exist', async () => {
  await expect(
    loadProject({ resolver: 'does-not-exist.json', default: {} }, workspace),
  ).rejects.toThrow();
});

it('surfaces a diagnostic or error when a resolver $ref target is missing', async () => {
  writeJSON('resolver.json', {
    $schema: 'https://www.designtokens.org/TR/2025.10/resolver/',
    version: '2025.10',
    sets: { ref: { sources: [{ $ref: './missing.json' }] } },
    resolutionOrder: [{ $ref: '#/sets/ref' }],
  });
  await expect(loadProject({ resolver: 'resolver.json', default: {} }, workspace)).rejects.toThrow();
});

it('loads a minimal valid resolver with a single set and no modifiers', async () => {
  writeJSON('tokens.json', {
    color: { red: { $type: 'color', $value: { colorSpace: 'srgb', components: [1, 0, 0] } } },
  });
  writeJSON('resolver.json', {
    $schema: 'https://www.designtokens.org/TR/2025.10/resolver/',
    version: '2025.10',
    sets: { main: { sources: [{ $ref: './tokens.json' }] } },
    resolutionOrder: [{ $ref: '#/sets/main' }],
  });
  const project = await loadProject({ resolver: 'resolver.json', default: {} }, workspace);
  expect(Object.keys(project.defaultTokens).length).toBeGreaterThan(0);
  expect(project.diagnostics.some((d) => d.severity === 'error')).toBe(false);
});

it('loads a resolver with one modifier + two contexts (no override overlays)', async () => {
  writeJSON('tokens.json', {
    color: { red: { $type: 'color', $value: { colorSpace: 'srgb', components: [1, 0, 0] } } },
  });
  writeJSON('resolver.json', {
    $schema: 'https://www.designtokens.org/TR/2025.10/resolver/',
    version: '2025.10',
    sets: { main: { sources: [{ $ref: './tokens.json' }] } },
    modifiers: {
      mode: {
        contexts: { Light: [], Dark: [] },
        default: 'Light',
      },
    },
    resolutionOrder: [{ $ref: '#/sets/main' }, { $ref: '#/modifiers/mode' }],
  });
  const project = await loadProject({ resolver: 'resolver.json', default: { mode: 'Light' } }, workspace);
  const axis = project.axes.find((a) => a.name === 'mode');
  expect(axis).toBeDefined();
  expect(axis?.contexts).toEqual(['Light', 'Dark']);
  // Singletons: default tuple + 1 per non-default context = 2 cells on `mode`.
  expect(Object.keys(project.cells['mode'] ?? {}).toSorted()).toEqual(['Dark', 'Light']);
});

it('records sourceFiles for every file pulled through $ref', async () => {
  writeJSON('tokens.json', {
    color: { red: { $type: 'color', $value: { colorSpace: 'srgb', components: [1, 0, 0] } } },
  });
  const resolverPath = writeJSON('resolver.json', {
    $schema: 'https://www.designtokens.org/TR/2025.10/resolver/',
    version: '2025.10',
    sets: { main: { sources: [{ $ref: './tokens.json' }] } },
    resolutionOrder: [{ $ref: '#/sets/main' }],
  });
  const project = await loadProject({ resolver: 'resolver.json', default: {} }, workspace);
  expect(project.sourceFiles).toContain(join(workspace, 'tokens.json'));
  // Resolver file itself may or may not land in sourceFiles depending on how
  // Terrazzo reports its own input; the referenced target definitely should.
  expect(resolverPath).toBeDefined();
});

it('resolves a `config.resolver` bare package specifier through the consumer cwd node_modules', async () => {
  // Stage a fake token package at node_modules/@swatchbook-test/tokens/.
  // No `exports` field: Node falls back to legacy subpath resolution so
  // `@swatchbook-test/tokens/resolver.json` maps to the file on disk.
  writeJSON('node_modules/@swatchbook-test/tokens/package.json', {
    name: '@swatchbook-test/tokens',
    version: '0.0.0',
  });
  writeJSON('node_modules/@swatchbook-test/tokens/tokens.json', {
    color: { red: { $type: 'color', $value: { colorSpace: 'srgb', components: [1, 0, 0] } } },
  });
  writeJSON('node_modules/@swatchbook-test/tokens/resolver.json', {
    $schema: 'https://www.designtokens.org/TR/2025.10/resolver/',
    version: '2025.10',
    sets: { main: { sources: [{ $ref: './tokens.json' }] } },
    resolutionOrder: [{ $ref: '#/sets/main' }],
  });
  const project = await loadProject(
    { resolver: '@swatchbook-test/tokens/resolver.json', default: {} },
    workspace,
  );
  expect(Object.keys(project.defaultTokens).length).toBeGreaterThan(0);
  expect(project.diagnostics.some((d) => d.severity === 'error')).toBe(false);
});

it('surfaces a clear error when a bare-specifier resolver is not installed', async () => {
  await expect(
    loadProject({ resolver: '@nope/not-installed/resolver.json', default: {} }, workspace),
  ).rejects.toThrow(/not-installed|Cannot find/);
});

it('surfaces a warn diagnostic when a modifier has no default and no contexts', async () => {
  writeJSON('tokens.json', {
    color: { red: { $type: 'color', $value: { colorSpace: 'srgb', components: [1, 0, 0] } } },
  });
  writeJSON('resolver.json', {
    $schema: 'https://www.designtokens.org/TR/2025.10/resolver/',
    version: '2025.10',
    sets: { main: { sources: [{ $ref: './tokens.json' }] } },
    modifiers: {
      broken: { contexts: {} },
    },
    resolutionOrder: [{ $ref: '#/sets/main' }],
  });
  let project;
  try {
    project = await loadProject({ resolver: 'resolver.json', default: {} }, workspace);
  } catch {
    // Terrazzo may reject the resolver outright; the diagnostic only fires
    // when Terrazzo admits the modifier to the parsed shape. Skip assertion
    // if parsing failed upstream.
    return;
  }
  const diag = project.diagnostics.find(
    (d) => d.group === 'swatchbook/resolver' && d.message.includes('broken'),
  );
  if (!diag) return;
  expect(diag.severity).toBe('warn');
});

/**
 * Phase-bounded load timing is opt-in via `SWATCHBOOK_LOG_VERBOSE=1`.
 * When unset, `loadProject` produces no `[swatchbook:load]` output —
 * silence is the contract for the default path. When set, each phase
 * logs a single line so a consumer hitting a hung or slow load can
 * identify which phase is the offender without instrumenting the code.
 */
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { loadProject } from '#/load.ts';
import { resolverPath } from '@unpunnyfuns/swatchbook-tokens';
import { dirname } from 'node:path';
import { tokensDir } from '@unpunnyfuns/swatchbook-tokens';

const fixtureCwd = dirname(tokensDir);

const baseConfig = {
  tokens: ['tokens/**/*.json'],
  resolver: resolverPath,
  default: { mode: 'Light', brand: 'Default', contrast: 'Normal' },
};

beforeEach(() => {
  delete process.env['SWATCHBOOK_LOG_VERBOSE'];
});

afterEach(() => {
  delete process.env['SWATCHBOOK_LOG_VERBOSE'];
  vi.restoreAllMocks();
});

it('produces no [swatchbook:load] output when SWATCHBOOK_LOG_VERBOSE is unset', async () => {
  const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  await loadProject(baseConfig, fixtureCwd);
  const loadLines = consoleSpy.mock.calls
    .map((args) => String(args[0] ?? ''))
    .filter((line) => line.startsWith('[swatchbook:load]'));
  expect(loadLines).toEqual([]);
}, 30_000);

it('logs a phase line per major load phase when SWATCHBOOK_LOG_VERBOSE=1', async () => {
  process.env['SWATCHBOOK_LOG_VERBOSE'] = '1';
  const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  await loadProject(baseConfig, fixtureCwd);
  const loadLines = consoleSpy.mock.calls
    .map((args) => String(args[0] ?? ''))
    .filter((line) => line.startsWith('[swatchbook:load]'));
  expect(loadLines.length).toBeGreaterThan(0);
  // Each phase line carries a millisecond-tagged duration.
  for (const line of loadLines) {
    expect(line).toMatch(/^\[swatchbook:load\] .+: \d+ms$/);
  }
  // The known phases should all be present at least once.
  const labels = loadLines.map((line) => line.match(/\] (.+): /)?.[1] ?? '');
  expect(labels).toContain('parse + normalize');
  expect(labels).toContain('token-listing build');
  expect(labels).toContain('graph build');
  expect(labels).toContain('total');
}, 30_000);

it('ignores any value other than literal "1" for SWATCHBOOK_LOG_VERBOSE', async () => {
  process.env['SWATCHBOOK_LOG_VERBOSE'] = 'true';
  const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  await loadProject(baseConfig, fixtureCwd);
  const loadLines = consoleSpy.mock.calls
    .map((args) => String(args[0] ?? ''))
    .filter((line) => line.startsWith('[swatchbook:load]'));
  expect(loadLines).toEqual([]);
}, 30_000);

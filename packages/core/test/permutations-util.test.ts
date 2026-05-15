/**
 * Direct unit coverage of helpers from `src/permutations/util.ts`.
 * `cartesianSize` + `permutationGuardDiagnostic` are exercised
 * indirectly via `max-permutations.test.ts`'s pathological-resolver
 * cases; this file pins the helpers themselves so the orchestration
 * test can stay focused on the loader behaviour.
 */
import { mkdtempSync, rmSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { Axis } from '#/types.ts';
import {
  cartesianSize,
  collectGlobbedFiles,
  DEFAULT_MAX_PERMUTATIONS,
  permutationGuardDiagnostic,
} from '#/permutations/util.ts';

function axis(name: string, contexts: string[]): Axis {
  return { name, contexts, default: contexts[0] ?? '', source: 'resolver' };
}

describe('cartesianSize', () => {
  it('returns 1 for an empty axis list', () => {
    expect(cartesianSize([])).toBe(1);
  });

  it('multiplies axis context counts', () => {
    expect(cartesianSize([axis('mode', ['Light', 'Dark'])])).toBe(2);
    expect(cartesianSize([axis('mode', ['Light', 'Dark']), axis('brand', ['A', 'B', 'C'])])).toBe(6);
  });

  it('treats axes with zero contexts as 1 (no-op modifier doesnt multiply)', () => {
    expect(cartesianSize([axis('mode', ['Light', 'Dark']), axis('empty', [])])).toBe(2);
  });

  it('handles realistic many-axis state-space products', () => {
    // 2 × 2 × 3 × 4 × 5 = 240
    expect(
      cartesianSize([
        axis('a', ['x', 'y']),
        axis('b', ['x', 'y']),
        axis('c', ['x', 'y', 'z']),
        axis('d', ['x', 'y', 'z', 'w']),
        axis('e', ['1', '2', '3', '4', '5']),
      ]),
    ).toBe(240);
  });
});

describe('DEFAULT_MAX_PERMUTATIONS', () => {
  it('is 1024 — pin so a bump shows up as a code review', () => {
    // Loader code defaults `config.maxPermutations` to this constant.
    // Changing it changes default load behaviour for every consumer.
    expect(DEFAULT_MAX_PERMUTATIONS).toBe(1024);
  });
});

describe('permutationGuardDiagnostic', () => {
  it('returns a warn diagnostic in the `swatchbook/permutations` group', () => {
    const diag = permutationGuardDiagnostic(15_000_000, 1024);
    expect(diag.severity).toBe('warn');
    expect(diag.group).toBe('swatchbook/permutations');
  });

  it('includes both numbers formatted with locale separators', () => {
    const diag = permutationGuardDiagnostic(15_000_000, 1024);
    expect(diag.message).toContain('15,000,000');
    expect(diag.message).toContain('1,024');
  });

  it('hints at the remediation paths in the message', () => {
    const diag = permutationGuardDiagnostic(2048, 1024);
    expect(diag.message).toContain('presets');
    expect(diag.message).toContain('disabledAxes');
    expect(diag.message).toContain('maxPermutations');
  });
});

describe('collectGlobbedFiles', () => {
  let workspace: string;

  beforeEach(() => {
    workspace = mkdtempSync(join(tmpdir(), 'swatchbook-util-glob-'));
  });

  afterEach(() => {
    rmSync(workspace, { recursive: true, force: true });
  });

  function writeFile(rel: string, body = '{}'): void {
    const abs = join(workspace, rel);
    const dir = abs.substring(0, abs.lastIndexOf('/'));
    if (dir) mkdirSync(dir, { recursive: true });
    writeFileSync(abs, body, 'utf8');
  }

  it('expands globs relative to cwd and returns absolute, sorted, deduplicated paths', () => {
    writeFile('tokens/a.json');
    writeFile('tokens/b.json');
    writeFile('tokens/nested/c.json');
    const out = collectGlobbedFiles(['tokens/*.json'], workspace);
    expect(out).toEqual([join(workspace, 'tokens/a.json'), join(workspace, 'tokens/b.json')]);
  });

  it('deduplicates overlapping patterns', () => {
    writeFile('tokens/a.json');
    writeFile('tokens/b.json');
    const out = collectGlobbedFiles(['tokens/*.json', 'tokens/a.json'], workspace);
    expect(out).toEqual([join(workspace, 'tokens/a.json'), join(workspace, 'tokens/b.json')]);
  });

  it('returns an empty array when no files match', () => {
    expect(collectGlobbedFiles(['nope/*.json'], workspace)).toEqual([]);
  });

  it('accepts an absolute path as a pattern (returns it as-is if it exists)', () => {
    writeFile('explicit.json');
    const explicit = join(workspace, 'explicit.json');
    const out = collectGlobbedFiles([explicit], workspace);
    expect(out).toEqual([explicit]);
  });
});

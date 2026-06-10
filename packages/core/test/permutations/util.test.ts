import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { expect, it } from 'vitest';
import { collectGlobbedFiles } from '#/permutations/util.ts';

function fixtureDir(): string {
  const dir = mkdtempSync(join(tmpdir(), 'swatchbook-glob-'));
  writeFileSync(join(dir, 'a.json'), '{}');
  writeFileSync(join(dir, 'b.json'), '{}');
  mkdirSync(join(dir, 'sub'));
  writeFileSync(join(dir, 'sub', 'c.json'), '{}');
  return dir;
}

it('returns absolute paths in sorted order', () => {
  const dir = fixtureDir();
  const result = collectGlobbedFiles(['*.json', 'sub/*.json'], dir);
  expect(result).toEqual([join(dir, 'a.json'), join(dir, 'b.json'), join(dir, 'sub', 'c.json')]);
});

it('deduplicates files matched by overlapping patterns', () => {
  const dir = fixtureDir();
  const result = collectGlobbedFiles(['*.json', '*.json', 'a.json'], dir);
  expect(result.filter((p) => p.endsWith('a.json'))).toHaveLength(1);
});

it('returns an empty array when nothing matches', () => {
  const dir = fixtureDir();
  expect(collectGlobbedFiles(['*.css'], dir)).toEqual([]);
});

it('keeps already-absolute matches without re-resolving against cwd', () => {
  const dir = fixtureDir();
  // An absolute glob makes globSync yield absolute matches, exercising the
  // isAbsolute branch that skips the resolve(cwd, match) step.
  const result = collectGlobbedFiles([join(dir, '*.json')], dir);
  expect(result).toEqual([join(dir, 'a.json'), join(dir, 'b.json')]);
});

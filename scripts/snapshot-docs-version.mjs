#!/usr/bin/env node
// Snapshot the docusaurus docs/ tree under versioned_docs/version-<MAJOR.MINOR>/
// on minor or major releases, so each released minor carries its own frozen
// docs. Patch releases no-op — the current minor's snapshot stays as it was
// when the minor shipped.
//
// Runs from the root `version` script (after `changeset version` has bumped
// workspace package.json versions), so the snapshot lands in the same
// "Version Packages" PR that Changesets opens.

import { existsSync, readFileSync } from 'node:fs';
import { execSync, spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, '..');

const next = JSON.parse(
  readFileSync(join(repoRoot, 'packages/core/package.json'), 'utf8'),
).version;

let prev;
try {
  prev = JSON.parse(
    execSync('git show HEAD:packages/core/package.json', {
      cwd: repoRoot,
      encoding: 'utf8',
    }),
  ).version;
} catch (err) {
  console.error('[snapshot-docs] failed to read prior version from git:', err.message);
  process.exit(1);
}

const parse = (v) => {
  const m = v.match(/^(\d+)\.(\d+)\.(\d+)/);
  if (!m) throw new Error(`unexpected version: ${v}`);
  return { major: Number(m[1]), minor: Number(m[2]), patch: Number(m[3]) };
};

const a = parse(prev);
const b = parse(next);

if (a.major === b.major && a.minor === b.minor) {
  console.log(`[snapshot-docs] patch bump ${prev} → ${next}, skipping snapshot`);
  process.exit(0);
}

const series = `${b.major}.${b.minor}`;
const versionedDir = join(repoRoot, 'apps/docs/versioned_docs', `version-${series}`);
if (existsSync(versionedDir)) {
  console.log(`[snapshot-docs] version-${series} already exists, skipping`);
  process.exit(0);
}

console.log(`[snapshot-docs] ${prev} → ${next}: cutting docs snapshot for ${series}`);
const result = spawnSync(
  'pnpm',
  ['--filter', '@unpunnyfuns/swatchbook-docs', 'exec', 'docusaurus', 'docs:version', series],
  { cwd: repoRoot, stdio: 'inherit' },
);
process.exit(result.status ?? 1);

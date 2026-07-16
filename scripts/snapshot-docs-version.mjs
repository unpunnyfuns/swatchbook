#!/usr/bin/env node
// Cut/refresh the stable docs snapshot on release.
//
// starlight-versions archives the *current* `content/docs/**` tree into
// `content/docs/<slug>/**` the moment a new slug appears in
// `apps/docs/src/versions.config.json`'s `versions` array and an Astro
// build/dev run happens -- its own `ensureNewVersion` hook does the copy,
// including the per-file `slug:` frontmatter and internal-link versioning
// (see apps/docs/astro.config.mjs's comment on the plugin's URL model). This
// script drives that mechanism rather than reimplementing it: drop the
// previously archived version, point the plugin at the new series, then run
// one build so the plugin performs the archive itself.
//
// Pre-1.0 single-stable-snapshot policy (see CLAUDE.md): only ever one
// archived version on disk. starlight-versions has no "replace" operation --
// it only ever adds a version, and throws if more than one un-archived slug
// is configured at once -- so the previous archive has to be deleted here,
// before the plugin's own archive hook runs. Skipping that step nests the
// old archive inside the new one (verified empirically: leaving a stale
// slug directory in `content/docs/` while configuring a different new one
// copies the stale directory into the new archive too, since the plugin
// only skips directories that are still listed in its own config).
//
// Prerelease versions (e.g. `1.0.0-alpha.N`) skip snapshotting entirely: the
// stable archive stays frozen while a prerelease channel is open, and only
// the unreleased "current" tree (root, unprefixed) moves.
//
// Runs from the root `version` script (after `changeset version` has bumped
// workspace package.json versions), so the snapshot change lands in the same
// "Version Packages" PR that Changesets opens.

import { existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, '..');
const docsRoot = join(repoRoot, 'apps/docs');
const versionsConfigPath = join(docsRoot, 'src/versions.config.json');
const contentDocsRoot = join(docsRoot, 'src/content/docs');
const contentVersionsRoot = join(docsRoot, 'src/content/versions');

/**
 * Decide what the docs snapshot step should do for a given core version.
 * Prerelease versions (e.g. `1.0.0-alpha.3`) skip snapshotting: during a
 * prerelease channel the stable archive stays frozen and only the current
 * (unreleased) tree moves. Non-prerelease versions archive under
 * `<major>.<minor>`.
 */
export function snapshotPlan(version) {
  const match = version.match(/^(\d+)\.(\d+)\.(\d+)(-[0-9A-Za-z.-]+)?$/);
  if (!match) return { action: 'error', message: `unexpected core version: ${version}` };
  if (match[4])
    return { action: 'skip', message: `prerelease ${version} — docs snapshot left unchanged` };
  return { action: 'snapshot', series: `${match[1]}.${match[2]}` };
}

function main() {
  const next = JSON.parse(
    readFileSync(join(repoRoot, 'packages/core/package.json'), 'utf8'),
  ).version;

  const plan = snapshotPlan(next);
  if (plan.action === 'error') {
    console.error(`[snapshot-docs] ${plan.message}`);
    process.exit(1);
  }
  if (plan.action === 'skip') {
    console.log(`[snapshot-docs] ${plan.message}`);
    process.exit(0);
  }
  const series = plan.series;

  const versionsConfig = JSON.parse(readFileSync(versionsConfigPath, 'utf8'));
  const previousSlugs = versionsConfig.versions.map((v) => v.slug);

  if (previousSlugs.includes(series)) {
    console.log(`[snapshot-docs] ${series} is already the archived version — nothing to do.`);
    process.exit(0);
  }

  for (const slug of previousSlugs) {
    const slugDocsDir = join(contentDocsRoot, slug);
    const slugManifest = join(contentVersionsRoot, `${slug}.json`);
    if (existsSync(slugDocsDir)) rmSync(slugDocsDir, { recursive: true, force: true });
    if (existsSync(slugManifest)) rmSync(slugManifest, { force: true });
    console.log(`[snapshot-docs] dropped previous archived version '${slug}'`);
  }

  writeFileSync(
    versionsConfigPath,
    `${JSON.stringify(
      { ...versionsConfig, versions: [{ slug: series, label: `${series} (stable)` }] },
      null,
      2,
    )}\n`,
  );

  console.log(`[snapshot-docs] archiving docs for ${series} (release ${next})`);
  // A single build is enough to trigger starlight-versions' `ensureNewVersion`
  // hook: it runs during `config:setup`, before any page rendering.
  const result = spawnSync('pnpm', ['--filter', '@unpunnyfuns/swatchbook-docs', 'build'], {
    cwd: repoRoot,
    stdio: 'inherit',
  });
  process.exit(result.status ?? 1);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

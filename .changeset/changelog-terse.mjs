// Terse changelog formatter: one line per change — the changeset summary's
// first line, plus its commit. Longer detail belongs in the linked commit/PR,
// not the changelog. Dependency lines reuse the default changeset behaviour.
//
// ESM, matching @changesets/cli v3. The v2-era `.cjs` form reached the
// default formatter through `require()`, which only kept working under v3
// because Node 24 permits requiring an ES module.
import defaultChangelog from '@changesets/cli/changelog';

async function getReleaseLine(changeset) {
  const firstLine =
    (changeset.summary || '')
      .split('\n')
      .map((line) => line.trim())
      .find(Boolean) ?? '';
  return `- ${changeset.commit ? `${changeset.commit}: ` : ''}${firstLine}`;
}

export default {
  getReleaseLine,
  getDependencyReleaseLine: defaultChangelog.getDependencyReleaseLine,
};

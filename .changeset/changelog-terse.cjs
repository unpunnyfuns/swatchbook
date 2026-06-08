// Terse changelog formatter: one line per change — the changeset summary's
// first line, plus its commit. Longer detail belongs in the linked commit/PR,
// not the changelog. Dependency lines reuse the default changeset behaviour.
const defaultChangelog = require('@changesets/cli/changelog').default;

async function getReleaseLine(changeset) {
  const firstLine =
    (changeset.summary || '')
      .split('\n')
      .map((line) => line.trim())
      .find(Boolean) ?? '';
  return `- ${changeset.commit ? `${changeset.commit}: ` : ''}${firstLine}`;
}

module.exports = {
  default: {
    getReleaseLine,
    getDependencyReleaseLine: defaultChangelog.getDependencyReleaseLine,
  },
};

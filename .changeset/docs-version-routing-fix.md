---
'@unpunnyfuns/swatchbook-blocks': patch
---

fix(docs): route latest release at `/` and main-branch at `/next/`

The docusaurus site's versioning config had drifted — `lastVersion: 'current'` pinned the main-branch docs to `/`, which caused Docusaurus to flag the released 0.10 snapshot as "out of date" even though 0.10 is the currently-shipping version. Visitors landing on `/` were reading unreleased content by default.

Now matches the intent described in CLAUDE.md: `/` serves the latest released snapshot (implicit `lastVersion` from the first entry in `versions.json`); main-branch docs move to `/next/` with an "unreleased documentation" banner. Visitors shipping against `@unpunnyfuns/swatchbook-*@0.10.2` land on docs that match their installed code.

No content changes — this is a routing-config fix.

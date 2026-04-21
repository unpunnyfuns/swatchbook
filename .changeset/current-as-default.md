---
'@unpunnyfuns/swatchbook-core': patch
---

docs: serve main-branch docs at `/` instead of the last-cut release

Pre-1.0, pinning the docs default at the last release means visitors
see a snapshot that's often behind what's actually on `main`. Flip
`lastVersion: 'current'` so the main-branch docs mount at `/` with a
plain "Next" label (no more "unreleased" banner — nothing to warn
about when current *is* the headline). Released snapshots keep working
at `/<version>/` through the version dropdown.

---
'@unpunnyfuns/swatchbook-integrations': patch
---

Move `@unpunnyfuns/swatchbook-core` from `peerDependencies` to `dependencies`. The two packages ship together in the fixed-version group, so the peer-dep framing buys nothing and triggers Changesets' peer-dep safety cascade (forcing a major bump across the entire fixed group when any member's version moves).

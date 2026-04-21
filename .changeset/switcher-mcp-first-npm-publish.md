---
'@unpunnyfuns/swatchbook-switcher': minor
'@unpunnyfuns/swatchbook-mcp': minor
---

feat(switcher, mcp): first npm publish

Earlier releases listed these packages in the repo and docs, but they never reached the npm registry — `npm install @unpunnyfuns/swatchbook-switcher` and `npm install @unpunnyfuns/swatchbook-mcp` both 404'd because trusted publishing was configured for `core` / `addon` / `blocks` only, and the partial-publish failure caused `changesets/action` to skip the subsequent tag push too (which is why git tags stopped at 0.6.2).

Bootstrapped via npm's pending-trusted-publisher flow on both package names. Subsequent releases publish alongside `core` / `addon` / `blocks` via the standard OIDC path, and the tag / GitHub-release step runs normally.

This changeset also tips the fixed-version group to 0.11.0 — the arrival of these two packages on the registry is the right anchor for a minor bump.

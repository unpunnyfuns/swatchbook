# @unpunnyfuns/swatchbook-integrations

## 0.13.1

### Patch Changes

- @unpunnyfuns/swatchbook-core@0.13.1

## 0.13.0

### Patch Changes

- 562bbc7: Release plumbing: `@unpunnyfuns/swatchbook-integrations` joins the fixed-version group so it releases in lockstep with core / addon / blocks / switcher / mcp (reaching `0.13.0` at its first publish).
- f66b9ef: Move `@unpunnyfuns/swatchbook-core` from `peerDependencies` to `dependencies`. The two packages ship together in the fixed-version group, so the peer-dep framing buys nothing and triggers Changesets' peer-dep safety cascade (forcing a major bump across the entire fixed group when any member's version moves).
- Updated dependencies [018f518]
- Updated dependencies [f03161f]
- Updated dependencies [74e755c]
  - @unpunnyfuns/swatchbook-core@0.13.0

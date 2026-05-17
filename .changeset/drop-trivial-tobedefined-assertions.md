---
"@unpunnyfuns/swatchbook-blocks": patch
---

Partial close of #829. Drops trivial `.toBeDefined()` assertions on `getByText` / `getByTestId` / `findByTestId` results across the blocks test suite (38 sites in 10 files). Testing Library's `getByX` throws on absence, so `.toBeDefined()` was a no-op — the throw already enforced the invariant. The presence check now reads as `screen.getByText('…')` (or `screen.getByTestId('…')`) without the redundant assertion wrapper.

Three remaining `.toBeDefined()` call sites that were also no-ops (against variables already returned by a throwing finder + then narrowed via `as`) are similarly cleaned up.

The "one describe per file" half of #829 — splitting 4 multi-describe test files — is deferred to #858 for review-burden separation. No behavior change in this PR.

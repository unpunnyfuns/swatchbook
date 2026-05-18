---
"@unpunnyfuns/swatchbook-core": minor
---

Closes #891. Removes the dead `emitViaTerrazzo` emitter and drops `Project.parserInput` from the public type. Two birds, one PR — `emitViaTerrazzo` was the only remaining public consumer of `parserInput`, and removing it lets the field move into a loader-internal closed-over local.

**What's gone:**
- `packages/core/src/emit-via-terrazzo.ts` — ~260 lines of code, dead since the "smart emitter is the only emitter" commit (905165d / PR #806). No consumer in any package; the smart `emitAxisProjectedCss` is the sole emission path.
- `packages/core/test/emit-via-terrazzo.test.ts` — its 7 tests vanish with the source.
- `Project.parserInput` — was an `@internal` field but visibly typed (`tokens: Record<string, TokenNormalized>; sources: InputSourceWithDocument[]; resolver: Resolver`), leaking three Terrazzo types onto the public `Project` shape. Consumers could destructure into shapes outside our control.

**What stays:**
- The `ParserInput` interface itself stays in `types.ts` — re-tagged `@internal Internal to the loader pipeline`. It still gets threaded through `loadResolverPermutations` → `loadProject` → `computeTokenListing` during load, then dropped. The shape never lands on a public surface.
- Resolver-backed token-listing emission still works (uses `parserInput` via parameter passing inside the loader, never via `Project`).

**Test-side change:** `packages/core/test/resolve-at.test.ts` had two tests using `project.parserInput.resolver.apply(tuple)` as the oracle for `resolveAt`'s correctness. They now load the resolver out-of-band via `loadResolverPermutations` directly (test-internal side-channel — fine for testing the loader, not something external consumers should mimic). Coverage is identical; just the access path changed.

Removed the `expect(layeredProject.parserInput).toBeUndefined()` assertion in `variance-analysis-layered.test.ts` — the field no longer exists to be undefined.

Pre-1.0 minor bump per project semver. Bundle of audit #887 critical #2 + worth-a-PR #6.

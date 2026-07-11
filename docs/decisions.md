# Decisions

Tactical and strategic choices that don't change design intent enough to warrant a plan edit. Newest first.

## 2026-07-11 — Terrazzo `plugin-token-listing` coupling: accept consciously for 1.0

1.0 stability is a promise about swatchbook's own public surface, not about `@terrazzo/plugin-token-listing`'s output format. The plugin stays exact-pinned at `0.1.1` (pre-1.0, unstable) and `Project.listing` couples to its shape. If that format churns and breaks our listing read, `computeTokenListing` is the insulation seam (it can swap to direct `getTransforms` consumption) and we absorb the change as a patch or minor. A `plugin-token-listing` format change is never on its own a swatchbook 2.0 trigger. Rejected: hardening the seam before 1.0 (premature; the insulation already exists), and waiting for the plugin to reach a stable 1.0 (that hands 1.0 timing to an upstream we don't control while swatchbook is already in production use).

## 2026-07-11 — Enter a 1.0.0-alpha prerelease channel

Move to a bounded, iterate-in-the-open `1.0.0-alpha.N` channel (Changesets pre-release mode, `alpha` dist-tag) rather than cutting `1.0.0` directly. The alpha window is where the API-surface audit and the `@terrazzo/plugin-token-listing@0.1.1` coupling decision get made with real feedback. Stable is frozen at 0.69.1 (all-in on alpha; no parallel maintenance line). No separate beta/rc: the path is `alpha.N → 1.0.0`, gated on the API audit closing, the Terrazzo stance being decided, issue #1309 fixed, and one quiet no-breaking cycle.

`alpha.0` is a mechanical flip of the current surface (no feature changes) to prove the pre-mode publish pipeline. During the alpha the semver policy stays "breaking = minor" (rendered as `alpha.N` increments); the flip to "breaking = major" lands with the `1.0.0` cut. The docs snapshot step skips prerelease versions, so the `/` snapshot stays frozen at 0.69 and docs fixes reach `/next/` only until 1.0.0.

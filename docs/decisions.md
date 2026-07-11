# Decisions

Tactical and strategic choices that don't change design intent enough to warrant a plan edit. Newest first.

## 2026-07-11 — Enter a 1.0.0-alpha prerelease channel

Move to a bounded, iterate-in-the-open `1.0.0-alpha.N` channel (Changesets pre-release mode, `alpha` dist-tag) rather than cutting `1.0.0` directly. The alpha window is where the API-surface audit and the `@terrazzo/plugin-token-listing@0.1.1` coupling decision get made with real feedback. Stable is frozen at 0.69.1 (all-in on alpha; no parallel maintenance line). No separate beta/rc: the path is `alpha.N → 1.0.0`, gated on the API audit closing, the Terrazzo stance being decided, issue #1309 fixed, and one quiet no-breaking cycle.

`alpha.0` is a mechanical flip of the current surface (no feature changes) to prove the pre-mode publish pipeline. During the alpha the semver policy stays "breaking = minor" (rendered as `alpha.N` increments); the flip to "breaking = major" lands with the `1.0.0` cut. The docs snapshot step skips prerelease versions, so the `/` snapshot stays frozen at 0.69 and docs fixes reach `/next/` only until 1.0.0.

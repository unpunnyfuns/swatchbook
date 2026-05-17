---
"@unpunnyfuns/swatchbook-core": patch
"@unpunnyfuns/swatchbook-blocks": patch
---

Closes #823 and #832. Test-only.

- **`@unpunnyfuns/swatchbook-core`** — the existing `swatchbook/resolver` test in `resolver-edge-cases.test.ts` was silently `return`ing in both branches (Terrazzo-rejects + diagnostic-absent), asserting nothing in either edge case. Tightened so exactly one of the two acceptable outcomes must hold: either `loadProject` throws with a recognizable error, or the project carries a `swatchbook/resolver` warn naming the broken modifier.
- **`@unpunnyfuns/swatchbook-blocks`** — new `prefers-reduced-motion.test.tsx` covers the `usePrefersReducedMotion` hook + the internal `isChromatic` detector by stubbing `navigator.userAgent` and `window.matchMedia`. Three cases: Chromatic-UA-wins-over-matchMedia, matchMedia-true outside Chromatic, both-false fall-through. Pins the Chromatic detection so a silent regression doesn't un-stabilize the motion-bearing visual snapshots.

The third audit-flagged diagnostic (`swatchbook/project` at `load.ts:107-113`) is unreachable under singleton enumeration — separately tracked as #852.

---
"@unpunnyfuns/swatchbook-core": minor
"@unpunnyfuns/swatchbook-blocks": patch
"@unpunnyfuns/swatchbook-addon": patch
---

Closes #866. Collapses `JointOverrides` from `ReadonlyMap<string, JointOverride>` to `ReadonlyArray<readonly [string, JointOverride]>` — the same shape consumers already saw on the wire (virtual module, Storybook channel) and what blocks-side `makeResolveAt` already reconstructed Maps from on every snapshot read.

No consumer uses keyed lookup. The three downstream callers (`buildResolveAt` in `resolve-at.ts`, `analyzeProjectVariance` in `variance-analysis.ts`, the smart emitter's `collectJointBlocks` in `css-axis-projected.ts`) all do `for (const … of …values())` iteration; switching to `for (const [, override] of …)` array destructuring is the only call-site change. Tests using `.size` switch to `.length`.

`probeJointOverrides` still uses an internal `Map<string, JointOverride>` for canonical-key dedupe across arity passes; the public return is materialized to the array shape on emit. The Map-↔-array marshaling on the wire boundary disappears: `addon/virtual/plugin.ts` (both module body and HMR re-broadcast) stops calling `[...project.jointOverrides.entries()]`, and `blocks/internal/use-project.ts` stops `new Map(...)` reconstructing on every render.

Pre-1.0 minor bump (`JointOverrides` is a public type export from core).

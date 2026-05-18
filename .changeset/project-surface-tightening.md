---
'@unpunnyfuns/swatchbook-core': minor
'@unpunnyfuns/swatchbook-blocks': patch
'@unpunnyfuns/swatchbook-addon': patch
---

Tighten the canonical `Project` type surface — pre-1.0 readonly + closed-set narrowing pass.

- `Project.chrome: Record<string, string>` → `Partial<Record<ChromeRole, string>>`. The `validateChrome` loader already enforces keys ∈ `CHROME_ROLES` at runtime; the type now reflects it. Same on `CommonConfig.chrome`.
- `Project.axes: Axis[]` → `readonly Axis[]`. Matches the existing `readonly` on sibling fields (`disabledAxes`, `presets`); post-load the array is immutable in practice.
- `Project.sourceFiles: string[]` → `readonly string[]`. Same rationale.
- `SnapshotForWire.varianceByPath` drops the `ReturnType<Project['varianceByPath']['get']>` indirection (which carries an unused `| undefined`) for the direct `Record<string, AxisVarianceResult>` it always actually is.
- `Permutation.input: Record<string, string>` → `Readonly<Record<string, string>>`. Internal `@internal` field; readonly matches its consumer pattern.
- Added `never` exhaustiveness `default:` branches to two switches over closed unions: `axisTouchesToken` over `VarianceInfo` (`packages/core/src/css-axis-projected.ts`) and `AxisVariance`'s render switch over `AxisVarianceResult` (`packages/blocks/src/token-detail/AxisVariance.tsx`). A future variant lands and these throw loudly at runtime instead of falling through silently.
- Aligned `addon/channel-types.ts` `VirtualToken` with `blocks/contexts.ts` `VirtualTokenShape` — added the missing `aliasOf` / `aliasChain` / `aliasedBy` / `partialAliasOf` fields so what ships over the channel matches what blocks expect to read.

Closes #940

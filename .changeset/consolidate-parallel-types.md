---
'@unpunnyfuns/swatchbook-core': minor
'@unpunnyfuns/swatchbook-blocks': patch
'@unpunnyfuns/swatchbook-addon': patch
---

Consolidate parallel type definitions: `@unpunnyfuns/swatchbook-blocks`'s `VirtualAxisShape` / `VirtualPermutationShape` / `VirtualDiagnosticShape` / `VirtualPresetShape` are now type-aliases of core's authoritative `Axis` / `Permutation` / `Diagnostic` / `Preset`. Internal `VirtualAxisLike` / `VirtualPermutationLike` helpers in blocks removed; core's types are used directly.

Two array fields on core's types tighten to `readonly` so the existing immutable usage flows through cleanly:

- `Axis.contexts: readonly string[]` (was `string[]`)
- `Permutation.sources: readonly string[]` (was `string[]`)

No first-party site mutates either array; consumers who treated them as immutable already match the tightened contract.

Side cleanups while we were in here:

- New `cssVarAsNumber` helper in blocks centralises the `var(--…)` → `CSSProperties.fontWeight` / `lineHeight` pattern. The four scattered `as unknown as number` casts are gone.
- New `SwatchbookGlobals` / `StoryParameters` types in addon narrow the Storybook globals + parameters bags around the keys the addon actually owns. Eliminates seven `Record<string, unknown>` casts in `preview.tsx`.

Composite-token shape narrowing (DTCG `$type` discriminated unions over shadow / border / gradient / typography) deferred to a follow-up — touches a different surface and is its own surgery.

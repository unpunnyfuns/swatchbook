---
"@unpunnyfuns/swatchbook-blocks": patch
"@unpunnyfuns/swatchbook-addon": patch
---

Closes #863. Drops the last `as unknown as` cast in `packages/addon/src/preview.tsx` by structurally aligning `VirtualTokenShape` with what `buildResolveAt` actually returns: optional string fields widened to `?: T | undefined` so they accept Terrazzo's `string | undefined` shape under `exactOptionalPropertyTypes`, and `partialAliasOf` retyped as `unknown` since its per-composite-type structure is heterogeneous (color's `components: (string | undefined)[]` doesn't fit `Record<string, string | undefined>`; the `CompositeBreakdown` consumer already narrows at runtime).

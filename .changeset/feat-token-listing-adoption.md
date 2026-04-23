---
'@unpunnyfuns/swatchbook-core': minor
'@unpunnyfuns/swatchbook-addon': minor
'@unpunnyfuns/swatchbook-blocks': minor
---

Adopt `@terrazzo/plugin-token-listing` as the authoritative source for per-token metadata. `loadProject` now runs the plugin alongside Terrazzo's build for resolver-backed projects and attaches a path-indexed `listing` map to `Project`. Each entry carries the plugin-css-emitted CSS variable name (`names.css`), a CSS-ready `previewValue`, the original aliased value, and `source.loc` pointing back to the authoring file + line.

Closes the drift risk Sidnioulz flagged: the block-display surface no longer reinvents naming or value-string generation where Terrazzo already has an opinion. `ColorTable` now reads its CSS var strings from the listing when available, falling back to the local Terrazzo-wrapping `makeCssVar` when a listing entry is missing (non-resolver projects, listing-plugin errors).

The snapshot flowing through the addon's virtual module and HMR channel includes the listing slice under a new `listing` field — consumers building blocks against `ProjectSnapshot` get the same data.

This is step 3 of the staged Terrazzo alignment. Step 1 (`makeCssVar` → Terrazzo) landed in the prior release; color value conversion and per-platform names (Swift/Android) are follow-ups that reuse the same listing pipeline.

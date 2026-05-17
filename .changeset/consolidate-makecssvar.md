---
"@unpunnyfuns/swatchbook-core": minor
"@unpunnyfuns/swatchbook-blocks": patch
"@unpunnyfuns/swatchbook-addon": patch
---

Second of three `#824` halves. Consolidates the two `makeCssVar` impls onto a single source — `packages/addon/src/hooks/use-token.ts:55`'s hand-rolled `path.replaceAll('.', '-')` version was a confirmed drift risk (no Terrazzo casing / unicode pass), while `packages/blocks/src/internal/use-project.ts:287`'s correct wrapper around `@terrazzo/token-tools/css`'s `makeCSSVar` was internal-only.

Adds `@unpunnyfuns/swatchbook-core/css-var` subpath exporting `makeCssVar(path, prefix)` — same browser-safe-subpath pattern as `/resolve-at` and `/fuzzy`. Both blocks and addon now import from there; the local impls are deleted. Future Terrazzo naming-policy shifts reach both surfaces in lockstep.

Minor bump on core because the subpath is a new public surface area; patch on blocks + addon (no public API change, just consumer-side cleanup).

The remaining `#824` half (`dataAttr` consolidation across 3 sites in core / addon / blocks) follows the same subpath shape and lands separately.

---
'@unpunnyfuns/swatchbook-core': minor
'@unpunnyfuns/swatchbook-addon': minor
'@unpunnyfuns/swatchbook-blocks': minor
---

Expose modifier axes as first-class on `Project`. `Project.axes: Axis[]` surfaces each DTCG resolver modifier with its `contexts`, `default`, `description`, and `source` (`'resolver' | 'synthetic'`); projects loaded without a resolver get a single synthetic `theme` axis. A new `permutationID(input)` utility centralizes the tuple-to-string logic previously inlined in the resolver loader — single-axis tuples stringify to the context value; multi-axis tuples join with ` · `. The virtual `virtual:swatchbook/tokens` module now also exports `axes`, so toolbar and panel work in follow-up PRs can key on tuples rather than flat theme names.

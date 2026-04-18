---
'@unpunnyfuns/swatchbook-core': minor
---

Multi-axis permutation IDs now join tuple values with ` · ` instead of Terrazzo's JSON-encoded format, so data-attribute values and toolbar labels stay readable. Single-axis resolvers are unchanged (modifier value used directly). Consumers pinning theme names by string (`parameters.swatchbook.theme`, `Config.default`) update from `'Light'` / `'Dark'` to `'Light · Default'` / `'Dark · Default'` when switching to a multi-axis resolver. The stringification is a stopgap until `Project.axes` exposes modifier structure directly (issue #131).

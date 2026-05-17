---
"@unpunnyfuns/swatchbook-core": patch
"@unpunnyfuns/swatchbook-addon": patch
"@unpunnyfuns/swatchbook-blocks": patch
"@unpunnyfuns/swatchbook-switcher": patch
"@unpunnyfuns/swatchbook-mcp": patch
"@unpunnyfuns/swatchbook-integrations": patch
---

Internal migration. Non-core read sites that iterated `Project.permutations` or indexed into `Project.permutationsResolved[name]` now route through `cells` / `resolveAt` / `varianceByPath` / `defaultTuple` instead. Theme name strings (e.g. `"Dark · Brand A"`) are synthesized from `axes + defaultTuple` at the call sites that need them, independent of the soon-to-be-removed `Project.permutations` array.

Touched consumers:

- `@unpunnyfuns/swatchbook-mcp` server tools (`describe_project`, `list_tokens`, `get_token`, `list_axes`, `get_alias_chain`, `get_aliased_by`, `get_color_formats`, `get_color_contrast`, `get_axis_variance`, `search_tokens`, `resolve_theme`, `get_consumer_output`) + the CLI's reload log line.
- `@unpunnyfuns/swatchbook-integrations` css-in-js `collectPaths` (now reads `varianceByPath.keys()`).
- `@unpunnyfuns/swatchbook-addon` preset `renderTokenTypes` (dropped the `permutationsResolved` fallback; enumerates singleton theme names from axes/presets/defaultTuple).
- `@unpunnyfuns/swatchbook-blocks` `use-project` (dropped the legacy `nameForTuple` / `tuplesEqual` helpers; narrowed the snapshot fallback to the active-permutation path only).

`Project.permutations` and `Project.permutationsResolved` are unchanged in this PR. Part 1 of 3 for #815 — the field removals and `Permutation`/`permutationID` exit from the public API land in subsequent PRs.

Three vestigial MCP tests dropped (asserted a "No permutations in project." error string from guards the migrated tools no longer need; the new default-theme-name path always resolves).

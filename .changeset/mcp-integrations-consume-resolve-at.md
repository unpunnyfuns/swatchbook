---
"@unpunnyfuns/swatchbook-core": minor
"@unpunnyfuns/swatchbook-addon": minor
"@unpunnyfuns/swatchbook-blocks": minor
"@unpunnyfuns/swatchbook-switcher": minor
"@unpunnyfuns/swatchbook-mcp": minor
"@unpunnyfuns/swatchbook-integrations": minor
---

`@unpunnyfuns/swatchbook-mcp`, `@unpunnyfuns/swatchbook-integrations`: server-side consumers switch from indexing `Project.permutationsResolved[name]` to calling `project.resolveAt(tuple)`. MCP builds a small `tupleByName: Map<permutationName, axisTuple>` once per project (refreshed on `setProject`) so tools that accept a `theme` name parameter map it to a tuple in O(1) before calling `resolveAt`. `get_axis_variance` drops its redundant `permutations.some` existence scan — `varianceByPath.has(path)` covers it. MCP tool inputs / outputs are unchanged. The `css-in-js` integration's `collectPaths` switches to `resolveAt(theme.input)` for the same iteration. After this PR only `loadProject` itself materializes the cartesian permutation map; the next PR drops that.

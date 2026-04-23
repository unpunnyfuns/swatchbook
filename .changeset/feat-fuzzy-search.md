---
'@unpunnyfuns/swatchbook-core': minor
'@unpunnyfuns/swatchbook-blocks': minor
'@unpunnyfuns/swatchbook-mcp': minor
---

Fuzzy search across `TokenNavigator`, `TokenTable`, and the MCP `search_tokens` tool. Case-insensitive, tolerates a single-character typo per term, and accepts out-of-order terms — `"blue palette"` matches `color.palette.blue.500`, `"surf def"` matches `color.surface.default`. Replaces the previous case-insensitive substring match.

Core now exports `fuzzyFilter(items, query, key, options?)` and `fuzzyMatches(haystack, query)` so downstream integrations can reuse the same ranking primitive. Backed by [`@leeoniya/ufuzzy`](https://github.com/leeoniya/uFuzzy).

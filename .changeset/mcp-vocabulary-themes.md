---
"@unpunnyfuns/swatchbook-mcp": minor
---

Closes #826. Renames `permutations` → `themes` and `defaultPermutation` → `defaultTheme` in MCP tool response shapes (`describe_project`, `list_axes`). Aligns the AI-tool wire surface with the rest of the public vocabulary post-cartesian-drop — internally the server already worked in terms of themes; only the response field names trailed. Tool descriptions and help-text prose updated to match.

Breaking for MCP clients that key off the old field names; the underlying values (default tuple name + singleton enumeration) are unchanged. The `theme` argument on tool inputs stays as-is — it's a string identifier (e.g. `"Dark · Brand A"`), not a tuple object, and the audit's `tuple` rename was rejected on that basis.

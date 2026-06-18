---
"@unpunnyfuns/swatchbook-core": patch
---

`project.resolveAt` now preserves alias provenance, so an axis-varying alias keeps its own chain, target, and description at non-default tuples; the MCP's per-theme token introspection was returning the resolved leaf target's metadata instead of the alias's own

---
"@unpunnyfuns/swatchbook-core": minor
"@unpunnyfuns/swatchbook-addon": minor
"@unpunnyfuns/swatchbook-blocks": minor
"@unpunnyfuns/swatchbook-switcher": minor
"@unpunnyfuns/swatchbook-mcp": minor
"@unpunnyfuns/swatchbook-integrations": minor
---

`@unpunnyfuns/swatchbook-core`: add `Project.varianceByPath` — per-token `AxisVarianceResult` cached at load time so consumers can look up which axes affect a token in O(1) instead of re-running the bucket analysis on every read. Same shape `analyzeAxisVariance` returns; populated with the existing cartesian-bucket algorithm for now (a later PR replaces the implementation with an analytical probe over `cells` when the cartesian materialization goes away). Smart-emitter Phase 2 and MCP `get_axis_variance` switch to read from the cache.

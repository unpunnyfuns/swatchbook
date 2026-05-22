---
'@unpunnyfuns/swatchbook-core': patch
'@unpunnyfuns/swatchbook-addon': patch
'@unpunnyfuns/swatchbook-blocks': patch
'@unpunnyfuns/swatchbook-switcher': patch
'@unpunnyfuns/swatchbook-integrations': patch
'@unpunnyfuns/swatchbook-mcp': patch
---

`loadProject` now emits phase-bounded timing to stdout when the `SWATCHBOOK_LOG_VERBOSE=1` environment variable is set. Lines look like `[swatchbook:load] graph build: 380ms`, with one entry per major phase (parse + normalize, preset apply sweep when presets are configured, token-listing build, graph build, total). When the env var is unset, behaviour is unchanged — no console output, only a few `performance.now()` calls per load (negligible overhead). Intended use: a consumer reports a hung or slow load and we need to know which phase is the offender before reaching for a full CPU profile.

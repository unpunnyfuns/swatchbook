---
'@unpunnyfuns/swatchbook-core': patch
'@unpunnyfuns/swatchbook-addon': patch
'@unpunnyfuns/swatchbook-blocks': patch
'@unpunnyfuns/swatchbook-switcher': patch
'@unpunnyfuns/swatchbook-integrations': patch
'@unpunnyfuns/swatchbook-mcp': patch
---

Expose `Config.maxJointArity` (default `4`) to override the cap on per-token joint-divergence arity probing. The default covers the largest joint shapes real-world design systems tend to express. Consumers with richer multi-axis systems can bump it for tokens that genuinely diverge across 5+ axes simultaneously; consumers with load-time concerns can lower it (1 disables joint-block emission entirely). Documented in `reference/config.mdx` with the per-token work formula and the failure-mode tradeoffs in both directions.

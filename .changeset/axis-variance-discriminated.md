---
"@unpunnyfuns/swatchbook-core": minor
"@unpunnyfuns/swatchbook-blocks": minor
"@unpunnyfuns/swatchbook-addon": minor
---

Closes #825. `AxisVarianceResult` is now a discriminated union on `kind`:

- `constant` — `varyingAxes: readonly []`
- `single` — adds `axis: string` shortcut + `varyingAxes: readonly [string]`
- `multi` — `varyingAxes: readonly [string, string, ...string[]]`

Consumers get exhaustive `switch (result.kind)` narrowing, and the `single` variant exposes `axis: string` directly so blocks no longer need to defensively check `varyingAxes[0]` for undefined. Same applied to the addon-side `VirtualVarianceEntry` wire shape and the virtual module's ambient `VirtualAxisVarianceEntry` declaration.

JSON wire shape is identical to the previous flat interface — MCP `get_axis_variance` and snapshot payloads keep working unchanged. New helper type `AxisVariancePerAxis` exported for consumers that want to reference the shared `perAxis` sub-shape without reaching into the union.

`#866` and `#865` carry the remaining `JointOverrides` and `Config` discriminated-union refactors from the same audit — each higher-churn and earning a standalone PR.

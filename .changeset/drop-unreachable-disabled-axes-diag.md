---
"@unpunnyfuns/swatchbook-core": patch
---

Closes #852. Removes the `swatchbook/project` warn diagnostic at `packages/core/src/load.ts:107-113` — its trigger (`disabledAxes.length > 0 && filteredPermutations.length === 0`) is unreachable under singleton enumeration.

All three loader paths (`resolver`, `layered`, plain-parse) push the default tuple first (`permutations[0]` is always the all-defaults input). The `disabledAxes` filter requires `perm.input[name] !== axisDefaults.get(name)` to drop a permutation — but the default tuple has every axis at its default by construction, so it survives any `disabledAxes` filter. `filteredPermutations.length` is always ≥ 1 post-filter.

The branch was load-bearing under the old cartesian fan-out path where misconfiguring `disabledAxes` could filter every cartesian tuple. Singleton enumeration's "default tuple always present" invariant made the check redundant. Drops the dead branch and the now-unused `Diagnostic` type import.

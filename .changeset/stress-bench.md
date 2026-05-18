---
'@unpunnyfuns/swatchbook-core': patch
---

Add a phase-partitioned benchmark harness for `loadProject`.

`packages/core/bench/fixtures/stress/` carries a deterministic generator + checked-in output modelling a realistic consumer shape (6 modifier axes, 200 mixed-type tokens with ~40% aliases, 30% per-context overlay density). `packages/core/bench/run.mts` imports the loader's exported sub-phases directly and times each — `parse`, `buildCells`, `probe`, `variance`, `listing`, `emitCss`, `snapshotWire` — and partitions `resolver.apply` call counts between cell construction and joint-pair probing via a thin `wrapResolver()` proxy.

Run-friendly via `pnpm --filter @unpunnyfuns/swatchbook-core bench`. Writes `packages/core/bench/baseline.json` so future PRs can diff against a known floor. Resilient to per-phase failures (writes a partial baseline with `errors[phase]` annotations).

Also adds `probeJointOverrides`'s implementation as a per-arity generator (`probeJointOverridesByArity`) and an opt-in `maxArity` cap via `ProbeOptions`. Default behaviour unchanged — `loadProject` and all existing call sites continue to do the full arity sweep. The generator + option are net-new advanced-consumer surface; the bench uses them when measuring against fixtures large enough to make all-arities sweeps impractical.

Initial baseline on the realistic fixture: `probe` is ~93% of total `loadProject` wall-clock (~2s of ~2.15s at 6 axes), with ~70× more `resolver.apply` calls than `buildCells`. The probe cost is the wall a future alias-graph optimisation can target.

---
'@unpunnyfuns/swatchbook-core': minor
---

Extend `defineSwatchbookConfig` with an `axes` shape for authored layered configurations — no DTCG resolver file required. Each axis lists its contexts as ordered file lists that overlay onto `tokens`; the loader parses `[...base, ...overlaysInAxisOrder]` once per cartesian tuple with alias resolution (last-write-wins on duplicate token paths). `Config.resolver` is now optional; setting both `resolver` and `axes` throws. Layered axes surface on `Project.axes` with `source: 'layered'`.

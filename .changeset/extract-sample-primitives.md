---
'@unpunnyfuns/swatchbook-blocks': minor
---

Extract per-token sample primitives from `MotionPreview`, `ShadowPreview`, `BorderPreview`, and `DimensionScale`. Each preview block's single-token renderer is now exported standalone so MDX authors can embed just one sample: `MotionSample`, `ShadowSample`, `BorderSample`, and `DimensionBar` — each takes a `path: string` prop (and `DimensionBar` also accepts `kind`, `MotionSample` accepts `speed` / `runKey`). The parent blocks are unchanged in DOM output and props; they're now thin iterators that filter, sort, and map over the extracted sample.

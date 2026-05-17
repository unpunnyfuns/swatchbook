---
"@unpunnyfuns/swatchbook-blocks": patch
---

Fixes #817. `useProject()`'s returned `ProjectData` is now memoized against the stable inner-field identities, instead of being constructed fresh on every render.

Previously the `snapshotToData(snapshot, resolveAt)` call ran inline on every render and produced a new object identity even when its inputs were unchanged — `resolveAt` was already memoized correctly, but the wrapping `ProjectData` wasn't. Downstream block consumers that do `useMemo([project, …])` saw a fresh `project` identity every render and invalidated their memos every time. The `useProject` JSDoc already warned about this exact shape for `resolveAt`; the wrapping object had the same problem, just one layer up.

Same fix applied to the virtual-module fallback path (`useVirtualModuleFallback`), and to its internal `activeAxes` value which was being recomputed inline.

No public API changes. Block render perf improves on every consumer that memoizes against `project` (`TokenNavigator`, `TokenTable`, `ColorPalette`, etc.).

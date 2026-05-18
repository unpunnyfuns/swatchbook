---
'@unpunnyfuns/swatchbook-addon': patch
---

`addon/channel-types.ts` now type-only-imports `Axis`, `Preset`, `Diagnostic`, `DiagnosticSeverity`, `AxisVarianceResult`, and `AxisVariancePerAxis` from `@unpunnyfuns/swatchbook-core` instead of re-declaring them verbatim. Closes the "manager bundle can't import core" excuse for the seven types where it never applied — type-only imports erase before the bundler sees them under `verbatimModuleSyntax`. Storybook manager bundle build verified unchanged.

`VirtualToken`, `VirtualCells`, `VirtualJointOverride/s` stay declared locally because they carry the wire-narrowed token shape, not core's `TokenMap` (which leaks Terrazzo internals via `TokenNormalized`).

Closes #891

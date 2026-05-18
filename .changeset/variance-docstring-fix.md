---
'@unpunnyfuns/swatchbook-core': patch
---

Fix `analyzeProjectVariance` docstring: layered / plain-parse multi-touch tokens classify as `orthogonal-after-probe`, not `joint-variant` with empty `jointCases` as the docstring previously claimed.

The implementation was correct; the comment had drifted. Cascade composition over per-axis cells IS the spec for layered modifiers (the loader builds the cells by cascade in the first place), so there's no hidden joint resolution for `analyzeProjectVariance` to surface — `orthogonal-after-probe` is the right classification. No behavioural change.

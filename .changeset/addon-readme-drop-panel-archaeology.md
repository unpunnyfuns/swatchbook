---
'@unpunnyfuns/swatchbook-addon': patch
---

docs(addon): drop the removed Design Tokens panel from the README

The addon's README still described a "unified Design Tokens panel (hierarchical tree + diagnostics)" that got removed in v0.3.0. Also had a lingering "Go through `useToken` / the panel / the doc blocks" bullet in the do-don't list that pointed consumers at an API surface that no longer exists.

Rewrote the intro paragraph to describe the current toolbar (axis dropdowns + preset pills + color-format picker) and call out the addon's re-export of the full blocks + switcher surface. Trimmed "the panel" from the do-don't rule.

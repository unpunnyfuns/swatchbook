---
'@unpunnyfuns/swatchbook-core': patch
---

Add a "Terrazzo dependencies" mini-section to the Quickstart. Clarifies that `@terrazzo/parser`, `plugin-css`, and `plugin-token-listing` come with `swatchbook-core` transitively (no extra install for the default setup), and flags the two cases where explicit Terrazzo installs are warranted: pinning matching versions alongside a production `@terrazzo/cli`, or installing additional ecosystem plugins (`plugin-swift`, `-android`, `-sass`, `-js`) to populate per-platform names in `<TokenDetail>`.

---
'@unpunnyfuns/swatchbook-core': patch
---

fix resolveAliasAt leaking baseline alias metadata into literal and partial-alias write results, which emitted var() references to the old alias target

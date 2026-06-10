---
'@unpunnyfuns/swatchbook-addon': patch
---

fix a transient bad token save crashing the Storybook dev server via an unhandled rejection in the HMR reload; failures now log and the previous tokens keep serving

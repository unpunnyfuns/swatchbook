---
'@unpunnyfuns/swatchbook-addon': patch
---

Stop registering the manager bundle twice. The preset's `managerEntries()` hook duplicated what Storybook's `resolveAddonName` already contributes via the `./manager` subpath export, so `addons.register(ADDON_ID, …)` fired twice and the manager logged "swatchbook was loaded twice". Modern Storybook now discovers the manager via the subpath export; the root `manager.js` shim still catches legacy resolvers that don't honor `package.json#exports`.

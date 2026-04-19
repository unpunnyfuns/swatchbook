---
'@unpunnyfuns/swatchbook-addon': patch
---

Fix the `storybook.icon` URL in the addon's `package.json` — previous path referenced a non-existent file, and the Storybook addon catalog doesn't support SVG. Point at the committed PNG so the addon tile renders on https://storybook.js.org/addons.

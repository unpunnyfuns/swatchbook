---
'@unpunnyfuns/swatchbook-addon': patch
---

Add unit tests for the integration-side-effects aggregate virtual module. Covers `resolveId` mapping, empty-integration bodies (no integrations + all opted-out), auto-inject filtering across a mixed list, and the fall-through path for unrelated IDs. Closes a hole where the aggregation logic added in 0.14 was only exercised end-to-end through Storybook builds.

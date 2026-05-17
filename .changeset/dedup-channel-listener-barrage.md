---
"@unpunnyfuns/swatchbook-addon": patch
"@unpunnyfuns/swatchbook-blocks": patch
---

Closes #837. The addon preview's global-axis applier and the blocks channel-globals subscriber both subscribe to all three of Storybook's `globalsUpdated` / `setGlobals` / `updateGlobals` events. Subscribing to all three is intentional (each carries the payload at a different point in the preview lifecycle — init, toolbar tick, cross-frame echo) but the handlers previously ran their full update path on every fire, so a single toolbar change fan-out to 3× DOM writes / 3× snapshot updates / 3× consumer re-renders.

Both handlers now content-dedupe on a stringified fingerprint (`axes` JSON + `format`). The first fire of each tick applies; the second and third no-op. No behavior change beyond fewer redundant updates.

The blocks-side previous identity-equality guard (`if (next !== snapshot)`) didn't dedupe because the spread (`{ ...next, axes: nextAxes }`) produced a fresh object identity on every fire even when content was unchanged.

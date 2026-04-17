---
'@unpunnyfuns/swatchbook-blocks': minor
---

Add `MotionPreview` block. Renders motion tokens — `transition` composites, standalone `duration`, standalone `cubicBezier` — as a looping ball animation so timing and easing are legible in motion. Per-row spec strip shows duration + easing; a global speed control (0.25× / 0.5× / 1× / 2×) lets consumers slow fast transitions to inspect the curve. Respects `prefers-reduced-motion: reduce` — the animation is replaced by an inline "Animation suppressed" notice and the replay button disables.

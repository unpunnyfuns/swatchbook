---
'@unpunnyfuns/swatchbook-blocks': minor
---

`TokenDetail` now renders visual previews for `dimension`, `duration`, and `cubicBezier` primitives — closing the consistency gap where these types had dedicated blocks (`DimensionScale`, `MotionPreview`) but fell back to raw text when opened individually. Dimension tokens show a bar sized to the token value; duration tokens animate a ball at that duration with neutral easing; cubicBezier tokens animate a ball at a fixed duration applying the easing curve. Both animated variants honor `prefers-reduced-motion: reduce` via the existing suppressed-notice path.

---
'@unpunnyfuns/swatchbook-blocks': patch
---

`MotionSample` (and by extension `<TokenNavigator>` when it renders `duration` / `transition` / `cubicBezier` tokens inline) now falls back to its static reduced-motion state when rendering inside Chromatic's snapshot runner. Detection via Chromatic's user-agent string. The setInterval-driven ball position was previously snapshotted at different positions run-to-run, flagging affected stories as unstable in Chromatic's diff review. Skipping the loop in Chromatic produces deterministic captures. Capture-only — local dev, addon-vitest, and the manual Storybook experience keep the animated version.

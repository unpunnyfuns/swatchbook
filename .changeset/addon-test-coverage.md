---
'@unpunnyfuns/swatchbook-addon': patch
---

Add unit coverage for `useToken`, `dataAttr`, and `ColorFormatSelector`. Brings the addon's direct test surface from 16 → 30 tests; sets up the jsdom + Testing Library scaffold (vitest config + virtual-module stub) the package didn't have before. `preview.tsx` and `manager.tsx` stay covered by Storybook play-functions — their integration shape (DOM mount, ambient module imports, Storybook channel comms) makes meaningful unit tests cost more than they return. No behavior changes.

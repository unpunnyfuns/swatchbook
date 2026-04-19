---
'@unpunnyfuns/swatchbook-addon': patch
---

Fix two toolbar-popover papercuts:

- Clicks inside the preview iframe now close the popover. The manager's document-level mousedown listener can't observe events inside the preview, so the preview now emits a channel event on mousedown and the popover listens for it.
- Toolbar no longer stays stuck in its "loading…" state when the manager mounts after the preview's initial `INIT_EVENT` broadcast. Manager now sends an `INIT_REQUEST` on mount and the preview re-broadcasts in response, closing the timing race.

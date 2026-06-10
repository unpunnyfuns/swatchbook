---
'@unpunnyfuns/swatchbook-addon': patch
---

fix the dev-server token watcher ignoring newly-added token files: it no longer filters to a basename allow-list frozen at server start, and re-arms after each reload so new directories get watched too

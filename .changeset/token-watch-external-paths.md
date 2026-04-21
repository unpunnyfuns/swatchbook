---
'@unpunnyfuns/swatchbook-addon': patch
---

fix(addon): pick up token edits when tokens live in a sibling workspace package

The addon's Vite plugin relied on `server.watcher.add()` to pick up
changes to `project.sourceFiles`. That watcher is rooted at the dev
server's project directory; absolute paths added outside that root
land inside chokidar, but the resulting events don't always propagate
through pnpm-symlinked chains, so a save to a token file living in a
sibling workspace package would refresh nothing in the preview.

Add a belt-and-suspenders file-level `node:fs.watch` on each source
file alongside the existing dir-level watch. Native, no root
constraint — catches the saves the dir-level watch misses without
relying on a specific editor's save shape.

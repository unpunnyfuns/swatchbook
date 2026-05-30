---
'@unpunnyfuns/swatchbook-core': patch
'@unpunnyfuns/swatchbook-addon': patch
'@unpunnyfuns/swatchbook-blocks': patch
'@unpunnyfuns/swatchbook-switcher': patch
'@unpunnyfuns/swatchbook-integrations': patch
'@unpunnyfuns/swatchbook-mcp': patch
---

The release workflow's `release` environment now gates only on publish runs (the Version Packages PR's squash-merge), not on every push to main. Previously every changeset-PR merge would pause for approval even though no publish was about to happen — the action would just open a VP PR. Now the gate fires only when `github.event.head_commit.message` starts with `chore(release):` — i.e., the VP PR was just merged and `changeset publish` is about to run. Routine pushes proceed unattended. Documented in `developers/sharp-corners.mdx`. No published-package behaviour change.

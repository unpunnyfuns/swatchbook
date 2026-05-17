---
"@unpunnyfuns/swatchbook-core": patch
"@unpunnyfuns/swatchbook-addon": patch
"@unpunnyfuns/swatchbook-blocks": patch
"@unpunnyfuns/swatchbook-mcp": patch
---

Closes #827. Internal-only — strips remaining stale JSDoc / inline comments that referenced the cartesian-drop chain, "PR 6a" / "wire format change" phases, "see commit 893331f", and "Replaces the legacy …" patterns. The bulk of these were already cleaned up in #816 / #841 / #846 as those PRs deleted the code they pointed at; this PR catches the few that survived as stranded references.

No behavior changes.

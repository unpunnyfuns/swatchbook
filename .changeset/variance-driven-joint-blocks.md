---
'@unpunnyfuns/swatchbook-core': patch
'@unpunnyfuns/swatchbook-addon': patch
'@unpunnyfuns/swatchbook-blocks': patch
'@unpunnyfuns/swatchbook-switcher': patch
'@unpunnyfuns/swatchbook-integrations': patch
'@unpunnyfuns/swatchbook-mcp': patch
---

`emitAxisProjectedCss`'s joint-block emission now scales per-token rather than as a cartesian over project axes. `analyzeProjectVariance` probes joint divergences for each token within that token's `affectedBy` set (capped at 4 axes per token), and `collectJointBlocks` consumes the resulting joint cases directly — no cartesian enumeration over the project's full axes. For a 12-axis project that previously needed ~243M outer iterations × O(tokens) inner work (consumer-reported >1h hang on 687-token projects), emission now completes in milliseconds. CSS output for the reference fixture is unchanged byte-for-byte. Joint divergences spanning 5+ axes simultaneously aren't emitted as compound blocks — the practical limit covers mode × brand × density × contrast joint shapes (the largest real-world combinations).

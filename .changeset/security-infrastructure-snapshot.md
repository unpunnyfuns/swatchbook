---
'@unpunnyfuns/swatchbook-core': patch
'@unpunnyfuns/swatchbook-addon': patch
'@unpunnyfuns/swatchbook-blocks': patch
'@unpunnyfuns/swatchbook-switcher': patch
'@unpunnyfuns/swatchbook-integrations': patch
'@unpunnyfuns/swatchbook-mcp': patch
---

Internal release: ships the security-infrastructure documentation added in #1044 into the current minor's docs snapshot. No published-package behaviour change. The recent CI hardening landed across #1042 (pin GitHub Actions to commit SHAs + add zizmor workflow audit), #1043 (disable Actions cache during release for cache-poisoning defense), #1044 (gate release on deployment environment with required approval), and #1046 (fix template-injection findings in mirror-playwright). The release-approval gate is documented under `developers/sharp-corners.mdx`.

---
"@unpunnyfuns/swatchbook-addon": patch
---

The addon's preview decorator and useToken resolver now preserve alias provenance, so an axis-varying alias keeps its own chain, reverse references, description, and deprecation in the real Storybook; previously the addon's raw resolver shadowed use-project's provenance resolver, silently undoing that fix outside of tests

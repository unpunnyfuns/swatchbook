---
'@unpunnyfuns/swatchbook-addon': patch
'@unpunnyfuns/swatchbook-blocks': patch
---

fix addon live-update staleness: useToken now tracks the live toolbar axis tuple over the channel in provider-less (MDX/autodocs) renders, and a per-story axis override no longer sticks to the <html> attributes after navigating to an MDX docs page (blocks now expose useChannelGlobals)

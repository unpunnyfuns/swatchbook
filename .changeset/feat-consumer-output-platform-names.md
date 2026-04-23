---
'@unpunnyfuns/swatchbook-blocks': minor
---

`<ConsumerOutput>` (and therefore `<TokenDetail>`, which composes it) now renders one extra row per non-CSS platform that appears in the Token Listing. Loading `@terrazzo/plugin-swift` / `-android` / `-sass` / `-js` through `config.terrazzoPlugins` and naming it in `config.listingOptions.platforms` is all it takes — rows with labels like "Swift", "Android", "Sass", "Js" appear automatically with each plugin's authoritative identifier, copy-to-clipboard included.

Cashes in the per-platform half of the Token Listing migration. The data was already flowing through the addon → blocks plumbing; this change surfaces it.

Exports `VirtualTokenListingShape` from `@unpunnyfuns/swatchbook-blocks` for consumers building custom per-platform blocks.

---
'@unpunnyfuns/swatchbook-addon': minor
'@unpunnyfuns/swatchbook-blocks': minor
---

feat: partial HMR for token edits — no more full preview reload

Saving a token file in dev mode now re-renders the preview in place
instead of blowing away the iframe. Toolbar state, story args, scroll
position, and any open overlays survive the refresh.

Under the hood:

- The addon's Vite plugin now sends a custom HMR event
  (`swatchbook/tokens-updated`) carrying the fresh virtual-module
  payload when source files change, instead of firing a `full-reload`.
- The preview subscribes via `import.meta.hot.on`, re-injects the
  generated stylesheet, and forwards the payload on Storybook's
  channel as `TOKENS_UPDATED_EVENT`.
- A new `useTokenSnapshot()` hook in blocks mirrors the
  `channel-globals` pattern — subscribes to the channel via
  `useSyncExternalStore` and exposes a live snapshot that `useProject`
  reads from. Token edits propagate through React's normal
  re-render path; no block-specific wiring per consumer required.
- Outside Storybook (the docs-site path, unit tests, production
  builds) the channel never fires and consumers keep seeing the
  initial values baked into the virtual module at build time — same
  behavior as before.

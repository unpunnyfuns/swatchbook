# Future plans

Ideas that have been explored but deliberately punted past v0.1.0. Not a
backlog (GitHub issues are the tracker) — a place to preserve *why* an
idea surfaced and what was decided when, so we don't re-litigate context
six months later.

Entries are reverse-chronological. Keep each short; link out to the
conversation, ADR, or issue that should ultimately carry it forward.

---

## 2026-04-17 — Addon writing back to token files (dev server only)

**Idea.** Manager/preview UI actions that mutate the user's token
source-of-truth on disk — e.g. "edit this token value from the panel",
"export current theme composition", "generate a new theme file from the
live preview".

**Why it came up.** Natural extension of the live preview: if the panel
can already show resolved values per theme, it's a small leap to let
authors tweak a value, see it repaint, and commit it back. Dev-only by
design — the deployed Storybook static build has no server, so the same
UI either hides or no-ops there.

**Mechanism (preferred).** Storybook's
`experimental_serverChannel(channel, options)` preset export. The preset
registers node-side listeners on the same channel the manager/preview
already use; the manager emits `channel.emit('swatchbook/write-token', …)`
from a UI action; the handler writes via `fs/promises`. No HTTP endpoint,
no CORS, no auth layer — it's the addon talking to itself over the
existing channel.

**Mechanism (alternative).** `viteFinal` adds Express-style middleware
for a `/swatchbook/…` endpoint the manager POSTs to. Equivalent power,
more setup, same dev-only scope.

**Constraints & footguns.**

- Dev server only. Static build has no node side — handlers registered
  via `experimental_serverChannel` simply don't exist there. UI gated on
  `import.meta.env.DEV` (or a build-time flag in the virtual module).
- Same-origin only; do not add CORS.
- No auth. Fine on `localhost`; document clearly that exposing the dev
  server over the network (tunnel, LAN) grants write access to anyone
  who can reach it.
- Write atomically (`fs.writeFile` tempfile + rename) so a crash mid-save
  doesn't corrupt the token file.
- Re-run `loadProject` after any write so the virtual module HMR picks
  up the new value — otherwise the UI shows stale.

**Decision.** Defer. Plausible post-v0.1.0 feature; no concrete user ask
yet. When revisited, file a dedicated milestone with named use cases
(edit value / export theme / generate theme) and spike one before
committing to the UI surface.

**Pointers.**

- `@storybook/preview-api` channel already used by the addon (see
  `packages/addon/src/preview.tsx` and `panel.tsx`).
- Existing dev-time write path for reference: `writeTokenCodegen` in
  `packages/addon/src/preset.ts` — Node side, runs at Storybook startup,
  proves the plumbing works.

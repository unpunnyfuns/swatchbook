---
"@unpunnyfuns/swatchbook-blocks": patch
"@unpunnyfuns/swatchbook-addon": patch
---

Second of three sub-PRs for #818. Sweeps `fireEvent` calls out of the blocks and addon browser-mode test suites — replaces with `userEvent` from `@vitest/browser/context` (project convention for browser-mode tests). Affects five blocks test files plus the addon's color-format-selector test.

Specific conversions:
- `fireEvent.change(input, { target: { value: 'x' } })` → `await userEvent.fill(input, 'x')` (matches intent + faster than `.type()` — translates to a single Playwright `locator.fill()` call).
- `fireEvent.click(el)` → `await userEvent.click(el)`. Drops the wrapping `act()` since userEvent handles act internally.
- Affected `it()` functions become `async`.

Surfaced one real-browser-only difference along the way: `userEvent.click(<tr>)` under Playwright's actionability checks doesn't reliably trigger a `<tr>`'s `onClick` handler the way React's synthetic `fireEvent.click(<tr>)` did. The `ColorTable — expansion` tests switched to keyboard activation (`row.focus()` + `userEvent.keyboard('{Enter}')`) — the row already exposes `tabIndex={0}` and an Enter/Space handler for the accessibility contract; this exercises the same path a keyboard user takes, which is the more representative real-user interaction here anyway.

#818's third sub-PR (split blocks tests into node + browser projects) is independent and lands separately.

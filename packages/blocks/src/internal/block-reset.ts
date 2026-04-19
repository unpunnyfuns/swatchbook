/**
 * Defensive element reset scoped to every block wrapper.
 *
 * Storybook 10's MDX docs applies house-style CSS to semantic elements
 * (`.sbdocs table`, `.sbdocs th/td`, `.sbdocs ul/li`, `.sbdocs details/summary`)
 * that bleeds into any block rendered inside a docs page. Our blocks set
 * inline styles on those elements for the properties they care about, but
 * anything they don't touch (background, border, margin, etc.) inherits
 * the docs look. That's why the Dashboard tree/table looked different
 * inside MDX vs a regular story.
 *
 * The fix mounts one stylesheet once per browsing session that scopes
 * `all: revert` on the semantic elements used by blocks, under the
 * `[data-swatchbook-block]` attribute carried by every block's outer
 * wrapper (via `themeAttrs`). `all: revert` restores browser defaults —
 * the block's inline styles still win on top of that, and MDX house
 * styles stop leaking in.
 *
 * The reset excludes the wrapper itself (direct `[data-swatchbook-block]`
 * selector) because the wrapper's `surfaceStyle` is what we want to keep.
 */

const STYLE_ID = 'swatchbook-block-reset';

const RESET_CSS = `[data-swatchbook-block] table,
[data-swatchbook-block] thead,
[data-swatchbook-block] tbody,
[data-swatchbook-block] tr,
[data-swatchbook-block] th,
[data-swatchbook-block] td,
[data-swatchbook-block] caption,
[data-swatchbook-block] ul,
[data-swatchbook-block] ol,
[data-swatchbook-block] li,
[data-swatchbook-block] details,
[data-swatchbook-block] summary,
[data-swatchbook-block] code,
[data-swatchbook-block] pre,
[data-swatchbook-block] p,
[data-swatchbook-block] h1,
[data-swatchbook-block] h2,
[data-swatchbook-block] h3,
[data-swatchbook-block] h4,
[data-swatchbook-block] h5,
[data-swatchbook-block] h6 {
  all: revert-layer;
}
`;

export function ensureBlockResetStylesheet(): void {
  if (typeof document === 'undefined') return;
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = RESET_CSS;
  document.head.appendChild(style);
}
